param([switch]$Execute)
$ErrorActionPreference = 'Stop'
$auditRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$workspaceRoot = [IO.Path]::GetFullPath((Join-Path $auditRoot '../../..')).TrimEnd('\')
$wikiRoot = Join-Path $workspaceRoot 'gitlab/nthu'
$softwareRoot = Join-Path $workspaceRoot 'gitlab/aerosense-software'
$archiveRoot = Join-Path $workspaceRoot 'zenodo-release'
function Assert-SafePath([string]$Path, [string]$Boundary) {
  $full = [IO.Path]::GetFullPath($Path)
  $base = [IO.Path]::GetFullPath($Boundary).TrimEnd('\')
  if (-not $full.StartsWith($base + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Outside approved boundary: $full" }
  $item = Get-Item -LiteralPath $full -Force
  if ($item.PSIsContainer) { throw "Expected file: $full" }
  for ($cursor = $full; $cursor -and $cursor.StartsWith($workspaceRoot, [StringComparison]::OrdinalIgnoreCase); $cursor = [IO.Path]::GetDirectoryName($cursor)) {
    $entry = Get-Item -LiteralPath $cursor -Force
    if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse point: $cursor" }
    if ($cursor -eq $workspaceRoot) { break }
  }
  return $full
}
function Assert-Hash([string]$Path, [string]$Hash, [long]$Bytes) {
  if ((Get-Item -LiteralPath $Path -Force).Length -ne $Bytes) { throw "Size mismatch: $Path" }
  if ((Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $Hash) { throw "SHA mismatch: $Path" }
}
$copies = Get-Content -LiteralPath (Join-Path $auditRoot 'software-repository-source-copy.json') -Raw | ConvertFrom-Json
$preserved = Get-Content -LiteralPath (Join-Path $archiveRoot 'reproduction-source/software-source-before-migration-20261021/PRESERVATION-MANIFEST.json') -Raw | ConvertFrom-Json
$canonicalByPath = @{}
foreach ($row in $preserved.files) { $canonicalByPath[$row.repository_path] = $row }
if ($copies.files.Count -ne 1220 -or $canonicalByPath.Count -ne 1220) { throw 'Unexpected approved file count' }
$indexHashes = @{}
foreach ($repo in @($wikiRoot, $softwareRoot)) {
  $index = Join-Path $repo '.git/index'
  $indexHashes[$index] = (Get-FileHash -LiteralPath $index -Algorithm SHA256).Hash.ToLowerInvariant()
}
$plan = @()
foreach ($row in $copies.files) {
  $rel = [string]$row.repository_relative
  if ($rel -notmatch '^(code|docs)/aerosense/' -or $rel -match '(^|/)(\.git|__pycache__)(/|$)' -or $rel.EndsWith('.pyc')) { throw "Unapproved source: $rel" }
  $canonical = $canonicalByPath[$rel]
  if (-not $canonical -or $canonical.sha256 -ne $row.sha256 -or $canonical.bytes -ne $row.bytes) { throw "Canonical mismatch: $rel" }
  $boundary = if ($rel.StartsWith('code/')) { Join-Path $wikiRoot 'code/aerosense' } else { Join-Path $wikiRoot 'docs/aerosense' }
  $source = Assert-SafePath (Join-Path $workspaceRoot $row.source_relative) $boundary
  $destination = Assert-SafePath (Join-Path $workspaceRoot $row.destination_relative) $softwareRoot
  $archive = Assert-SafePath (Join-Path $workspaceRoot $canonical.canonical) $archiveRoot
  foreach ($p in @($source, $destination, $archive)) { Assert-Hash $p $row.sha256 $row.bytes }
  $plan += [pscustomobject]@{ repository_relative=$rel; source=$source; software=$destination; canonical=$archive; sha256=$row.sha256; bytes=[long]$row.bytes }
}
$preflight = [ordered]@{ checked_at_utc=[DateTime]::UtcNow.ToString('o'); files=$plan; index_hashes=$indexHashes; execute=[bool]$Execute; protected_ignored_cache_files=2 }
$preflight | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $auditRoot 'wiki-software-removal-preflight.json') -Encoding utf8
if (-not $Execute) { Write-Output "Validated $($plan.Count) exact copies; no deletion requested"; exit 0 }
$removed = @(); [long]$removedBytes = 0
foreach ($row in $plan) {
  foreach ($p in @($row.source, $row.software, $row.canonical)) { Assert-Hash $p $row.sha256 $row.bytes }
  Remove-Item -LiteralPath $row.source
  if (Test-Path -LiteralPath $row.source) { throw "Source remains: $($row.source)" }
  foreach ($p in @($row.software, $row.canonical)) { Assert-Hash $p $row.sha256 $row.bytes }
  $removed += $row
  $removedBytes += [long]$row.bytes
}
foreach ($index in $indexHashes.Keys) {
  if ((Get-FileHash -LiteralPath $index -Algorithm SHA256).Hash.ToLowerInvariant() -ne $indexHashes[$index]) { throw "Index changed: $index" }
}
$receipt = [ordered]@{ completed_at_utc=[DateTime]::UtcNow.ToString('o'); files=$removed; removed_files=$removed.Count; removed_bytes=$removedBytes; canonical_and_software_hashes_rechecked=$true; indices_unchanged=$true; ignored_cache_files_not_touched=2; directory_deletions=0 }
$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $auditRoot 'executed-wiki-software-copy-cleanup.json') -Encoding utf8
Write-Output "Removed $($removed.Count) exact Wiki duplicates ($removedBytes bytes); Software and canonical sources retained; indices unchanged; two ignored caches untouched."
