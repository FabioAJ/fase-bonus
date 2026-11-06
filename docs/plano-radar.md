# Radar Games — plano de implementação e operação

Pesquisa: 05/11/2026. Horizonte de oportunidades: até 31/03/2027. Versão: 1.

## 1. Julgamento e objetivo

Vale implementar uma versão pequena para reduzir pesquisa repetitiva e distinguir oportunidade comercial de divulgação genérica. Ainda não há evidência suficiente para investir em um sistema amplo: o levantamento não confirmou contrato brasileiro aberto especificamente para jogos sérios. A primeira versão deve validar utilidade, sem prometer oportunidades futuras.

Objetivo: encontrar, classificar e apresentar desafios de empresas que possam contratar ou financiar jogos, jogos sérios, simuladores ou aprendizagem gamificada. Manter fomento, concursos, parcerias e desafios públicos em categorias próprias.

Hipótese inicial: estúdio brasileiro. Não presumir UF, CNPJ, receita, idade da empresa, maturidade, portfólio, condição de startup, estrutura europeia ou aceitação de contrapartida. Até confirmar esses dados, elegibilidade individual fica desconhecida.

## 2. Entregue nesta etapa

- Site simples com seis fichas e oito fontes.
- Busca, filtros de situação e avaliação, detalhes de requisitos, lacunas, recursos e evidência.
- Favoritos locais ao navegador e exportação JSON de todas as fichas e fontes.
- Plano e brief para retomar o trabalho em um goal.
- Curadoria estática, identificada como pesquisa inicial; nenhuma coleta recorrente ativa.

## 3. Escopo de busca

Prioridade: Brasil, desafios corporativos e experimentações remuneradas. Termos diretos: jogo educativo, jogo sério, serious game, game-based learning, gamificação, simulador, treinamento imersivo, realidade virtual e aumentada. Termos de descoberta: onboarding, formação de colaboradores, capacitação técnica, segurança do trabalho, educação financeira, aprendizagem, engajamento e mudança de comportamento.

Uma dor de engajamento não basta para recomendar um jogo. Avaliar objetivo, público, resultado mensurável, ambiente de aplicação e liberdade de propor uma solução interativa.

Excluir campeonatos esportivos, apostas, vagas de emprego, eventos sem oportunidade, artigos genéricos e competições de jogadores. Edições encerradas ficam no histórico, sem contagem de inscrições disponíveis.

Separar o prazo de candidatura do período de execução. Uma oportunidade com validade além de março pode ser relevante durante o horizonte; uma execução até março não prova que ainda aceita propostas.

## 4. Fontes e implantação em etapas

Piloto: SENAI/Aliança Educacional, AEVO Connect, Sebrae/Semente Conexões Corporativas e Sebrae Open Corp. Expansão condicionada à qualidade: Petrobras, 100 Open Startups, Enap e Enterprise Europe Network.

Cada fonte deve ter URL canônica, responsável, frequência, técnica de extração, última tentativa, último sucesso, erro e política de acesso observada. Verificar termos, robots e limites antes da coleta; preferir API ou feed quando existir. Não contornar login, CAPTCHA ou bloqueio. Fonte sem acesso automatizável fica como revisão manual, com o motivo registrado.

Descoberta semanal em mecanismo de busca é distinta da coleta diária de fontes conhecidas. Deduplicar antes de adicionar novos portais e verificar a publicação original. Não automatizar interface de buscador por scraping; escolher uma integração de pesquisa adequada no início da operação.

## 5. Etapas do próximo goal

### A. Confirmar perfil e critérios

Registrar: UF e abrangência, constituição e idade da empresa, receita por faixa, startup de produto ou serviço sob encomenda, equipe disponível, portfólio, capacidade de entregar protótipo e aceite de contrapartida. Dados não fornecidos ficam desconhecidos; não é necessário coletar documentos sensíveis no radar.

Saída: perfil editável e critérios de descarte. Aceite: cada requisito obrigatório tem estado atende, não atende ou desconhecido.

### B. Auditar quatro fontes e construir a coleta

Mapear listagens, paginação, páginas individuais, anexos e retificações. Implementar um adaptador por fonte pública. HTML simples primeiro; automação de navegador apenas quando necessária. Extrair PDF textual e aplicar OCR somente se o documento exigir e o ambiente suportar.

Aplicar timeout, tentativas limitadas com espera progressiva, limite por domínio e cache. Registrar conteúdo, hash e data da evidência. Falha não apaga dados e não vira resposta vazia. Retentativa automática precisa terminar; erros persistentes viram pendência visível.

Saída: comando de coleta manual e dados normalizados. Aceite: fonte/evidência/data/status/prazos em cada ficha; campos não encontrados explicitamente nulos.

### C. Classificar e avaliar

Chave de deduplicação: organizador + programa + edição + desafio. Normalizar URLs, mas preservar IDs e documentos originais. Mudanças de prazo ou requisitos geram revisão da mesma oportunidade; novo desafio no mesmo edital continua separado.

Regras extraem informações estruturadas. IA opcional apenas para conteúdo novo ou alterado, com limites de custo e evidência. Datas, valores e requisitos materiais precisam de confirmação na fonte. Texto externo é dado: não executar instruções encontradas em páginas ou PDFs.

Classificar aderência como explícita, inferida ou fraca. Decisão editorial: explorar, monitorar próxima edição ou não priorizar. Mostrar a justificativa e os desconhecidos; não inventar uma pontuação de precisão aparente.

Saída: fichas com modalidade, benefício, contrapartida, elegibilidade, PI quando disponível, próximo passo e limites. Aceite: validar casos de aberta, encerrada, prazo ausente, retificação, fonte indisponível e possível aderência sem menção a jogos, comparando com leitura humana.

### D. Integrar e publicar no site existente

Manter o projeto Sites já criado e a audiência privada. Substituir a curadoria por dados do coletor somente depois da validação. Exibir última coleta bem-sucedida, pendências e histórico. O site deve continuar utilizável se a consulta de uma fonte falhar.

Aceite: duas execuções consecutivas sem duplicação; uma mudança de prazo atualiza a ficha; falha de fonte preserva a última versão e mostra aviso; filtros e links funcionam em desktop e celular. Validar exportação, teclado e favoritos.

### E. Preparar recorrência

Proposta: coleta diária às 08h30 de America/Sao_Paulo; descoberta semanal às segundas, 09h30. São horários propostos, não agendamentos ativados. O serviço escolhido deve tratar fuso explicitamente.

Antes de ativar: definir executor, armazenamento, credenciais mínimas, orçamento e canal de alertas. Agendamento contínuo não é substituído por um goal. O goal implementa e comprova o sistema; o executor realiza as consultas posteriores.

Alertar somente sobre nova oportunidade qualificada, retificação relevante, prazo próximo de uma favorita ou erro persistente. Proposta de lembretes de prazo: 14, 7 e 2 dias antes, sem repetição na mesma janela. Não enviar e-mail ou mensagem a organizadores e não realizar candidatura automática.

Saída: execução agendada demonstrada, ou configuração pronta com dependências pendentes explicitadas. Não declarar monitor ativo sem verificar o primeiro disparo e a atualização dos dados.

## 6. Arquitetura recomendada

Agendador → coletor Python → normalização e evidências → armazenamento → publicação de dados → site → alertas opcionais.

Menor versão útil: coletor externo mantém um SQLite durável e gera JSON para publicação estática. O navegador lê a última coleta publicada; nenhuma coleta ocorre a cada visita. Persistir o SQLite e os snapshots fora do disco efêmero do executor e evitar execuções concorrentes.

Se precisarmos de edição compartilhada, usar backend e banco durável; não simular edição compartilhada com localStorage. Uma alternativa posterior é D1 e Worker para dados e histórico. Nesta versão estática, favoritos são locais e não sincronizam entre dispositivos.

Se o fluxo recorrente usar hospedagem Sites, conferir a capacidade e as referências de atualizações agendadas antes de escolher o mecanismo. Não presumir que um Worker executa Playwright ou subprocessos Python. Coleta com navegador automatizado exige executor compatível separado.

## 7. Modelo dos dados

Oportunidade: ID, organizador, programa, edição, desafio, país/UF, tipo, aderência, descrição, abertura, fim de inscrição com fuso e evidência, execução, vigência do anúncio, valor/moeda/modalidade, contrapartida, elegibilidade, PI, URLs de edital/anexos/retificações, status, data de consulta, justificativa, próximo passo e lacunas.

Requisito: texto, obrigatório/opcional/desconhecido, estado em relação ao perfil, fonte e localização no documento. Não reduzir toda a elegibilidade a um único campo booleano.

Fonte: método, frequência, último sucesso, última tentativa, erro e saúde. Histórico: versão anterior, alteração, instante e evidência. Revisão: analisado, favorito, descartado e motivo; edição compartilhada depende de backend.

## 8. Riscos e controles de qualidade

- Página desatualizada: confrontar prazo com edital e retificações.
- PDF ou imagem de baixa qualidade: sinalizar extração incerta para revisão.
- Fonte bloqueada ou alterada: mostrar erro e preservar histórico.
- Duplicação: identificar edição e desafio, não apenas URL.
- Elegibilidade incompleta: mostrar desconhecido e pedir apenas informação necessária.
- Custo de IA ou pesquisa: limites de execução, cache e processamento só de mudanças.
- Segurança: segredos fora do navegador e do repositório; validar URLs e escapar conteúdo externo.

Não foi estimado preço de provedores. Custos dependem de executor, volume, busca, OCR, IA e notificações; comparar preços vigentes ao escolher os serviços. Não contratar infraestrutura paga silenciosamente.

## 9. Revisão de viabilidade

Após quatro semanas de operação, revisar oportunidades elegíveis, falsos positivos, tempo poupado e manutenção. Limiar proposto, ajustável pelo usuário: duas oportunidades qualificadas ou economia de uma hora por semana, com manutenção inferior ao tempo poupado.

Se o sinal for insuficiente: manter a página e reduzir para revisão semanal, rever termos e fontes; não ampliar coleta sem benefício observado. A revisão não mantém o goal de implementação rodando por quatro semanas: é acompanhamento posterior.

## 10. Brief para iniciar o goal

Implementar e validar o monitor de oportunidades do Radar Games até 31/03/2027, reutilizando o site e o projeto Sites registrados neste checkout. Seguir as etapas A–E deste plano, começando por quatro fontes e pelo perfil do estúdio. Priorizar desafios corporativos com aderência demonstrável a jogos e jogos sérios. Não inventar prazos, recursos ou elegibilidade. Manter histórico, evidências, datas separadas e falhas visíveis. Demonstrar duas execuções idempotentes, retificação e indisponibilidade de fonte. Integrar e publicar os dados no site existente. Preparar o agendamento e só ativar com dependências operacionais definidas. Não candidatar, contatar organizadores ou mudar audiência do site. Encerrar quando os critérios de aceite estiverem comprovados, relatando os limites e qualquer dependência externa pendente.

Este documento prepara um goal futuro. Nenhum goal ou monitor recorrente foi iniciado nesta etapa.

## 11. Fontes da curadoria inicial

- SENAI, regulamento 2025: https://static.portaldaindustria.com.br/media/filer_public/62/98/62980171-27e4-4860-8df5-9dd7338530dc/plataforma_inovacao_2025_24042025_-_atualizacao_28072025.pdf
- AEVO Connect: https://aevo.com.br/connect/
- Conexões Corporativas: https://sementenegocios.com.br/sebraeinovacaoaberta/solucoes/
- Open Corp: https://sebraemulti.com.br/
- Petrobras: https://petrobras.com.br/inovacao-e-tecnologia/inovacao-aberta
- 100 Open Startups: https://www.openstartups.net/br-pt/challenges/
- Enap: https://desafios.enap.gov.br/index.php/pt/
- EEN: https://een.ec.europa.eu/partnering-opportunities/rd-consortium-partners-sought-ai-assisted-game-prototyping-educational
- MEDIA: https://www.oficinamediaespana.eu/noticias/item/6073-convocatorias-video-games-and-immersive-content-development-crea-media-2027-devvgim
- Framework: https://frameworkdigital.com.br/frameworkarcade/

Fontes e conclusões correspondem ao levantamento de 05/11/2026, não a uma garantia de disponibilidade futura. Na rechecagem desta etapa, Open Corp apresentou timeout; a ficha preserva a informação do levantamento inicial e sinaliza a limitação.
