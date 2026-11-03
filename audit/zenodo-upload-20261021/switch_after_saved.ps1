$ErrorActionPreference = 'Stop'
$taskAudit = $PSScriptRoot
$taskWorkerId = 22624
$taskName = 'AeroSense-02c-lightsheet-GH146-run03-raw-part01-of07.zip'
$taskExpectedMd5 = '860a79739a0a30cd994c7c4b6d3d04d9'
$taskExpectedSha = '2da28a212c68204c8a6b69c22cc1d583854e04cae465d3f810214df3dcc33820'
$taskExpectedBytes = 496460678
$taskProcess = Get-Process -Id $taskWorkerId
$null = $taskProcess.Handle
$taskIdentity = Get-CimInstance Win32_Process -Filter "ProcessId = $taskWorkerId"
if ($taskIdentity.Name -ne 'pythonw.exe' -or $taskIdentity.CommandLine -notlike '*upload_to_zenodo.py*') { throw 'Unexpected process; left running.' }
$taskDeadline = (Get-Date).AddMinutes(40)
while ((Get-Date) -lt $taskDeadline -and -not $taskProcess.HasExited) {
    try {
        $taskReceipts = Get-Content -LiteralPath (Join-Path $taskAudit 'upload-receipts.json') -Raw | ConvertFrom-Json
        $taskReceipt = $taskReceipts.files.$taskName
        $taskProgress = Get-Content -LiteralPath (Join-Path $taskAudit 'upload-progress.json') -Raw | ConvertFrom-Json
    } catch { Start-Sleep -Milliseconds 200; continue }
    if ($taskReceipts.record_id -ne 23469212 -or $taskProgress.record_id -ne 23469212) { throw 'Unexpected record; left running.' }
    if ($taskReceipt.verified -and $taskReceipt.bytes -eq $taskExpectedBytes -and $taskReceipt.md5 -eq $taskExpectedMd5 -and $taskReceipt.sha256 -eq $taskExpectedSha) {
        if ($taskProgress.current.name -ne $taskName -and $taskProgress.current.sent_bytes -gt 10485760) { throw 'Next file already advanced; left running.' }
        $taskProcess.Kill()
        $taskProcess.WaitForExit(10000) | Out-Null
        [ordered]@{record_id=23469212; stopped_worker=$taskWorkerId; saved_file=$taskName; bytes=$taskExpectedBytes; md5=$taskExpectedMd5; verified=$true; at=(Get-Date).ToString('o'); reason='Switch to two simultaneous transfers after the current file was saved and verified.'} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $taskAudit 'parallel-switch.json') -Encoding utf8
        exit 0
    }
    Start-Sleep -Milliseconds 200
}
