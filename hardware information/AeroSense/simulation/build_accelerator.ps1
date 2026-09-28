$ErrorActionPreference = 'Stop'
$aeroCompiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if (!(Test-Path -LiteralPath $aeroCompiler)) { throw 'C# compiler unavailable. Run flow_sweep.py with --engine numpy instead.' }
Push-Location $PSScriptRoot
try {
    & $aeroCompiler /nologo /optimize+ /out:LbmCore.exe LbmCore.cs
    if ($LASTEXITCODE -ne 0) { throw 'Reference accelerator compilation failed.' }
    & $aeroCompiler /nologo /optimize+ /out:LbmCoreFast.exe LbmCoreFast.cs
    if ($LASTEXITCODE -ne 0) { throw 'Unrolled accelerator compilation failed.' }
} finally { Pop-Location }
