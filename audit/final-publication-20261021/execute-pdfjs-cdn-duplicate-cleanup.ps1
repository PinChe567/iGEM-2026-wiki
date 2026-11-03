param([switch]$Execute)
$ErrorActionPreference='Stop'
$auditDir=Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceDir=[IO.Path]::GetFullPath((Join-Path $auditDir '../../..'))
$planPath=Join-Path $auditDir 'pdfjs-cdn-duplicate-cleanup-plan.json'
$plan=Get-Content -LiteralPath $planPath -Raw -Encoding UTF8 | ConvertFrom-Json
$gate=Get-Content -LiteralPath (Join-Path $auditDir 'pdfjs-cdn-cleanup-qa-gate.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if(-not $gate.public_qa_passed -or -not $gate.source_stable_confirmed){throw 'QA gate failed'}
$allowed=@(
 'aerosense-wiki/js/vendor/pdfjs-6.4.299/pdf.mjs',
 'aerosense-wiki/js/vendor/pdfjs-6.4.299/pdf.worker.mjs',
 'gitlab/nthu/site/js/vendor/pdfjs-6.4.299/pdf.mjs',
 'gitlab/nthu/site/js/vendor/pdfjs-6.4.299/pdf.worker.mjs',
 'aerosense-wiki/igem-upload/pdfjs-official/pdfjs-6-4-299-3ab3d2fe.js',
 'aerosense-wiki/igem-upload/pdfjs-official/pdfjs-worker-6-4-299-07ceb740.js'
)
function Check-Hash([string]$path,[string]$hash){
 if((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $hash){throw "Hash changed: $path"}
}
function Checked-File([string]$relative){
 $absolute=[IO.Path]::GetFullPath((Join-Path $workspaceDir $relative))
 if(-not $absolute.StartsWith($workspaceDir.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Outside workspace'}
 $item=Get-Item -LiteralPath $absolute -Force
 if($item.PSIsContainer){throw 'Expected exact file'}
 $cursor=$item
 while($null -ne $cursor){
  if(($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'Reparse point refused'}
  $cursor=if($cursor -is [IO.FileInfo]){$cursor.Directory}else{$cursor.Parent}
 }
 return $item.FullName
}
if($plan.items.Count -ne $allowed.Count){throw 'Unexpected file count'}
$seen=@{}
foreach($r in $plan.items){
 if($r.path -notin $allowed -or $seen.ContainsKey($r.path)){throw 'Unexpected duplicate cleanup target'}
 $seen[$r.path]=$true
 Check-Hash (Checked-File $r.path) $r.sha256
 Check-Hash (Checked-File $r.canonical) $r.sha256
}
foreach($r in $gate.active_public_preserved_files){Check-Hash (Join-Path $workspaceDir $r.path) $r.sha256}
if(-not $Execute){[pscustomobject]@{mode='preflight-only';files=$plan.files;bytes=$plan.bytes;deletes=0}|ConvertTo-Json;exit 0}
$receipt=[ordered]@{started_at_utc=[DateTime]::UtcNow.ToString('o');removed_files=@();canonical_verified=$true;recursive_delete_used=$false;pyc_touched=$false;completed=$false}
$out=Join-Path $auditDir 'executed-pdfjs-cdn-duplicate-cleanup.json'
foreach($r in $plan.items){
 $path=Checked-File $r.path
 Check-Hash $path $r.sha256
 Check-Hash (Checked-File $r.canonical) $r.sha256
 Remove-Item -LiteralPath $path -Force
 if(Test-Path -LiteralPath $path){throw 'Removal unconfirmed'}
 $receipt.removed_files+=$r
 $receipt|ConvertTo-Json -Depth 10|Set-Content -LiteralPath $out -Encoding UTF8
}
foreach($r in $gate.active_public_preserved_files){Check-Hash (Join-Path $workspaceDir $r.path) $r.sha256}
$receipt.completed=$true
$receipt.removed_count=$receipt.removed_files.Count
$receipt.removed_bytes=$plan.bytes
$receipt.active_public_unchanged=$gate.active_public_preserved_files.Count
$receipt.completed_at_utc=[DateTime]::UtcNow.ToString('o')
$receipt|ConvertTo-Json -Depth 10|Set-Content -LiteralPath $out -Encoding UTF8
[pscustomobject]@{completed=$true;files=$receipt.removed_count;bytes=$receipt.removed_bytes;active_public_unchanged=$receipt.active_public_unchanged}|ConvertTo-Json
