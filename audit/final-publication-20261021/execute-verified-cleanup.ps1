$ErrorActionPreference = 'Stop'
$auditDirectory = $PSScriptRoot
$workspaceDirectory = [IO.Path]::GetFullPath((Join-Path $auditDirectory '..\..\..'))
$archiveDirectory = [IO.Path]::GetFullPath((Join-Path $workspaceDirectory 'zenodo-release'))
$plan = Get-Content -LiteralPath (Join-Path $auditDirectory 'proposed-canonical-cleanup.json') -Raw | ConvertFrom-Json
if ($plan.count -ne 168 -or $plan.files.Count -ne 168) { throw 'Unexpected cleanup plan size' }
$allowedDirectories = @('hardware_test','hardware_test2','hardware_test3') | ForEach-Object { [IO.Path]::GetFullPath((Join-Path $workspaceDirectory $_)) }
function Assert-NoReparsePoint([string]$filePath) {
    $cursor = Get-Item -LiteralPath $filePath -Force
    while ($null -ne $cursor -and $cursor.FullName.StartsWith($workspaceDirectory,[StringComparison]::OrdinalIgnoreCase)) {
        if (($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Reparse point: $($cursor.FullName)" }
        $cursor = $cursor.Parent
    }
}
function Assert-VerifiedPair($record) {
    $sourcePath = [IO.Path]::GetFullPath([string]$record.source_absolute)
    $canonicalPath = [IO.Path]::GetFullPath([string]$record.retain_canonical_absolute)
    if (-not ($allowedDirectories | Where-Object { $sourcePath.StartsWith($_ + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase) })) { throw "Source outside approved directories: $sourcePath" }
    if (-not $canonicalPath.StartsWith($archiveDirectory + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw "Canonical outside archive: $canonicalPath" }
    if ($sourcePath -eq $canonicalPath) { throw 'Source equals canonical path' }
    foreach ($checkedPath in @($sourcePath,$canonicalPath)) {
        Assert-NoReparsePoint $checkedPath
        $item = Get-Item -LiteralPath $checkedPath -Force
        if ($item.PSIsContainer -or $item.Length -ne $record.bytes) { throw "Length/type mismatch: $checkedPath" }
        if ((Get-FileHash -LiteralPath $checkedPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) { throw "Hash mismatch: $checkedPath" }
    }
}
$protected = @($plan.protected_raw_avi) + @($plan.protected_other_archived_videos)
$protectedBefore = @($protected | ForEach-Object {
    $protectedPath = [IO.Path]::GetFullPath((Join-Path $workspaceDirectory $_.file))
    [ordered]@{path=$protectedPath;bytes=(Get-Item -LiteralPath $protectedPath).Length;sha256=(Get-FileHash -LiteralPath $protectedPath -Algorithm SHA256).Hash.ToLowerInvariant()}
})
foreach ($record in $plan.files) { Assert-VerifiedPair $record }
$receipt = [ordered]@{started_at_utc=[DateTime]::UtcNow.ToString('o');status='running';removed_files=@();removed_empty_directories=@();protected_videos=$protectedBefore;canonical_survival_verified=$false}
$receiptPath = Join-Path $auditDirectory 'executed-duplicate-cleanup.json'
foreach ($record in $plan.files) {
    Assert-VerifiedPair $record
    Remove-Item -LiteralPath ([string]$record.source_absolute) -Force
    if (Test-Path -LiteralPath ([string]$record.source_absolute)) { throw "Removal failed: $($record.source_absolute)" }
    $receipt.removed_files += [ordered]@{source=$record.source;bytes=$record.bytes;sha256=$record.sha256;retained_canonical=$record.retain_canonical_absolute}
    $receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $receiptPath -Encoding utf8
}
foreach ($directory in $allowedDirectories) {
    if (Test-Path -LiteralPath $directory) {
        Assert-NoReparsePoint $directory
        if (@(Get-ChildItem -LiteralPath $directory -Force).Count -eq 0) {
            Remove-Item -LiteralPath $directory -Force
            $receipt.removed_empty_directories += $directory
        }
    }
}
foreach ($record in $plan.files) {
    if ((Get-FileHash -LiteralPath ([string]$record.retain_canonical_absolute) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) { throw 'Canonical survival verification failed' }
}
foreach ($record in $protectedBefore) {
    if ((Get-Item -LiteralPath $record.path).Length -ne $record.bytes -or (Get-FileHash -LiteralPath $record.path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) { throw 'Protected video verification failed' }
}
$receipt.status='complete'
$receipt.canonical_survival_verified=$true
$receipt.completed_at_utc=[DateTime]::UtcNow.ToString('o')
$receipt.removed_count=$receipt.removed_files.Count
$totalRemovedBytes = [int64]0
foreach ($removedRecord in $receipt.removed_files) { $totalRemovedBytes += [int64]$removedRecord.bytes }
$receipt.removed_bytes=$totalRemovedBytes
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $receiptPath -Encoding utf8
[ordered]@{removed_files=$receipt.removed_count;removed_bytes=$receipt.removed_bytes;empty_directories=$receipt.removed_empty_directories.Count;protected_videos=$protectedBefore.Count;canonical_survival_verified=$true} | ConvertTo-Json
