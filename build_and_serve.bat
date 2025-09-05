@echo off
setlocal
REM ============================================================
REM  Webapp Serie A - Build & Serve (Windows 11)
REM  Percorso progetto: D:\webapp
REM  Foglio Excel: "Tutti i dati"
REM  Cosa fa:
REM    1) Crea/attiva venv
REM    2) Aggiorna pip + installa dipendenze
REM    3) Genera i JSON (2021..2025 + index + storico)
REM    4) Avvia server su http://localhost:8080
REM ============================================================

cd /d D:\webapp || (echo ERRORE: impossibile accedere a D:\webapp & pause & exit /b 1)

REM --- Se c'è "py", usa py -3; altrimenti usa "python"
where py >nul 2>&1 && (set "PY=py -3") || (set "PY=python")

echo ==
echo == Verifica Python ==
%PY% --version || (echo ERRORE: Python non trovato nel PATH. Installa Python 3.x e riprova. & pause & exit /b 1)

REM --- Crea venv se manca
if not exist ".venv\Scripts\python.exe" (
  echo ==
  echo == Creazione ambiente virtuale ==
  %PY% -m venv .venv || (echo ERRORE: creazione venv fallita. & pause & exit /b 1)
)

REM --- Attiva venv
echo ==
echo == Attivazione ambiente ==
call ".venv\Scripts\activate" || (echo ERRORE: attivazione venv fallita. & pause & exit /b 1)

REM --- Aggiorna pip
echo ==
echo == Aggiornamento pip ==
python -m pip install --upgrade pip

REM --- Installa dipendenze
echo ==
echo == Installazione dipendenze (pandas, openpyxl) ==
pip install -q pandas openpyxl || (echo ERRORE: installazione dipendenze fallita. & pause & exit /b 1)

REM --- Verifica input
if not exist "tools\input" (
  echo ERRORE: Cartella mancante: tools\input
  echo Metti qui i file Excel: 2021.xlsx, 2022.xlsx, 2023.xlsx, 2024.xlsx, 2025.xlsx
  pause
  exit /b 1
)

echo ==
echo == Avvio build JSON ==
echo    - sorgente: tools\input
echo    - output  : data
echo    - foglio  : "Tutti i dati"
echo    - pattern : "{year}.xlsx"
echo ==
python tools\build_data.py ^
  --input tools\input ^
  --out data ^
  --seasons 2021 2022 2023 2024 2025 ^
  --pattern "{year}.xlsx" ^
  --sheet "Tutti i dati" ^
  --config_map tools\config\columns_mapping.json ^
  --config_agg tools\config\aggregation_config.json ^
  --teams_aliases tools\config\teams_aliases.json

if errorlevel 1 (
  echo ERRORE durante la build dei JSON. Controlla i messaggi sopra.
  echo Suggerimenti:
  echo  - Verifica che i file Excel esistano in tools\input e abbiano il nome giusto.
  echo  - Verifica che il foglio si chiami esattamente: Tutti i dati