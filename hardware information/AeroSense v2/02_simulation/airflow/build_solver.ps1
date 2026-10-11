$ErrorActionPreference = 'Stop'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
& $compiler /nologo /optimize+ "/out:$PSScriptRoot\LbmCoreFast.exe" "$PSScriptRoot\LbmCoreFast.cs"
if ($LASTEXITCODE -ne 0) { throw 'C# solver build failed.' }
& $compiler /nologo /optimize+ "/out:$PSScriptRoot\LbmCorePhysical.exe" "$PSScriptRoot\LbmCorePhysical.cs"
if ($LASTEXITCODE -ne 0) { throw 'Variable-tau C# solver build failed.' }
