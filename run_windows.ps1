$scriptPath = Join-Path $PSScriptRoot "models\blender\build_aerosense_showcase_v2.py"
$candidates = @(
  "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 5.0\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 4.5\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 4.4\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 4.3\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe"
)
$blenderExe = $null
foreach ($p in $candidates) { if (Test-Path $p) { $blenderExe = $p; break } }
if (-not $blenderExe) { $cmd = Get-Command blender -ErrorAction SilentlyContinue; if ($cmd) { $blenderExe = $cmd.Source } }
if (-not $blenderExe) { Write-Host "Blender not found. Edit this script and set blender.exe manually." -ForegroundColor Red; exit 1 }
Write-Host "Using Blender: $blenderExe" -ForegroundColor Green
& $blenderExe --background --python $scriptPath
