/* Regras de filtro e busca sem dependência da página, para que possam ser testadas em Node. */
(function (root) {
  const states = [
    ['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],['BA','Bahia'],
    ['CE','Ceará'],['DF','Distrito Federal'],['ES','Espírito Santo'],['GO','Goiás'],
    ['MA','Maranhão'],['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],['MG','Minas Gerais'],
    ['PA','Pará'],['PB','Paraíba'],['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],
    ['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],['RS','Rio Grande do Sul'],
    ['RO','Rondônia'],['RR','Roraima'],['SC','Santa Catarina'],['SP','São Paulo'],
    ['SE','Sergipe'],['TO','Tocantins']
  ];
  const pays = {
    cash: {label: 'Paga em dinheiro', hint: 'Prêmio, subvenção, auxílio, patrocínio ou contrato'},
    investment: {label: 'Investimento', hint: 'O dinheiro volta ao investidor em receita ou participação'},
    none: {label: 'Não paga', hint: 'Formação, estrutura, mentoria ou visibilidade'},
    unknown: {label: 'Pagamento a confirmar', hint: 'A fonte não confirma se há dinheiro'}
  };
  const oppTypes = {
    edital: 'Edital público',
    empresa: 'Desafio de empresa',
    fundo: 'Fundo ou publisher',
    concurso: 'Concurso, festival ou jam',
    programa: 'Aceleração ou formação'
  };
  const gameFocus = {
    autoral: 'Jogos comerciais e autorais',
    serio: 'Jogos sérios e educativos',
    gamificacao: 'Gamificação e treinamento',
    geral: 'Inovação em geral'
  };
  const modalities = {
    fomento: 'Fomento', incentivo: 'Incentivo fiscal', subvencao: 'Subvenção', patrocinio: 'Patrocínio', premio: 'Prêmio',
    auxilio: 'Auxílio', bolsa: 'Bolsa', matchfunding: 'Matchfunding', pdi: 'P&D', poc: 'Piloto ou prova de conceito',
    investimento: 'Investimento', conversivel: 'Investimento conversível', receita: 'Participação em receita',
    financiamento: 'Financiamento', royalties: 'Royalties', aceleracao: 'Aceleração', formacao: 'Formação',
    estrutura: 'Residência', parceria: 'Parceria', vitrine: 'Vitrine'
  };
  // Quem busca por um termo também quer os seus sinônimos.
  const synonyms = {
    game: ['jogo','game'], games: ['jogo','game'], jogo: ['jogo','game'], jogos: ['jogo','game'],
    serio: ['serio','serious','educativ','educac'], serios: ['serio','serious','educativ','educac'], serious: ['serio','serious'],
    educativo: ['educativ','educac','edtech','aprendiz'], educativos: ['educativ','educac','edtech','aprendiz'], educacao: ['educac','educativ','edtech','aprendiz'],
    gamificacao: ['gamific'], gamification: ['gamific'], gamificado: ['gamific'],
    treinamento: ['treinamento','capacitac','simulac','formacao'], simulador: ['simulac','simulador'], simulacao: ['simulac','simulador'],
    vr: ['xr','realidade virtual','imers'], rv: ['xr','realidade virtual','imers'], xr: ['xr','realidade virtual','imers'],
    premio: ['premio','premiac','concurso','prize'], dinheiro: ['premio','subvenc','apoio','r$','us$'],
    bolsa: ['bolsa','grant','subvenc'], grant: ['grant','bolsa','subvenc'], investimento: ['investiment','financiament','aporte'],
    empresa: ['empresa','corporativ','startup'], desafio: ['desafio','challenge'], jam: ['jam','hackathon'],
    indie: ['indie','independ','autora'], unreal: ['unreal','uefn'], android: ['android','google play','mobile'], mobile: ['mobile','android']
  };
  const norm = v => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function matchesState(application, uf) {
    return !uf || application.territoryScope === 'national' ||
      (application.territoryScope === 'restricted' && application.states.includes(uf));
  }
  function matchesCnpj(application, value) {
    return !value || (value === 'yes' && application.requiresCnpjAtApplication === true) ||
      (value === 'no' && application.requiresCnpjAtApplication === false);
  }
  function matchesPays(application, value) {
    return !value || application.pays === value;
  }
  function matchesOppType(application, value) {
    return !value || application.oppType === value;
  }
  function matchesModality(application, value) {
    return !value || application.modality.includes(value);
  }
  function matchesGameFocus(application, value) {
    return !value || application.gameFocus.includes(value);
  }
  /* Todas as palavras precisam aparecer, em qualquer ordem; cada uma aceita seus sinônimos. */
  function matchesText(text, query) {
    const haystack = norm(text);
    const stop = new Set(['de','do','da','dos','das','para','com','em','e','o','a','os','as']);
    return norm(query).split(/\s+/).filter(word => word && !stop.has(word))
      .every(word => (synonyms[word] || [word]).some(term => haystack.includes(term)));
  }
  /* Prazo vencido sai de "abertas" mesmo que a curadoria ainda não tenha sido refeita. */
  function categoryOf(application, now = new Date()) {
    if (application.category !== 'current') return application.category;
    const today = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Sao_Paulo'}).format(now);
    const expired = application.closeAt ? now.getTime() > Date.parse(application.closeAt)
      : application.closeDate && application.closeDate < today;
    return expired ? 'closed' : 'current';
  }
  function daysUntil(application, now = new Date()) {
    if (!application.closeDate) return null;
    const today = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Sao_Paulo'}).format(now);
    return Math.round((Date.parse(application.closeDate + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);
  }
  /* Com prazo primeiro, do mais próximo ao mais distante; encerradas do mais recente ao mais antigo. */
  function compareDeadline(a, b, now = new Date()) {
    const da = daysUntil(a, now), db = daysUntil(b, now);
    if (da === null || db === null) return (da === null) - (db === null);
    const pastA = da < 0, pastB = db < 0;
    if (pastA !== pastB) return pastA - pastB;
    return pastA ? db - da : da - db;
  }
  const payRank = {cash: 0, investment: 1, unknown: 2, none: 3};
  function comparePay(a, b) {
    return payRank[a.pays] - payRank[b.pays];
  }
  const filters = {states, pays, oppTypes, gameFocus, modalities, norm, matchesState, matchesCnpj, matchesPays, matchesOppType, matchesGameFocus, matchesModality, matchesText, categoryOf, daysUntil, compareDeadline, comparePay};
  if (typeof module !== 'undefined' && module.exports) module.exports = filters;
  else root.RADAR_FILTERS = filters;
})(typeof window !== 'undefined' ? window : globalThis);
