# Fase Bônus

Antigo Radar Games. Editais públicos, desafios de empresas, fundos e concursos para jogos comerciais, jogos sérios e gamificação. Horizonte: 31/03/2027. Curadoria conferida em 06/11/2026.

55 fichas: 23 chamadas/canais atuais, 16 em acompanhamento e 16 encerradas. 66 fontes com URLs distintas. Essas contagens não significam inscrições elegíveis ou contratos garantidos.

Filtros: busca com sinônimos, Paga? (`pays`: dinheiro, investimento, não paga, a confirmar), modalidade (`modality`: fomento, incentivo fiscal, prêmio etc.), tipo de oportunidade (`oppType`), tipo de jogo (`gameFocus`), CNPJ na inscrição, território, 26 estados e DF, tema, aderência explícita (`explicitGames`), favoritos e prazo em 30 dias. Valor desconhecido só aparece em Qualquer ou quando se escolhe "a confirmar". A busca fica na URL e pode ser compartilhada.

Fonte de verdade: collector/reviewed.json. Os arquivos dist/data.js, dist/application.js, dist/collection-status.js e dist/discoveries.js são gerados pelo coletor. Interface em dist/index.html, dist/app.js, dist/style.css, dist/filters.js e dist/searches.js (buscas prontas da aba Buscar mais).

Coletor manual: python collector/radar_collect.py. Só curadoria: --build-only. Descoberta no PNCP e no Querido Diário: --discover (os achados vão apenas para revisão). Guia em collector/README.md.

Coleta: 56 fontes com leitura concluída e 10 com limitação. 265 links de documentos/listagens/possíveis chamadas aguardam revisão, sem promoção automática a inscrição disponível.

Sem agendamento, backend remoto ou publicacao automatica apos o comando local. Favoritos usam localStorage. Exportacao JSON inclui fichas, fontes e favoritos. O radar nao envia propostas, mensagens, cadastros ou aceites.

Previa: python -m http.server 8765 --bind 127.0.0.1 --directory dist

Validacao: python -m unittest discover -s collector -p 'test_*.py' -v e node collector/test_filters.cjs.

Preservar .openai/hosting.json e reutilizar o mesmo projeto Sites.

Exportacao PDF: botao Exportar PDF baixa diretamente as fichas que passam pelos filtros atuais (incluindo favoritos e situacao). Inclui prazo, apoio, abrangencia, CNPJ, documentos, impedimentos, pendencias, fontes clicaveis, data e filtros. Para tudo: Todas + limpar filtros. Geracao local no navegador, sem servico externo. Implementacao em dist/pdf-export.js; jsPDF 4.2.1 MIT em dist/lib/ com licenca preservada. Nao usa captura da tela nem janela de impressao.
