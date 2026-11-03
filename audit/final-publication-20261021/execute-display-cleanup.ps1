$ErrorActionPreference = 'Stop'
$auditDirectory = $PSScriptRoot
$workspaceDirectory = [IO.Path]::GetFullPath((Join-Path $auditDirectory '..\..\..'))
$archiveDirectory = [IO.Path]::GetFullPath((Join-Path $workspaceDirectory 'zenodo-release'))
$plan = Get-Content -LiteralPath (Join-Path $auditDirectory 'verified-display-cleanup-plan.json') -Raw | ConvertFrom-Json
if ($plan.count -ne 146 -or $plan.files.Count -ne 146) { throw 'Unexpected reviewed display plan size' }
$allowedRoots = @('aerosense-wiki/fig/odor-2026-10-21','aerosense-wiki/assets/hardware-test3','aerosense-wiki/resources/hardware-en','aerosense-wiki/game/apps/wiki-client/games/labyrinth/assets','registry_docs_v2/figures') | ForEach-Object { [IO.Path]::GetFullPath((Join-Path $workspaceDirectory $_)) }
$inventory = Get-Content -LiteralPath (Join-Path $auditDirectory 'all-assets-inventory.json') -Raw | ConvertFrom-Json -AsHashtable
$livePaths = @($inventory.assets | ForEach-Object { $_.paths })
function Assert-DisplayPair($record) {
    $sourcePath = [IO.Path]::GetFullPath([string]$record.source_absolute)
    $canonicalPath = [IO.Path]::GetFullPath([string]$record.retain_canonical_absolute)
    if (-not ($allowedRoots | Where-Object { $sourcePath.StartsWith($_ + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase) })) { throw 'Source outside five reviewed display roots' }
    if (-not $canonicalPath.StartsWith($archiveDirectory + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) { throw 'Canonical outside archive' }
    if ($record.source.StartsWith('aerosense-wiki/')) {
        $siteRelative = $record.source.Substring('aerosense-wiki/'.Length)
        if ($siteRelative -in $livePaths) { throw "Still locally referenced: $siteRelative" }
    }
    foreach ($checkedPath in @($sourcePath,$canonicalPath)) {
        $item = Get-Item -LiteralPath $checkedPath -Force
        if ($item.PSIsContainer -or $item.Length -ne $record.bytes) { throw 'Size/type mismatch' }
        $cursor = $item
        while ($null -ne $cursor -and $cursor.FullName.StartsWith($workspaceDirectory,[StringComparison]::OrdinalIgnoreCase)) {
            if (($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Reparse point' }
            $cursor = $cursor.Parent
        }
        if ((Get-FileHash -LiteralPath $checkedPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) { throw "Hash mismatch: $checkedPath" }
    }
}
foreach ($record in $plan.files) { Assert-DisplayPair $record }
$receipt = [ordered]@{started_at_utc=[DateTime]::UtcNow.ToString('o');status='running';removed_files=@();removed_bytes=[int64]0;canonical_survival_verified=$false}
$receiptPath = Join-Path $auditDirectory 'executed-display-cleanup.json'
foreach ($record in $plan.files) {
    Assert-DisplayPair $record
    Remove-Item -LiteralPath ([string]$record.source_absolute) -Force
    if (Test-Path -LiteralPath ([string]$record.source_absolute)) { throw 'Removal failed' }
    $receipt.removed_files += [ordered]@{source=$record.source;bytes=$record.bytes;sha256=$record.sha256;retained_canonical=$record.retain_canonical}
    $receipt.removed_bytes += [int64]$record.bytes
    $receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $receiptPath -Encoding utf8
}
foreach ($record in $plan.files) {
    if ((Get-FileHash -LiteralPath ([string]$record.retain_canonical_absolute) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) { throw 'Canonical survivor mismatch' }
}
$receipt.status='complete'
$receipt.completed_at_utc=[DateTime]::UtcNow.ToString('o')
$receipt.canonical_survival_verified=$true
$receipt.removed_count=$receipt.removed_files.Count
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $receiptPath -Encoding utf8
[ordered]@{removed_files=$receipt.removed_count;removed_bytes=$receipt.removed_bytes;canonical_survival_verified=$true} | ConvertTo-Json
