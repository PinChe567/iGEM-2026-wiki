param([switch]$Delete)
$ErrorActionPreference = 'Stop'
$workspaceRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..\..\..')).Path
$siteRoot = (Resolve-Path -LiteralPath (Join-Path $workspaceRoot 'aerosense-wiki')).Path
$archiveRoot = (Resolve-Path -LiteralPath (Join-Path $workspaceRoot 'zenodo-release')).Path
$odorRoot = (Resolve-Path -LiteralPath (Join-Path $workspaceRoot 'odor')).Path
$rawRoot = (Resolve-Path -LiteralPath (Join-Path $archiveRoot 'aerosense-wiki\data\odor-2026-10-21\raw')).Path
if ($odorRoot -ne (Join-Path $workspaceRoot 'odor')) { throw 'Unexpected odor target.' }
if ((Get-Item -LiteralPath $odorRoot).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Odor target is a reparse point.' }
$odorEntries = @(Get-ChildItem -LiteralPath $odorRoot -Force)
if ($odorEntries.Count -ne 12 -or @($odorEntries | Where-Object { $_.PSIsContainer -or $_.Extension -ne '.xlsx' -or ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) }).Count -ne 0) { throw 'Unexpected odor contents.' }
$odorVerified = @()
foreach ($sourceFile in $odorEntries) {
    $archivedFile = Get-Item -LiteralPath (Join-Path $rawRoot $sourceFile.Name)
    $sourceHash = (Get-FileHash -LiteralPath $sourceFile.FullName -Algorithm SHA256).Hash
    $archivedHash = (Get-FileHash -LiteralPath $archivedFile.FullName -Algorithm SHA256).Hash
    if ($sourceFile.Length -ne $archivedFile.Length -or $sourceHash -ne $archivedHash) { throw "Backup mismatch: $($sourceFile.Name)" }
    $odorVerified += [pscustomobject]@{ source=$sourceFile.FullName; archive=$archivedFile.FullName; bytes=$sourceFile.Length; sha256=$sourceHash }
}
$videoManifest = Get-Content -LiteralPath (Join-Path $siteRoot 'audit\video-cleanup-20261021.json') -Raw -Encoding UTF8 | ConvertFrom-Json
if (@($videoManifest.targets).Count -ne 23) { throw 'Expected exactly 23 listed video copies.' }
$videoVerified = @()
foreach ($record in $videoManifest.targets) {
    $videoFile = Get-Item -LiteralPath $record.path
    $resolvedVideo = (Resolve-Path -LiteralPath $videoFile.FullName).Path
    $insideSite = $resolvedVideo.StartsWith($siteRoot + '\', [StringComparison]::OrdinalIgnoreCase)
    $insideArchive = $resolvedVideo.StartsWith($archiveRoot + '\', [StringComparison]::OrdinalIgnoreCase)
    if (-not ($insideSite -or $insideArchive)) { throw 'Video outside the authorized site/archive roots.' }
    if ($videoFile.PSIsContainer -or $videoFile.Extension -notin @('.mp4','.webm') -or ($videoFile.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Unexpected video type; AVI must be retained.' }
    if (-not $record.public_delivery_verified -or $record.watch_url -notmatch '^https://video\.igem\.org/w/[A-Za-z0-9]+$') { throw 'Missing verified official counterpart.' }
    $videoHash=(Get-FileHash -LiteralPath $resolvedVideo -Algorithm SHA256).Hash
    if ($videoFile.Length -ne $record.bytes -or $videoHash -ne $record.sha256) { throw "Video hash mismatch: $resolvedVideo" }
    $videoVerified += [pscustomobject]@{ path=$resolvedVideo; bytes=$videoFile.Length; sha256=$videoHash; watch_url=$record.watch_url }
}
$aviBefore = @(Get-ChildItem -LiteralPath $siteRoot,$archiveRoot -Filter '*.avi' -File -Recurse | ForEach-Object { [pscustomobject]@{path=$_.FullName; bytes=$_.Length; modified=$_.LastWriteTimeUtc.ToString('o')} })
$report=[ordered]@{ renewed_user_authorization=$true; preflight_passed=$true; odor_backup_verified=$odorVerified; videos=$videoVerified; original_avi_retained=$aviBefore; executed=$false; deleted_videos=0; deleted_odor_folder=$false }
$reportPath=Join-Path $PSScriptRoot 'cleanup-reauthorized-result.json'
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding UTF8
if (-not $Delete) { [pscustomobject]@{ odor_files_verified=$odorVerified.Count; video_copies_verified=$videoVerified.Count; avi_files_retained=$aviBefore.Count; deletion_performed=$false } | ConvertTo-Json; exit }
# The exact, resolved odor directory contains only the twelve verified XLSX copies.
Remove-Item -LiteralPath $odorRoot -Recurse -Force
$report.deleted_odor_folder = -not (Test-Path -LiteralPath $odorRoot)
foreach ($video in $videoVerified) {
    Remove-Item -LiteralPath $video.path -Force
    if (Test-Path -LiteralPath $video.path) { throw 'Video deletion did not complete.' }
    $report.deleted_videos++
    $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding UTF8
}
foreach ($avi in $aviBefore) {
    $currentAvi=Get-Item -LiteralPath $avi.path
    if ($currentAvi.Length -ne $avi.bytes -or $currentAvi.LastWriteTimeUtc.ToString('o') -ne $avi.modified) { throw 'AVI preservation check failed.' }
}
$report.executed=$true
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding UTF8
[pscustomobject]@{ odor_folder_deleted=$report.deleted_odor_folder; video_copies_deleted=$report.deleted_videos; original_avi_retained=$aviBefore.Count; archived_odor_files=12 } | ConvertTo-Json
