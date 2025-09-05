# Piano di Test — AstaMaster (User Acceptance Testing)

Questo documento guida un **tester umano** a verificare che AstaMaster funzioni correttamente prima dell’uso in asta.

## 1. Preparazione
- Browser consigliati (desktop): **Chrome**, **Firefox**, **Edge** (versioni recenti).
- Mobile: almeno un test su **Android Chrome** e **iOS Safari**.
- Dati disponibili in `data/`: `index.json`, `2024.json`, `2025.json`, `storico.json`.
- Foto giocatori in `img/` come `COD.jpg` (o `.png` / `.webp`).
- Aprire il sito con un server statico (es. `python -m http.server`).

## 2. Casi d’uso principali

### 2.1 Ricerca & Selezione
1. Premi **/** per focalizzare la ricerca (il cursore deve finire nell’input).
2. Digita almeno 3 lettere di un cognome: compaiono i suggerimenti.
3. Clicca un risultato: la lista scompare e si apre il **Dettaglio giocatore**.
**Atteso**: foto (o placeholder), nome, chip ruolo, badge squadra, badge qualità.

### 2.2 Card 2024 (rigori) & 2025
- Seleziona un **portiere**: in **2024** devono comparire **GS** e **GSR** (no GF/GFR).
- Seleziona un **giocatore di movimento**: in **2024** devono comparire **GF** e **GFR** (no GS/GSR).
**Atteso**: 2025 mostra MV/FM/Presenze + indicatori generali coerenti al ruolo.

### 2.3 Storico (sezioni, tooltip, gruppi)
1. Verifica che **Storico** mostri 3 blocchi: **Dati statistici**, **Statistiche per presenza**, **Futures**.
2. Passa il mouse sui titoli: deve apparire un **tooltip** breve.
3. Apri **Opzioni → Storico – gruppi** e **spegni** “Statistiche per presenza”.
**Atteso**: il blocco scompare dalla card **Storico** e compare nella card **Nascoste**.
4. Riaccendi “Statistiche per presenza” e **spegni** “Futures”.
**Atteso**: comportamento analogo per **Futures**.

### 2.4 Card “Nascoste”
- Quando un gruppo è spento, le sue voci compaiono nella card **Nascoste** (collassabile), graficamente **separata** dalle altre.
**Atteso**: con tutti i gruppi accesi, la card mostra “Nessun campo nascosto”.

### 2.5 Opzioni (soglie, OK, Reset, sticky bar)
1. In **Opzioni → Soglie badge**, cambia una soglia (es. MV 2024 da 6.1 a 6.3).
2. Chiudi con **OK** (in alto sticky o in basso).
3. Riapri un giocatore con MV 2024 > nuova soglia.
**Atteso**: i badge qualità riflettono la soglia aggiornata.
4. Clicca **Reset impostazioni**: riconferma.
**Atteso**: tema **scuro**, soglie default, gruppi Storico accesi, card visibili.

### 2.6 Tema & visibilità card
- Spegni **2025** e/o **Storico** con gli switch in alto.
**Atteso**: i riquadri spariscono e la preferenza resta salvata (ricalcando la pagina, resta coerente).
- Cambia **Tema scuro** → chiaro.
**Atteso**: persistenza della preferenza anche dopo reload.

### 2.7 Immagini giocatori (fallback)
- Rinomina temporaneamente la foto di un giocatore per simulare assenza.
**Atteso**: il sistema prova `jpg → png → webp` e infine mostra `placeholder.svg`.

## 3. Edge cases
- **COD non presente** in `2025.json`: la card 2025 segnala “Giocatore non trovato…”.
- **Valori assenti**: al posto dei numeri appare `—`.
- **Affidabilità**: se 2024 `aff` è 0–100, la UI la normalizza correttamente.
- **Input focus**: digitando **/** dentro un input/textarea **non** deve muovere il focus (nessun jump).

## 4. Performance & UX
- Ricerca: per una query di 3–4 lettere, i suggerimenti devono comparire entro ~100–200 ms su desktop.
- Mobile: apri **Opzioni**: la finestra deve ancorarsi in basso, con barra **sticky** e pulsante **OK** visibile.

## 5. Accessibilità (rapido)
- Navigazione via **Tab** su input e risultati.
- Contrasto leggibile in tema scuro/chiaro.
- Tooltip non devono interferire con il click.

## 6. Esito e report
Per ogni sezione, segna **OK/KO** con eventuali note (browser, OS, passaggi riprodotti). In caso di KO allega:
- Passi per riprodurre
- Browser/OS
- Schermata o breve clip
- JSON/giocatore coinvolto

Grazie per il testing! 💙
