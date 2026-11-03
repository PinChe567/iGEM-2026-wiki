param([switch]$Execute)

# Default mode only verifies. Do not supply -Execute before the root agent's
# explicit signal that all document conversions no longer need these copies.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$auditRoot = $PSScriptRoot
$planPath = Join-Path $auditRoot 'source-only-artifact-removal-plan.json'
$expectedPlanSha256 = '5eeb44807d069238a1ab2058a33f5e68def70c2d23ff5e5c5666037a07c29dcb'
$actualPlanSha256 = (Get-FileHash -LiteralPath $planPath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualPlanSha256 -ne $expectedPlanSha256) { throw 'Reviewed plan hash changed.' }
$plan = Get-Content -LiteralPath $planPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ($plan.file_count -ne 550 -or $plan.total_bytes -ne 108211247 -or @($plan.files).Count -ne 550) {
    throw 'Unexpected cleanup scope.'
}
$workspaceRoot = [IO.Path]::GetFullPath($plan.workspace_root).TrimEnd('\')
$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $workspaceRoot 'gitlab/nthu')).TrimEnd('\')
$archiveRoot = [IO.Path]::GetFullPath((Join-Path $workspaceRoot 'zenodo-release')).TrimEnd('\')
if ($repositoryRoot -cne $plan.repository_root -or $archiveRoot -cne $plan.archive_root) { throw 'Root paths differ from reviewed plan.' }
$sourceRoots = @((Join-Path $repositoryRoot 'code/aerosense'), (Join-Path $repositoryRoot 'docs/aerosense'))
$indexPath = Join-Path $repositoryRoot '.git/index'
$indexHashBefore = (Get-FileHash -LiteralPath $indexPath -Algorithm SHA256).Hash.ToLowerInvariant()

function Assert-ContainedPlainFile([string]$Path, [string]$AllowedRoot) {
    $absolute = [IO.Path]::GetFullPath($Path)
    $boundary = [IO.Path]::GetFullPath($AllowedRoot).TrimEnd('\')
    if (-not $absolute.StartsWith($boundary + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw "File is not a strict child of its approved root: $absolute"
    }
    if (-not [string]::Equals($absolute, $Path, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Plan contains noncanonical path syntax: $Path"
    }
    $resolved = (Resolve-Path -LiteralPath $absolute).ProviderPath
    if (-not [string]::Equals($resolved, $absolute, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Resolved path differs: $absolute"
    }
    $item = Get-Item -LiteralPath $absolute -Force
    if ($item.PSIsContainer) { throw "Directories may not be removed: $absolute" }
    $ancestorPath = $absolute
    while ($true) {
        $ancestor = Get-Item -LiteralPath $ancestorPath -Force
        if (($ancestor.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "Reparse point found: $ancestorPath"
        }
        if ([string]::Equals($ancestorPath, $workspaceRoot, [StringComparison]::OrdinalIgnoreCase)) { break }
        $parent = [IO.Directory]::GetParent($ancestorPath)
        if ($null -eq $parent) { throw 'Ancestry escaped the workspace.' }
        $ancestorPath = $parent.FullName
        if (-not ($ancestorPath.StartsWith($workspaceRoot + '\', [StringComparison]::OrdinalIgnoreCase) -or
            [string]::Equals($ancestorPath, $workspaceRoot, [StringComparison]::OrdinalIgnoreCase))) {
            throw 'Ancestry escaped the workspace.'
        }
    }
    return $item
}

function Assert-Canonical($Record) {
    $expected = [IO.Path]::GetFullPath((Join-Path $workspaceRoot $Record.canonical_relative))
    if (-not [string]::Equals($expected, $Record.canonical_absolute, [StringComparison]::OrdinalIgnoreCase)) { throw 'Canonical path mismatch.' }
    $item = Assert-ContainedPlainFile $Record.canonical_absolute $archiveRoot
    if ($item.Length -ne $Record.bytes) { throw "Canonical size mismatch: $($Record.canonical_relative)" }
    $hash = (Get-FileHash -LiteralPath $Record.canonical_absolute -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($hash -ne $Record.canonical_sha256 -or $hash -ne $Record.source_sha256) { throw "Canonical hash mismatch: $($Record.canonical_relative)" }
    return $hash
}

function Assert-Pair($Record) {
    $expected = [IO.Path]::GetFullPath((Join-Path $repositoryRoot $Record.repository_relative))
    if (-not [string]::Equals($expected, $Record.source_absolute, [StringComparison]::OrdinalIgnoreCase)) { throw 'Source path mismatch.' }
    if ($Record.allowed_source_root -notin $sourceRoots) { throw 'Unexpected allowed source root.' }
    if ([string]::Equals($Record.source_absolute, $Record.canonical_absolute, [StringComparison]::OrdinalIgnoreCase)) { throw 'Source equals canonical.' }
    $item = Assert-ContainedPlainFile $Record.source_absolute $Record.allowed_source_root
    if ($item.Length -ne $Record.bytes) { throw "Source size mismatch: $($Record.repository_relative)" }
    $hash = (Get-FileHash -LiteralPath $Record.source_absolute -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($hash -ne $Record.source_sha256) { throw "Source hash mismatch: $($Record.repository_relative)" }
    $null = Assert-Canonical $Record
}

# Validate the entire set before considering any mutation.
$seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($record in $plan.files) {
    if (-not $seen.Add($record.source_absolute)) { throw 'Duplicate source in plan.' }
    Assert-Pair $record
}
$preflight = [ordered]@{
    checked_at_utc = [DateTime]::UtcNow.ToString('o')
    plan_sha256 = $actualPlanSha256
    file_count = $plan.file_count
    total_bytes = $plan.total_bytes
    all_source_canonical_hashes_match = $true
    all_paths_contained_without_reparse = $true
    index_sha256_before = $indexHashBefore
    executed = $false
}
if (-not $Execute) {
    $preflight | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $auditRoot 'source-only-artifact-removal-preflight.json') -Encoding UTF8
    Write-Output 'Verified 550 publication copies and exact canonical files. No files deleted; no index changes.'
    exit 0
}

$removed = [Collections.Generic.List[object]]::new()
$failure = $null
$receiptPath = Join-Path $auditRoot 'executed-source-only-artifact-copy-cleanup.json'
try {
    foreach ($record in $plan.files) {
        # Re-read both SHA256 values immediately before each individual removal.
        Assert-Pair $record
        Remove-Item -LiteralPath $record.source_absolute -Force
        if (Test-Path -LiteralPath $record.source_absolute) { throw "Source still exists: $($record.repository_relative)" }
        # The canonical copy must still exist with exact original bytes afterward.
        $canonicalAfter = Assert-Canonical $record
        $removed.Add([ordered]@{
            repository_relative = $record.repository_relative
            source_sha256 = $record.source_sha256
            bytes = $record.bytes
            canonical_relative = $record.canonical_relative
            canonical_sha256_after = $canonicalAfter
            source_absent = $true
        })
    }
} catch {
    $failure = $_.Exception.Message
    throw
} finally {
    $indexHashAfter = (Get-FileHash -LiteralPath $indexPath -Algorithm SHA256).Hash.ToLowerInvariant()
    $removedBytes = 0L
    foreach ($completedRecord in $removed) { $removedBytes += [long]$completedRecord.bytes }
    [ordered]@{
        completed_at_utc = [DateTime]::UtcNow.ToString('o')
        plan_sha256 = $actualPlanSha256
        planned_files = $plan.file_count
        removed_files = $removed.Count
        removed_bytes = $removedBytes
        completed = ($null -eq $failure -and $removed.Count -eq $plan.file_count)
        error = $failure
        index_sha256_before = $indexHashBefore
        index_sha256_after = $indexHashAfter
        index_unchanged = ($indexHashBefore -eq $indexHashAfter)
        canonical_files_removed = 0
        directories_removed = 0
        files = $removed
    } | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
}
Write-Output "Removed $($removed.Count) verified publication copies. Canonical files retained and rechecked."
