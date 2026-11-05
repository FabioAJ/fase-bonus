/* Curadoria estática. Nenhuma chamada de coleta é feita ao abrir esta página. */
const {opportunities, sources} = window.RADAR;
const $ = id => document.getElementById(id);
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
let favorites = new Set();
try { const saved = JSON.parse(localStorage.getItem('radar-games-favorites') || '[]'); if (Array.isArray(saved)) favorites = new Set(saved.filter(id => opportunities.some(o => o.id === id))); } catch {}
const current = o => ['een','media'].includes(o.id);
const tone = o => o.decision === 'Explorar' ? 'explore' : o.decision === 'Não priorizar' ? 'skip' : 'watch';
function showPanel(name){
  if (!['opportunities','sources','plan'].includes(name)) name='opportunities';
  document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==name);
  document.querySelectorAll('.tab').forEach(t=>{const active=t.dataset.panel===name;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active));});
}
function route(){showPanel(location.hash==='#plano'?'plan':location.hash==='#fontes'?'sources':'opportunities');}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{location.hash={plan:'plano',sources:'fontes',opportunities:'oportunidades'}[t.dataset.panel];}));
window.addEventListener('hashchange',route);route();
function render(){
  const q=normalize($('search').value), status=$('status').value, decision=$('decision').value;
  const list=opportunities.filter(o=>(!q||normalize([o.name,o.org,o.summary,o.type,...o.requirements].join(' ')).includes(q))&&(!status||(status==='current'?current(o):!current(o)))&&(!decision||o.decision===decision)&&(!$('onlyFav').checked||favorites.has(o.id)));
  $('resultCount').textContent=`${list.length} de ${opportunities.length} fichas`;
  $('cards').innerHTML=list.length?list.map(o=>`<article class="card"><div class="card-top"><span class="tag ${tone(o)}">${esc(o.decision)}</span><button class="fav ${favorites.has(o.id)?'selected':''}" data-favorite="${o.id}" aria-label="${favorites.has(o.id)?'Remover dos':'Adicionar aos'} favoritos: ${esc(o.name)}" aria-pressed="${favorites.has(o.id)}">${favorites.has(o.id)?'★':'☆'}</button></div><p class="org">${esc(o.org)}</p><h3>${esc(o.name)}</h3><p class="summary">${esc(o.summary)}</p><div class="facts"><div><span class="fact-label">Situação</span><span class="fact-value">${esc(o.status)}</span></div><div><span class="fact-label">Prazo / calendário</span><span class="fact-value">${esc(o.dateLabel)}</span></div><div><span class="fact-label">Modalidade</span><span class="fact-value">${esc(o.type)}</span></div><div><span class="fact-label">Território</span><span class="fact-value">${esc(o.region)}</span></div></div><div class="verdict"><strong>Vale a pena?</strong>${esc(o.judgment)}</div><div class="card-bottom"><button class="details-btn" data-detail="${o.id}">Ver requisitos e análise ↗</button><small>${o.requirements.length} requisitos mapeados</small></div></article>`).join(''):'<div class="empty">Nenhuma ficha com esses filtros. Ajuste a busca ou desmarque “Só favoritos”.</div>';
}
['search','status','decision','onlyFav'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',render));
$('cards').addEventListener('click',e=>{
  const fav=e.target.closest('[data-favorite]');
  if(fav){const id=fav.dataset.favorite;favorites.has(id)?favorites.delete(id):favorites.add(id);try{localStorage.setItem('radar-games-favorites',JSON.stringify([...favorites]));}catch{toast('Favoritos disponíveis só nesta sessão: armazenamento indisponível.');}render();return;}
  const btn=e.target.closest('[data-detail]');if(btn)openDetail(btn.dataset.detail);
});
function openDetail(id){
  const o=opportunities.find(item=>item.id===id);if(!o)return;
  const list=items=>'<ul>'+items.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>';
  $('detailBody').innerHTML=`<span class="tag ${tone(o)}">${esc(o.decision)}</span><h2>${esc(o.name)}</h2><p class="org">${esc(o.org)} · ${esc(o.region)}</p><p>${esc(o.summary)}</p><div class="detail-callout"><p><strong>${esc(o.status)}</strong><br>${esc(o.dateLabel)}. ${esc(o.horizon)}</p></div><h3>Requisitos conhecidos</h3>${list(o.requirements)}<h3>O que falta confirmar</h3>${list(o.gaps)}<h3>Recursos e modalidade</h3><p>${esc(o.money)} · ${esc(o.type)}.</p><h3>Nosso julgamento</h3><p>${esc(o.judgment)}</p><h3>Próximo passo recomendado</h3><p>${esc(o.next)}</p><h3>Evidência e limites da pesquisa</h3><p>${esc(o.evidence)}</p><p class="quality">${esc(o.quality)} · Registro da pesquisa em 05/11/2026. Síntese do levantamento, sujeita ao edital integral e retificações.</p><a class="detail-source" target="_blank" rel="noopener noreferrer" href="${esc(o.url)}">Consultar ${esc(o.source)} ↗</a>`;
  $('detail').showModal();
}
$('closeDetail').addEventListener('click',()=>$('detail').close());
$('detail').addEventListener('click',e=>{if(e.target===$('detail')){const r=$('detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('detail').close();}});
$('sourceCards').innerHTML=sources.map(s=>`<article class="source-card"><span class="tag ${s.priority==='Alta'?'explore':'watch'}">Prioridade ${esc(s.priority.toLowerCase())}</span><span class="cadence">Proposta: ${esc(s.cadence.toLowerCase())}</span><h3>${esc(s.name)}</h3><p>${esc(s.scope)}</p><span class="fact-label">Onde coletar</span><span class="fact-value">${esc(s.method)}</span><p class="source-note">${esc(s.note)}</p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Abrir fonte ↗</a></article>`).join('');
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
$('copyGoal').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('goalText').textContent);toast('Brief copiado. Nenhum goal foi iniciado.');}catch{toast('Selecione o texto do brief para copiar.');}});
$('exportBtn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({research_date:window.RADAR.checked,horizon:window.RADAR.horizon,automatic_collection:false,opportunities:opportunities.map(o=>({...o,favorite:favorites.has(o.id)})),sources},null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='radar-games-2026-11-05.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Exportação das seis fichas e oito fontes preparada.');
});
render();
