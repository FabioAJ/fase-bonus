# Radar Games

Site estático com curadoria em português, sem backend e sem coleta automática ativa.

Fonte: `dist/data.js`. Interface: `dist/index.html`, `dist/app.js`, `dist/style.css`.
Plano e brief do próximo goal: `dist/plano-radar.md`.

Pesquisa inicial: 05/11/2026. Horizonte: 31/03/2027. Favoritos usam localStorage, sem sincronização entre dispositivos. Exportação JSON inclui todas as fichas, fontes e favoritos. O site não faz contatos nem candidaturas. Fontes externas abrem em nova aba.

Para prévia local: `python -m http.server 8765 --bind 127.0.0.1 --directory dist`.

Reutilizar `.openai/hosting.json` nas próximas alterações. Não criar outro projeto Sites.
