$ErrorActionPreference = 'Stop'
$taskWorkspace = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../../..')).Path
$auditDirectory = Join-Path $taskWorkspace 'aerosense-wiki/audit/final-publication-20261021'
$cacheDirectory = (Resolve-Path -LiteralPath (Join-Path $auditDirectory 'registry-image-source-cache')).Path
$canonicalDirectory = (Resolve-Path -LiteralPath (Join-Path $taskWorkspace 'zenodo-release/aerosense-wiki/assets/registry-historical-gels-20261021')).Path
$receiptPath = Join-Path $auditDirectory 'executed-registry-historical-gel-cache-cleanup.json'
if (Test-Path -LiteralPath $receiptPath) { throw 'Cleanup already has a receipt; do not repeat.' }
$preserved = Get-Content -LiteralPath (Join-Path $auditDirectory 'registry-historical-gel-preservation.json') -Raw | ConvertFrom-Json
$original = Get-Content -LiteralPath (Join-Path $auditDirectory 'registry-image-original-compatibility.json') -Raw | ConvertFrom-Json
$uploaded = Get-Content -LiteralPath (Join-Path $auditDirectory 'registry-image-upload-readback.json') -Raw | ConvertFrom-Json
if ($uploaded.success_count -ne 75 -or $uploaded.mapped_count -ne 75) { throw 'Registry upload verification not complete.' }
if ($preserved.files.Count -ne 4) { throw 'Unexpected canonical selection.' }
$expectedNames = @(
  'b9b2e651fab2-162e2e391a9f-gel-a.webp',
  '47e61e3af719-1062986f348e-gel-b.webp',
  '1fd264b2e801-73a8f00df738-gel-c.webp',
  '753117eef170-3df0df20eba4-gel-d.webp'
)
function Assert-ContainedOrdinaryPath([string]$Candidate, [string]$Container) {
  $resolved = (Resolve-Path -LiteralPath $Candidate).Path
  if (-not $resolved.StartsWith($Container + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw "Path escapes approved directory: $resolved" }
  $item = Get-Item -LiteralPath $resolved -Force
  if ($item.PSIsContainer) { throw 'Expected exact regular file.' }
  $cursor = $item
  while ($null -ne $cursor) {
    if (($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Reparse point in approved path: $($cursor.FullName)" }
    if ($cursor.FullName -eq $taskWorkspace) { break }
    $cursor = if ($cursor -is [IO.FileInfo]) { $cursor.Directory } else { $cursor.Parent }
  }
  return $resolved
}
$verified = @()
foreach ($row in $preserved.files) {
  $sourceRows = @($original.checks | Where-Object { $_.source_image_url -eq $row.source_image_url -and $_.exact_path })
  if ($sourceRows.Count -ne 1) { throw 'Ambiguous original cache source.' }
  $source = Assert-ContainedOrdinaryPath $sourceRows[0].exact_path $cacheDirectory
  $canonical = Assert-ContainedOrdinaryPath (Join-Path $taskWorkspace $row.canonical_path) $canonicalDirectory
  if ([IO.Path]::GetFileName($source) -notin $expectedNames) { throw 'File outside four-name allowlist.' }
  $sourceHash = (Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant()
  $canonicalHash = (Get-FileHash -LiteralPath $canonical -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($sourceHash -ne $row.sha256 -or $canonicalHash -ne $row.sha256) { throw 'Canonical/source SHA mismatch.' }
  if ((Get-Item -LiteralPath $source).Length -ne $row.bytes -or (Get-Item -LiteralPath $canonical).Length -ne $row.bytes) { throw 'Canonical/source size mismatch.' }
  $verified += [ordered]@{path=$source; canonical=$canonical; sha256=$sourceHash; bytes=[long]$row.bytes}
}
if (@($verified | ForEach-Object { $_.path } | Select-Object -Unique).Count -ne 4) { throw 'Duplicate selection.' }
$receipt = [ordered]@{
  started_at_utc=[DateTime]::UtcNow.ToString('o')
  scope='Only four exact historical gel cache copies, never previously attempted/blocked; prior 83 blocked files excluded.'
  root_authorization='Final tiny cleanup of four archived and Registry-verified cache copies.'
  preservation_receipt_sha256=(Get-FileHash -LiteralPath (Join-Path $auditDirectory 'registry-historical-gel-preservation.json') -Algorithm SHA256).Hash.ToLowerInvariant()
  registry_upload_receipt_sha256=(Get-FileHash -LiteralPath (Join-Path $auditDirectory 'registry-image-upload-readback.json') -Algorithm SHA256).Hash.ToLowerInvariant()
  verified_files=$verified
  removed_files=@()
  removed_file_count=0
  removed_file_bytes=0
  status='verified; deletion starting'
  prior_83_blocked_files_untouched=$true
  no_recursive_delete=$true
}
$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding utf8
try {
  foreach ($entry in $verified) {
    if ((Get-FileHash -LiteralPath $entry.path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw 'Source changed after verification.' }
    Remove-Item -LiteralPath $entry.path -Force
    if (Test-Path -LiteralPath $entry.path) { throw 'Exact file still exists after deletion.' }
    $receipt.removed_files += $entry
    $receipt.removed_file_count += 1
    $receipt.removed_file_bytes += $entry.bytes
    $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding utf8
  }
  foreach ($entry in $verified) {
    if ((Get-FileHash -LiteralPath $entry.canonical -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw 'Preserved canonical changed.' }
  }
  $receipt.status = 'completed'
  $receipt.finished_at_utc = [DateTime]::UtcNow.ToString('o')
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding utf8
  [pscustomobject]@{status=$receipt.status;removed_file_count=$receipt.removed_file_count;removed_file_bytes=$receipt.removed_file_bytes;prior_83_blocked_files_untouched=$true} | ConvertTo-Json
} catch {
  $receipt.status = 'stopped after error; do not retry'
  $receipt.error = $_.Exception.Message
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding utf8
  throw
}
