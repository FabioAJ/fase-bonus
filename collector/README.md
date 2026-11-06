# Coletor do Radar Games

Coleta manual de fontes públicas de editais, fomento, programas de empreendedorismo e financiamento de jogos. Sem envio de inscrições, mensagens, acordos ou dados pessoais. Cobertura nacional, com canais internacionais complementares. CNPJ e estado são filtros; não há aba exclusiva por perfil.

## Executar

No diretório `collector`, usando Python 3.11 ou superior:

```powershell
python -m pip install --target vendor -r requirements.txt
python radar_collect.py --max-details 1 --workers 3
```

Consultar apenas fontes escolhidas:

```powershell
python radar_collect.py --source bndes --source centelhamg --source centelhago
```

Regerar os dados do site sem acessar a internet:

```powershell
python radar_collect.py --build-only
```

Testes:

```powershell
python -m unittest discover -s . -p "test_*.py" -v
```

Os testes de PDF usam um documento real da coleta e são pulados se ainda não houver PDF em `state/snapshots`. Os demais testes não acessam a rede. O ambiente restrito do Codex no Windows pode exigir execução autorizada fora do sandbox para a rede, leitura das dependências e temporários.

Procurar editais de jogos em bases nacionais, por palavra-chave (PNCP e Querido Diário):

```powershell
python radar_collect.py --discover
```

Os achados aparecem na aba Buscar mais como itens a revisar e nunca viram ficha sozinhos. Base fora do ar não apaga os achados anteriores. Os termos ficam em `GAME_TERMS`, e os filtros de ruído em `GAME_RE`, `CALL_RE` e `NOISE_RE`, no `radar_collect.py`.

## Arquivos

- `sources.json`: 66 fontes, URLs e anexos de partida. Adicionar um portal aqui amplia a cobertura da próxima execução.
- `reviewed.json`: fonte de verdade das 55 fichas conferidas e seus requisitos. Toda ficha precisa de `pays`, `modality`, `oppType`, `gameFocus` e `explicitGames`. Alterar esse arquivo para atualizar a curadoria; os JS de dados são gerados.
- `state/state.json`: estado por fonte, hashes, tentativas, último sucesso, documentos e datas com contexto.
- `state/snapshots/`: evidências públicas baixadas; PDFs e HTML preservados por hash.
- `state/review-queue.json`: links deduplicados a revisar, incluindo documentos e listagens. Não é lista de editais abertos.
- `../dist/data.js`, `application.js`, `collection-status.js`: dados publicados na página.

`state/state.json` e `state/review-queue.json` ficam no Git, para a coleta semanal continuar de onde parou. Os snapshots e as bibliotecas instaladas são ignorados; usar o comando de instalação acima.

## O que a coleta faz

1. Consulta `robots.txt` e recusa acesso quando não autorizado ou indisponível de forma insegura.
2. Faz tentativas limitadas, com timeout, intervalo por domínio, limite de 8 MB e até 100 páginas de texto por PDF.
3. Lê HTML e PDFs textuais; identifica documentos ligados ao portal e limita o número de anexos por execução.
4. Normaliza URLs preservando edição/parâmetros relevantes, elimina rastreadores e separa datas pelo contexto (inscrição, execução, resultado ou desconhecido).
5. Preserva o último documento válido quando há falha e exibe erro ou coleta parcial. Mudança no conteúdo é detectada por hash.
6. Exporta uma fila de revisão; não promove automaticamente um link para oportunidade aberta ou elegível.
7. Publica apenas fichas revisadas, com prazo vencido automaticamente retirado da categoria atual. Prazo com horário é comparado com fuso; prazo sem horário usa o dia de São Paulo.

## Revisar novas descobertas

Consultar a fonte original e registrar no `reviewed.json`: prazo de candidatura e evidência, modalidade, apoio individual, CNPJ na inscrição e contratação, território, requisitos, anexos, impedimentos e fonte. Distinguir `possible` (pode iniciar a inscrição/pitch no perfil informado), `conditional`, `blocked` e `prepare`. Mesmo uma ficha `possible` exige avaliar projeto, equipe e regras completas.

Para a aba atual, `category` pode ser `current`, `watch` ou `closed`. Financiamento privado ou formação não são chamados de contrato ou subvenção. Usar `closeDate` (ISO) e, quando conhecido, `closeAt` (ISO com fuso). Não inferir uma data de inscrição a partir da execução ou da publicação do resultado.

Depois da revisão, executar `--build-only`, fazer commit e push na `main`: o GitHub publica o site. A cópia local pode ser aberta com `python -m http.server 8765 --directory ../dist`.

## Estado desta entrega

A aba Fontes mostra quantas fontes foram lidas, as falhas e os motivos. Nada vira ficha sem revisão.

A coleta roda toda segunda-feira pelo GitHub Actions (`.github/workflows/coleta.yml`), que grava o estado no repositório e dispara a publicação. O resumo de cada rodada fica na aba Actions. Não rodar com intervalos agressivos: o coletor respeita `robots.txt`, e alguns portais podem recusar os servidores do GitHub. Falha numa fonte preserva o último dado bom. A pesquisa na web continua complementar ao que o coletor lê.

## Filtros nacionais

O site oferece 26 estados e o Distrito Federal. Ao escolher uma UF, entram chamadas nacionais e as territorialmente vinculadas à UF; canais internacionais continuam disponíveis sem o filtro de estado. Isso não prova cobertura exaustiva de todos os editais de cada estado.

`requiresCnpjAtApplication` usa true, false ou null. O filtro Sim/Não aplica-se à inscrição; null aparece apenas em Qualquer. Formalização posterior e contratação permanecem na ficha. `territoryScope`, `states` e `territoryLabel` registram abrangência conferida, sem inferir elegibilidade a partir do local do evento.

Validação dos filtros: `node test_filters.cjs` a partir de collector. A pesquisa ampliada adicionou 13 fichas: quatro atuais, quatro anúncios/ciclos em acompanhamento e cinco edições encerradas. Situação atual: 18 atuais, 11 em acompanhamento e 8 encerradas.


HTML com cinco ou mais marcadores de template não renderizados é recusado. Fontes com required_text precisam conter os termos da chamada na leitura HTTP; navegação ou rodapé isolado não conta como leitura da chamada.
