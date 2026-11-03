$ErrorActionPreference = 'Stop'
$approvedParent = 'C:\Users\user\Desktop\大學的東西\iGEM\lolab 1th\wiki\hardware_test2'
$approvedChild = 'C:\Users\user\Desktop\大學的東西\iGEM\lolab 1th\wiki\hardware_test2\new_25C'
foreach ($checkedDirectory in @($approvedChild,$approvedParent)) {
    $resolvedDirectory = (Get-Item -LiteralPath $checkedDirectory -Force).FullName
    if ($resolvedDirectory -ne $checkedDirectory) { throw 'Exact absolute path mismatch' }
    if (((Get-Item -LiteralPath $checkedDirectory -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw 'Reparse point' }
}
if (@(Get-ChildItem -LiteralPath $approvedChild -Force).Count -ne 0) { throw 'Child is not empty' }
Remove-Item -LiteralPath 'C:\Users\user\Desktop\大學的東西\iGEM\lolab 1th\wiki\hardware_test2\new_25C'
if (@(Get-ChildItem -LiteralPath $approvedParent -Force).Count -ne 0) { throw 'Parent is not empty' }
Remove-Item -LiteralPath 'C:\Users\user\Desktop\大學的東西\iGEM\lolab 1th\wiki\hardware_test2'
$receiptPath = Join-Path $PSScriptRoot 'executed-duplicate-cleanup.json'
$receipt = Get-Content -LiteralPath $receiptPath -Raw | ConvertFrom-Json
$receipt.removed_empty_directories += @($approvedChild,$approvedParent)
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $receiptPath -Encoding utf8
'Removed two verified-empty directories; no recursive deletion used.'
