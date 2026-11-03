$ErrorActionPreference='Stop'
$workspaceDirectory=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$registryRoot=[IO.Path]::GetFullPath((Join-Path $workspaceDirectory 'registry_docs_v2'))
$archiveRoot=[IO.Path]::GetFullPath((Join-Path $workspaceDirectory 'zenodo-release'))
$plan=Get-Content -LiteralPath (Join-Path $PSScriptRoot 'verified-registry-root-png-cleanup-plan.json') -Raw | ConvertFrom-Json
if ($plan.count -ne 14 -or $plan.files.Count -ne 14) {throw 'Unexpected plan count'}
$removed=@()
foreach ($record in $plan.files) {
    $sourcePath=[IO.Path]::GetFullPath([string]$record.source_absolute)
    $canonicalPath=[IO.Path]::GetFullPath([string]$record.retain_canonical_absolute)
    if ([IO.Path]::GetDirectoryName($sourcePath) -ne $registryRoot -or [IO.Path]::GetExtension($sourcePath) -ne '.png') {throw 'Source outside approved PNG scope'}
    if (-not $canonicalPath.StartsWith($archiveRoot + [IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)) {throw 'Canonical outside archive'}
    foreach ($checkedPath in @($sourcePath,$canonicalPath)) {
        $item=Get-Item -LiteralPath $checkedPath -Force
        if ($item.PSIsContainer -or $item.Length -ne $record.bytes) {throw 'Size/type mismatch'}
        $cursor=$item
        while ($null -ne $cursor -and $cursor.FullName.StartsWith($workspaceDirectory,[StringComparison]::OrdinalIgnoreCase)) {
            if (($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {throw 'Reparse point'}
            $cursor=$cursor.Parent
        }
        if ((Get-FileHash -LiteralPath $checkedPath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) {throw 'Hash mismatch'}
    }
    Remove-Item -LiteralPath $sourcePath -Force
    $removed+=$record.source
}
foreach ($record in $plan.files) {
    if ((Get-FileHash -LiteralPath ([string]$record.retain_canonical_absolute) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) {throw 'Canonical survivor mismatch'}
}
[ordered]@{status='complete';removed_count=$removed.Count;removed_bytes=$plan.bytes;removed=$removed;canonical_survival_verified=$true} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'executed-registry-root-png-cleanup.json') -Encoding utf8
'Removed 14 Registry-root PNG display copies; all unmodified originals remain verified in Zenodo.'
