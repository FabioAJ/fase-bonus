/* Buscas prontas da aba "Buscar mais". Para acrescentar uma, basta incluir o texto no grupo. */
window.SEARCHES = {
  bases: [
    {name: 'PNCP', hint: 'Contratações públicas recebendo proposta', url: 'https://pncp.gov.br/app/editais?q=%22jogos%20digitais%22&status=recebendo_proposta&pagina=1'},
    {name: 'Querido Diário', hint: 'Diários oficiais de municípios', url: 'https://queridodiario.ok.org.br/pesquisa?term=%22jogos%20eletr%C3%B4nicos%22%20edital'},
    {name: 'Prosas', hint: 'Editais de cultura e impacto', url: 'https://prosas.com.br/editais'},
    {name: '100 Open Startups', hint: 'Desafios de empresas', url: 'https://www.openstartups.net/br-pt/challenges/'},
    {name: 'Desafios Enap', hint: 'Desafios do governo federal', url: 'https://desafios.enap.gov.br/index.php/pt/'},
    {name: 'itch.io', hint: 'Próximos game jams', url: 'https://itch.io/jams/upcoming'},
    {name: 'Alertas do Google', hint: 'Receba aviso por e-mail de uma busca', url: 'https://www.google.com/alerts'}
  ],
  groups: [
    {title: 'Editais públicos de games', queries: [
      'edital "jogos eletrônicos" inscrições abertas',
      'edital "jogos digitais" fomento inscrições',
      'PNAB edital games jogos eletrônicos inscrições',
      'chamada pública desenvolvimento de jogos prefeitura',
      'site:gov.br edital "jogos eletrônicos"',
      'site:prosas.com.br edital jogos eletrônicos'
    ]},
    {title: 'Desafios de empresas', queries: [
      'desafio startups gamificação inscrições abertas',
      'inovação aberta treinamento gamificação chamada startups',
      'desafio "realidade virtual" treinamento segurança startups inscrições',
      'programa open innovation "gamificação" engajamento colaboradores edital',
      'hackathon empresa jogo educativo prêmio inscrições'
    ]},
    {title: 'Jogos sérios e educativos', queries: [
      '"jogos sérios" edital chamada',
      '"serious games" call for proposals funding',
      '"jogo educativo" chamada pública desenvolvimento',
      'edtech gamificação edital FAPESP FAPEMIG FAPERJ FAPESC',
      '"serious game" competition call for submissions'
    ]},
    {title: 'Fundos e bolsas internacionais', queries: [
      '"indie game" fund applications open',
      'video game grant applications open developers',
      'game developer fund Latin America applications',
      'indie game publisher accepting pitches',
      '"impact games" grant call for projects'
    ]},
    {title: 'Concursos e game jams', queries: [
      'game jam prêmio em dinheiro inscrições Brasil',
      'concurso de jogos prêmio inscrições abertas',
      'game competition cash prize open submissions',
      'indie game awards submissions open'
    ]}
  ]
};
