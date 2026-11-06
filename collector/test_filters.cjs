const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const filters = require('../dist/filters.js');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname,'reviewed.json'),'utf8'));
const apps = catalog.applications;
assert.equal(filters.states.length,27);
assert.equal(new Set(filters.states.map(([uf])=>uf)).size,27);
assert(filters.matchesState(apps.bndes,'AC'),'Chamada nacional deve aparecer em todas as UFs.');
assert(filters.matchesState(apps.pnabrn,'RN'));
assert(!filters.matchesState(apps.pnabrn,'MG'),'Chamada restrita não deve vazar para outra UF.');
assert(filters.matchesState(apps.cepedi,'BA'));
assert(filters.matchesState(apps.cepedi,'SE'));
assert(!filters.matchesState(apps.cepedi,'SP'));
assert(!filters.matchesState(apps.media,'SP'),'Europa não é candidatura de SP.');
assert(filters.matchesState(apps.media,''));
assert(filters.matchesCnpj(apps.proacgames,'yes'));
assert(!filters.matchesCnpj(apps.proacgames,'no'));
assert(filters.matchesCnpj(apps.bndes,'no'));
assert(filters.matchesCnpj(apps.centelhamg,'no'),'Formalização posterior deve permanecer explícita, mas não impedir início por PF.');
assert(filters.matchesCnpj(apps.indiefund,'no'),'Pitch individual confirmado; contrato continua a confirmar na ficha.');
assert(!filters.matchesCnpj(apps.rioinvest,'yes'));
assert(!filters.matchesCnpj(apps.rioinvest,'no'),'Desconhecido não equivale a não.');
assert(filters.matchesCnpj(apps.rioinvest,''));
const validUFs = new Set(filters.states.map(([uf])=>uf));
for(const [id,a] of Object.entries(apps)) {
  assert(['national','restricted','international'].includes(a.territoryScope),id);
  assert(Array.isArray(a.states),id);
  assert(a.territoryLabel,id);
  assert(a.states.every(uf=>validUFs.has(uf)),id);
  assert([true,false,null].includes(a.requiresCnpjAtApplication),id);
  if(a.territoryScope==='restricted') assert(a.states.length,id);
}
// Filtro de pagamento: o valor desconhecido nunca é tratado como "paga" nem como "não paga".
for(const [id,a] of Object.entries(apps)) {
  assert(Object.keys(filters.pays).includes(a.pays),`${id}: pays`);
  assert(Object.keys(filters.oppTypes).includes(a.oppType),`${id}: oppType`);
  assert(a.gameFocus.length && a.gameFocus.every(f=>Object.keys(filters.gameFocus).includes(f)),`${id}: gameFocus`);
  assert.equal(typeof a.explicitGames,'boolean',`${id}: explicitGames`);
}
for(const [id,a] of Object.entries(apps)) {
  assert(Array.isArray(a.modality)&&a.modality.length&&a.modality.every(m=>filters.modalities[m]),`${id}: modality`);
}
assert(filters.matchesModality(apps.proacgames,'fomento'));
assert(!filters.matchesModality(apps.proacgames,'incentivo'));
assert(filters.matchesModality(apps.federalgames,'fomento')&&filters.matchesModality(apps.federalgames,'incentivo'),'Pacote federal combina dois instrumentos.');
assert(filters.matchesModality(apps.inova6,''));
assert(filters.matchesPays(apps.proacgames,'cash'));
assert(!filters.matchesPays(apps.proacgames,'none'));
assert(filters.matchesPays(apps.bhtec,'none'),'BH-TEC informa que não há aporte direto.');
assert(filters.matchesPays(apps.indiefund,'investment'),'Investimento não é prêmio.');
assert(!filters.matchesPays(apps.federalgames,'cash'),'Anúncio sem regra não pode aparecer como pago.');
assert(!filters.matchesPays(apps.federalgames,'none'));
assert(filters.matchesPays(apps.federalgames,''));
assert(filters.matchesOppType(apps.enelindividual,'empresa'));
assert(!filters.matchesOppType(apps.enelindividual,'edital'));
assert(filters.matchesGameFocus(apps.pipeeducacao,'serio'));
assert(filters.matchesGameFocus(apps.pipeeducacao,'gamificacao'));
assert(!filters.matchesGameFocus(apps.proacgames,'serio'));
// Busca: palavras em qualquer ordem, sem acento e com sinônimos.
assert(filters.matchesText('Jogos sérios para treinamento em SP','sp treinamento'));
assert(filters.matchesText('Jogos sérios','jogos serios'));
assert(filters.matchesText('Chamada de gamificação','gamification'));
assert(filters.matchesText('Treinamento em XR / imersão','VR'));
assert(filters.matchesText('Serious game challenge','jogo sério'));
assert(!filters.matchesText('Aceleração gratuita','prêmio'));
assert(filters.matchesText('qualquer','para de'),'Só palavras vazias não filtram.');
// Prazos: comparação no fuso de Brasília.
const now=new Date('2026-11-06T12:00:00-03:00');
assert.equal(filters.daysUntil({closeDate:'2026-11-12'},now),6);
assert.equal(filters.daysUntil({},now),null);
assert.equal(filters.categoryOf({category:'current',closeDate:'2026-11-06'},now),'current');
assert.equal(filters.categoryOf({category:'current',closeDate:'2026-11-05'},now),'closed');
assert.equal(filters.categoryOf({category:'current',closeDate:'2026-11-06',closeAt:'2026-11-06T11:00:00-03:00'},now),'closed');
assert.equal(filters.categoryOf({category:'watch',closeDate:'2020-01-01'},now),'watch');
const sorted=[{id:'sem'},{id:'passou',closeDate:'2026-01-01'},{id:'longe',closeDate:'2027-01-01'},{id:'perto',closeDate:'2026-11-10'},{id:'passou-recente',closeDate:'2026-10-01'}]
  .sort((a,b)=>filters.compareDeadline(a,b,now)).map(x=>x.id);
assert.deepEqual(sorted,['perto','longe','passou-recente','passou','sem']);
console.log('Filtros: UF, CNPJ, pagamento, tipo, foco, busca com sinônimos e prazos validados.');
