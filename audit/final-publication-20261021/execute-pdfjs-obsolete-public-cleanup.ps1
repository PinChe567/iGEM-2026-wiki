param([switch]$Execute)
$ErrorActionPreference='Stop'
$auditDir=Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceDir=[IO.Path]::GetFullPath((Join-Path $auditDir '../../..'))
$planPath=Join-Path $auditDir 'pdfjs-obsolete-public-cleanup-plan.json'
$plan=Get-Content -LiteralPath $planPath -Raw -Encoding UTF8 | ConvertFrom-Json
$gate=Get-Content -LiteralPath (Join-Path $auditDir 'pdfjs-cleanup-qa-gate.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $gate.public_qa_passed -or -not $gate.source_stable_confirmed) {throw 'Public QA gate failed.'}
$allowedRoot=[IO.Path]::GetFullPath((Join-Path $workspaceDir 'gitlab/nthu/.build-check/pdfjs-previous-public'))
function Check-Path([string]$path,[switch]$Directory) {
 $absolute=[IO.Path]::GetFullPath($path)
 if ($absolute -ne $allowedRoot -and -not $absolute.StartsWith($allowedRoot.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase)) {throw "Outside the named obsolete output: $absolute"}
 $item=Get-Item -LiteralPath $absolute -Force
 if ($item.PSIsContainer -ne [bool]$Directory) {throw "Wrong entry type: $absolute"}
 $cursor=$item
 while ($null -ne $cursor) {
  if (($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {throw "Reparse point refused: $($cursor.FullName)"}
  $cursor=if ($cursor -is [IO.FileInfo]) {$cursor.Directory} else {$cursor.Parent}
 }
 return $item.FullName
}
function Check-Hash([string]$path,[string]$hash) {
 if ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $hash) {throw "File hash changed: $path"}
}
foreach ($r in $gate.active_public_preserved_files) {Check-Hash (Join-Path $workspaceDir $r.path) $r.sha256}
$seen=@{}
foreach ($r in $plan.items) {
 if ($seen.ContainsKey($r.path)) {throw 'Duplicate cleanup path.'};$seen[$r.path]=$true
 if ([IO.Path]::GetExtension($r.path) -eq '.pyc') {throw 'No bytecode removal is permitted.'}
 $p=Check-Path (Join-Path $workspaceDir $r.path);Check-Hash $p $r.sha256
}
$actualFiles=@(Get-ChildItem -LiteralPath $allowedRoot -File -Recurse -Force)
if ($actualFiles.Count -ne $plan.files) {throw 'Unexpected files in the obsolete output.'}
if (-not $Execute) {[pscustomobject]@{mode='preflight-only';files=$plan.files;bytes=($plan.items|Measure-Object -Property bytes -Sum).Sum;active_public_verified=$gate.active_public_preserved_files.Count;deletes=0}|ConvertTo-Json;exit 0}
$out=Join-Path $auditDir 'executed-pdfjs-obsolete-public-cleanup.json'
$receipt=[ordered]@{started_at_utc=[DateTime]::UtcNow.ToString('o');plan_sha256=(Get-FileHash -LiteralPath $planPath -Algorithm SHA256).Hash.ToLowerInvariant();removed_files=@();removed_empty_directories=@();active_public_verified_before=$gate.active_public_preserved_files.Count;recursive_delete_used=$false;pyc_touched=$false;completed=$false}
foreach ($r in $plan.items) {
 $p=Check-Path (Join-Path $workspaceDir $r.path);Check-Hash $p $r.sha256
 Remove-Item -LiteralPath $p -Force
 if (Test-Path -LiteralPath $p) {throw "Removal not confirmed: $p"}
 $receipt.removed_files += $r
 if (($receipt.removed_files.Count % 100) -eq 0) {$receipt | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $out -Encoding UTF8}
}
$dirs=@(Get-ChildItem -LiteralPath $allowedRoot -Directory -Recurse -Force | Sort-Object {$_.FullName.Length} -Descending)
$dirs+=Get-Item -LiteralPath $allowedRoot
foreach ($d in $dirs) {
 $p=Check-Path $d.FullName -Directory
 if (@(Get-ChildItem -LiteralPath $p -Force).Count -eq 0) {Remove-Item -LiteralPath $p -Force;$receipt.removed_empty_directories+=$p}
}
foreach ($r in $gate.active_public_preserved_files) {Check-Hash (Join-Path $workspaceDir $r.path) $r.sha256}
$receipt.active_public_verified_after=$gate.active_public_preserved_files.Count
$receipt.completed=$true;$receipt.completed_at_utc=[DateTime]::UtcNow.ToString('o');$receipt.removed_count=$receipt.removed_files.Count;$receipt.removed_bytes=($receipt.removed_files|Measure-Object -Property bytes -Sum).Sum
$receipt|ConvertTo-Json -Depth 10|Set-Content -LiteralPath $out -Encoding UTF8
[pscustomobject]@{completed=$true;files=$receipt.removed_count;bytes=$receipt.removed_bytes;empty_directories=$receipt.removed_empty_directories.Count;active_public_unchanged=$receipt.active_public_verified_after}|ConvertTo-Json
