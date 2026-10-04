param([int]$Port = 8000)
$ErrorActionPreference = 'Stop'

$previewBundleBuilder = Join-Path $PSScriptRoot 'scripts\build-home-bundles.mjs'
$previewNodeCommand = Get-Command node -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
$previewNodePath = if ($previewNodeCommand) { $previewNodeCommand.Source } else { $null }
if (-not $previewNodePath) {
    foreach ($programDirectory in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
        if (-not $programDirectory) { continue }
        $nodeCandidate = Join-Path $programDirectory 'nodejs\node.exe'
        if (Test-Path -LiteralPath $nodeCandidate -PathType Leaf) {
            $previewNodePath = $nodeCandidate
            break
        }
    }
}
if ($previewNodePath) {
    if (-not (Test-Path -LiteralPath $previewBundleBuilder -PathType Leaf)) {
        throw "Homepage bundle builder is missing: $previewBundleBuilder"
    }
    Write-Host 'Rebuilding homepage styles and scripts before preview...'
    & $previewNodePath $previewBundleBuilder
    if ($LASTEXITCODE -ne 0) {
        throw "Homepage bundle rebuild failed (code $LASTEXITCODE). Fix the reported source error before starting the preview."
    }
} else {
    foreach ($bundleFile in @('css\home.bundle.css', 'js\home.bundle.js')) {
        if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot $bundleFile) -PathType Leaf)) {
            throw "Node.js is unavailable and a generated homepage bundle is missing: $bundleFile. Install Node.js and run the preview again."
        }
    }
    Write-Warning 'Node.js is unavailable. Preview will use the existing homepage bundles; source edits need a rebuild before they appear.'
}

$previewPython = Get-Command python -ErrorAction SilentlyContinue
$previewLauncher = Get-Command py -ErrorAction SilentlyContinue
$previewBundledPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
Write-Host "AeroSense preview: http://127.0.0.1:$Port/index.html"
Write-Host 'Press Ctrl+C to stop the preview.'
if ($previewPython) {
    & $previewPython.Source -m http.server $Port --bind 127.0.0.1 --directory $PSScriptRoot
} elseif ($previewLauncher) {
    & $previewLauncher.Source -3 -m http.server $Port --bind 127.0.0.1 --directory $PSScriptRoot
} elseif (Test-Path -LiteralPath $previewBundledPython) {
    & $previewBundledPython -m http.server $Port --bind 127.0.0.1 --directory $PSScriptRoot
} else {
    throw 'Python is unavailable. Serve this folder with a local static web server.'
}
