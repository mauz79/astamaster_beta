# AstaMaster

**Assistente in tempo reale per l’asta del Fantacalcio.**  
AstaMaster ti aiuta a decidere al volo mentre fai offerte: cerca un giocatore, vedi **dati dell’ultima stagione**, **confronto con la stagione precedente**, e una sezione **Storico** con metriche aggregate sulle ultime 4 stagioni—il tutto in una **single page** veloce e utilizzabile anche su **GitHub Pages**.

> **Stato**: stabile (ricerca, schede 2025/2024, storico).  
> **Tecnologia**: sito statico (HTML/CSS/JS + JSON), nessun backend.

---

## ✨ Funzionalità

- 🔎 **Ricerca istantanea** per nome (accent-insensitive).
- 🧩 **Schede dati**:
  - **2025**: ruolo, squadra, presenze, mediavoto (MV), fantamedia (FM), e badge **Cambio Squadra** / **Cambio Ruolo**.
  - **2024**: ruolo, squadra, affidabilità, presenze, MV, FM, gol, assist, ammonizioni, espulsioni.
  - **Storico (4 stagioni)**: medie e indicatori (incl. “attesi/normalizzati”), con **etichette leggibili** e **tooltip** esplicativi.
- 🧰 **“Altre statistiche”**: mostra automaticamente tutte le colonne extra presenti nei JSON.
- ⚡ **Performance**: dati caricati on-demand; nessun server da mantenere.
- 📱 **Responsive**: utilizzabile da laptop, tablet, smartphone durante l’asta.

---

## 🗂 Struttura del progetto

```
AstaMaster/
├─ index.html            # Home/SPA (puoi usare anche webapp.html)
├─ webapp.html           # Alternativa a index (stesso DOM)
├─ styles.css            # Stili principali
├─ app.js                # Logica front-end (ricerca, UI, caricamento JSON)
├─ data/
│  ├─ 2021.json          # Dati stagione 2021 (tutte le colonne normalizzate)
│  ├─ 2022.json
│  ├─ 2023.json
│  ├─ 2024.json
│  ├─ 2025.json          # Include "cambio_squadra" e "cambio_ruolo"
│  ├─ index.json         # Indice ricerca (cod, nome, nome_norm, ruolo_2025, squadra_2025)
│  └─ storico.json       # Dati storico da storico.xlsx (intestazioni speciali)
├─ tools/
│  ├─ build_data.py                  # Genera 2021..2025.json + index.json + build_report.md
│  ├─ build_storico_from_excel.py    # Genera storico.json da storico.xlsx
│  ├─ input/
│  │  ├─ 2021.xlsx 2022.xlsx 2023.xlsx 2024.xlsx 2025.xlsx
│  │  └─ storico.xlsx
│  └─ config/
│     ├─ columns_mapping.json        # Mappa colonne chiave (cod, nome, ruolo, squadra)
│     ├─ aggregation_config.json     # Config storico da stagionali (opzionale)
│     └─ teams_aliases.json          # Alias nomi squadra
├─ img/
│  └─ placeholder.svg
├─ .nojekyll
├─ 404.html
└─ info.md               # Guida completa step-by-step (build dati, troubleshooting, ecc.)
```

---

## 🚀 Come usare AstaMaster durante l’asta

1. **Apri la web app** (GitHub Pages o locale — vedi sotto).
2. **Digita il nome** del giocatore in campo “Cerca un giocatore”.
3. Guarda:
   - la card **2025** con badge “Cambio Squadra/Ruolo”,
   - la card **2024** (affidabilità, presenze, MV/FM, gol/assist/cartellini),
   - la card **Storico** con medie/indicatori sulle ultime 4 stagioni.
4. Se ti serve altro, apri **“Altre statistiche (tutte le colonne)”**.

---

## 🧑‍💻 Sviluppo e build dati (Windows 11)

### Prerequisiti
- **Python 3.x** (64-bit) installato nel PATH  
- Librerie: `pandas`, `openpyxl`

### Setup ambiente (PowerShell)
```powershell
cd D:\webapp   # o cartella del repo
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install pandas openpyxl
```

### Genera JSON stagionali + index
```powershell
python toolsuild_data.py `
  --input tools\input `
  --out data `
  --seasons 2021 2022 2023 2024 2025 `
  --pattern "{year}.xlsx" `
  --sheet "Tutti i dati" `
  --config_map tools\config\columns_mapping.json `
  --config_agg tools\configggregation_config.json `
  --teams_aliases tools\config	eams_aliases.json
```

### Genera JSON dello **storico** (da `storico.xlsx`)
```powershell
python toolsuild_storico_from_excel.py `
  --file "tools\input\storico.xlsx" `
  --sheet "Tutti i dati" `
  --out "data\storico.json" `
  --seasons_considered 2021 2022 2023 2024
```

✅ Output attesi in `data/`: `2021..2025.json`, `index.json`, `storico.json`, `build_report.md`

---

## ▶️ Avvio locale

```powershell
cd D:\webapp
.\.venv\Scripts\Activate.ps1
python -m http.server 8080
```
Apri: <http://localhost:8080>

---

## 🌐 Deploy su GitHub Pages

1. **Commit & Push** su GitHub (branch `main`, root del progetto).
2. **Settings → Pages**: _Deploy from a branch_ → `main` / `/root`.
3. Attendi la pubblicazione, poi visita:  
   `https://<utente>.github.io/AstaMaster/`

---

## 🤝 Contribuire

Hai suggerimenti, bug o nuove metriche utili in asta?  
Apri una **Issue** o invia una **Pull Request**. Mantieni i nomi foglio/colonne allineati alle convenzioni o aggiorna i mapping nei file `tools/config/` e nel parser storico.

---

## 📄 Licenza

Scegli una licenza (es. **MIT** oppure **Apache-2.0**).  
Crea un file `LICENSE` alla radice del repository.

---

## 🙏 Crediti

Progetto ideato da **Maurizio Sciamanna**.  
AstaMaster è ottimizzato per essere un **assistente tascabile** durante l’asta: semplice, veloce, informativo.
