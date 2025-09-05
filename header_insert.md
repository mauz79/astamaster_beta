# Inserto HTML: Header con brand, barra di ricerca e toggle tema

Copia **tale e quale** all'interno del tuo file `index.html` (o `webapp.html`).

- Posizione: **subito dentro `<body>`**, come primo figlio del wrapper `.app`.
- L'`<input id="searchInput">` mantiene la compatibilità con il tuo `app.js`.
- Il pulsante **Tema** scrive/legge `data-theme` su `<html>` e salva la preferenza in `localStorage`.

---

## Snippet: `<header>`

```
<!-- HEADER — inserisci questo blocco subito dentro <body>, come primo figlio di .app -->
<header class="header">
  <div class="container topbar">
    <div class="brand" aria-label="AstaMaster">
      <span class="logo" aria-hidden="true"></span>
      <span>AstaMaster</span>
    </div>

    <div class="search" role="search" aria-label="Cerca giocatore">
      <!-- Icona lente (facoltativa) -->
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M21 21l-3.51-3.51M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <input id="searchInput" type="search" placeholder="Cerca un giocatore" autocomplete="off" inputmode="search" aria-label="Cerca un giocatore" />
      <span class="kbd" aria-hidden="true">Ctrl/⌘ K</span>
    </div>

    <button class="btn" id="themeToggle" type="button" aria-pressed="false" aria-label="Cambia tema">
      <span class="icon" aria-hidden="true">🌗</span>
      <span class="txt">Tema</span>
    </button>
  </div>
</header>

```

---

## Snippet: toggle tema (se non vuoi toccare `app.js`)

```
<!-- (Facoltativo) Inserisci questo <script> in fondo al <body> oppure spostalo in app.js -->
<script>
(function(){
  const root = document.documentElement;
  const key = 'astamaster-theme';
  const btn = document.getElementById('themeToggle');
  // Applica tema salvato se presente
  const saved = localStorage.getItem(key);
  if(saved === 'light' || saved === 'dark'){
    root.setAttribute('data-theme', saved);
    btn?.setAttribute('aria-pressed', String(saved === 'dark'));
  }
  // Toggle tema
  btn?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem(key, next);
    btn.setAttribute('aria-pressed', String(next === 'dark'));
  });
})();
</script>

```

> In alternativa, puoi spostare la logica del toggle tema in `app.js` e rimuovere lo `<script>` inline.
