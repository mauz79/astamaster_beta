const DATA_BASE = 'data/';
const IMG_BASE = 'img/';

const LABELS = {
  cod: "COD", nome: "Nome", r: "Ruolo", sq: "Squadra",
  p: "Presenze", mvt: "Mediavoto (Tot)", mvc: "Mediavoto (Casa)", mvf: "Mediavoto (Fuori)",
  mvdst: "MV Dev.Std", mvdlt: "MV ΔSquadra", mvand: "MV Andamento", mvrnd: "MV Rendimento",
  fmt: "Fantamedia (Tot)", fmc: "Fantamedia (Casa)", fmf: "Fantamedia (Fuori)",
  fmdst: "FM Dev.Std", fmdlt: "FM ΔSquadra", fmand: "FM Andamento", fmrnd: "FM Rendimento",
  fmld: "Fantamiliardi",
  gf: "Gol", gfr: "Gol su Rigore", gs: "Gol Subiti", gsr: "GS su Rigore",
  as: "Assist", a: "Ammonizioni", e: "Espulsioni",
  rp: "Rigori Parati", rs: "Rigori Sbagliati", ag: "Autogol",
  aff: "Affidabilità %",
  t: "Tesserato", tln: "In fantasquadra",
  cambio_squadra: "Cambio Squadra", cambio_ruolo: "Cambio Ruolo"
};

const LABELS_STORICO = {
  oldsq: "Old SQ (stato)", squadra_2024_status: "Squadra 2024 (stato)", ruolo_2024: "Ruolo 2024",
  oldr: "Old R", cambio_ruolo_descr: "Cambio Ruolo (descr.)",
  p_2024: "Presenze 2024", aff_2024: "Affidabilità 2024", mvt_2024: "Mediavoto 2024", mvand_2024: "Andamento MV 2024",
  fmt_2024: "Fantamedia 2024", fmand_2024: "Andamento FM 2024",
  p_tot_4stag: "Presenze tot (4 stag.)", p_media_stagione: "Pres. medie/stagione",
  aff_media_stagione: "Aff. media/stagione", mvt_media_stagione: "MV media/stagione", fmt_media_stagione: "FM media/stagione",
  gf_media_stagione: "Gol medi/stagione", gf_per_presenza: "Gol per presenza", presenze_per_gol: "Presenze per gol", gf_media_stagione_norm: "Gol medi (attesi)",
  as_media_stagione: "Assist medi/stagione", as_per_presenza: "Assist per presenza", presenze_per_assist: "Presenze per assist", as_media_stagione_norm: "Assist medi (attesi)",
  a_media_stagione: "Amm. medie/stagione", a_per_presenza: "Amm. per presenza", presenze_per_ammonizione: "Presenze per amm.", a_media_stagione_norm: "Amm. medie (attese)",
  e_media_stagione: "Esp. medie/stagione", e_per_presenza: "Esp. per presenza", presenze_per_espulsione: "Presenze per esp.", e_media_stagione_norm: "Esp. medie (attese)",
  gs_media_stagione: "GS medi/stagione", gs_per_presenza: "GS per presenza", gs_media_stagione_norm: "GS medi (attesi)",
  rp_media_stagione: "RP medi/stagione", rp_per_presenza: "RP per presenza", presenze_per_rp: "Presenze per RP", rp_media_stagione_norm: "RP medi (attesi)"
};

// Storico: chiavi da non mostrare
const HIDE_STORICO = new Set([
  // già nascosti precedentemente
  'aff_2024','fmand_2024','fmt_2024','mvand_2024','mvt_2024','p_2024','ruolo_2024','oldsq',
  // nuove esclusioni richieste
  'a_per_presenza','as_per_presenza','e_per_presenza','gf_per_presenza','nome','oldr','sq','squadra_2024_status'
]);

const TOOLTIP = {
  aff: "Partite giocate su totale previste nella stagione",
  fmdlt: "Δ tra Fantamedia del giocatore e media della squadra",
  mvdlt: "Δ tra Mediavoto del giocatore e media della squadra",
  fmdst: "Scarto quadratico medio (Fantamedia)",
  mvdst: "Scarto quadratico medio (Mediavoto)",
  fmrnd: "Fantamedia / Costo",
  mvrnd: "Mediavoto / Costo"
};

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

const $ = sel => document.querySelector(sel);

// === Formatting max 3 decimals ===
function fmtValue(v){
  if(v===null || v===undefined) return '—';
  const num = typeof v === 'number' ? v : (typeof v === 'string' ? Number(v.toString().replace(',', '.')) : NaN);
  if(!Number.isFinite(num)) return String(v);
  return Number(num.toFixed(3)).toString();
}

function escapeHtml(str){ return String(str).replace(/[&<>"']/g, s => ({'&':'&','<':'<','>':'>','"':'"','\'':'&#39;'}[s])); }
function rowKV(label, value, key){
  const tipText = TOOLTIP[key] || TOOLTIP_STORICO[key];
  const tip = tipText ? ` title="${escapeHtml(tipText)}"` : '';
  const display = fmtValue(value);
  return `<div class="row"><span class="key"${tip}>${label}</span><span class="val">${display}</span></div>`;
}
function listKV(obj, keys){ return keys.filter(k => k in obj).map(k => rowKV(LABELS[k] || k, obj[k], k)).join(''); }
function renderExtra(obj){
  const exclude = new Set(['_season','cambio_squadra','cambio_ruolo']);
  ['cod','nome','r','sq','p','mvt','fmt','mvc','mvf','fmc','fmf','aff','gf','as','a','e','gfr','gs','gsr','rp','rs','ag','mvdst','fmdst','mvdlt','fmdlt','mvand','fmand','mvrnd','fmrnd','fmld']
    .forEach(k => exclude.add(k));
  const entries = Object.entries(obj).filter(([k]) => !exclude.has(k));
  if(entries.length===0) return '<div class="small">Nessun altro campo.</div>';
  entries.sort((a,b)=>a[0].localeCompare(b[0]));
  return entries.map(([k,v]) => rowKV(k, v, k)).join('');
}

async function fetchJSON(file){
  const res = await fetch(DATA_BASE+file,{cache:'no-store'});
  if(!res.ok) throw new Error('Impossibile caricare '+file+' ('+res.status+')');
  return res.json();
}
function norm(s){return (s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()}
function highlightMatch(text, query){
  const lt = text||''; const q = query||''; const i = lt.toLowerCase().indexOf(q.toLowerCase());
  if(i<0) return escapeHtml(lt); const end = i+q.length;
  return escapeHtml(lt.slice(0,i))+'<mark>'+escapeHtml(lt.slice(i,end))+'</mark>'+escapeHtml(lt.slice(end));
}
function normCod(x){ const s = String(x ?? '').trim(); if(/^\d+\.0$/.test(s)) return s.slice(0,-2); return s; }
let INDEX=[]; let data2025=null, data2024=null, storico=null; let map2025=null;
async function loadIndex(){ try{ INDEX = await fetchJSON('index.json') }catch(e){ console.warn('index.json non trovato', e) } }

// Show/Hide results helper
function hideResults(){ const p = document.getElementById('panelResults'); if(p) p.classList.add('hidden'); }
function showResults(){ const p = document.getElementById('panelResults'); if(p) p.classList.remove('hidden'); }

// === Toggles ===
const TOGGLE_KEYS = { y2025:'toggle-2025', storico:'toggle-storico' };
function applyToggles(){
  const t25 = localStorage.getItem(TOGGLE_KEYS.y2025);
  const ts = localStorage.getItem(TOGGLE_KEYS.storico);
  const show25 = t25!== 'off';
  const showS = ts!== 'off';
  const c25 = document.getElementById('wrap2025');
  const cs = document.getElementById('wrapStorico');
  c25?.classList.toggle('hidden', !show25);
  cs?.classList.toggle('hidden', !showS);
  const cb25 = document.getElementById('toggle2025'); if(cb25) cb25.checked = show25;
  const cbs = document.getElementById('toggleStorico'); if(cbs) cbs.checked = showS;
}
function setupToggles(){
  const cb25 = document.getElementById('toggle2025');
  const cbs = document.getElementById('toggleStorico');
  cb25?.addEventListener('change', e=>{ localStorage.setItem(TOGGLE_KEYS.y2025, e.target.checked? 'on':'off'); applyToggles(); });
  cbs?.addEventListener('change', e=>{ localStorage.setItem(TOGGLE_KEYS.storico, e.target.checked? 'on':'off'); applyToggles(); });
  applyToggles();
}

function renderResults(items, query){
  const ul = document.getElementById('results'); ul.innerHTML='';
  items.slice(0,50).forEach(item=>{
    const li=document.createElement('li'); li.className='result-item'; li.setAttribute('role','option'); li.tabIndex=0;
    const title = `<span class=\"result-title\">${highlightMatch(item.nome||'', query)}</span>`;
    const meta = `<span class=\"result-meta\">${escapeHtml(item.ruolo_2025||'—')} · ${escapeHtml(item.squadra_2025||'—')}</span>`;
    li.innerHTML = `${title}<span>${meta}</span>`;
    li.addEventListener('click',()=>selectPlayer(item.cod,item));
    li.addEventListener('keypress',(e)=>{if(e.key==='Enter') selectPlayer(item.cod,item)});
    ul.appendChild(li);
  });
}
function search(q){ const nq = norm(q.trim()); if(!nq){$('#results').innerHTML='';return} const res = INDEX.filter(x=>norm(x.nome).includes(nq)); renderResults(res,q) }
let debounceTimer; const inputEl = document.getElementById('searchInput');
inputEl.addEventListener('input', (e)=>{ showResults(); clearTimeout(debounceTimer); const v=e.target.value; debounceTimer=setTimeout(()=>search(v),140) })

async function ensureYear(year){
  if(year===2025 && !data2025){ data2025 = await fetchJSON('2025.json'); map2025 = new Map(data2025.filter(r=>r.cod!=null||r.COD!=null).map(r=>[normCod(r.cod??r.COD), r])) }
  if(year===2024 && !data2024){ data2024 = await fetchJSON('2024.json') }
}
function indexByCOD(records){ const m=new Map(); for(const r of records){ const cod=(r.cod??r.COD??r.id??r.Id); if(cod!=null) m.set(normCod(cod),r) } return m }

// === Foto con fallback estensioni ===
const PHOTO_EXTS = ['jpg','png','webp'];
function setPlayerPhoto(cod){
  const img = document.getElementById('playerPhoto');
  if(!img) return;
  let i=0; const tryNext=()=>{
    if(i>=PHOTO_EXTS.length){ img.src='img/placeholder.svg'; return; }
    const ext = PHOTO_EXTS[i++]; img.src = IMG_BASE + cod + '.' + ext; };
  img.onerror = ()=> tryNext();
  tryNext();
}

function addTopBadges(rec25, p24, srec){
  const wrap = document.getElementById('playerBadges');
  if(!wrap) return;
  const out = [];
  // Cambio ruolo
  if(rec25?.cambio_ruolo===true){ out.push('<span class="badge warn">Cambio Ruolo</span>'); }
  // Cambio squadra o nuovo acquisto
  const isCambioSq = rec25?.cambio_squadra===true;
  const isNew = (srec?.oldsq && String(srec.oldsq).toLowerCase()==='new');
  if(isNew){ out.push('<span class="badge info">Nuovo acquisto</span>'); }
  else if(isCambioSq){ out.push('<span class="badge alert">Cambio Squadra</span>'); }
  // Soglie MV/FM 2024
  const mv2024 = Number(p24?.mvt);
  const fm2024 = Number(p24?.fmt);
  if(Number.isFinite(mv2024) && mv2024>6.1){ out.push('<span class="badge good">MV 2024 > 6.1</span>'); }
  if(Number.isFinite(fm2024) && fm2024>6.6){ out.push('<span class="badge good">FM 2024 > 6.6</span>'); }
  // Soglie medie storiche
  const mvMed = Number(srec?.mvt_media_stagione);
  const fmMed = Number(srec?.fmt_media_stagione);
  if(Number.isFinite(mvMed) && mvMed>6.1){ out.push('<span class="badge good">MV medio > 6.1</span>'); }
  if(Number.isFinite(fmMed) && fmMed>6.6){ out.push('<span class="badge good">FM media > 6.6</span>'); }
  wrap.innerHTML = out.join(' ');
}

async function selectPlayer(cod, idx){
  document.getElementById('playerSection').classList.remove('hidden');
  const role = (idx?.ruolo_2025||'').toUpperCase().trim();
  const roleKnown = ['P','D','C','A'].includes(role);

  // foto + nome + meta (ruolo + squadra)
  document.getElementById('playerName').textContent = idx?.nome || 'Giocatore';
  setPlayerPhoto(normCod(cod));
  document.getElementById('playerMeta').innerHTML = `
    <span class="${roleKnown?`chip chip--role role--${role}`:'badge'}">${escapeHtml(role || '—')}</span>
    <span class="badge">${escapeHtml(idx?.squadra_2025||'—')}</span>`;
  document.getElementById('playerBadges').innerHTML = '';

  // Nascondi suggerimenti
  $('#results').innerHTML=''; hideResults();

  // Spinner
  document.getElementById('card2025').innerHTML='<span class=spinner aria-label=caricamento></span>';
  document.getElementById('card2024').innerHTML='<span class=spinner aria-label=caricamento></span>';
  document.getElementById('cardStorico').innerHTML='<span class=spinner aria-label=caricamento></span>';
  document.getElementById('extraFields').innerHTML='';

  await ensureYear(2025); await ensureYear(2024);
  const codN = normCod(cod);
  const rec25 = map2025? map2025.get(codN) : null;

  // 2025 (rispetta toggle visibilità card)
  const card25El = document.getElementById('card2025');
  const card25Wrap = document.getElementById('wrap2025');
  card25Wrap?.classList.remove('card--attention');
  if(rec25){
    const roleFields = (rec25?.r || role || '').toString().toUpperCase().trim();
    let main25;
    if(roleFields === 'P'){
      main25 = ['r','sq','p','mvt','fmt','mvc','mvf','fmc','fmf','aff','gs','gsr','as','a','e'];
    } else {
      main25 = ['r','sq','p','mvt','fmt','mvc','mvf','fmc','fmf','aff','gf','as','a','e'];
    }
    const parts=[]; parts.push(listKV(rec25, main25));
    // sposta i badge di cambio in alto (non nella card 2025)
    if(rec25.cambio_squadra===true || rec25.cambio_ruolo===true){ card25Wrap?.classList.add('card--attention'); }
    card25El.innerHTML = parts.join('');
    document.getElementById('extraFields').innerHTML = renderExtra(rec25)
  } else {
    card25El.innerHTML = '<div class=small>Giocatore non trovato nel 2025.json</div>';
  }

  // 2024
  let p24=null; if(data2024){ const map24=indexByCOD(data2024); p24 = map24.get(codN) }
  if(p24){
    const role24 = (p24?.r || role || '').toString().toUpperCase().trim();
    let main24;
    if(role24 === 'P'){
      // GK: mostra GS & GSR
      main24 = ['r','sq','aff','p','mvt','fmt','gs','gsr','as','a','e'];
    } else {
      // Non GK: mostra GF & GFR
      main24 = ['r','sq','aff','p','mvt','fmt','gf','gfr','as','a','e'];
    }
    document.getElementById('card2024').innerHTML = listKV(p24, main24)
  } else { document.getElementById('card2024').innerHTML='<div class=small>Dati 2024 non disponibili.</div>' }

  // Storico
  let srec = null;
  try{
    if(!storico){ storico = await fetchJSON('storico.json') }
    const total = Array.isArray(storico)? storico.length : 0;
    srec = (storico||[]).find(x => normCod(x.cod) === codN);
    if(srec){
      const fields = Object.keys(srec)
        .filter(k => k !== 'cod' && k !== 'stagioni_considerate' && !HIDE_STORICO.has(k))
        .sort();
      const rows = fields.map(k => rowKV(LABELS_STORICO[k] || LABELS[k] || k, srec[k], k)).join('');
      const header = Array.isArray(srec.stagioni_considerate)? `<div class=\"small\">Stagioni: ${srec.stagioni_considerate.join(', ')}</div>`:'';
      document.getElementById('cardStorico').innerHTML = header + rows;
    } else {
      document.getElementById('cardStorico').innerHTML = `<div class=small>Nessun dato storico per COD ${escapeHtml(codN)} (storico len=${total}).</div>`;
    }
  }catch(e){
    document.getElementById('cardStorico').innerHTML = '<div class=small>Storico non disponibile.</div>';
    console.warn('Errore caricamento storico.json', e);
  }

  // Badges in alto (post-load perché usiamo p24/srec)
  addTopBadges(rec25, p24, srec);
}

// Expand/Collapse: card "Altre statistiche"
document.addEventListener('click', (e)=>{
  const h3 = e.target.closest('.expandable h3');
  if(h3){ const card = h3.closest('.expandable'); card?.classList.toggle('collapsed'); }
});

// Shortcut Ctrl/⌘+K per focus ricerca (+ riapri suggerimenti)
document.addEventListener('keydown', (e)=>{
  if((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')){
    const el = document.getElementById('searchInput');
    if(el){ e.preventDefault(); el.focus(); el.select?.(); showResults(); }
  }
});

// Init
(async function init(){ try{ await loadIndex() }catch(e){ console.warn(e) } setupToggles(); })();
