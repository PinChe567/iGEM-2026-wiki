param([switch]$Execute, [string]$PublicQaReceipt)
$ErrorActionPreference = 'Stop'
$auditDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$siteDir = [IO.Path]::GetFullPath((Join-Path $auditDir '../..'))
$workspaceDir = [IO.Path]::GetFullPath((Join-Path $siteDir '..'))
$planPath = Join-Path $auditDir 'final-staging-cleanup-candidates.json'
$plan = Get-Content -LiteralPath $planPath -Raw -Encoding UTF8 | ConvertFrom-Json
$rows = @($plan.files | Where-Object { $_.status -in @('ready_for_parent_review','generated_preview_candidate','superseded_generated_metadata') })
$approvedRoot = $siteDir.TrimEnd('\') + '\'
function Assert-OrdinaryContainedFile([string]$relative, [string]$allowedRoot) {
  $absolute = [IO.Path]::GetFullPath((Join-Path $workspaceDir $relative))
  if (-not $absolute.StartsWith($allowedRoot, [StringComparison]::OrdinalIgnoreCase)) { throw "Path outside authorized root: $relative" }
  $entry = Get-Item -LiteralPath $absolute -Force
  if ($entry.PSIsContainer) { throw "Expected an individual file: $relative" }
  $cursor = $entry
  while ($null -ne $cursor) {
    if (($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Reparse point rejected: $($cursor.FullName)" }
    $cursor = if ($cursor -is [IO.FileInfo]) { $cursor.Directory } else { $cursor.Parent }
  }
  return $entry.FullName
}
function Assert-Hash([string]$path, [string]$expected) {
  $actual = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actual -ne $expected) { throw "Hash changed: $path" }
}
$seen = @{}
foreach ($row in $rows) {
  if ($seen.ContainsKey($row.source)) { throw "Duplicate target in plan: $($row.source)" }
  $seen[$row.source] = $true
  if ([IO.Path]::GetExtension($row.source) -eq '.pyc') { throw 'Rejected bytecode targets are excluded.' }
  $path = Assert-OrdinaryContainedFile $row.source $approvedRoot
  Assert-Hash $path $row.sha256
  if ($row.canonical) {
    $keeper = Assert-OrdinaryContainedFile $row.canonical ($workspaceDir.TrimEnd('\') + '\')
    if ($keeper -eq $path) { throw 'Canonical and candidate are the same file.' }
    Assert-Hash $keeper $row.sha256
  } elseif ($row.regenerate_from_canonical_pdf) {
    $keeper = Assert-OrdinaryContainedFile $row.regenerate_from_canonical_pdf ($workspaceDir.TrimEnd('\') + '\')
    Assert-Hash $keeper $row.canonical_pdf_sha256
  } elseif ($row.replacement_source) {
    $keeper = Assert-OrdinaryContainedFile $row.replacement_source ($workspaceDir.TrimEnd('\') + '\')
    Assert-Hash $keeper $row.replacement_sha256
  } else { throw "No preserved original or reproducible PDF parent: $($row.source)" }
}
if (-not $Execute) {
  [pscustomobject]@{mode='preflight-only'; files=$rows.Count; bytes=($rows | Measure-Object -Property bytes -Sum).Sum; deletes=0} | ConvertTo-Json
  exit 0
}
if (-not $PublicQaReceipt) { throw 'Pass the final public-QA approval receipt after hardware confirms completion.' }
$qaPath = Assert-OrdinaryContainedFile $PublicQaReceipt ($workspaceDir.TrimEnd('\') + '\')
$qa = Get-Content -LiteralPath $qaPath -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $qa.public_qa_passed -or -not $qa.source_stable_confirmed -or -not $qa.no_runtime_references_to_cleanup_targets) { throw 'Final public QA/reference preconditions are not all recorded.' }
$receipt = [ordered]@{started_at_utc=[DateTime]::UtcNow.ToString('o'); plan_sha256=(Get-FileHash -LiteralPath $planPath -Algorithm SHA256).Hash.ToLowerInvariant(); public_qa_receipt=$PublicQaReceipt; public_qa_receipt_sha256=(Get-FileHash -LiteralPath $qaPath -Algorithm SHA256).Hash.ToLowerInvariant(); groups=@{}; removed_files=@(); directories_removed=0; canonical_files_removed=0; rejected_pyc_attempted=0; completed=$false}
$receiptPath = Join-Path $auditDir 'executed-final-staging-cleanup.json'
foreach ($row in $rows) {
  # Repeat all guards immediately before each individual removal.
  $path = Assert-OrdinaryContainedFile $row.source $approvedRoot
  Assert-Hash $path $row.sha256
  if ($row.canonical) {
    $keeper = Assert-OrdinaryContainedFile $row.canonical ($workspaceDir.TrimEnd('\') + '\')
    Assert-Hash $keeper $row.sha256
  } elseif ($row.regenerate_from_canonical_pdf) {
    $keeper = Assert-OrdinaryContainedFile $row.regenerate_from_canonical_pdf ($workspaceDir.TrimEnd('\') + '\')
    Assert-Hash $keeper $row.canonical_pdf_sha256
  } else {
    $keeper = Assert-OrdinaryContainedFile $row.replacement_source ($workspaceDir.TrimEnd('\') + '\')
    Assert-Hash $keeper $row.replacement_sha256
  }
  Remove-Item -LiteralPath $path -Force
  if (Test-Path -LiteralPath $path) { throw "Removal not confirmed: $path" }
  $receipt.removed_files += [pscustomobject]@{source=$row.source; group=$row.group; sha256=$row.sha256; bytes=$row.bytes; retained=$keeper}
  if (-not $receipt.groups.ContainsKey($row.group)) { $receipt.groups[$row.group]=0 }
  $receipt.groups[$row.group]++
  $receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
}
$receipt.completed=$true
$receipt.completed_at_utc=[DateTime]::UtcNow.ToString('o')
$receipt.removed_count=$receipt.removed_files.Count
$receipt.removed_bytes=($receipt.removed_files | Measure-Object -Property bytes -Sum).Sum
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
[pscustomobject]@{completed=$true;files=$receipt.removed_count;bytes=$receipt.removed_bytes;groups=$receipt.groups} | ConvertTo-Json -Depth 5
