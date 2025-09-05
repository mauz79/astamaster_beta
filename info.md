# AstaMaster — Preset profili, etichette 2024/Storico, badge Aff., scheda “Nascoste”

Questa patch aggiunge:

- **Profili** (preset) per salvare/ricaricare la configurazione (soglie, campi Storico, toggle 2025/Storico).
- **Etichette/icone** su **2024** e **Storico** (non in 2025) per leggere più velocemente: ⚽ **GF**, 🅿️ **rigori**, 🧤 **GS** portieri, 🎯 **assist**, 🟨 **amm.**, 🟥 **esp.**
- **Badge Affidabilità**: _Aff 2024 > 66%_ e _Aff media > 0.66_.
- **Scheda “Nascoste”** (collassabile) con **solo i campi Storico disabilitati** in Opzioni.
- Layout già **mobile‑friendly** e foto **grande** in alto.

## Come usare i **Profili**
1. Apri **Opzioni → Profili**.
2. Usa il selettore per passare da un profilo all’altro (di default c’è **Default**).
3. **Salva** per aggiornare il profilo corrente con le impostazioni attuali.
4. **Salva come…** per creare un nuovo profilo (verrà impostato come corrente).
5. **Rinomina… / Elimina** per gestire i profili (non puoi rinominare/eliminare **Default**).

> I profili salvano: **soglie badge**, **campi Storico attivi** e **toggle** 2025/Storico. Tutto è persistente in `localStorage`.

## Etichette/icone
- Le iconcine compaiono **solo** su **2024** e **Storico** (non in 2025), e precedono il nome del campo.
- Esempi: `GF` = ⚽, `GFR` = 🅿️, `GS` = 🧤, `GSR` = 🅿️🧤, `AS` = 🎯, `A` = 🟨, `E` = 🟥, `RP` = 🧱.

## Badge Affidabilità
- In alto, accanto ai badge qualità, compaiono anche:
  - **Aff 2024 > 66%** (si adatta sia a dati 0–1 che 0–100).
  - **Aff media > 0.66** (da Storico).

## Scheda “Nascoste”
- È **collassabile** (clicca il titolo) e mostra **solo** i campi dello Storico che hai disattivato in Opzioni (così li hai comunque a portata, ma separati).

## Integrazione
- Sostituisci i file: `index.html`, `webapp.html`, `styles.css`, `app.js`.
- Le immagini dei calciatori devono stare in `img/` e chiamarsi **COD.jpg/png/webp**; c’è il fallback automatico e `img/placeholder.svg`.

Buon testing! :)
