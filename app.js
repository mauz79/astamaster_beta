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

const HIDE_STORICO = new Set([
  'aff_2024','fmand_2024','fmt_2024','mvand_2024','mvt_2024','p_2024','ruolo_2024','oldsq',
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
  aff_media_stagione: "Affidabilità media su ultime 4 stagioni (0–1)",
  gf_media_stagione_norm: "Gol attesi medi (normalizzati)",
  as_media_stagione_norm: "Assist attesi medi (normalizzati)",
  a_media_stagione_norm: "Amm. attese medie",
  e_media_stagione_norm: "Espulsioni attese medie",
  gs_media_stagione_norm: "Gol subiti attesi medi",
  rp_media_stagione_norm: "Rigori parati attesi medi"
};

const $ = sel => document.querySelector(sel);
function fmtValue(v){ if(v===null||v===undefined) return '—'; const n= typeof v==='number'?v:Number(String(v).replace(',','.')); if(!Number.isFinite(n)) return String(v); return Number(n.toFixed(3)).toString(); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&','<':'<','>':'>','"':'"','\'':'&#39;'}[c])); }
function rowKV(label,val,key){ const tip=TOOLTIP[key]||TOOLTIP_STORICO[key]; const t=tip?` title="${escapeHtml(tip)}"`:''; return `<div class="row"><span class="key"${t}>${label}</span><span class="val">${fmtValue(val)}</span></div>` }
function listKV(obj,keys){ return keys.filter(k=>k in obj).map(k=>rowKV(LABELS[k]||k,obj[k],k)).join('') }
async function fetchJSON(f){ const r=await fetch(DATA_BASE+f,{cache:'no-store'}); if(!r.ok) throw new Error('Impossibile caricare '+f+' ('+r.status+')'); return r.json() }
function norm(s){return (s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase()}
function highlightMatch(t,q){ const lt=t||'',qq=q||''; const i=lt.toLowerCase().indexOf(qq.toLowerCase()); if(i<0) return escapeHtml(lt); const e=i+qq.length; return escapeHtml(lt.slice(0,i))+'<mark>'+escapeHtml(lt.slice(i,e))+'</mark>'+escapeHtml(lt.slice(e)) }
function normCod(x){ const s=String(x??'').trim(); return /^\d+\.0$/.test(s)? s.slice(0,-2): s }

let INDEX=[], data2025=null, data2024=null, storico=null, map2025=null;
async function loadIndex(){ try{ INDEX=await fetchJSON('index.json') }catch(e){ console.warn('index.json non trovato',e) } }
function hideResults(){ $('#panelResults')?.classList.add('hidden') }
function showResults(){ $('#panelResults')?.classList.remove('hidden') }

const TOGGLE_KEYS={ y2025:'toggle-2025', storico:'toggle-storico' };
function applyToggles(){ const t25=localStorage.getItem(TOGGLE_KEYS.y2025)!=='off'; const ts=localStorage.getItem(TOGGLE_KEYS.storico)!=='off'; $('#wrap2025')?.classList.toggle('hidden',!t25); $('#wrapStorico')?.classList.toggle('hidden',!ts); const cb25=$('#toggle2025'); if(cb25) cb25.checked=t25; const cbs=$('#toggleStorico'); if(cbs) cbs.checked=ts }
function setupToggles(){ $('#toggle2025')?.addEventListener('change',e=>{ localStorage.setItem(TOGGLE_KEYS.y2025, e.target.checked?'on':'off'); applyToggles() }); $('#toggleStorico')?.addEventListener('change',e=>{ localStorage.setItem(TOGGLE_KEYS.storico, e.target.checked?'on':'off'); applyToggles() }); applyToggles() }

const PHOTO_EXTS=['jpg','png','webp'];
function setPlayerPhoto(cod){ const img=$('#playerPhoto'); if(!img) return; let i=0; const next=()=>{ if(i>=PHOTO_EXTS.length){ img.src='img/placeholder.svg'; return } img.src=IMG_BASE+cod+'.'+PHOTO_EXTS[i++] }; img.onerror=()=>next(); next() }

const DEFAULT_THRESHOLDS={ mv2024:6.1, fm2024:6.6, mvMed:6.1, fmMed:6.6 };
const LS_THRESH='astamaster-thresholds';
function getThresholds(){ try{ const t=JSON.parse(localStorage.getItem(LS_THRESH)||'{}'); return { mv2024: +t.mv2024||DEFAULT_THRESHOLDS.mv2024, fm2024: +t.fm2024||DEFAULT_THRESHOLDS.fm2024, mvMed: +t.mvMed||DEFAULT_THRESHOLDS.mvMed, fmMed: +t.fmMed||DEFAULT_THRESHOLDS.fmMed } }catch{ return {...DEFAULT_THRESHOLDS} } }
function saveThresholds(t){ localStorage.setItem(LS_THRESH, JSON.stringify(t)) }

const LS_STO_FIELDS='astamaster-storico-fields-enabled';
function allowedStoricoKeys(){ const all=Object.keys(LABELS_STORICO).filter(k=>!HIDE_STORICO.has(k)); let s; try{s=JSON.parse(localStorage.getItem(LS_STO_FIELDS)||'null')}catch{ s=null } if(Array.isArray(s)&&s.length) return all.filter(k=>s.includes(k)); return all }
function saveStoricoKeys(keys){ localStorage.setItem(LS_STO_FIELDS, JSON.stringify(keys)) }

function buildOptionsUI(){
  const t=getThresholds(); const mv24=$('#opt_mv2024'), fm24=$('#opt_fm2024'), mvm=$('#opt_mvMed'), fmm=$('#opt_fmMed'); if(mv24) mv24.value=t.mv2024; if(fm24) fm24.value=t.fm2024; if(mvm) mvm.value=t.mvMed; if(fmm) fmm.value=t.fmMed; const sync=()=>saveThresholds({ mv2024:parseFloat(mv24.value||t.mv2024), fm2024:parseFloat(fm24.value||t.fm2024), mvMed:parseFloat(mvm.value||t.mvMed), fmMed:parseFloat(fmm.value||t.fmMed) }); [mv24,fm24,mvm,fmm].forEach(i=>i&&i.addEventListener('change',sync));
  const list=$('#storicoFieldsList'); if(!list) return; const all=Object.keys(LABELS_STORICO).filter(k=>!HIDE_STORICO.has(k)); const enabled=new Set(allowedStoricoKeys()); list.innerHTML=''; all.sort((a,b)=>(LABELS_STORICO[a]||a).localeCompare(LABELS_STORICO[b]||b,'it')).forEach(k=>{ const id='fld_'+k; const lab=document.createElement('label'); lab.className='opt-check'; lab.innerHTML=`<input type="checkbox" id="${id}" ${enabled.has(k)?'checked':''} data-key="${k}"> <span>${escapeHtml(LABELS_STORICO[k]||k)}</span>`; list.appendChild(lab) }); const persist=()=>{ const keys=Array.from(list.querySelectorAll('input[type="checkbox"]')).filter(i=>i.checked).map(i=>i.dataset.key); saveStoricoKeys(keys) }; list.addEventListener('change',persist); $('#btnAll')?.addEventListener('click',()=>{ list.querySelectorAll('input[type="checkbox"]').forEach(i=>i.checked=true); persist() }); $('#btnNone')?.addEventListener('click',()=>{ list.querySelectorAll('input[type="checkbox"]').forEach(i=>i.checked=false); persist() })
}

function addTopBadges(rec25,p24,srec){ const wrap=$('#playerBadges'); if(!wrap) return; const out=[]; const thr=getThresholds(); if(rec25?.cambio_ruolo===true) out.push('<span class="badge warn">Cambio Ruolo</span>'); const isCambioSq=rec25?.cambio_squadra===true; const isNew=(srec?.oldsq&&String(srec.oldsq).toLowerCase()==='new'); if(isNew) out.push('<span class="badge info">Nuovo acquisto</span>'); else if(isCambioSq) out.push('<span class="badge alert">Cambio Squadra</span>'); const mv2024=+p24?.mvt, fm2024=+p24?.fmt; if(Number.isFinite(mv2024)&&mv2024>thr.mv2024) out.push(`<span class="badge good">MV 2024 > ${thr.mv2024}</span>`); if(Number.isFinite(fm2024)&&fm2024>thr.fm2024) out.push(`<span class="badge good">FM 2024 > ${thr.fm2024}</span>`); const mvMed=+srec?.mvt_media_stagione, fmMed=+srec?.fmt_media_stagione; if(Number.isFinite(mvMed)&&mvMed>thr.mvMed) out.push(`<span class="badge good">MV medio > ${thr.mvMed}</span>`); if(Number.isFinite(fmMed)&&fmMed>thr.fmMed) out.push(`<span class="badge good">FM media > ${thr.fmMed}</span>`); wrap.innerHTML=out.join(' ') }

function renderResults(items,q){ const ul=$('#results'); ul.innerHTML=''; items.slice(0,50).forEach(item=>{ const li=document.createElement('li'); li.className='result-item'; li.setAttribute('role','option'); li.tabIndex=0; const title=`<span class=\"result-title\">${highlightMatch(item.nome||'', q)}</span>`; const meta=`<span class=\"result-meta\">${escapeHtml(item.ruolo_2025||'—')} · ${escapeHtml(item.squadra_2025||'—')}</span>`; li.innerHTML=`${title}<span>${meta}</span>`; li.addEventListener('click',()=>selectPlayer(item.cod,item)); li.addEventListener('keypress',(e)=>{if(e.key==='Enter') selectPlayer(item.cod,item)}); ul.appendChild(li) }) }

function search(q){ const nq=norm(q.trim()); if(!nq){ $('#results').innerHTML=''; return } const res=INDEX.filter(x=>norm(x.nome).includes(nq)); renderResults(res,q) }
let debounceTimer; document.getElementById('searchInput').addEventListener('input', e=>{ showResults(); clearTimeout(debounceTimer); const v=e.target.value; debounceTimer=setTimeout(()=>search(v),140) })

async function ensureYear(y){ if(y===2025 && !data2025){ data2025=await fetchJSON('2025.json'); map2025=new Map(data2025.filter(r=>r.cod!=null||r.COD!=null).map(r=>[normCod(r.cod??r.COD), r])) } if(y===2024 && !data2024){ data2024=await fetchJSON('2024.json') } }
function indexByCOD(recs){ const m=new Map(); for(const r of recs){ const cod=(r.cod??r.COD??r.id??r.Id); if(cod!=null) m.set(normCod(cod),r) } return m }

async function selectPlayer(cod, idx){
  $('#playerSection').classList.remove('hidden');
  const role=(idx?.ruolo_2025||'').toUpperCase().trim(); const roleKnown=['P','D','C','A'].includes(role);
  $('#playerName').textContent = idx?.nome || 'Giocatore'; setPlayerPhoto(normCod(cod));
  $('#playerMeta').innerHTML = `<span class="${roleKnown?`chip chip--role role--${role}`:'badge'}">${escapeHtml(role||'—')}</span><span class="badge">${escapeHtml(idx?.squadra_2025||'—')}</span>`;
  $('#playerBadges').innerHTML=''; $('#results').innerHTML=''; hideResults();
  $('#card2025').innerHTML='<span class=spinner aria-label=caricamento></span>';
  $('#card2024').innerHTML='<span class=spinner aria-label=caricamento></span>';
  $('#cardStorico').innerHTML='<span class=spinner aria-label=caricamento></span>';
  await ensureYear(2025); await ensureYear(2024);
  const codN=normCod(cod); const rec25=map2025? map2025.get(codN) : null;
  const wrap25=$('#wrap2025'); wrap25?.classList.remove('card--attention');
  if(rec25){ const rf=(rec25?.r||role||'').toUpperCase().trim(); let main25; if(rf==='P'){ main25=['r','sq','p','mvt','fmt','mvc','mvf','fmc','fmf','aff','gs','gsr','as','a','e'] } else { main25=['r','sq','p','mvt','fmt','mvc','mvf','fmc','fmf','aff','gf','as','a','e'] } const parts=[]; parts.push(listKV(rec25,main25)); if(rec25.cambio_squadra===true||rec25.cambio_ruolo===true){ wrap25?.classList.add('card--attention') } $('#card2025').innerHTML=parts.join('') } else { $('#card2025').innerHTML='<div class=small>Giocatore non trovato nel 2025.json</div>' }
  let p24=null; if(data2024){ const m24=indexByCOD(data2024); p24=m24.get(codN) }
  if(p24){ const r24=(p24?.r||role||'').toUpperCase().trim(); let main24; if(r24==='P'){ main24=['r','sq','aff','p','mvt','fmt','gs','gsr','as','a','e'] } else { main24=['r','sq','aff','p','mvt','fmt','gf','gfr','as','a','e'] } $('#card2024').innerHTML=listKV(p24,main24) } else { $('#card2024').innerHTML='<div class=small>Dati 2024 non disponibili.</div>' }
  let srec=null; try{ if(!storico){ storico=await fetchJSON('storico.json') } const total=Array.isArray(storico)?storico.length:0; srec=(storico||[]).find(x=>normCod(x.cod)===codN); if(srec){ const enabled=new Set(allowedStoricoKeys()); const fields=Object.keys(srec).filter(k=>k!=='cod' && k!=='stagioni_considerate' && !HIDE_STORICO.has(k) && enabled.has(k)).sort(); const rows=fields.map(k=>rowKV(LABELS_STORICO[k]||LABELS[k]||k,srec[k],k)).join(''); const header=Array.isArray(srec.stagioni_considerate)? `<div class=\"small\">Stagioni: ${srec.stagioni_considerate.join(', ')}</div>`:''; $('#cardStorico').innerHTML=header+rows } else { $('#cardStorico').innerHTML=`<div class=small>Nessun dato storico per COD ${escapeHtml(codN)}.</div>` } }catch(e){ $('#cardStorico').innerHTML='<div class=small>Storico non disponibile.</div>'; console.warn('Errore storico.json',e) }
  addTopBadges(rec25,p24,srec);
}

document.addEventListener('keydown', e=>{ if((e.ctrlKey||e.metaKey)&&(e.key==='k'||e.key==='K')){ const el=$('#searchInput'); if(el){ e.preventDefault(); el.focus(); el.select?.(); showResults() } } });

(async function init(){ try{ await loadIndex() }catch(e){ console.warn(e) } setupToggles(); buildOptionsUI(); })();
