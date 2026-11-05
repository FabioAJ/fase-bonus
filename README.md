# Radar Games

Site estático com curadoria em português, sem backend e sem coleta automática ativa.

Fonte: `dist/data.js`. Interface: `dist/index.html`, `dist/app.js`, `dist/style.css`.
Plano e brief do próximo goal: `dist/plano-radar.md`.

A interface usa como referência a paleta neutra, o acento laranja e as tags do GameNotes. Requisitos, recursos, prazo e lacunas aparecem na listagem. Filtros por situação, território, avaliação, favoritos e temas combináveis (OU entre temas, E entre categorias); filtros aplicados removíveis; ordenação por prioridade, prazo de inscrição e organização; visualização em lista ou cartões. Tema e fonte são informações distintas. Os contadores das opções mostram os totais da curadoria; o total dos resultados reflete os filtros. Atalho `/` foca a busca. No celular, o painel de filtros tem ação para retornar aos resultados. Favoritos e preferência de visualização são locais ao navegador.

Pesquisa inicial: 05/11/2026. Horizonte: 31/03/2027. Favoritos usam localStorage, sem sincronização entre dispositivos. Exportação JSON inclui todas as fichas, fontes e favoritos. O site não faz contatos nem candidaturas. Fontes externas abrem em nova aba.

Para prévia local: `python -m http.server 8765 --bind 127.0.0.1 --directory dist`.

Reutilizar `.openai/hosting.json` nas próximas alterações. Não criar outro projeto Sites.
