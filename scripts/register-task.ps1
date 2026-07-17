# Registra la tarea programada diaria de Windows (07:00 cada día).
# EJECUTAR MANUALMENTE una sola vez, desde PowerShell:
#   powershell -ExecutionPolicy Bypass -File scripts\register-task.ps1
# Para eliminarla: schtasks /Delete /TN "ErgoLabMinerDiario" /F
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$script = Join-Path $root "scripts\run-daily.ps1"

schtasks /Create /F /TN "ErgoLabMinerDiario" /SC DAILY /ST 07:00 `
  /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$script`""

Write-Host "Tarea 'ErgoLabMinerDiario' registrada: cada dia a las 07:00."
Write-Host "Comprueba con: schtasks /Query /TN ErgoLabMinerDiario"
