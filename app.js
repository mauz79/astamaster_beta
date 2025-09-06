const DATA_BASE = 'data/';
const IMG_BASE = 'img/';

// ===== Labels =====
const LABELS = {
  cod: "COD", nome: "Nome", r: "Ruolo", sq: "Squadra",
  p: "Presenze", mvt: "Mediavoto (Tot)", mvc: "Mediavoto (Casa)", mvf: "Mediavoto (Fuori)",
  fmt: "Fantamedia (Tot)", fmc: "Fantamedia (Casa)", fmf: "Fantamedia (Fuori)",
  gf: "Gol", gfr: "Gol su Rigore", gs: "Gol Subiti", gsr: "GS su Rigore",
  as: "Assist", a: "Ammonizioni", e: "Espulsioni",
  rp: "Rigori Parati", rs: "Rigori Sbagliati", ag: "Autogol",
  aff: "Affidabilità %",
  cambio_squadra: "Cambio Squadra", cambio_ruolo: "Cambio Ruolo"
};

// Storico: etichette normalizzate
const LABELS_STORICO = {
  p_tot_4stag: "Presenze tot",
  cambio_ruolo_descr: "Cambio Ruolo",
  p_media_stagione: "Pres. medie/stagione",
  aff_media_stagione: "Aff. media/stagione",
  mvt_media_stagione: "MV media/stagione",
  fmt_media_stagione: "FM media/stagione",
  gf_media_stagione: "Gol medi/stagione",
  as_media_stagione: "Assist medi/stagione",
  gs_media_stagione: "GS medi/stagione",
  rp_media_stagione: "RP medi/stagione",
  a_media_stagione: "Amm. medie/stagione",
  e_media_stagione: "Esp. medie/stagione",
  // per presenza
  presenze_per_gol: "Presenze per gol",
  presenze_per_assist: "Presenze per assist",
  presenze_per_ammonizione: "Presenze per amm.",
  presenze_per_espulsione: "Presenze per esp.",
  gs_per_presenza: "GS per presenza",
  rp_per_presenza: "RP per presenza",
  presenze_per_rp: "Presenze per RP",
  // attesi
  gf_media_stagione_norm: "Gol medi (attesi)",
  as_media_stagione_norm: "Assist medi (attesi)",
  a_media_stagione_norm: "Amm. medie (attese)",
  e_media_stagione_norm: "Esp. medie (attese)",
  gs_media_stagione_norm: "GS medi (attesi)",
  rp_media_stagione_norm: "RP medi (attesi)"
};

// Campi da non mostrare MAI
const HIDE_STORICO = new Set([
  'aff_2024','fmand_2024','fmt_2024','mvand_2024','mvt_2024','p_2024','ruolo_2024','oldsq',
  'a_per_presenza','as_per_presenza','e_per_presenza','gf_per_presenza','nome','oldr','sq','squadra_2024_status'
]);

// Iconcine SOLO per 2024 e Storico

const ICONS = {
  gf: '⚽',
  gfr: '🅁⚽',        // gol su rigore
  ag: '🔴⚽',        // autogol
  rs: '🅁🔴⚽',      // rigore sbagliato
  gs: '🔴🧤',        // gol subiti
  gsr: '🅁🔴🧤',    // gol subiti su rigore
  rp: '🅁🟢🧤',    // rigori parati
  as: '🎯',
  a:  '🟨',
  e:  '🟥'
};


// Tooltips per le sezioni Storico
const SECT_TIPS = {
  dati: 'Medie e conteggi consolidati sulle ultime stagioni',
  perPres: 'Indicatori normalizzati rispetto alle presenze',
  futures: 'Valori attesi (normalizzati) stimati su base storica'
};

// ===== Helpers =====
const $ = sel => document.querySelector(sel);
function fmtValue(v){ if(v===null||v===undefined) return '—'; const n = typeof v==='number'? v : Number(String(v).replace(',','.')); if(!Number.isFinite(n)) return String(v); return Number(n.toFixed(3)).toString(); }
function fmtPercent01(x){ if(x===null||x===undefined) return '—'; let v=Number(x); if(!Number.isFinite(v)) return String(x); if(v<=1) v*=100; return Number(v.toFixed(1)).toString()+'%'; }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&','<':'<','>':'>','"':'"','\'':'&#39;'}[c])); }
function rowKVctx(label,val,key,ctx){ const ico=(ctx!=='2025' && ICONS[key])? `<span class="ico">${ICONS[key]}</span>` : ''; const display = (key==='aff_media_stagione') ? fmtPercent01(val) : fmtValue(val); return `<div class="row"><span class="key">${ico}${label}</span><span class="val">${display}</span></div>` }
function listKVctx(obj,keys,ctx){ return keys.filter(k=>k in obj).map(k=>rowKVctx(LABELS[k]||LABELS_STORICO[k]||k,obj[k],k,ctx)).join('') }
async function fetchJSON(f){ const r=await fetch(DATA_BASE+f,{cache:'no-store'}); if(!r.ok) throw new Error('Impossibile caricare '+f+' ('+r.status+')'); return r.json() }
function norm(s){return (s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()}
function highlightMatch(t,q){ const lt=t||'',qq=q||''; const i=lt.toLowerCase().indexOf(qq.toLowerCase()); if(i<0) return escapeHtml(lt); const e=i+qq.length; return escapeHtml(lt.slice(0,i))+'<mark>'+escapeHtml(lt.slice(i,e))+'</mark>'+escapeHtml(lt.slice(e)) }
function normCod(x){ const s=String(x??'').trim(); return /^\d+\.0$/.test(s)? s.slice(0,-2): s }

// ===== State =====
let INDEX=[], data2025=null, data2024=null, storico=null, map2025=null;

// ===== Suggestions =====
async function loadIndex(){ try{ INDEX=await fetchJSON('index.json') }catch(e){ console.warn('index.json non trovato',e) } }
function hideResults(){ $('#panelResults')?.classList.add('hidden') }
function showResults(){ $('#panelResults')?.classList.remove('hidden') }
function renderResults(items,q){ const ul=$('#results'); ul.innerHTML=''; items.slice(0,50).forEach(item=>{ const li=document.createElement('li'); li.className='result-item'; li.setAttribute('role','option'); li.tabIndex=0; const title=`<span class=\"result-title\">${highlightMatch(item.nome||'', q)}</span>`; const meta=`<span class=\"result-meta\">${escapeHtml(item.ruolo_2025||'—')} · ${escapeHtml(item.squadra_2025||'—')}</span>`; li.innerHTML=`${title}<span>${meta}</span>`; li.addEventListener('click',()=>selectPlayer(item.cod,item)); li.addEventListener('keypress',(e)=>{if(e.key==='Enter') selectPlayer(item.cod,item)}); ul.appendChild(li) }) }
function search(q){ const nq=norm(q.trim()); if(!nq){ $('#results').innerHTML=''; return } const res=INDEX.filter(x=>norm(x.nome).includes(nq)); renderResults(res,q) }
let debounceTimer; document.getElementById('searchInput').addEventListener('input', e=>{ showResults(); clearTimeout(debounceTimer); const v=e.target.value; debounceTimer=setTimeout(()=>search(v),140) })

// ===== Data loading =====
async function ensureYear(y){ if(y===2025 && !data2025){ data2025=await fetchJSON('2025.json'); map2025=new Map(data2025.filter(r=>r.cod!=null||r.COD!=null).map(r=>[normCod(r.cod??r.COD), r])) } if(y===2024 && !data2024){ data2024=await fetchJSON('2024.json') } }
function indexByCOD(recs){ const m=new Map(); for(const r of recs){ const cod=(r.cod??r.COD??r.id??r.Id); if(cod!=null) m.set(normCod(cod),r) } return m }

// ===== Photo =====
const PHOTO_EXTS=['jpg','png','webp'];
function setPlayerPhoto(cod){ const img=$('#playerPhoto'); if(!img) return; let i=0; const next=()=>{ if(i>=PHOTO_EXTS.length){ img.src='img/placeholder.svg'; return } img.src=IMG_BASE+cod+'.'+PHOTO_EXTS[i++] }; img.onerror=()=>next(); next() }

// ===== Toggles (card visibility + theme) =====
const TOGGLE_KEYS={ y2025:'toggle-2025', storico:'toggle-storico' };
function applyToggles(){ const t25=localStorage.getItem(TOGGLE_KEYS.y2025)!=='off'; const ts=localStorage.getItem(TOGGLE_KEYS.storico)!=='off'; $('#wrap2025')?.classList.toggle('hidden',!t25); $('#wrapStorico')?.classList.toggle('hidden',!ts); const s25=$('#switch2025'); if(s25) s25.checked=t25; const ss=$('#switchStorico'); if(ss) ss.checked=ts }
function setupToggles(){ $('#switch2025')?.addEventListener('change',e=>{ localStorage.setItem(TOGGLE_KEYS.y2025, e.target.checked?'on':'off'); applyToggles() }); $('#switchStorico')?.addEventListener('change',e=>{ localStorage.setItem(TOGGLE_KEYS.storico, e.target.checked?'on':'off'); applyToggles() }); applyToggles(); }

const THEME_KEY='astamaster-theme';
function applyTheme(mode){ document.documentElement.setAttribute('data-theme', mode); const sw=$('#switchTheme'); if(sw) sw.checked=(mode==='dark'); }
function setupTheme(){ const saved=localStorage.getItem(THEME_KEY); if(saved==='light'||saved==='dark'){ applyTheme(saved) } else { applyTheme('dark') } $('#switchTheme')?.addEventListener('change', e=>{ const mode=e.target.checked?'dark':'light'; applyTheme(mode); localStorage.setItem(THEME_KEY, mode); }); }

// ===== Thresholds (parametrizzabili) =====
const DEFAULT_THRESHOLDS={ mv2024:6.1, fm2024:6.6, mvMed:6.1, fmMed:6.6 };
const LS_THRESH='astamaster-thresholds';
function getThresholds(){ try{ const t=JSON.parse(localStorage.getItem(LS_THRESH)||'{}'); return { mv2024: +t.mv2024||DEFAULT_THRESHOLDS.mv2024, fm2024: +t.fm2024||DEFAULT_THRESHOLDS.fm2024, mvMed: +t.mvMed||DEFAULT_THRESHOLDS.mvMed, fmMed: +t.fmMed||DEFAULT_THRESHOLDS.fmMed } }catch{ return {...DEFAULT_THRESHOLDS} } }
function saveThresholds(t){ localStorage.setItem(LS_THRESH, JSON.stringify(t)) }

// ===== Storico: gruppi (non singole voci) =====
const LS_STO_GROUPS='astamaster-storico-groups';
function getGroups(){ try{ const g=JSON.parse(localStorage.getItem(LS_STO_GROUPS)||'{}'); return { perPres: g.perPres!==false, futures: g.futures!==false } }catch{ return { perPres:true, futures:true } } }
function saveGroups(g){ localStorage.setItem(LS_STO_GROUPS, JSON.stringify(g)) }

function storicoSectionOrder(){
  const DATI_STAT = ['p_tot_4stag','cambio_ruolo_descr','p_media_stagione','aff_media_stagione','mvt_media_stagione','fmt_media_stagione','gf_media_stagione','as_media_stagione','gs_media_stagione','rp_media_stagione','a_media_stagione','e_media_stagione'];
  const PER_PRES = ['presenze_per_gol','presenze_per_assist','presenze_per_ammonizione','presenze_per_espulsione','gs_per_presenza','rp_per_presenza','presenze_per_rp'];
  const FUTURES  = ['gf_media_stagione_norm','as_media_stagione_norm','a_media_stagione_norm','e_media_stagione_norm','gs_media_stagione_norm','rp_media_stagione_norm'];
  return { DATI_STAT, PER_PRES, FUTURES };
}

// ===== Options UI =====
function buildOptionsUI(){
  // Soglie
  const t=getThresholds(); const mv24=$('#opt_mv2024'), fm24=$('#opt_fm2024'), mvm=$('#opt_mvMed'), fmm=$('#opt_fmMed');
  if(mv24) mv24.value=t.mv2024; if(fm24) fm24.value=t.fm2024; if(mvm) mvm.value=t.mvMed; if(fmm) fmm.value=t.fmMed;
  const sync=()=>saveThresholds({ mv2024:parseFloat(mv24.value||t.mv2024), fm2024:parseFloat(fm24.value||t.fm2024), mvMed:parseFloat(mvm.value||t.mvMed), fmMed:parseFloat(fmm.value||t.fmMed) });
  [mv24,fm24,mvm,fmm].forEach(i=>i&&i.addEventListener('change',sync));

  // Gruppi Storico come switch
  const g=getGroups();
  const sg1=$('#switchPerPres'); const sg2=$('#switchFutures');
  if(sg1) sg1.checked = g.perPres; if(sg2) sg2.checked = g.futures;
  sg1?.addEventListener('change',()=>{ saveGroups({ perPres: sg1.checked, futures: sg2.checked }) });
  sg2?.addEventListener('change',()=>{ saveGroups({ perPres: sg1.checked, futures: sg2.checked }) });

  // Pulsante OK per chiudere il pannello Opzioni
  const close = ()=>{ const det=document.querySelector('details.options'); if(det) det.removeAttribute('open'); };
  $('#btnCloseOptions')?.addEventListener('click', close);
  $('#btnCloseOptionsTop')?.addEventListener('click', close);

  // Reset impostazioni
  $('#btnResetOptions')?.addEventListener('click', ()=>{
    localStorage.removeItem(LS_THRESH);
    localStorage.removeItem(LS_STO_GROUPS);
    localStorage.removeItem(TOGGLE_KEYS.y2025);
    localStorage.removeItem(TOGGLE_KEYS.storico);
    localStorage.removeItem(THEME_KEY);
    // Re-applica default
    setupTheme();
    applyToggles();
    buildOptionsUI();
    alert('Impostazioni ripristinate.');
  });
}

// ===== Badges header (inclusi Affidabilità) =====
function addTopBadges(rec25,p24,srec){ const wrap=$('#playerBadges'); if(!wrap) return; const out=[]; const thr=getThresholds(); if(rec25?.cambio_ruolo===true) out.push('<span class="badge warn">Cambio Ruolo</span>'); const isCambioSq=rec25?.cambio_squadra===true; const isNew=(srec?.oldsq&&String(srec.oldsq).toLowerCase()==='new'); if(isNew) out.push('<span class="badge info">Nuovo acquisto</span>'); else if(isCambioSq) out.push('<span class="badge alert">Cambio Squadra</span>'); const mv2024=+p24?.mvt, fm2024=+p24?.fmt; if(Number.isFinite(mv2024)&&mv2024>thr.mv2024) out.push(`<span class="badge good">MV 2024 > ${thr.mv2024}</span>`); if(Number.isFinite(fm2024)&&fm2024>thr.fm2024) out.push(`<span class="badge good">FM 2024 > ${thr.fm2024}</span>`); const mvMed=+srec?.mvt_media_stagione, fmMed=+srec?.fmt_media_stagione; if(Number.isFinite(mvMed)&&mvMed>thr.mvMed) out.push(`<span class="badge good">MV medio > ${thr.mvMed}</span>`); if(Number.isFinite(fmMed)&&fmMed>thr.fmMed) out.push(`<span class="badge good">FM media > ${thr.fmMed}</span>`);
  let aff24 = Number(p24?.aff); if(Number.isFinite(aff24)){ if(aff24>1) aff24/=100; if(aff24>0.66) out.push('<span class="badge good">Aff 2024 > 66%</span>'); }
  const affMed = Number(srec?.aff_media_stagione); if(Number.isFinite(affMed) && affMed>0.66) out.push('<span class="badge good">Aff media > 66%</span>');
  wrap.innerHTML=out.join(' ') }

// ===== Expandable (card Nascoste) =====
document.addEventListener('click', (e)=>{ const h3 = e.target.closest('.expandable h3'); if(h3){ const card=h3.closest('.expandable'); card?.classList.toggle('collapsed'); }});

// ===== Player selection =====
async function selectPlayer(cod, idx){
  $('#playerSection').classList.remove('hidden');
  const role=(idx?.ruolo_2025||'').toUpperCase().trim(); const roleKnown=['P','D','C','A'].includes(role);
  $('#playerName').textContent = idx?.nome || 'Giocatore'; setPlayerPhoto(normCod(cod));
  $('#playerMeta').innerHTML = `<span class="${roleKnown?`chip chip--role role--${role}`:'badge'}">${escapeHtml(role||'—')}</span><span class="badge">${escapeHtml(idx?.squadra_2025||'—')}</span>`;
  $('#playerBadges').innerHTML=''; $('#results').innerHTML=''; hideResults();
  $('#card2025').innerHTML='<span class=spinner aria-label=caricamento></span>';
  $('#card2024').innerHTML='<span class=spinner aria-label=caricamento></span>';
  $('#cardStorico').innerHTML='<span class=spinner aria-label=caricamento></span>';
  $('#cardHidden').innerHTML='<span class=spinner aria-label=caricamento></span>';
  await ensureYear(2025); await ensureYear(2024);
  const codN=normCod(cod); const rec25=map2025? map2025.get(codN) : null;

  const wrap25=$('#wrap2025'); wrap25?.classList.remove('card--attention');
  if(rec25){ const rf=(rec25?.r||role||'').toUpperCase().trim(); let main25; if(rf==='P'){ main25=['r','sq','p','mvt','fmt','mvc','mvf','fmc','fmf','aff','gs','gsr','as','a','e'] } else { main25=['r','sq','p','mvt','fmt','mvc','mvf','fmc','fmf','aff','gf','as','a','e'] } const parts=[]; parts.push(listKVctx(rec25,main25,'2025')); if(rec25.cambio_squadra===true||rec25.cambio_ruolo===true){ wrap25?.classList.add('card--attention') } $('#card2025').innerHTML=parts.join('') } else { $('#card2025').innerHTML='<div class=small>Giocatore non trovato nel 2025.json</div>' }

  let p24=null; if(data2024){ const m24=indexByCOD(data2024); p24=m24.get(codN) }
  if (p24) {
  const r24 = (p24?.r || role || '').toUpperCase().trim();
  let main24;
  if (r24 === 'P') {
    main24 = ['r','sq','aff','p','mvt','fmt','gs','gsr','rp','as','ag','a','e'];
  } else {
    main24 = ['r','sq','aff','p','mvt','fmt','gf','gfr','rs','as','ag','a','e'];
  }

  // Render standard 2024
  $('#card2024').innerHTML = listKVctx(p24, main24, '2024');

  // === NUOVO: percentile & z-score nel ruolo (2024) + badge Top 10% ===
  const fmStats24 = computeRoleStats2024('fmt', p24?.fmt, r24);
  const mvStats24 = computeRoleStats2024('mvt', p24?.mvt, r24);

  // Sezione "Posizione nel ruolo (2024)"
  let rankHTML = '';
  if (fmStats24 || mvStats24) {
    rankHTML += '<h4 class="sect">Posizione nel ruolo (2024)</h4>';
    if (fmStats24) {
      rankHTML += rowSimple('FM 2024 – Percentile', fmtPercent01(fmStats24.pct));
      rankHTML += rowSimple('FM 2024 – Z\u200a-score', fmStats24.z);
    }
    if (mvStats24) {
      rankHTML += rowSimple('MV 2024 – Percentile', fmtPercent01(mvStats24.pct));
      rankHTML += rowSimple('MV 2024 – Z\u200a-score', mvStats24.z);
    }
    $('#card2024').innerHTML += rankHTML;
  }

  // Badge accanto al nome se Top 10% in almeno una metrica
  const _metaEl = $('#playerMeta');
  if (_metaEl) {
    const _tops = [];
    if (fmStats24?.pct >= 0.90) _tops.push(`FM 2024 ${fmtPercent01(fmStats24.pct)}`);
    if (mvStats24?.pct >= 0.90) _tops.push(`MV 2024 ${fmtPercent01(mvStats24.pct)}`);
    if (_tops.length) {
      _metaEl.insertAdjacentHTML(
        'beforeend',
        `<span class="badge good" title="${escapeHtml(_tops.join(' · '))}">Top 10% nel ruolo</span>`
      );
    }
  }
} else {
  $('#card2024').innerHTML = '<div class=small>Dati 2024 non disponibili.</div>';
}


  let srec=null; try{ if(!storico){ storico=await fetchJSON('storico.json') } srec=(storico||[]).find(x=>normCod(x.cod)===codN); if(srec){
      const groups=getGroups();
      const {DATI_STAT, PER_PRES, FUTURES} = storicoSectionOrder();
      const part0rows = DATI_STAT.filter(k=> (k in srec) && !HIDE_STORICO.has(k)).map(k=> rowKVctx(LABELS_STORICO[k]||k, srec[k], k, 'storico')).join('');
      const part1rows = groups.perPres ? PER_PRES.filter(k=> (k in srec) && !HIDE_STORICO.has(k)).map(k=> rowKVctx(LABELS_STORICO[k]||k, srec[k], k, 'storico')).join('') : '';
      const part2rows = groups.futures ? FUTURES.filter(k=> (k in srec) && !HIDE_STORICO.has(k)).map(k=> rowKVctx(LABELS_STORICO[k]||k, srec[k], k, 'storico')).join('') : '';
      const part0 = part0rows? `<h4 class=\"sect\" title=\"${escapeHtml(SECT_TIPS.dati)}\">Dati statistici</h4>${part0rows}` : '';
      const part1 = part1rows? `<h4 class=\"sect\" title=\"${escapeHtml(SECT_TIPS.perPres)}\">Statistiche per presenza</h4>${part1rows}` : '';
      const part2 = part2rows? `<h4 class=\"sect\" title=\"${escapeHtml(SECT_TIPS.futures)}\">Futures</h4>${part2rows}` : '';
      $('#cardStorico').innerHTML = part0 + part1 + part2 || '<div class=small>Nessun dato storico da mostrare.</div>';

      // Nascoste = gruppi spenti
      let hiddenRows='';
      if(!groups.perPres){ hiddenRows += PER_PRES.filter(k=> (k in srec)&&!HIDE_STORICO.has(k)).map(k=> rowKVctx(LABELS_STORICO[k]||k, srec[k], k, 'storico')).join('') }
      if(!groups.futures){ hiddenRows += FUTURES.filter(k=> (k in srec)&&!HIDE_STORICO.has(k)).map(k=> rowKVctx(LABELS_STORICO[k]||k, srec[k], k, 'storico')).join('') }
      $('#cardHidden').innerHTML = hiddenRows || '<div class=small>Nessun campo nascosto.</div>';
    } else { $('#cardStorico').innerHTML=`<div class=small>Nessun dato storico disponibile.</div>`; $('#cardHidden').innerHTML='<div class=small>Nessun dato storico disponibile.</div>'; }
  }catch(e){ $('#cardStorico').innerHTML='<div class=small>Storico non disponibile.</div>'; $('#cardHidden').innerHTML=''; console.warn('Errore storico.json',e) }

  addTopBadges(rec25,p24,srec);
}
// ===== Role stats 2024 (percentile & z-score) =====
function computeRoleStats2024(metric, value, role){
  try{
    const v = Number(value);
    const r = (role??'').toUpperCase();
    if(!data2024 || !Number.isFinite(v) || !r) return null;

    // Prendiamo tutti i valori della metrica nel medesimo ruolo dalla tabella 2024
    const vals = data2024
      .filter(rec => ((rec.r ?? rec.role ?? '').toUpperCase() === r))
      .map(rec => Number(rec[metric]))
      .filter(n => Number.isFinite(n))
      .sort((a,b)=>a-b);

    const N = vals.length;
    if(!N) return null;

    // Media e dev. standard (popolazione) per z-score
    const mean = vals.reduce((a,b)=>a+b,0)/N;
    const variance = vals.reduce((a,b)=>a + Math.pow(b-mean,2),0)/N;
    const std = Math.sqrt(variance);

    // Percentile midrank: gestisce i pari valorizzando a metà dell'intervallo
    const eps = 1e-9;
    let less=0, equal=0;
    for(const x of vals){
      if(x < v - eps) less++;
      else if(Math.abs(x - v) <= eps) equal++;
    }
    const pct = (less + 0.5*equal)/N; // 0..1
    const z = std>0 ? (v - mean)/std : 0;

    return {pct, z, N, mean, std};
  }catch{ return null; }
}

function rowSimple(label, value){
  const display = (typeof value === 'number') ? fmtValue(value) : String(value);
  return `<div class="row"><span class="key">${escapeHtml(label)}</span><span class="val">${display}</span></div>`;
}

// ===== Shortcuts =====
document.addEventListener('keydown', e=>{ if((e.ctrlKey||e.metaKey)&&(e.key==='q'||e.key==='Q')){ const el=$('#searchInput'); if(el){ e.preventDefault(); el.focus(); el.select?.(); showResults() } } });

// ===== Init =====
(async function init(){ try{ await loadIndex() }catch(e){ console.warn(e) } setupTheme(); setupToggles(); buildOptionsUI(); })();
