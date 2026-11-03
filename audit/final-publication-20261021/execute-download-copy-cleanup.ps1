$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$siteRoot = [IO.Path]::GetFullPath((Join-Path $taskRoot 'aerosense-wiki'))
$archiveRoot = [IO.Path]::GetFullPath((Join-Path $taskRoot 'zenodo-release'))
$plan = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'verified-download-copy-cleanup-plan.json') -Raw | ConvertFrom-Json
$removed = @()
foreach ($entry in $plan.files) {
    $source = [IO.Path]::GetFullPath($entry.source_absolute)
    $canonical = [IO.Path]::GetFullPath($entry.retain_canonical_absolute)
    $hardwareDownloads = [IO.Path]::GetFullPath((Join-Path $siteRoot 'resources/hardware-en')) + [IO.Path]::DirectorySeparatorChar
    $impactInput = [IO.Path]::GetFullPath((Join-Path $siteRoot 'assets/sustainability/impact-model-inputs.csv'))
    if (-not ($source.StartsWith($hardwareDownloads, [StringComparison]::OrdinalIgnoreCase) -or $source -eq $impactInput)) { throw "Source outside approved download-copy roots: $source" }
    if (-not $canonical.StartsWith($archiveRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Canonical outside archive: $canonical" }
    if ($source -eq $canonical -or [IO.Path]::GetExtension($source) -notin @('.csv','.json')) { throw 'Invalid source type or duplicate path' }
    $sourceFile = Get-Item -LiteralPath $source
    $archiveFile = Get-Item -LiteralPath $canonical
    if (($sourceFile.Attributes -band [IO.FileAttributes]::ReparsePoint) -or ($archiveFile.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Reparse point not allowed' }
    if ($sourceFile.Length -ne $entry.bytes -or $archiveFile.Length -ne $entry.bytes) { throw "Size mismatch: $source" }
    if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw "Source hash mismatch: $source" }
    if ((Get-FileHash -LiteralPath $canonical -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw "Canonical hash mismatch: $canonical" }
    Remove-Item -LiteralPath $source
    if (Test-Path -LiteralPath $source) { throw "Source remains: $source" }
    if ((Get-FileHash -LiteralPath $canonical -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw "Canonical changed after removal: $canonical" }
    $removed += $entry
}
$report = [ordered]@{status='complete';removed_count=$removed.Count;removed_bytes=($removed | Measure-Object -Property bytes -Sum).Sum;files=$removed;canonical_survival_verified=$true;completed_at_utc=[DateTime]::UtcNow.ToString('o')}
$report | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'executed-download-copy-cleanup.json') -Encoding utf8
Write-Output "Removed $($removed.Count) unreferenced CSV/JSON download copies; all canonical bytes retained."

