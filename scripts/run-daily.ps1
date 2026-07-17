# Ciclo diario local: genera artículo + reconstruye el sitio estático.
# Pensado para ejecutarse desde el Programador de tareas de Windows.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "[run-daily] $(Get-Date -Format o) — iniciando ciclo"
node miner/index.mjs
if ($LASTEXITCODE -ne 0) { throw "El miner terminó con error ($LASTEXITCODE)" }

npm --prefix web run build
if ($LASTEXITCODE -ne 0) { throw "La build de Astro terminó con error ($LASTEXITCODE)" }

Write-Host "[run-daily] Ciclo completado. Sitio actualizado en web/dist"
