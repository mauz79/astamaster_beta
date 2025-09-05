# AstaMaster — Patch UI (soglie, switch Storico, foto grande, mobile)

Questa patch introduce: soglie badge parametrizzate (persistenti), switch per i singoli campi dello Storico (persistenti), rimozione scheda 'Altre statistiche', foto giocatore grande con meta+badges e layout mobile migliorato.

## Istruzioni
1. Copia `index.html`, `webapp.html`, `styles.css`, `app.js` nella root del progetto.
2. Aggiungi le foto in `img/` con nome **COD.jpg/png/webp** (fallback su `placeholder.svg`).
3. Avvia un server statico e apri il sito. Usa 'Opzioni' per regolare soglie e campi Storico; i toggle 2025/Storico restano persistenti.

## Note tecniche
- Soglie salvate in `localStorage` chiave `astamaster-thresholds`.
- Campi Storico abilitati salvati in `astamaster-storico-fields-enabled`.
- Nascondi 2025/Storico: chiavi `toggle-2025` e `toggle-storico`.
- Portieri: GS/GSR (no GF/GFR). Non portieri: GF/GFR (no GS/GSR).
- Numeri con massimo 3 decimali.
