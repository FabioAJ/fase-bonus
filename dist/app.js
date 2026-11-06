const {opportunities,sources}=window.RADAR;
const apps=window.APPLICATIONS;
const $=id=>document.getElementById(id);
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const state={scope:'current',favorite:false,searching:false};
let favorites=new Set();
try{const a=JSON.parse(localStorage.getItem('radar-games-favorites')||'[]');if(Array.isArray(a))favorites=new Set(a.filter(id=>apps[id]));}catch{}
const categories=[['current','Chamadas e canais abertos'],['watch','Em acompanhamento'],['closed','Encerrados'],['all','Todas']];
const badge=(text,tone='gray')=>`<span class="status ${tone}"><span aria-hidden="true"></span>${esc(text)}</span>`;
const todayParts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
const todayISO=['year','month','day'].map(k=>todayParts.find(p=>p.type===k).value).join('-');
const categoryOf=o=>apps[o.id].category==='current'&&(apps[o.id].closeAt?Date.now()>Date.parse(apps[o.id].closeAt):apps[o.id].closeDate&&apps[o.id].closeDate<todayISO)?'closed':apps[o.id].category;
const profileLabel=a=>({not_required:'Inscrição possível como pessoa física',pitch_only:'Pitch individual; contrato a confirmar',required:'Exige CNPJ na inscrição',later:'Empresa exigida na etapa posterior',unknown:'Condição de CNPJ a confirmar'}[a.cnpj]||'Condição de CNPJ a confirmar');
function matches(o){
 const a=apps[o.id],q=norm($('search').value),filters=window.RADAR_FILTERS;
 return (state.scope==='all'||categoryOf(o)===state.scope)&&(!state.favorite||favorites.has(o.id))
 &&(!$('region').value||($('region').value==='Brasil'?o.region==='Brasil':o.region!=='Brasil'))
 &&filters.matchesState(a,$('uf').value)&&filters.matchesCnpj(a,$('cnpj').value)
 &&(!$('topic').value||a.tags.includes($('topic').value))
 &&(!q||norm([o.name,o.org,...o.requirements,...o.gaps,a.eligibility,a.deadline,a.territoryLabel,...a.tags].join(' ')).includes(q));
}
function cardHTML(o){const a=apps[o.id];return `<article class="dossier" aria-labelledby="title-${o.id}"><div class="dossier-top"><span class="dossier-kind">${esc(a.stage)}</span><div class="dossier-top-actions"><a class="button primary top-source" href="${esc(a.docsUrl||a.sourceUrl)}" target="_blank" rel="noopener noreferrer">${a.docsUrl?'Ler edital (PDF)':'Abrir fonte'}</a><button data-favorite="${o.id}" class="save-button ${favorites.has(o.id)?'saved':''}" aria-pressed="${favorites.has(o.id)}" aria-label="${favorites.has(o.id)?'Remover dos':'Adicionar aos'} favoritos: ${esc(a.short)}">${favorites.has(o.id)?'★ Salvo':'☆ Salvar'}</button></div></div>
 <h2 id="title-${o.id}">${esc(a.short)}</h2><p class="dossier-org">${esc(a.host)}</p><p class="territory-info"><strong>Abrangência:</strong> ${esc(a.territoryLabel)}</p><div class="profile-fit"><strong>${esc(profileLabel(a))}</strong>${a.profileNote?`<p>${esc(a.profileNote)}</p>`:''}</div>
 <div class="participation ${a.tone}"><h3>${esc(a.verdict)}</h3></div>
 <dl class="key-facts"><div><dt>Prazo para participar</dt><dd>${esc(categoryOf(o)==='closed'&&a.category==='current'?'Prazo encerrado':a.deadline)}</dd><p>${esc(a.deadlineDetail)}</p></div><div><dt>Apoio por projeto</dt><dd>${esc(a.support)}</dd><p>${esc(a.supportDetail)}</p></div></dl>
 <section class="dossier-section"><h3>Quem pode participar</h3><ul class="requirements">${o.requirements.map(r=>`<li>${esc(r)}</li>`).join('')}</ul><div class="field-row"><span>Contrapartida / custos</span><strong>${esc(a.cost)}</strong></div></section>
 <section class="dossier-section"><h3>O que preparar para a inscrição</h3><ul class="document-list">${a.deliverables.map(d=>`<li><span class="doc-icon ${d.state}" aria-hidden="true">${d.state==='unknown'?'?':d.state==='historical'?'◷':'✓'}</span><div><p>${esc(d.text)}</p><small>${d.state==='unknown'?'Não confirmado no levantamento':d.state==='historical'?'Referência da edição passada':'Informado na fonte'}</small></div></li>`).join('')}</ul><p class="documentation-note">Esta é uma síntese do levantamento, não a lista completa de anexos exigidos.</p></section>
 <section class="dossier-section"><h3>O que pode impedir a participação</h3><ul class="blockers">${a.blockers.map(b=>`<li>${esc(b)}</li>`).join('')}</ul></section>
 <section class="dossier-section how-to"><h3>Como avançar</h3><p>${esc(a.how)}</p>${a.reason?`<p class="analysis-note">${esc(a.reason)}</p>`:''}<div class="dossier-actions"><a class="button primary" href="${esc(a.docsUrl||a.sourceUrl)}" target="_blank" rel="noopener noreferrer">${a.docsUrl?'Ler edital completo (PDF)':esc(a.action)} <svg width="15" height="15" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4h9v9M16 4 5 15M4 7v9h9"/></svg></a>${a.docsUrl?`<a class="text-link" href="${esc(a.sourceUrl)}" target="_blank" rel="noopener noreferrer">Orientações de candidatura</a>`:''}</div></section>
 <details class="evidence"><summary>Fonte, pendências e verificação</summary><p><strong>${esc(a.sourceLabel)}</strong></p><p>${esc(a.evidenceNote)}</p><ul>${o.gaps.map(g=>`<li>${esc(g)}</li>`).join('')}</ul><a href="${esc(o.url)}" target="_blank" rel="noopener noreferrer">Consultar fonte do levantamento</a></details>
 <div class="dossier-footer"><span>Pesquisa: 05/11/2026</span><span>${esc(a.profileFit==='possible'?'Outros requisitos do projeto a confirmar':'Enquadramento pendente ou com restrições')}</span></div></article>`;}
function render(){
 const list=opportunities.filter(matches),focused=document.activeElement?.dataset?.favorite;
 $('listHeading').textContent=categories.find(([key])=>key===state.scope)[1];
 $('resultCount').textContent=`${list.length} ${list.length===1?'ficha':'fichas'}`;
 $('exportPdf').disabled=list.length===0;
 $('scopeButtons').innerHTML=categories.map(([value,label])=>`<button data-scope="${value}" aria-pressed="${state.scope===value}" class="scope-button ${state.scope===value?'active':''}">${label}<span>${value==='all'?opportunities.length:opportunities.filter(o=>categoryOf(o)===value).length}</span></button>`).join('');
 $('favoriteCount').textContent=favorites.size;$('favoriteFilter').setAttribute('aria-pressed',String(state.favorite));$('favoriteFilter').classList.toggle('active',state.favorite);
 $('clearFilters').hidden=!($('search').value||$('region').value||$('uf').value||$('topic').value||$('cnpj').value||state.favorite||state.scope!=='current');
 $('cards').innerHTML=list.length?list.map(cardHTML).join(''):'<div class="empty"><h3>Nenhuma ficha encontrada</h3><p>Tente “Todas” ou remova os filtros.</p><button class="button secondary" data-reset>Limpar filtros</button></div>';
 if(focused)(document.querySelector(`[data-favorite="${CSS.escape(focused)}"]`)||$('favoriteFilter')).focus({preventScroll:true});
}
$('exportPdf').addEventListener('click',async()=>{
 const list=opportunities.filter(matches);
 if(!list.length)return toast('Nenhuma ficha para exportar. Ajuste os filtros.');
 const button=$('exportPdf');button.disabled=true;button.textContent='Gerando PDF…';
 try{
  const selected=id=>$(id).selectedOptions[0].textContent;
  const filters=[categories.find(([key])=>key===state.scope)[1],`Território: ${selected('region')}`,`Estado: ${selected('uf')}`,`CNPJ na inscrição: ${selected('cnpj')}`,`Tema: ${selected('topic')}`,state.favorite?'Somente favoritos':'', $('search').value?`Busca: ${$('search').value}`:''].filter(Boolean);
  const pdf=window.RADAR_PDF.build({opportunities:list,apps,checked:window.RADAR.checked,horizon:window.RADAR.horizon,filters,categoryOf,profileLabel});
  await pdf.save(`radar-games-${todayISO}-${list.length}-fichas.pdf`,{returnPromise:true});
  toast(`PDF gerado com ${list.length} ${list.length===1?'ficha':'fichas'}. Confira os downloads.`);
 }catch(error){console.error('Falha na exportação PDF',error);toast('Não foi possível gerar o PDF. Recarregue a página e tente novamente.');}
 finally{button.textContent='Exportar PDF';button.disabled=opportunities.filter(matches).length===0;}
});
function reset(){state.scope='all';state.favorite=false;state.searching=false;$('search').value='';$('region').value='';$('uf').value='';$('topic').value='';$('cnpj').value='';render();}
function route(){const hash=location.hash.slice(1),panel=hash==='fontes'?'sources':hash==='plano'?'plan':'opportunities';document.querySelectorAll('.panel').forEach(p=>p.hidden=p.id!==panel);document.querySelectorAll('[data-panel]').forEach(a=>{const active=a.dataset.panel===panel;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});requestAnimationFrame(()=>{document.documentElement.scrollTop=0;document.body.scrollTop=0;});}
$('scopeButtons').addEventListener('click',e=>{const b=e.target.closest('[data-scope]');if(b){state.scope=b.dataset.scope;render();document.querySelector(`[data-scope="${state.scope}"]`).focus({preventScroll:true});}});
$('cards').addEventListener('click',e=>{if(e.target.closest('[data-reset]'))return reset();const b=e.target.closest('[data-favorite]');if(!b)return;const id=b.dataset.favorite;favorites.has(id)?favorites.delete(id):favorites.add(id);try{localStorage.setItem('radar-games-favorites',JSON.stringify([...favorites]));}catch{toast('Favoritos disponíveis nesta sessão.');}render();});
$('search').addEventListener('input',()=>{const active=!!$('search').value.trim();if(active&&!state.searching)state.scope='all';state.searching=active;render();});$('region').addEventListener('change',()=>{if($('region').value==='international')$('uf').value='';render();});$('uf').addEventListener('change',()=>{if($('uf').value)$('region').value='Brasil';render();});$('cnpj').addEventListener('change',render);$('topic').addEventListener('change',render);$('clearFilters').addEventListener('click',reset);$('favoriteFilter').addEventListener('click',()=>{state.favorite=!state.favorite;render();});
$('uf').innerHTML='<option value="">Todos os estados</option>'+window.RADAR_FILTERS.states.map(([uf,name])=>`<option value="${uf}">${esc(name)} (${uf})</option>`).join('');
$('topic').innerHTML='<option value="">Todos os temas</option>'+[...new Set(Object.values(apps).flatMap(a=>a.tags))].sort((a,b)=>a.localeCompare(b,'pt-BR')).map(t=>`<option>${esc(t)}</option>`).join('');
const health=window.COLLECTION||{sources:[],mode:'manual',scheduled:false};
const readableTime=t=>t?new Date(t).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}):'Ainda não executada';
$('collectionSummary').innerHTML=`<strong>${health.successCount||0} de ${sources.length} fontes consultadas com sucesso</strong><p>Última execução manual: ${esc(readableTime(health.lastRun))}. ${health.errorCount||0} fontes com falha. ${health.candidateCount||0} links de documentos e possíveis chamadas aguardam revisão; não são inscrições confirmadas.</p><p>O coletor pode ser executado sob demanda. Não existe agendamento ativo.</p>`;
$('sourceCards').innerHTML=sources.map(s=>{const h=health.sources?.find(x=>x.id===s.id);return `<article class="source-card"><div><span class="source-priority">Prioridade ${esc(s.priority.toLowerCase())}</span><span class="muted">${esc(s.cadence)}</span></div><h2>${esc(s.name)}</h2><p>${esc(s.scope)}</p><p class="source-note">${esc(s.note)}</p><div class="source-health ${['error','partial'].includes(h?.status)?'error':'ok'}"><strong>${h?({ok:'Consulta concluída',unchanged:'Sem alteração de conteúdo',cached:'Consulta em cache',error:'Falha de acesso',partial:'Coleta parcial: anexo pendente'}[h.status]||h.status):'Ainda não consultada pelo coletor'}</strong><p>${h?.lastSuccess?'Último acesso bem-sucedido: '+esc(readableTime(h.lastSuccess)):''}${h?.error?esc(h.error):''}</p></div><a class="text-link" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Abrir portal</a></article>`;}).join('');
let toastTimer;function toast(msg){$('toast').textContent=msg;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3200);}
$('copyGoal').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('goalText').textContent);toast('Plano copiado. Nenhum goal foi iniciado.');}catch{toast('Selecione o texto para copiar.');}});
$('exportBtn').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({research_date:window.RADAR.checked,horizon:window.RADAR.horizon,automatic_collection:false,collection:window.COLLECTION,opportunities:opportunities.map(o=>({...o,application:apps[o.id],favorite:favorites.has(o.id)})),sources},null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='radar-games-inscricoes.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Pesquisa exportada com as fichas de inscrição.');});
document.querySelectorAll('[data-panel],.brand').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();history.pushState(null,'',a.getAttribute('href'));route();}));window.addEventListener('popstate',route);window.addEventListener('hashchange',route);route();render();
