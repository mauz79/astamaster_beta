# Webapp Serie A — Guida completa **build dati** (Windows 11)

Questa guida spiega **tutto** ciò che serve per rigenerare i file JSON della webapp:
- JSON stagionali 2021..2025 + `index.json` (ricerca) + `2025.json` con flag cambi + `build_report.md`
- JSON **storico** da `storico.xlsx` (intestazioni diverse)
- Comandi **PowerShell** e **CMD**, convenzioni di **naming** file/fogli, verifiche e **troubleshooting**
- **Come aggiornare il mapping** del parser storico quando compaiono nuove colonne
- **Etichette leggibili** per la card “Storico” da incollare in `app.js`

> Percorso progetto usato negli esempi: `D:\webapp`

---

## 1) Requisiti

- **Windows 11**
- **Python 3.x** (64‑bit) installato e nel **PATH**
  - Verifica: `python --version`
- Librerie Python:
  - `pandas`, `openpyxl` (saranno installate nei comandi sotto)

> Se `python` non è riconosciuto, usa il launcher `py -3`.

---

## 2) Struttura del progetto

```
D:\webapp\
├─ index.html
├─ webapp.html
├─ styles.css
├─ app.js
├─ 404.html
├─ .nojekyll
├─ img\
│  └─ placeholder.svg
├─ data\
│  └─ (uscita JSON: 2021.json..2025.json, index.json, storico.json, build_report.md)
└─ tools\
   ├─ build_data.py
   ├─ build_storico_from_excel.py
   ├─ input\
   │  ├─ 2021.xlsx
   │  ├─ 2022.xlsx
   │  ├─ 2023.xlsx
   │  ├─ 2024.xlsx
   │  ├─ 2025.xlsx
   │  └─ storico.xlsx
   └─ config\
      ├─ columns_mapping.json
      ├─ aggregation_config.json
      └─ teams_aliases.json
```

---

## 3) Convenzioni di **naming** (file e fogli)

### File stagionali
- Posizione: `D:\webapp\tools\input\`
- **Nome file**: `2021.xlsx`, `2022.xlsx`, `2023.xlsx`, `2024.xlsx`, `2025.xlsx`
- **Foglio**: `Tutti i dati` (stesso per **tutti** i file)

> Se i nomi non seguono questo schema, usa `--pattern` (es.: `--pattern "SerieA_{year}.xlsx"`).
> Se il foglio non è `Tutti i dati`, usa `--sheet "NomeFoglio"`.

### File storico
- Posizione: `D:\webapp\tools\input\storico.xlsx`
- **Foglio**: `Tutti i dati`
- Intestazioni **diverse** dallo schema stagionale → si usa lo script dedicato `build_storico_from_excel.py` con una mappatura flessibile.

> Suggerimento: se possibile, **rinomina** i fogli a `Tutti i dati` per avere comandi uniformi.

---

## 4) Ambiente Python (venv)

### PowerShell (consigliato)
```powershell
cd D:\webapp
# Consenti script SOLO per questa sessione
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

# Crea venv (una tantum)
python -m venv .venv

# Attiva venv
.\.venv\Scripts\Activate.ps1

# Aggiorna pip e installa dipendenze
python -m pip install --upgrade pip
pip install pandas openpyxl
```

### CMD (Prompt dei comandi)
```bat
cd /d D:\webapp
python -m venv .venv
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install pandas openpyxl
```

---

## 5) Generazione JSON **stagionali** (+ `index.json`, `build_report.md`)

> Usa `tools\build_data.py` — legge **tutte le colonne** dagli Excel stagionali e le esporta così come sono (normalizzando i nomi delle chiavi), costruisce `index.json` e aggiunge i flag `cambio_squadra`/`cambio_ruolo` in `2025.json`.

### PowerShell
```powershell
python tools\build_data.py `
  --input tools\input `
  --out data `
  --seasons 2021 2022 2023 2024 2025 `
  --pattern "{year}.xlsx" `
  --sheet "Tutti i dati" `
  --config_map tools\config\columns_mapping.json `
  --config_agg tools\config\aggregation_config.json `
  --teams_aliases tools\config\teams_aliases.json
```

### CMD
```bat
python tools\build_data.py ^
  --input tools\input ^
  --out data ^
  --seasons 2021 2022 2023 2024 2025 ^
  --pattern "{year}.xlsx" ^
  --sheet "Tutti i dati" ^
  --config_map tools\config\columns_mapping.json ^
  --config_agg tools\config\aggregation_config.json ^
  --teams_aliases tools\config\teams_aliases.json
```

### Output attesi in `data/`
- `2021.json .. 2025.json` → tutte le colonne degli Excel (normalizzate) + `_season`
- `2025.json` → include `cambio_squadra` e `cambio_ruolo` (se il 2024 è presente)
- `index.json` → indice ricerca (`cod`, `nome`, `nome_norm`, `ruolo_2025`, `squadra_2025`)
- `build_report.md` → report colonne/mappature

### Esempio `index.json` (prime righe)
Dovresti vedere record simili a:
```json
[{"cod":"101506","nome":"ZIOLKOWSKI Jan","nome_norm":"ziolkowski jan","ruolo_2025":"D","squadra_2025":"Roma"},
 {"cod":"101507","nome":"ZORTEA Nadir","nome_norm":"zortea nadir","ruolo_2025":"C","squadra_2025":"Bologna"}]
```

### Esempio `build_report.md` (estratto)
```
## 2025
- File: `tools\input\2025.xlsx`  (foglio: `Tutti i dati`)
- Righe: 584
- Colonne originali (34): Nome, Sq, R, COD, ...
- Colonne normalizzate (34): nome, sq, r, cod, ...
- Colonne chiave risolte: COD=`cod`, NOME=`nome`, RUOLO=`r`, SQUADRA=`sq`
```

> Se `index.json` risultasse vuoto o la ricerca non funzionasse, controlla qui che `NOME=` e `COD=` siano correttamente risolti.

---

## 6) Generazione JSON **storico** da `storico.xlsx`

> Usa `tools\build_storico_from_excel.py` — mappa le **intestazioni speciali** del foglio storico alle chiavi JSON finali; gestisce `n.d`, virgole decimali e percentuali (es. `Aff%` ÷ 100).

### PowerShell
```powershell
python tools\build_storico_from_excel.py `
  --file "tools\input\storico.xlsx" `
  --sheet "Tutti i dati" `
  --out "data\storico.json" `
  --seasons_considered 2021 2022 2023 2024
```

### CMD
```bat
python tools\build_storico_from_excel.py ^
  --file "tools\input\storico.xlsx" ^
  --sheet "Tutti i dati" ^
  --out "data\storico.json" ^
  --seasons_considered 2021 2022 2023 2024
```

### Note importanti (storico)
- Lo script ha un **mapping** flessibile degli header (cerca sinonimi). Se ti segnala colonne mancanti, leggi gli header reali e aggiungi sinonimi nel `MAP` interno (vedi sezione **6.b**), oppure rinomina la colonna nel file.
- Alcuni campi percentuali (es. `aff_2024`, `aff_media_stagione`) vengono automaticamente **divisi per 100** se sono > 1 (es. `78` → `0.78`).
- Se non esiste `presenze_per_assist` ma esiste `as_per_presenza`, puoi **calcolarla** come `1 / as_per_presenza` (vedi **fallback** in sezione 6.b).

### Output atteso (esempio record)
```json
{
  "cod":"12345","nome":"Nome Cognome","sq":"Milan","r":"C",
  "oldsq":"new","squadra_2024_status":"trasferito","ruolo_2024":"C",
  "oldr":"C","cambio_ruolo_descr":null,
  "p_2024":32.0,"aff_2024":0.78,"mvt_2024":6.22,"mvand_2024":0.02,
  "fmt_2024":6.88,"fmand_2024":0.03,
  "p_tot_4stag":120.0,"p_media_stagione":30.0,"aff_media_stagione":0.76,
  "mvt_media_stagione":6.25,"fmt_media_stagione":6.70,
  "gf_media_stagione":4.5,"gf_per_presenza":0.15,"presenze_per_gol":6.67,
  "gf_media_stagione_norm":4.1,
  "as_media_stagione":3.0,"as_per_presenza":0.10,"presenze_per_assist":10.0,
  "as_media_stagione_norm":2.8,
  "a_media_stagione":5.0,"a_per_presenza":0.17,"presenze_per_ammonizione":6.0,
  "a_media_stagione_norm":4.7,
  "e_media_stagione":0.1,"e_per_presenza":0.003,"presenze_per_espulsione":100.0,
  "e_media_stagione_norm":0.08,
  "gs_media_stagione":0.0,"gs_per_presenza":0.0,"gs_media_stagione_norm":0.0,
  "rp_media_stagione":0.0,"rp_per_presenza":0.0,"presenze_per_rp":null,
  "rp_media_stagione_norm":0.0,
  "stagioni_considerate":[2021,2022,2023,2024]
}
```

---

## 6.b) **Aggiornare il mapping** nel parser storico (`build_storico_from_excel.py`)

Quando compaiono nuove intestazioni nel file `storico.xlsx`, segui questi passi:

### 1) Elenca gli header reali e la loro forma “canonizzata”
Usa questo snippet in **PowerShell** (con venv attiva):
```powershell
.\.venv\Scripts\python.exe - << 'PY'
import pandas as pd, unicodedata, re
fn = r"D:\\webapp\\tools\\input\\storico.xlsx"; sheet = "Tutti i dati"
def canon(s):
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii","ignore").decode("ascii")
    s = s.lower(); s = re.sub(r"[^\w\s]+"," ", s); s = re.sub(r"\s+"," ", s).strip(); return s
xl = pd.ExcelFile(fn, engine="openpyxl"); df = xl.parse(sheet)
for c in df.columns: print(repr(c), '->', canon(c))
PY
```
Prendi nota della **colonna originale** e della sua **forma canonizzata** (la parte a destra della freccia).

### 2) Aggiungi sinonimi nel dizionario `MAP`
Dentro `build_storico_from_excel.py` cerca il blocco:
```python
MAP = {
    "presenze_per_assist": ["presenze per un assist", ...],
    "as_media_stagione_norm": ["assist medi stagione (normalizzato)", ...],
    # ... altre chiavi ...
}
```
Aggiungi **nuove stringhe** (meglio se già **canonizzate** come output dello snippet). Puoi inserire più varianti (es. con/ senza parentesi, apostrofi, abbreviazioni).

### 3) (Opzionale) Fallback di calcolo
Se manca `presenze_per_assist` ma esiste `as_per_presenza`, puoi calcolarla così:
```python
# Dopo aver costruito rec {...}
if rec.get("presenze_per_assist") is None and rec.get("as_per_presenza"):
    try:
        v = float(rec["as_per_presenza"])
        rec["presenze_per_assist"] = round(1.0 / v, 3) if v > 0 else None
    except Exception:
        pass
```
> Inserisci questo blocco **prima** dell'`out.append(rec)`.

### 4) Rigenera lo storico
```powershell
python tools\build_storico_from_excel.py `
  --file "tools\input\storico.xlsx" `
  --sheet "Tutti i dati" `
  --out "data\storico.json" `
  --seasons_considered 2021 2022 2023 2024
```
Se ancora mancano colonne, lo script lo segnala in console.

---

## 7) Avvio server locale (test)

### PowerShell
```powershell
cd D:\webapp
.\.venv\Scripts\Activate.ps1
python -m http.server 8080
```

### CMD
```bat
cd /d D:\webapp
call .venv\Scripts\activate
python -m http.server 8080
```

Apri: <http://localhost:8080>

---

## 7.b) **Etichette leggibili** per la card “Storico” in `app.js`

La card “Storico” elenca automaticamente tutti i campi dello storico. Per mostrare **etichette più chiare**:

1. **Aggiungi** questo dizionario in `app.js` (vicino agli altri `LABELS`):
```js
// Etichette aggiuntive per i campi di storico.json
const LABELS_STORICO = {
  oldsq: "Old SQ (stato)",
  squadra_2024_status: "Squadra 2024 (stato)",
  ruolo_2024: "Ruolo 2024",
  oldr: "Old R",
  cambio_ruolo_descr: "Cambio Ruolo (descr.)",

  p_2024: "Presenze 2024",
  aff_2024: "Affidabilità 2024",
  mvt_2024: "Mediavoto 2024",
  mvand_2024: "Andamento MV 2024",
  fmt_2024: "Fantamedia 2024",
  fmand_2024: "Andamento FM 2024",

  p_tot_4stag: "Presenze tot (4 stag.)",
  p_media_stagione: "Pres. medie/stagione",
  aff_media_stagione: "Aff. media/stagione",
  mvt_media_stagione: "MV media/stagione",
  fmt_media_stagione: "FM media/stagione",

  gf_media_stagione: "Gol medi/stagione",
  gf_per_presenza: "Gol per presenza",
  presenze_per_gol: "Presenze per gol",
  gf_media_stagione_norm: "Gol medi (attesi)",

  as_media_stagione: "Assist medi/stagione",
  as_per_presenza: "Assist per presenza",
  presenze_per_assist: "Presenze per assist",
  as_media_stagione_norm: "Assist medi (attesi)",

  a_media_stagione: "Amm. medie/stagione",
  a_per_presenza: "Amm. per presenza",
  presenze_per_ammonizione: "Presenze per amm.",
  a_media_stagione_norm: "Amm. medie (attese)",

  e_media_stagione: "Esp. medie/stagione",
  e_per_presenza: "Esp. per presenza",
  presenze_per_espulsione: "Presenze per esp.",
  e_media_stagione_norm: "Esp. medie (attese)",

  gs_media_stagione: "GS medi/stagione",
  gs_per_presenza: "GS per presenza",
  gs_media_stagione_norm: "GS medi (attesi)",

  rp_media_stagione: "RP medi/stagione",
  rp_per_presenza: "RP per presenza",
  presenze_per_rp: "Presenze per RP",
  rp_media_stagione_norm: "RP medi (attesi)"
};
```

2. **Modifica** il rendering della card “Storico” per usare le etichette aggiuntive (cerca il punto dove costruisci `rows`):
```js
const fields = Object.keys(srec).filter(k => k !== 'cod' && k !== 'stagioni_considerate').sort();
const rows = fields
  .map(k => rowKV(LABELS_STORICO[k] || LABELS[k] || k, srec[k], k))
  .join('');
```

3. **(Opzionale)** Tooltip per alcune metriche (sezione storico):
```js
// Se vuoi aggiungere tooltip esplicativi per alcune chiavi di storico
const TOOLTIP_STORICO = {
  aff_2024: "Affidabilità stagione 2024 (0–1)",
  aff_media_stagione: "Affidabilità media su ultime 4 stagioni (0–1)",
  gf_media_stagione_norm: "Gol attesi medi (normalizzati)",
  as_media_stagione_norm: "Assist attesi medi (normalizzati)",
  a_media_stagione_norm: "Ammonizioni attese medie",
  e_media_stagione_norm: "Espulsioni attese medie",
  gs_media_stagione_norm: "Gol subiti attesi medi",
  rp_media_stagione_norm: "Rigori parati attesi medi"
};

// Estendi rowKV per accettare tooltip anche da TOOLTIP_STORICO
function rowKV(label, value, key){
  const tipText = TOOLTIP[key] || TOOLTIP_STORICO?.[key];
  const tip = tipText ? ` title="${escapeHtml(tipText)}"` : '';
  return `<div class="row"><span class="key"${tip}>${label}</span><span class="val">${value ?? '—'}</span></div>`;
}
```

Salva, aggiorna la pagina, e verifica la card “Storico”.

---

## 8) Configurazioni (dove intervenire se cambia qualcosa)

### `tools\config\columns_mapping.json`
Identifica le colonne **chiave** negli Excel stagionali, necessarie per `index.json` e per i flag di cambio:
```json
{
  "cod": ["COD", "Cod", "Id", "ID"],
  "nome": ["Nome", "Giocatore"],
  "ruolo": ["R", "Ruolo"],
  "squadra": ["Sq", "Squadra", "Team", "Club"]
}
```
> Se in qualche file i nomi differiscono, **aggiungili** qui.

### `tools\config\aggregation_config.json`
Definisce le metriche aggregate per lo **storico** calcolato da `build_data.py` (non da `storico.xlsx`):
```json
{
  "seasons_for_history": [2021, 2022, 2023, 2024],
  "sum_fields": ["gf","gfr","as","a","e","ag","gs","gsr","rp","rs"],
  "mean_fields": ["p","mvt","mvc","mvf","mvdst","mvdlt","mvand","mvrnd","fmt","fmc","fmf","fmdst","fmdlt","fmand","fmrnd","fmld","aff"],
  "include_raw_per_season": false
}
```

### `tools\config\teams_aliases.json`
Uniforma nomi squadra:
```json
{
  "Internazionale": "Inter",
  "Milan AC": "Milan",
  "Juventus FC": "Juventus"
}
```

---

## 9) Verifiche rapide

- **Index** caricato? (PowerShell)
  ```powershell
  Get-Content .\data\index.json -TotalCount 3
  ```
  Dovresti vedere coppie tipo `{"cod":"…","nome":"…"}` (es.: ZIOLKOWSKI Jan, ZORTEA Nadir ...).

- **Build report** (controllo chiavi):
  ```powershell
  Select-String -Path .\data\build_report.md -Pattern "Colonne chiave risolte" -Context 0,3
  ```
  Verifica che per **tutti** gli anni compaiano `COD=cod`, `NOME=nome`, `RUOLO=r`, `SQUADRA=sq`.

- **Storico** valido?
  ```powershell
  Get-Content .\data\storico.json -TotalCount 5
  ```

---

## 10) Troubleshooting

- **`ModuleNotFoundError: pandas`** → attiva la venv o installa deps:
  ```powershell
  .\.venv\Scripts\Activate.ps1
  pip install pandas openpyxl
  ```

- **ExecutionPolicy blocca .ps1**:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
  Unblock-File .\build_and_serve.ps1
  PowerShell -ExecutionPolicy Bypass -File .\build_and_serve.ps1
  ```

- **File Excel non trovati** → controlla percorso/nomi o usa `--pattern`.

- **Foglio non trovato** → assicurati che si chiami **`Tutti i dati`**, altrimenti usa `--sheet` con il nome esatto. Per elencare i fogli:
  ```powershell
  .\.venv\Scripts\python.exe - << 'PY'
  import pandas as pd, glob
  for f in glob.glob(r"D:\\webapp\\tools\\input\\*.xlsx"):
      try:
          print(f, pd.ExcelFile(f, engine="openpyxl").sheet_names)
      except Exception as e:
          print(f, 'ERROR:', e)
  PY
  ```

- **`index.json` vuoto / ricerca non funziona** → apri `data\build_report.md` e controlla la sezione 2025 → “Colonne chiave risolte”. Se `NOME`/`COD` non sono mappati, aggiorna `columns_mapping.json`.

- **File .xls (non .xlsx)** → converti in `.xlsx` (openpyxl legge .xlsx).

---

## 11) Script helper (facoltativi)

- **Batch completo**: `build_and_serve.bat` (crea venv, installa, builda, serve)
  ```bat
  cd /d D:\webapp
  build_and_serve.bat
  ```

- **PowerShell completo**: `build_and_serve.ps1`
  ```powershell
  PowerShell -ExecutionPolicy Bypass -File "D:\webapp\build_and_serve.ps1" -Sheet "Tutti i dati" -Input "D:\webapp\tools\input" -Out "D:\webapp\data"
  ```

> Gli script accettano parametri; se omessi usano i default indicati nel file.

---

## 12) (Opzionale) Deploy su GitHub Pages

1. Push della cartella `D:\webapp` in un repository GitHub (branch `main`).
2. **Settings → Pages**: *Deploy from a branch* → Branch `main` / root `/`.
3. Attendi la pubblicazione; l’app sarà disponibile su `https://<utente>.github.io/<repo>/`.

---

### Checklist finale
- [ ] Excel stagionali in `tools/input/` con foglio `Tutti i dati`
- [ ] `storico.xlsx` in `tools/input/` con foglio `Tutti i dati`
- [ ] Eseguiti comandi build **stagionali** e **storico**
- [ ] `data/index.json` contiene record `cod`/`nome`
- [ ] `data/build_report.md` conferma chiavi risolte per 2025
- [ ] `data/storico.json` popolato
- [ ] Test locale: `python -m http.server 8080`

Buon lavoro! ⚽️📊
