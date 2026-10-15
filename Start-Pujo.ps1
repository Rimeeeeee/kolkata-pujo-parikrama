$ErrorActionPreference = 'Stop'
$pujoRoot = $PSScriptRoot
$pujoPidFile = Join-Path $pujoRoot '.pujo-server.pid'
$pujoExisting = $false
try { $pujoResponse = Invoke-WebRequest -Uri 'http://127.0.0.1:4173/' -UseBasicParsing -TimeoutSec 2; $pujoExisting = $pujoResponse.Content -like '*Pujo Parikrama*' } catch {}
if (-not $pujoExisting) {
    $pujoNode = Get-Command node -ErrorAction Stop
    $pujoProcess = Start-Process -FilePath $pujoNode.Source -ArgumentList 'serve.mjs' -WorkingDirectory $pujoRoot -WindowStyle Hidden -PassThru
    Set-Content -LiteralPath $pujoPidFile -Value $pujoProcess.Id
    Start-Sleep -Milliseconds 800
}
Start-Process 'http://127.0.0.1:4173/'
Write-Host 'Pujo Parikrama is open at http://127.0.0.1:4173/'
Write-Host 'Run Stop-Pujo.ps1 when you finish.'
