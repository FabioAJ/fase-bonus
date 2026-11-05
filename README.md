# Radar Games

Pesquisa nacional de oportunidades para jogos, jogos serios e gamificacao. Horizonte: 31/03/2027. Curadoria conferida em 05/11/2026.

37 fichas: 18 chamadas/canais atuais, 11 em acompanhamento e 8 encerradas. 41 fontes com URLs distintas. Essas contagens nao significam inscricoes elegiveis ou contratos garantidos.

Fichas independentes, busca, territorio, 26 estados e DF, tema, favoritos e CNPJ obrigatorio na inscricao em Qualquer/Sim/Nao. Condicoes desconhecidas so aparecem em Qualquer. A UF inclui chamadas nacionais e as restritas aquela UF. Nao ha aba por perfil.

Fonte de verdade: collector/reviewed.json. Os arquivos dist/data.js, dist/application.js e dist/collection-status.js sao gerados pelo coletor. Interface em dist/index.html, dist/app.js, dist/style.css e dist/filters.js.

Coletor manual: python collector/radar_collect.py. Para gerar apenas curadoria: python collector/radar_collect.py --build-only. Guia em collector/README.md.

Coleta: 34 fontes com leitura concluida e 7 com limitacao. Enel e Petrobras foram conferidas no navegador; isso nao remove a falha do coletor HTTP. 99 links de documentos/listagens/possiveis chamadas aguardam revisao, sem promocao automatica a inscricao disponivel.

Sem agendamento, backend remoto ou publicacao automatica apos o comando local. Favoritos usam localStorage. Exportacao JSON inclui fichas, fontes e favoritos. O radar nao envia propostas, mensagens, cadastros ou aceites.

Previa: python -m http.server 8765 --bind 127.0.0.1 --directory dist

Validacao: python -m unittest discover -s collector -p 'test_*.py' -v e node collector/test_filters.cjs.

Preservar .openai/hosting.json e reutilizar o mesmo projeto Sites.
