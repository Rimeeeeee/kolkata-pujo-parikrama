$pujoPidFile = Join-Path $PSScriptRoot '.pujo-server.pid'
if (Test-Path -LiteralPath $pujoPidFile) {
    $pujoServerPid = [int](Get-Content -LiteralPath $pujoPidFile)
    $pujoProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $pujoServerPid"
    if ($pujoProcess -and $pujoProcess.Name -eq 'node.exe' -and $pujoProcess.CommandLine -like '*serve.mjs*') {
        Stop-Process -Id $pujoServerPid
    }
    Remove-Item -LiteralPath $pujoPidFile
}
