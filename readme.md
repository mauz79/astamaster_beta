# AstaMaster — AlterLega Draft Assistant

**AstaMaster** è un assistente per l'**asta di AlterLega** pensato per aiutarti a **scegliere i calciatori su cui puntare**. Combina **statistiche annuali** e **elaborazioni storiche** per offrire uno **scouting mirato**: un colpo d’occhio su rendimento, affidabilità e prospettive ("Futures").

## Funzioni principali
- **Ricerca rapida** del giocatore (Ctrl F5 / ⌘ K per focalizzare l’input).
- **Card 2025** (stato attuale) e **Card 2024** con metriche coerenti per ruolo:
  - *Portieri*: Gol Subiti (GS) e GS su Rigore (GSR).
  - *Altri ruoli*: Gol Fatti (GF) e Gol su Rigore (GFR).
- **Storico** in 3 blocchi:
  - **Dati statistici** (medie e conteggi consolidati).
  - **Statistiche per presenza** (indicatori normalizzati per evento).
  - **Futures** (valori attesi normalizzati).
- **Badges** intelligenti (cambio ruolo/squadra, nuovi acquisti, soglie su MV/FM 2024 e medie storiche, **Affidabilità** 2024 > 66% e **Aff. media/stagione** > 0.66).
- **Opzioni** con:
  - **Soglie** badge regolabili (persistenti).
  - **Switch di gruppo** per Storico (accendi/spegni *Statistiche per presenza* e *Futures*).
  - **OK** per chiudere rapidamente il pannello.
  - **Reset impostazioni** per tornare ai default.
- **Card “Nascoste”**: mostra i gruppi disattivati (così non perdi informazioni).
- **Tema scuro/chiaro** via switch (persistente).

## Struttura file
- `index.html`, `webapp.html` — markup della web app.
- `styles.css` — tema, layout responsive, pannello Opzioni con barra **sticky** su mobile.
- `app.js` — logica (ricerca, caricamento JSON, rendering card, soglie, gruppi Storico, badge, reset, ecc.).

## Dati richiesti
- Cartella `data/` con `2025.json`, `2024.json`, `storico.json`, `index.json` (lista per i suggerimenti).
- Cartella `img/` con le foto dei giocatori: `COD.jpg` *(fallback su `.png` → `.webp` → `placeholder.svg`)*.

## Crediti
AstaMaster è sviluppato da **mauz79** per **Lega Fantacalcio AlterLega**.
