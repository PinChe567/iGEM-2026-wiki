$ErrorActionPreference = 'Stop'
$taskRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$workspaceRoot = [IO.Path]::GetFullPath((Join-Path $taskRoot '..'))
$target = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'upload-staging'))
if ($target -ne (Join-Path $workspaceRoot 'aerosense-wiki/audit/final-publication-20261021/upload-staging')) { throw 'Unexpected target' }
if (-not $target.StartsWith($workspaceRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Outside workspace' }
if ((Get-Item -LiteralPath $target).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Reparse target' }
$plan = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'upload-staging-cleanup-plan.json') -Raw | ConvertFrom-Json
$additions = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'publication-download-archive-receipt.json') -Raw | ConvertFrom-Json
$items = @()
foreach ($entry in $plan.items) {
  $source = [IO.Path]::GetFullPath((Join-Path $workspaceRoot $entry.source))
  if (-not $source.StartsWith($target + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Source outside staging' }
  $canonicalRel = @($entry.canonical) | Select-Object -First 1
  if (-not $canonicalRel) { $canonicalRel = ($additions.files | Where-Object staging_source -EQ $entry.source).canonical }
  if (-not $canonicalRel) { throw "No canonical: $($entry.source)" }
  $canonical = [IO.Path]::GetFullPath((Join-Path $workspaceRoot $canonicalRel))
  if (-not $canonical.StartsWith($workspaceRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Canonical outside workspace' }
  foreach ($path in @($source, $canonical)) {
    $file = Get-Item -LiteralPath $path
    if ($file.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Reparse file' }
    if ($file.Length -ne $entry.bytes) { throw "Size changed: $path" }
    if ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw "Hash changed: $path" }
  }
  $items += [pscustomobject]@{source=$source; canonical=$canonical; bytes=$entry.bytes; sha256=$entry.sha256}
}
$allFiles = @(Get-ChildItem -LiteralPath $target -Recurse -File)
if ($allFiles.Count -ne $items.Count) { throw 'Unplanned files in staging' }
if (@(Get-ChildItem -LiteralPath $target -Recurse -Force | Where-Object { $_.Attributes -band [IO.FileAttributes]::ReparsePoint }).Count) { throw 'Reparse descendant' }
foreach ($entry in $items) { Remove-Item -LiteralPath $entry.source -Force }
foreach ($directory in (Get-ChildItem -LiteralPath $target -Recurse -Directory | Sort-Object { $_.FullName.Length } -Descending)) {
  if (@(Get-ChildItem -LiteralPath $directory.FullName -Force).Count -eq 0) { Remove-Item -LiteralPath $directory.FullName }
}
if (@(Get-ChildItem -LiteralPath $target -Force).Count -eq 0) { Remove-Item -LiteralPath $target }
foreach ($entry in $items) {
  if ((Get-FileHash -LiteralPath $entry.canonical -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw 'Post-cleanup canonical mismatch' }
}
$receipt = [pscustomobject]@{status='complete'; removed_files=$items.Count; removed_bytes=($items | Measure-Object bytes -Sum).Sum; canonical_rechecked=$true; files=$items}
$receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'executed-upload-staging-cleanup.json') -Encoding utf8
$receipt | Select-Object status,removed_files,removed_bytes,canonical_rechecked | ConvertTo-Json
