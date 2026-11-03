param([switch]$Execute, [switch]$SoftwareLinks)
$ErrorActionPreference='Stop'
$auditDir=Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceDir=[IO.Path]::GetFullPath((Join-Path $auditDir '../../..'))
$planName=if ($SoftwareLinks) {'obsolete-software-links-build-cleanup-plan.json'} else {'obsolete-generated-build-cleanup-plan.json'}
$planPath=Join-Path $auditDir $planName
$plan=Get-Content -LiteralPath $planPath -Raw -Encoding UTF8 | ConvertFrom-Json
$gatePath=Join-Path $workspaceDir $plan.qa_gate
$gate=Get-Content -LiteralPath $gatePath -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $gate.public_qa_passed -or -not $gate.source_stable_confirmed) {throw 'Public QA gate failed.'}
$base=[IO.Path]::GetFullPath((Join-Path $workspaceDir 'gitlab/nthu/.build-check'))
$allowedNames=if ($SoftwareLinks) {@('software-links-public','software-links-final-public')} else {@('initial-public','final-public','source-only-previous-public','source-only-final-public','source-only-release-public')}
$allowedRoots=@($allowedNames | ForEach-Object {[IO.Path]::GetFullPath((Join-Path $base $_))})
function Check-Path([string]$path,[switch]$Directory) {
 $absolute=[IO.Path]::GetFullPath($path)
 $matched=@($allowedRoots | Where-Object {$absolute -eq $_ -or $absolute.StartsWith($_.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase)})
 if ($matched.Count -ne 1) {throw "Outside named obsolete outputs: $absolute"}
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
foreach ($r in $plan.files) {
 if ($seen.ContainsKey($r.source)) {throw 'Duplicate cleanup path.'};$seen[$r.source]=$true
 if ([IO.Path]::GetExtension($r.source) -eq '.pyc') {throw 'No bytecode removal is permitted.'}
 $p=Check-Path (Join-Path $workspaceDir $r.source);Check-Hash $p $r.sha256
}
if (-not $Execute) {[pscustomobject]@{mode='preflight-only';files=$plan.files.Count;bytes=$plan.bytes;active_public_verified=$gate.active_public_preserved_files.Count;deletes=0}|ConvertTo-Json;exit 0}
$outName=if ($SoftwareLinks) {'executed-software-links-build-cleanup.json'} else {'executed-obsolete-generated-build-cleanup.json'}
$out=Join-Path $auditDir $outName
$receipt=[ordered]@{started_at_utc=[DateTime]::UtcNow.ToString('o');plan_sha256=(Get-FileHash -LiteralPath $planPath -Algorithm SHA256).Hash.ToLowerInvariant();removed_files=@();removed_empty_directories=@();active_public_verified_before=$gate.active_public_preserved_files.Count;recursive_delete_used=$false;completed=$false}
foreach ($r in $plan.files) {
 $p=Check-Path (Join-Path $workspaceDir $r.source);Check-Hash $p $r.sha256
 Remove-Item -LiteralPath $p -Force
 if (Test-Path -LiteralPath $p) {throw "Removal not confirmed: $p"}
 $receipt.removed_files += $r
 if (($receipt.removed_files.Count % 100) -eq 0) {$receipt | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $out -Encoding UTF8}
}
foreach ($rootPath in $allowedRoots) {
 if (-not (Test-Path -LiteralPath $rootPath)) {continue}
 $dirs=@(Get-ChildItem -LiteralPath $rootPath -Directory -Recurse -Force | Sort-Object {$_.FullName.Length} -Descending)
 $dirs+=Get-Item -LiteralPath $rootPath
 foreach ($d in $dirs) {
  $p=Check-Path $d.FullName -Directory
  if (@(Get-ChildItem -LiteralPath $p -Force).Count -eq 0) {Remove-Item -LiteralPath $p -Force;$receipt.removed_empty_directories+=$p}
 }
}
foreach ($r in $gate.active_public_preserved_files) {Check-Hash (Join-Path $workspaceDir $r.path) $r.sha256}
$receipt.active_public_verified_after=$gate.active_public_preserved_files.Count
$receipt.completed=$true;$receipt.completed_at_utc=[DateTime]::UtcNow.ToString('o');$receipt.removed_count=$receipt.removed_files.Count;$receipt.removed_bytes=($receipt.removed_files|Measure-Object -Property bytes -Sum).Sum
$receipt|ConvertTo-Json -Depth 10|Set-Content -LiteralPath $out -Encoding UTF8
[pscustomobject]@{completed=$true;files=$receipt.removed_count;bytes=$receipt.removed_bytes;empty_directories=$receipt.removed_empty_directories.Count;active_public_unchanged=$receipt.active_public_verified_after}|ConvertTo-Json
