$ErrorActionPreference = 'Stop'
$workspaceDirectory = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$sourceRoot = [IO.Path]::GetFullPath((Join-Path $workspaceDirectory 'eNose-feature-igem'))
$archiveRoot = [IO.Path]::GetFullPath((Join-Path $workspaceDirectory 'zenodo-release'))
$plan = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'verified-enose-cleanup-plan.json') -Raw | ConvertFrom-Json
if ($plan.count -ne 47 -or $plan.files.Count -ne 47) { throw 'Unexpected reviewed source count' }
function Assert-EnosePair($record) {
    $sourcePath = [IO.Path]::GetFullPath([string]$record.source_absolute)
    $canonicalPath = [IO.Path]::GetFullPath([string]$record.retain_canonical_absolute)
    if (-not $sourcePath.StartsWith($sourceRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Source outside exact approved folder' }
    if (-not $canonicalPath.StartsWith($archiveRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Canonical outside archive' }
    foreach ($checkedPath in @($sourcePath,$canonicalPath)) {
        $item = Get-Item -LiteralPath $checkedPath -Force
        if ($item.PSIsContainer -or $item.Length -ne $record.bytes) { throw 'Size/type mismatch' }
        $cursor=$item
        while ($null -ne $cursor -and $cursor.FullName.StartsWith($workspaceDirectory,[StringComparison]::OrdinalIgnoreCase)) {
            if (($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Reparse point' }
            $cursor=$cursor.Parent
        }
        if ((Get-FileHash -LiteralPath $checkedPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) { throw 'Hash mismatch' }
    }
}
foreach ($record in $plan.files) { Assert-EnosePair $record }
$receipt=[ordered]@{status='running';removed_files=@();removed_bytes=[int64]0;canonical_survival_verified=$false}
$receiptPath=Join-Path $PSScriptRoot 'executed-enose-cleanup.json'
foreach ($record in $plan.files) {
    Assert-EnosePair $record
    Remove-Item -LiteralPath ([string]$record.source_absolute) -Force
    $receipt.removed_files += [ordered]@{source=$record.source;bytes=$record.bytes;sha256=$record.sha256;retained_canonical=$record.retain_canonical}
    $receipt.removed_bytes += [int64]$record.bytes
    $receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $receiptPath -Encoding utf8
}
foreach ($relative in @('scripts','analysis','raw_renamed','')) {
    $emptyDirectory=[IO.Path]::GetFullPath((Join-Path $sourceRoot $relative))
    if ($emptyDirectory -ne $sourceRoot -and -not $emptyDirectory.StartsWith($sourceRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Empty-directory containment failure' }
    if (((Get-Item -LiteralPath $emptyDirectory -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Reparse point' }
    if (@(Get-ChildItem -LiteralPath $emptyDirectory -Force).Count -ne 0) { throw 'Unexpected file remains; directory retained' }
    Remove-Item -LiteralPath $emptyDirectory -Force
}
foreach ($record in $plan.files) {
    if ((Get-FileHash -LiteralPath ([string]$record.retain_canonical_absolute) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) { throw 'Canonical survival check failed' }
}
$receipt.status='complete';$receipt.removed_count=$receipt.removed_files.Count;$receipt.canonical_survival_verified=$true;$receipt.completed_at_utc=[DateTime]::UtcNow.ToString('o')
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $receiptPath -Encoding utf8
[ordered]@{removed_files=$receipt.removed_count;removed_bytes=$receipt.removed_bytes;canonical_survival_verified=$true} | ConvertTo-Json
