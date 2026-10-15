$labRoot = $PSScriptRoot
$connection = Get-NetTCPConnection -LocalPort 5178 -State Listen -ErrorAction SilentlyContinue
if ($connection) {
  Write-Output 'Port 5178 is already listening. Open http://127.0.0.1:5178'
  exit 0
}
$nodePath = (Get-Command node).Source
$preview = Start-Process -FilePath $nodePath -ArgumentList @('node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5178','--strictPort') -WorkingDirectory $labRoot -WindowStyle Hidden -RedirectStandardOutput "$labRoot\evidence\preview.stdout.log" -RedirectStandardError "$labRoot\evidence\preview.stderr.log" -PassThru
Write-Output "2048 Lab PID $($preview.Id): http://127.0.0.1:5178"
