param([int]$Port = 8000)
$ErrorActionPreference = 'Stop'
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
