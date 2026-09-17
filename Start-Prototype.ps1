$ErrorActionPreference = 'Stop'
# Optional override; otherwise use a Python installation on PATH.
$python = $env:PYTHON
if (-not $python) { $python = (Get-Command python -ErrorAction Stop).Source }
$listener = Get-NetTCPConnection -LocalPort 8767 -State Listen -ErrorAction SilentlyContinue
if ($listener) { Write-Host 'Port 8767 is already in use. If this is the prototype, open http://127.0.0.1:8767 .'; exit }
Start-Process -FilePath $python -ArgumentList @('"' + (Join-Path $PSScriptRoot 'serve.py') + '"') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
Start-Process 'http://127.0.0.1:8767'
