param(
  [string]$Sheet = "Tutti i dati",
  [string]$Input = "tools\input",
  [string]$Out   = "data"
)

$ErrorActionPreference = "Stop"
Set-Location D:\webapp

# Fallback robusti nel caso i parametri arrivino vuoti
if ([string]::IsNullOrWhiteSpace($Input)) { $Input = "tools\input" }
if ([string]::IsNullOrWhiteSpace($Out))   { $Out   = "data" }
if ([string]::IsNullOrWhiteSpace($Sheet)) { $Sheet = "Tutti i dati" }

Write-Host "== Parametri attivi ==" -ForegroundColor Cyan
Write-Host "Input: $Input"
Write-Host "Out  : $Out"
Write-Host "Sheet: $Sheet"

# Abilita script solo per questa sessione (se lanciato manualmente)
try { Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force } catch {}

# Crea venv se serve
if (!(Test-Path ".\.venv\Scripts\python.exe")) {
  try { py -3 -m venv .venv } catch { python -m venv .venv }
}

$py  = ".\.venv\Scripts\python.exe"
$pip = ".\.venv\Scripts\pip.exe"

# Aggiorna pip + installa dipendenze (silenzioso)
& $py -m pip install --upgrade pip
& $pip install -q pandas openpyxl

# Verifica input
if (!(Test-Path $Input)) {
  throw "Cartella input mancante: $Input (metti qui 2021.xlsx … 2025.xlsx)"
}

Write-Host "== Build JSON ==" -ForegroundColor Cyan
& $py tools\build_data.py `
  --input $Input `
  --out   $Out `
  --seasons 2021 2022 2023 2024 2025 `
  --pattern "{year}.xlsx" `
  --sheet $Sheet `
  --config_map tools\config\columns_mapping.json `
  --config_agg tools\config\aggregation_config.json `
  --teams_aliases tools\config\teams_aliases.json

Write-Host "== Avvio server: http://localhost:8080 ==" -ForegroundColor Green
Start-Process "http://localhost:8080/"
& $py -m http.server 8080
