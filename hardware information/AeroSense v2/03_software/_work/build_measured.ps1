$ErrorActionPreference = 'Stop'
$softwareDir = Split-Path -Parent $PSScriptRoot
$runtimeDir = 'C:/Users/user/AppData/Local/Temp/aerosense_oct05_build'
$buildDir = Join-Path $PSScriptRoot 'measured_firmware'
$evidenceDir = Join-Path $softwareDir 'build_evidence'
$pythonExe = 'C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null
Copy-Item -LiteralPath (Join-Path $softwareDir 'firmware/platformio.ini') -Destination $buildDir -Force
foreach ($name in @('src','data')) {
  New-Item -ItemType Directory -Force -Path (Join-Path $buildDir $name) | Out-Null
  Get-ChildItem -LiteralPath (Join-Path $softwareDir "firmware/$name") -File | Where-Object { $_.Name -notin @('config.h','aerosense_config.h') } | ForEach-Object { Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $buildDir $name) -Force }
}
$env:PYTHONPATH = Join-Path $runtimeDir 'toolchain_fresh'
$env:PLATFORMIO_CORE_DIR = Join-Path $runtimeDir 'pio'
$env:PYTHONUTF8 = '1'
$env:PLATFORMIO_SETTING_ENABLE_TELEMETRY = 'no'
$env:PLATFORMIO_SETTING_CHECK_PLATFORMIO_INTERVAL = '0'
$env:PLATFORMIO_SETTING_CHECK_PLATFORMS_INTERVAL = '0'
$env:PLATFORMIO_SETTING_CHECK_LIBRARIES_INTERVAL = '0'
& $pythonExe -m platformio run --project-dir $buildDir 2>&1 | Tee-Object -FilePath (Join-Path $evidenceDir 'firmware_compile_measured.log')
if ($LASTEXITCODE -ne 0) { throw "Firmware build failed: $LASTEXITCODE" }
& $pythonExe -m platformio run --project-dir $buildDir --target buildfs 2>&1 | Tee-Object -FilePath (Join-Path $evidenceDir 'filesystem_build_measured.log')
if ($LASTEXITCODE -ne 0) { throw "Filesystem build failed: $LASTEXITCODE" }
