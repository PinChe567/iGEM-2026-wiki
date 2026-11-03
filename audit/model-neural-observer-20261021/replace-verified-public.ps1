$ErrorActionPreference = 'Stop'
$auditRoot = $PSScriptRoot
$planPath = Join-Path $auditRoot 'public-refresh-plan.json'
$plan = Get-Content -LiteralPath $planPath -Raw -Encoding UTF8 | ConvertFrom-Json
$workspaceRoot = (Resolve-Path -LiteralPath $plan.workspace).Path.TrimEnd('\')
$oldRoot = [IO.Path]::GetFullPath($plan.old_root).TrimEnd('\')
$newRoot = [IO.Path]::GetFullPath($plan.new_root).TrimEnd('\')
if ($oldRoot -ne (Join-Path $workspaceRoot 'gitlab\nthu\public')) { throw 'Unexpected old public target' }
if ($newRoot -ne (Join-Path $workspaceRoot 'gitlab\nthu\.build-check\model-neural-observer-public')) { throw 'Unexpected new output target' }

function Assert-PlainContained([string]$target, [string]$boundary) {
    $full = [IO.Path]::GetFullPath($target).TrimEnd('\')
    if ($full -ne $boundary -and -not $full.StartsWith($boundary + '\', [StringComparison]::OrdinalIgnoreCase)) { throw "Outside boundary: $full" }
    $item = Get-Item -LiteralPath $full -Force
    if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Reparse point: $full" }
    if ($item.Extension -eq '.pyc') { throw 'Pyc is outside authorized scope' }
    return $item
}

foreach ($rootPath in @($oldRoot, $newRoot)) {
    $cursor = $rootPath
    while ($true) {
        $null = Assert-PlainContained $cursor $workspaceRoot
        if ($cursor -eq $workspaceRoot) { break }
        $cursor = Split-Path -Parent $cursor
    }
    foreach ($item in Get-ChildItem -LiteralPath $rootPath -Force -Recurse) {
        $null = Assert-PlainContained $item.FullName $rootPath
    }
}

function Verify-Inventory([string]$rootPath, $entries) {
    $actual = @(Get-ChildItem -LiteralPath $rootPath -File -Force -Recurse)
    if ($actual.Count -ne @($entries).Count) { throw "Unexpected file count: $rootPath" }
    foreach ($entry in $entries) {
        if ([IO.Path]::IsPathRooted($entry.path) -or $entry.path.Split('/') -contains '..') { throw 'Unsafe plan path' }
        $path = [IO.Path]::GetFullPath((Join-Path $rootPath $entry.path))
        $item = Assert-PlainContained $path $rootPath
        if ($item.PSIsContainer -or $item.Length -ne $entry.bytes) { throw "Size mismatch: $path" }
        if ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw "SHA mismatch: $path" }
    }
}

Verify-Inventory $oldRoot $plan.old_files
Verify-Inventory $newRoot $plan.new_files
$receipt = [ordered]@{
    started_at_utc = [DateTime]::UtcNow.ToString('o')
    plan_sha256 = (Get-FileHash -LiteralPath $planPath -Algorithm SHA256).Hash.ToLowerInvariant()
    scope = 'Only verified obsolete gitlab/nthu/public files, then native move of verified new output; no recursive deletion.'
    old_root = $oldRoot
    new_root = $newRoot
    status = 'in progress'
    removed_files = [Collections.Generic.List[object]]::new()
    removed_empty_directories = [Collections.Generic.List[string]]::new()
    untouched = @('upload-staging blocked copies', 'all pyc files', 'GitHub checkout', 'source and .git')
}
$receiptPath = Join-Path $auditRoot 'executed-public-refresh.json'
try {
    foreach ($entry in $plan.old_files) {
        $path = [IO.Path]::GetFullPath((Join-Path $oldRoot $entry.path))
        $null = Assert-PlainContained $path $oldRoot
        if ((Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.sha256) { throw "Changed immediately before removal: $path" }
        Remove-Item -LiteralPath $path -Force
        $receipt.removed_files.Add($entry)
    }
    $directories = @(Get-ChildItem -LiteralPath $oldRoot -Directory -Force -Recurse | Sort-Object { $_.FullName.Length } -Descending)
    foreach ($directory in $directories) {
        $null = Assert-PlainContained $directory.FullName $oldRoot
        if (@(Get-ChildItem -LiteralPath $directory.FullName -Force).Count -ne 0) { throw 'Directory is not empty' }
        Remove-Item -LiteralPath $directory.FullName
        $receipt.removed_empty_directories.Add($directory.FullName)
    }
    $null = Assert-PlainContained $oldRoot $workspaceRoot
    if (@(Get-ChildItem -LiteralPath $oldRoot -Force).Count -ne 0) { throw 'Old public is not empty' }
    Remove-Item -LiteralPath $oldRoot
    $receipt.removed_empty_directories.Add($oldRoot)
    $null = Assert-PlainContained $newRoot $workspaceRoot
    Move-Item -LiteralPath $newRoot -Destination $oldRoot
    Verify-Inventory $oldRoot $plan.new_files
    $receipt.status = 'completed'
    $receipt.active_public_files = @($plan.new_files).Count
    $receipt.active_public_bytes = $plan.new_bytes
    $receipt.active_public_sha_verification = 'All files exactly match the independently verified new build.'
} catch {
    $receipt.status = 'stopped with error; no retry or fallback performed'
    $receipt.error = $_.Exception.Message
    throw
} finally {
    $receipt.finished_at_utc = [DateTime]::UtcNow.ToString('o')
    $receipt.removed_file_count = $receipt.removed_files.Count
    $receipt.removed_file_bytes = ($receipt.removed_files | Measure-Object -Property bytes -Sum).Sum
    $receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
}
[ordered]@{status=$receipt.status; removed_file_count=$receipt.removed_file_count; removed_file_bytes=$receipt.removed_file_bytes; active_public_files=$receipt.active_public_files; active_public_bytes=$receipt.active_public_bytes} | ConvertTo-Json
