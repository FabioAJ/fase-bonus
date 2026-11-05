# Radar Games

Site estático com curadoria em português, sem backend e sem coleta automática ativa.

Fonte de verdade: `collector/reviewed.json`. Os arquivos `dist/data.js`, `dist/application.js` e `dist/collection-status.js` são gerados pelo coletor. Interface: `dist/index.html`, `dist/app.js`, `dist/style.css`.
Plano e brief do próximo goal: `dist/plano-radar.md`.

A versão 3 usa fichas independentes: duas colunas no desktop e uma no celular. Cada oportunidade mostra sua própria elegibilidade, apoio por projeto, prazo de inscrição, documentos conhecidos, lacunas e links de edital. Esses campos estão em `dist/application.js`. O filtro inicial mostra duas possibilidades atuais, sem tratá-las como contratos brasileiros. Categorias: para analisar, próximas edições e encerrados. Busca textual inicia em todas as categorias; território, tema e favoritos refinam as fichas. Favoritos continuam locais ao navegador. O guia usado nesta revisão foi `frontend-design`, do repositório oficial anthropics/skills, baixado em `work/design-skills` neste workspace; não foi instalado globalmente.

Correção editorial na versão 3: MEDIA 2027 oferece até €200 mil por projeto e até 60% do orçamento elegível; €13,5 milhões é orçamento global. O edital exclui projetos com formação profissional, treinamento ou terapia como objetivo principal. A ficha contém link direto para o PDF e síntese dos documentos exigidos, com limitações explícitas.

Pesquisa inicial: 05/11/2026. Horizonte: 31/03/2027. Favoritos usam localStorage, sem sincronização entre dispositivos. Exportação JSON inclui todas as fichas, fontes e favoritos. O site não faz contatos nem candidaturas. Fontes externas abrem em nova aba.

A ampliação inclui 29 fichas revisadas, 33 fontes e perfil MG/GO sem CNPJ. A aba inicial prioriza BNDES Garagem (Criação), Santander Explorer e o pitch solo do Indie Fund. O filtro de CNPJ distingue inscrição sem empresa, necessidade de constituir depois, exigência empresarial e condições ainda desconhecidas. As outras abas preservam oportunidades condicionais e histórico; a contagem não significa 16 inscrições elegíveis.

Coletor real e instruções: `collector/README.md`. Executado manualmente: 17/33 fontes acessíveis, 3 falhas explícitas e fila de revisão separada das fichas. Não há agendamento ativo nem publicação automática após o comando local. Para atualizar os dados locais: `python collector/radar_collect.py`; para só gerar a curadoria: `python collector/radar_collect.py --build-only`.

Para prévia local: `python -m http.server 8765 --bind 127.0.0.1 --directory dist`.

Reutilizar `.openai/hosting.json` nas próximas alterações. Não criar outro projeto Sites.

Cobertura nacional: filtro de 26 estados e DF, CNPJ obrigatório na inscrição em Sim/Não/Qualquer, sem aba por perfil. Cadastro e critérios territoriais estão em collector/reviewed.json.
