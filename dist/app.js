const {opportunities, sources} = window.RADAR;
const apps = window.APPLICATIONS;
const F = window.RADAR_FILTERS;
const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const STORAGE_KEY = 'radar-games-favorites'; // nome antigo mantido para não perder os favoritos já salvos
const SELECTS = {pays: 'paga', modality: 'modalidade', oppType: 'tipo', gameFocus: 'jogo', cnpj: 'cnpj', region: 'regiao', uf: 'uf', topic: 'tema'};
const SCOPES = [['current', 'Abertas agora'], ['watch', 'Para acompanhar'], ['closed', 'Encerradas'], ['all', 'Todas']];
const PRESETS = [
  {key: 'pays', value: 'cash', label: 'Pagam em dinheiro'},
  {key: 'oppType', value: 'empresa', label: 'Desafios de empresa'},
  {key: 'gameFocus', value: 'serio', label: 'Jogos sérios'},
  {key: 'gameFocus', value: 'autoral', label: 'Jogos comerciais'},
  {key: 'cnpj', value: 'no', label: 'Sem CNPJ'},
  {key: 'soon', value: true, label: 'Fecham em 30 dias'}
];
const state = {scope: 'current', favorite: false, soon: false, explicit: false, sort: 'deadline', open: null};

let favorites = new Set();
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (Array.isArray(saved)) favorites = new Set(saved.filter(id => apps[id]));
} catch {}

const categoryOf = o => F.categoryOf(apps[o.id]);
const brDate = iso => iso ? iso.slice(0, 10).split('-').reverse().join('/') : '';
const isNew = a => a.addedAt && a.addedAt === window.RADAR.checked;
const modalityLabels = a => a.modality.map(m => F.modalities[m]);
const cnpjLabel = a => ({
  not_required: 'Aceita pessoa física',
  pitch_only: 'Pitch individual; contrato a confirmar',
  required: 'Exige CNPJ na inscrição',
  later: 'Empresa exigida em etapa posterior',
  unknown: 'CNPJ a confirmar'
}[a.cnpj] || 'CNPJ a confirmar');

function searchText(o) {
  const a = apps[o.id];
  return [o.name, o.org, o.type, ...o.requirements, ...o.gaps, a.eligibility, a.deadline, a.deadlineDetail, a.support, a.supportDetail,
    a.territoryLabel, a.stage, a.profileNote, ...a.tags, ...a.blockers, a.evidenceNote, F.oppTypes[a.oppType], F.pays[a.pays].label, ...modalityLabels(a),
    ...a.gameFocus.map(g => F.gameFocus[g])].join(' ');
}

/* Todas as condições menos a situação: assim as abas mostram quantas fichas cada uma teria. */
function matchesFilters(o) {
  const a = apps[o.id];
  if (state.favorite && !favorites.has(o.id)) return false;
  if ($('region').value && ($('region').value === 'Brasil') !== (o.region === 'Brasil')) return false;
  if (!F.matchesState(a, $('uf').value) || !F.matchesCnpj(a, $('cnpj').value)) return false;
  if (!F.matchesPays(a, $('pays').value) || !F.matchesModality(a, $('modality').value) || !F.matchesOppType(a, $('oppType').value) || !F.matchesGameFocus(a, $('gameFocus').value)) return false;
  if ($('topic').value && !a.tags.includes($('topic').value)) return false;
  if (state.explicit && !a.explicitGames) return false;
  if (state.soon) {
    const days = F.daysUntil(a);
    if (days === null || days < 0 || days > 30) return false;
  }
  return F.matchesText(searchText(o), $('search').value);
}
const inScope = o => state.scope === 'all' || categoryOf(o) === state.scope;

function sorted(list) {
  const byDeadline = (x, y) => F.compareDeadline(apps[x.id], apps[y.id]);
  const orders = {
    deadline: byDeadline,
    pay: (x, y) => F.comparePay(apps[x.id], apps[y.id]) || byDeadline(x, y),
    new: (x, y) => isNew(apps[y.id]) - isNew(apps[x.id]) || byDeadline(x, y),
    name: (x, y) => apps[x.id].short.localeCompare(apps[y.id].short, 'pt-BR')
  };
  return [...list].sort(orders[state.sort]);
}

function deadlineBadge(a) {
  if (F.categoryOf(a) === 'closed') return '';
  const days = F.daysUntil(a);
  if (days === null || days < 0) return '';
  const text = days === 0 ? 'Fecha hoje' : days === 1 ? 'Fecha amanhã' : `Faltam ${days} dias`;
  return `<span class="badge-time ${days <= 7 ? 'urgent' : days <= 30 ? 'soon' : ''}">${text}</span>`;
}
const deadlineText = o => {
  const a = apps[o.id];
  return categoryOf(o) === 'closed' && a.category === 'current' ? 'Prazo encerrado' : a.deadline;
};

function cardHTML(o) {
  const a = apps[o.id], open = state.open === o.id, saved = favorites.has(o.id), url = a.docsUrl || a.sourceUrl;
  return `<article class="card ${open ? 'open' : ''}" id="ficha-${esc(o.id)}" aria-labelledby="title-${esc(o.id)}">
    <div class="card-top">
      <div class="pills">
        <span class="pay pay-${esc(a.pays)}" title="${esc(F.pays[a.pays].hint)}">${esc(F.pays[a.pays].label)}</span>
        ${modalityLabels(a).filter(label => label !== F.pays[a.pays].label).map(label => `<span class="mode">${esc(label)}</span>`).join('')}
        <span class="pill">${esc(F.oppTypes[a.oppType])}</span>
        ${isNew(a) ? '<span class="pill pill-new">Novo</span>' : ''}
        ${a.explicitGames ? '' : '<span class="pill pill-inferred" title="A fonte não pede jogo nem gamificação: a aderência é uma hipótese a validar">Aderência a validar</span>'}
      </div>
      <button data-favorite="${esc(o.id)}" class="save ${saved ? 'saved' : ''}" aria-pressed="${saved}" aria-label="${saved ? 'Remover dos' : 'Adicionar aos'} favoritos: ${esc(a.short)}">${saved ? '★' : '☆'}</button>
    </div>
    <div class="card-head"><h3 id="title-${esc(o.id)}">${esc(a.short)}</h3><p class="host">${esc(a.host)}</p></div>
    <dl class="facts">
      <div><dt>Prazo</dt><dd>${esc(deadlineText(o))}</dd>${deadlineBadge(a)}</div>
      <div><dt>Apoio</dt><dd>${esc(a.support)}</dd></div>
    </dl>
    <ul class="meta">
      <li>${esc(cnpjLabel(a))}</li>
      <li>${esc(a.territoryLabel)}</li>
      <li>${a.gameFocus.map(g => esc(F.gameFocus[g])).join(' · ')}</li>
      ${a.entryFee === 'paid' ? '<li class="fee">Cobra taxa de inscrição</li>' : a.entryFee === 'free' ? '<li>Inscrição gratuita</li>' : ''}
    </ul>
    <div class="card-actions">
      <button class="button" data-toggle="${esc(o.id)}" aria-expanded="${open}">${open ? 'Fechar ficha' : 'Ver ficha'}</button>
      <a class="button primary" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${a.docsUrl ? 'Ler edital' : 'Abrir fonte'}<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path d="M7 4h9v9M16 4 5 15"/></svg></a>
      ${a.closeDate && categoryOf(o) !== 'closed' ? `<button class="button quiet" data-ics="${esc(o.id)}">Pôr na agenda</button>` : ''}
    </div>
    ${open ? detailHTML(o) : ''}
  </article>`;
}

function detailHTML(o) {
  const a = apps[o.id];
  const docState = {unknown: ['?', 'Não confirmado na pesquisa'], historical: ['◷', 'Referência da edição passada']};
  return `<div class="detail">
    <p class="verdict tone-${esc(a.tone)}">${esc(a.verdict)}${a.profileNote ? `. ${esc(a.profileNote)}` : ''}</p>
    <div class="detail-grid">
      <section><h4>Prazo e apoio</h4><p>${esc(a.deadlineDetail)}</p>${a.supportDetail ? `<p>${esc(a.supportDetail)}</p>` : ''}${a.cost ? `<p class="muted">Custos: ${esc(a.cost)}</p>` : ''}</section>
      <section><h4>Quem pode participar</h4><ul>${o.requirements.map(r => `<li>${esc(r)}</li>`).join('')}</ul></section>
      <section><h4>O que preparar</h4><ul class="docs">${a.deliverables.map(d => {
        const [icon, label] = docState[d.state] || ['✓', 'Informado na fonte'];
        return `<li><span class="doc-icon ${esc(d.state)}" aria-hidden="true">${icon}</span><div>${esc(d.text)}<small>${label}</small></div></li>`;
      }).join('')}</ul></section>
      <section><h4>O que pode impedir</h4><ul class="blockers">${a.blockers.map(b => `<li>${esc(b)}</li>`).join('')}</ul></section>
    </div>
    <details class="evidence"><summary>Fonte e verificação</summary>
      <p><strong>${esc(a.sourceLabel)}</strong>, conferida em ${esc(brDate(a.reviewedAt))}.</p><p>${esc(a.evidenceNote)}</p>
      ${o.gaps.length ? `<ul>${o.gaps.map(g => `<li>${esc(g)}</li>`).join('')}</ul>` : ''}
      <p><a href="${esc(o.url)}" target="_blank" rel="noopener noreferrer">Consultar a fonte da pesquisa</a>${a.docsUrl ? ` · <a href="${esc(a.sourceUrl)}" target="_blank" rel="noopener noreferrer">Página da chamada</a>` : ''}</p>
    </details>
  </div>`;
}

function activeList() {
  const items = [];
  const selectedText = id => $(id).selectedOptions[0].textContent;
  const labels = {pays: 'Paga', modality: 'Modalidade', oppType: 'Tipo', gameFocus: 'Jogo', cnpj: 'CNPJ', region: 'Território', uf: 'Estado', topic: 'Tema'};
  if ($('search').value.trim()) items.push(['search', `Busca: ${$('search').value.trim()}`]);
  for (const id of Object.keys(SELECTS)) if ($(id).value) items.push([id, `${labels[id]}: ${selectedText(id)}`]);
  if (state.explicit) items.push(['explicit', 'Só o que cita jogos']);
  if (state.soon) items.push(['soon', 'Fecham em 30 dias']);
  if (state.favorite) items.push(['favorite', 'Favoritos']);
  return items;
}
function clearOne(key) {
  if (key === 'search') $('search').value = '';
  else if (key in SELECTS) $(key).value = '';
  else state[key] = false;
}

function renderStats() {
  const open = opportunities.filter(o => categoryOf(o) === 'current');
  const dated = open.filter(o => F.daysUntil(apps[o.id]) !== null).sort((x, y) => F.compareDeadline(apps[x.id], apps[y.id]));
  const next = dated[0] && F.daysUntil(apps[dated[0].id]);
  const paid = open.filter(o => apps[o.id].pays === 'cash').length;
  $('stats').innerHTML = `<div><dt>Abertas agora</dt><dd>${open.length}</dd></div><div><dt>Pagam em dinheiro</dt><dd>${paid}</dd></div><div><dt>Próximo prazo</dt><dd>${next === undefined ? 'Nenhum' : next === 0 ? 'Hoje' : `${next} ${next === 1 ? 'dia' : 'dias'}`}</dd></div>`;
  $('upcoming').innerHTML = dated.slice(0, 6).map(o => {
    const a = apps[o.id];
    return `<li><button data-jump="${esc(o.id)}" title="${esc(a.short)}"><span class="up-date">${esc(brDate(a.closeDate).slice(0, 5))}</span><span class="up-name">${esc(a.short)}</span></button></li>`;
  }).join('');
  $('headerMeta').textContent = `Pesquisa de ${brDate(window.RADAR.checked)}`;
}

function render() {
  const filtered = opportunities.filter(matchesFilters);
  const list = sorted(filtered.filter(inScope));
  const focused = document.activeElement?.dataset?.favorite || document.activeElement?.dataset?.toggle;
  const focusAttr = document.activeElement?.dataset?.favorite ? 'favorite' : 'toggle';
  $('listHeading').textContent = SCOPES.find(([key]) => key === state.scope)[1];
  $('resultCount').textContent = `${list.length} ${list.length === 1 ? 'ficha' : 'fichas'}`;
  $('exportPdf').disabled = list.length === 0;
  $('scopeButtons').innerHTML = SCOPES.map(([key, label]) => {
    const count = key === 'all' ? filtered.length : filtered.filter(o => categoryOf(o) === key).length;
    return `<button data-scope="${key}" aria-pressed="${state.scope === key}" class="scope-button ${state.scope === key ? 'active' : ''}">${label}<span class="count">${count}</span></button>`;
  }).join('');
  $('favoriteCount').textContent = favorites.size;
  $('favoriteFilter').setAttribute('aria-pressed', String(state.favorite));
  $('favoriteFilter').classList.toggle('active', state.favorite);
  $('presets').innerHTML = PRESETS.map((p, i) => {
    const on = p.key === 'soon' ? state.soon : $(p.key).value === p.value;
    return `<button class="preset ${on ? 'active' : ''}" aria-pressed="${on}" data-preset="${i}">${esc(p.label)}</button>`;
  }).join('');
  const active = activeList();
  $('filterCount').textContent = active.length;
  $('filterCount').hidden = !active.length;
  $('activeFilters').innerHTML = active.length ? active.map(([key, text]) => `<button class="chip" data-clear="${key}" aria-label="Remover filtro ${esc(text)}">${esc(text)}<span aria-hidden="true">×</span></button>`).join('') + '<button class="text-button" data-reset>Limpar tudo</button>' : '';
  $('cards').innerHTML = list.length ? list.map(cardHTML).join('') : emptyHTML(filtered);
  if (focused) document.querySelector(`[data-${focusAttr}="${CSS.escape(focused)}"]`)?.focus({preventScroll: true});
  writeUrl();
}

function emptyHTML(filtered) {
  const elsewhere = SCOPES.filter(([key]) => key !== 'all' && key !== state.scope)
    .map(([key, label]) => [key, label, filtered.filter(o => categoryOf(o) === key).length]).filter(([, , n]) => n);
  return `<div class="empty"><h3>Nenhuma ficha aqui com esses filtros</h3>
    ${elsewhere.length ? `<p>Mas há resultado em outras situações:</p><div class="empty-actions">${elsewhere.map(([key, label, n]) => `<button class="button" data-scope="${key}">${esc(label)} (${n})</button>`).join('')}</div>` : '<p>Tente tirar um filtro ou procure este tema na aba Buscar mais.</p>'}
    <div class="empty-actions"><button class="text-button" data-reset>Limpar filtros</button><a class="text-button" href="#buscar">Buscar mais na internet</a></div></div>`;
}

/* A busca fica na URL: dá para salvar nos favoritos do navegador ou mandar para alguém. */
function writeUrl() {
  const params = new URLSearchParams();
  if ($('search').value.trim()) params.set('q', $('search').value.trim());
  for (const [id, key] of Object.entries(SELECTS)) if ($(id).value) params.set(key, $(id).value);
  if (state.scope !== 'current') params.set('sit', state.scope);
  if (state.sort !== 'deadline') params.set('ordem', state.sort);
  if (state.explicit) params.set('cita', '1');
  if (state.soon) params.set('logo', '1');
  if (state.favorite) params.set('fav', '1');
  if (state.open) params.set('ficha', state.open);
  const query = params.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
}
function readUrl() {
  const params = new URLSearchParams(location.search);
  $('search').value = params.get('q') || '';
  for (const [id, key] of Object.entries(SELECTS)) {
    const value = params.get(key) || '';
    $(id).value = [...$(id).options].some(option => option.value === value) ? value : '';
  }
  if (SCOPES.some(([key]) => key === params.get('sit'))) state.scope = params.get('sit');
  if (['deadline', 'pay', 'new', 'name'].includes(params.get('ordem'))) state.sort = params.get('ordem');
  $('sort').value = state.sort;
  state.explicit = params.get('cita') === '1';
  $('explicit').checked = state.explicit;
  state.soon = params.get('logo') === '1';
  state.favorite = params.get('fav') === '1';
  if (apps[params.get('ficha')]) {
    state.open = params.get('ficha');
    const owner = opportunities.find(o => o.id === state.open);
    if (owner && !inScope(owner)) state.scope = 'all';
  }
}

function reset() {
  Object.assign(state, {favorite: false, soon: false, explicit: false, open: null});
  $('search').value = '';
  $('explicit').checked = false;
  for (const id of Object.keys(SELECTS)) $(id).value = '';
  render();
}

function scrollToCard(id) {
  requestAnimationFrame(() => document.getElementById(`ficha-${id}`)?.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'}));
}

function downloadIcs(o) {
  const a = apps[o.id], day = a.closeDate.replaceAll('-', '');
  const end = new Date(Date.parse(`${a.closeDate}T12:00:00Z`) + 86400000).toISOString().slice(0, 10).replaceAll('-', '');
  const text = v => String(v).replace(/[\\;,]/g, m => `\\${m}`).replace(/\n/g, '\\n');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fase Bonus//PT-BR', 'BEGIN:VEVENT', `UID:${o.id}@fase-bonus`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '')}`, `DTSTART;VALUE=DATE:${day}`, `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${text(`Prazo: ${a.short}`)}`, `DESCRIPTION:${text(`${a.deadline}. Confira na fonte: ${a.sourceUrl}`)}`, `URL:${a.sourceUrl}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Prazo em 7 dias', 'TRIGGER:-P7D', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  save(new Blob([ics], {type: 'text/calendar;charset=utf-8'}), `prazo-${o.id}.ics`);
  toast('Arquivo de agenda baixado, com aviso 7 dias antes.');
}
function save(blob, name) {
  const url = URL.createObjectURL(blob), link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let toastTimer;
function toast(message) {
  $('toast').textContent = message;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3200);
}

function fillSelect(id, first, entries) {
  $(id).innerHTML = `<option value="">${esc(first)}</option>` + entries.map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join('');
}
const UF_CODES = new Set(F.states.map(([uf]) => uf));
fillSelect('pays', 'Qualquer', Object.entries(F.pays).map(([key, p]) => [key, p.label]));
fillSelect('modality', 'Todas', Object.entries(F.modalities).filter(([key]) => Object.values(apps).some(a => a.modality.includes(key))).sort((x, y) => x[1].localeCompare(y[1], 'pt-BR')));
fillSelect('oppType', 'Todos', Object.entries(F.oppTypes));
fillSelect('gameFocus', 'Todos', Object.entries(F.gameFocus));
fillSelect('uf', 'Todos os estados', F.states.map(([uf, name]) => [uf, `${name} (${uf})`]));
fillSelect('topic', 'Todos os temas', [...new Set(Object.values(apps).flatMap(a => a.tags))].filter(t => !UF_CODES.has(t)).sort((x, y) => x.localeCompare(y, 'pt-BR')).map(t => [t, t]));

/* Aba Buscar mais */
const afterDate = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
const googleUrl = query => `https://www.google.com/search?q=${encodeURIComponent(`${query} after:${afterDate}`)}`;
const external = (url, label, extra = '') => `<a class="link-out ${extra}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;
function renderSearches() {
  const data = window.SEARCHES;
  $('searchGroups').innerHTML = `<article class="search-group bases"><h2>Bases para consultar direto</h2><ul>${data.bases.map(b => `<li>${external(b.url, b.name)}<small>${esc(b.hint)}</small></li>`).join('')}</ul></article>` +
    data.groups.map(g => `<article class="search-group"><h2>${esc(g.title)}</h2><ul>${g.queries.map(q => `<li>${external(googleUrl(q), q)}</li>`).join('')}</ul></article>`).join('');
  const d = window.DISCOVERIES || {items: [], errors: []};
  $('discoveriesMeta').textContent = d.lastRun
    ? `Busca automática no PNCP e no Querido Diário em ${new Date(d.lastRun).toLocaleDateString('pt-BR', {timeZone: 'America/Sao_Paulo'})}. Não foram conferidos: podem não ter relação com desenvolvimento de jogos.${d.errors?.length ? ` ${d.errors.length} consultas falharam nessa execução.` : ''}`
    : 'Ainda sem execução. Rode python radar_collect.py --discover na pasta collector.';
  $('discoveries').innerHTML = d.items?.length ? d.items.map(i => `<article class="discovery"><div><span class="pill">${esc(i.source)}</span>${i.uf ? `<span class="pill">${esc(i.uf)}</span>` : ''}${i.date ? `<span class="muted">${esc(i.dateLabel)} ${esc(brDate(i.date))}</span>` : ''}</div><h3>${esc(i.org || i.title)}</h3><p>${esc(i.excerpt)}</p>${external(i.url, 'Abrir documento')}</article>`).join('') : '<p class="muted">Nenhum achado passou pelo filtro na última execução.</p>';
}
$('customSearch').addEventListener('submit', event => {
  event.preventDefault();
  const term = $('customTerm').value.trim();
  if (!term) { $('customLinks').innerHTML = ''; return; }
  const encoded = encodeURIComponent(term);
  $('customLinks').innerHTML = [
    external(googleUrl(`${term} edital inscrições`), 'Google: editais'),
    external(googleUrl(`${term} desafio startups inscrições`), 'Google: desafios'),
    external(googleUrl(`${term} game grant open call`), 'Google: internacional'),
    external(`https://www.google.com/search?tbm=nws&q=${encoded}`, 'Google Notícias'),
    external(`https://pncp.gov.br/app/editais?q=${encoded}&status=recebendo_proposta&pagina=1`, 'PNCP'),
    external(`https://queridodiario.ok.org.br/pesquisa?term=${encoded}`, 'Querido Diário')
  ].join('');
});

/* Aba Fontes */
function renderSources() {
  const health = window.COLLECTION || {sources: []};
  const time = t => t ? new Date(t).toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'}) : 'Ainda não executada';
  const label = {ok: 'Consulta concluída', unchanged: 'Sem alteração de conteúdo', cached: 'Consulta em cache', error: 'Falha de acesso', partial: 'Coleta parcial'};
  $('collectionSummary').innerHTML = `<strong>${health.successCount || 0} de ${sources.length} fontes lidas com sucesso</strong><p>Última coleta: ${esc(time(health.lastRun))}. ${health.errorCount || 0} com falha. ${health.candidateCount || 0} links aguardam revisão e não são inscrições confirmadas. A coleta é manual: não há agendamento ativo.</p>`;
  $('sourceCards').innerHTML = sources.map(s => {
    const h = health.sources?.find(x => x.id === s.id);
    const tone = !h ? 'pending' : ['error', 'partial'].includes(h.status) ? 'error' : 'ok';
    return `<article class="source-card"><h2>${esc(s.name)}</h2><p>${esc(s.scope)}</p><p class="source-health ${tone}">${h ? esc(label[h.status] || h.status) : 'Fonte nova, ainda não coletada'}${h?.error ? `: ${esc(h.error)}` : ''}</p>${external(s.url, 'Abrir portal')}</article>`;
  }).join('');
}

/* Eventos */
$('scopeButtons').addEventListener('click', event => {
  const button = event.target.closest('[data-scope]');
  if (!button) return;
  state.scope = button.dataset.scope;
  render();
  document.querySelector(`#scopeButtons [data-scope="${state.scope}"]`).focus({preventScroll: true});
});
$('cards').addEventListener('click', event => {
  const target = event.target;
  const scope = target.closest('[data-scope]');
  if (scope) { state.scope = scope.dataset.scope; return render(); }
  if (target.closest('[data-reset]')) return reset();
  const toggle = target.closest('[data-toggle]');
  if (toggle) {
    state.open = state.open === toggle.dataset.toggle ? null : toggle.dataset.toggle;
    render();
    if (state.open) scrollToCard(state.open);
    return;
  }
  const calendar = target.closest('[data-ics]');
  if (calendar) return downloadIcs(opportunities.find(o => o.id === calendar.dataset.ics));
  const favorite = target.closest('[data-favorite]');
  if (!favorite) return;
  const id = favorite.dataset.favorite;
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites])); } catch { toast('Favoritos valem só nesta sessão.'); }
  render();
});
$('presets').addEventListener('click', event => {
  const button = event.target.closest('[data-preset]');
  if (!button) return;
  const preset = PRESETS[button.dataset.preset];
  if (preset.key === 'soon') state.soon = !state.soon;
  else $(preset.key).value = $(preset.key).value === preset.value ? '' : preset.value;
  render();
  document.querySelector(`[data-preset="${button.dataset.preset}"]`).focus({preventScroll: true});
});
$('activeFilters').addEventListener('click', event => {
  if (event.target.closest('[data-reset]')) return reset();
  const chip = event.target.closest('[data-clear]');
  if (chip) { clearOne(chip.dataset.clear); render(); $('search').focus({preventScroll: true}); }
});
$('upcoming').addEventListener('click', event => {
  const button = event.target.closest('[data-jump]');
  if (!button) return;
  reset();
  state.scope = 'current';
  state.open = button.dataset.jump;
  render();
  scrollToCard(state.open);
});
$('search').addEventListener('input', render);
for (const id of ['pays', 'modality', 'oppType', 'gameFocus', 'cnpj', 'topic']) $(id).addEventListener('change', render);
$('region').addEventListener('change', () => { if ($('region').value === 'international') $('uf').value = ''; render(); });
$('uf').addEventListener('change', () => { if ($('uf').value) $('region').value = 'Brasil'; render(); });
$('explicit').addEventListener('change', () => { state.explicit = $('explicit').checked; render(); });
$('sort').addEventListener('change', () => { state.sort = $('sort').value; render(); });
$('favoriteFilter').addEventListener('click', () => { state.favorite = !state.favorite; render(); });
$('toggleFilters').addEventListener('click', () => {
  const open = $('filterGrid').classList.toggle('show');
  $('toggleFilters').setAttribute('aria-expanded', String(open));
});
$('copyLink').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href); toast('Link copiado com os filtros atuais.'); }
  catch { toast('Copie o endereço na barra do navegador: ele já guarda os filtros.'); }
});
$('exportPdf').addEventListener('click', async () => {
  const list = sorted(opportunities.filter(matchesFilters).filter(inScope));
  if (!list.length) return toast('Nenhuma ficha para exportar. Ajuste os filtros.');
  const button = $('exportPdf');
  button.disabled = true;
  button.textContent = 'Gerando…';
  try {
    const filters = [SCOPES.find(([key]) => key === state.scope)[1], ...activeList().map(([, text]) => text)];
    const pdf = window.RADAR_PDF.build({opportunities: list, apps, checked: window.RADAR.checked, horizon: window.RADAR.horizon, filters, categoryOf, profileLabel: cnpjLabel, payLabel: a => F.pays[a.pays].label, typeLabel: a => [F.oppTypes[a.oppType], ...modalityLabels(a)].join(' | ')});
    const today = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Sao_Paulo'}).format(new Date());
    await pdf.save(`fase-bonus-${today}-${list.length}-fichas.pdf`, {returnPromise: true});
    toast(`PDF gerado com ${list.length} ${list.length === 1 ? 'ficha' : 'fichas'}.`);
  } catch (error) {
    console.error('Falha na exportação PDF', error);
    toast('Não foi possível gerar o PDF. Recarregue a página e tente de novo.');
  } finally {
    button.textContent = 'Exportar PDF';
    button.disabled = opportunities.filter(matchesFilters).filter(inScope).length === 0;
  }
});
$('exportBtn').addEventListener('click', () => {
  const data = {research_date: window.RADAR.checked, horizon: window.RADAR.horizon, automatic_collection: false, collection: window.COLLECTION, discoveries: window.DISCOVERIES, opportunities: opportunities.map(o => ({...o, application: apps[o.id], favorite: favorites.has(o.id)})), sources};
  save(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json;charset=utf-8'}), 'fase-bonus-pesquisa.json');
  toast('Pesquisa exportada em JSON.');
});

/* Tema: claro por padrão, escuro só por escolha de quem usa */
const THEME_KEY = 'fase-bonus-theme';
function applyTheme(theme) {
  const dark = theme === 'dark';
  if (dark) document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  $('themeToggle').textContent = dark ? 'Modo claro' : 'Modo escuro';
  document.querySelector('meta[name="theme-color"]').content = dark ? '#1b1b1b' : '#ffffff';
}
$('themeToggle').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch { toast('O tema vale só nesta sessão.'); }
});
applyTheme(document.documentElement.dataset.theme);

/* Navegação entre as abas */
function route() {
  const hash = location.hash.slice(1);
  const panel = hash === 'fontes' ? 'sources' : hash === 'buscar' ? 'search-more' : 'opportunities';
  document.querySelectorAll('.panel').forEach(p => { p.hidden = p.id !== panel; });
  document.querySelectorAll('[data-panel]').forEach(link => {
    const active = link.dataset.panel === panel;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

readUrl();
renderStats();
renderSearches();
renderSources();
route();
render();
if (state.open) scrollToCard(state.open);
