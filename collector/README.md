# Coletor do Radar Games

Coleta manual de fontes públicas de editais, fomento, programas de empreendedorismo e financiamento de jogos. Sem envio de inscrições, mensagens, acordos ou dados pessoais. Perfil de curadoria atual: MG/GO, sem CNPJ.

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

## Arquivos

- `sources.json`: 20 fontes, URLs e anexos de partida. Adicionar um portal aqui amplia a cobertura da próxima execução.
- `reviewed.json`: fonte de verdade das 16 fichas conferidas e seus requisitos. Alterar esse arquivo para atualizar a curadoria; os JS de dados são gerados.
- `state/state.json`: estado por fonte, hashes, tentativas, último sucesso, documentos e datas com contexto.
- `state/snapshots/`: evidências públicas baixadas; PDFs e HTML preservados por hash.
- `state/review-queue.json`: links deduplicados a revisar, incluindo documentos e listagens. Não é lista de editais abertos.
- `../dist/data.js`, `application.js`, `collection-status.js`: dados publicados na página.

O estado e as bibliotecas instaladas são ignorados pelo Git. O pacote de entrega não inclui snapshots ou dependências; usar o comando de instalação acima.

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

Depois da revisão, executar `--build-only`. Para a versão hospedada, empacotar e publicar no mesmo projeto Sites; executar o coletor local **não publica sozinho na nuvem**. A cópia local pode ser aberta com `python -m http.server 8765 --directory ../dist`.

## Estado desta entrega

A coleta foi executada de verdade nas 20 fontes. 17 tiveram sucesso e 3 falharam: Enap (404), EEN (robots indisponível/recusado) e SENAI (timeout). A página mostra essas limitações. Duas fontes repetidas retornaram `unchanged`. Os links foram reindexados para remover navegação genérica e manter documentos/chamadas na fila.

Não há agendamento ou backend remoto ativo. A recorrência exige escolher um executor compatível com Python, persistir `state`, configurar a publicação dos dados e verificar o primeiro disparo. Não rodar com intervalos agressivos. Descoberta por busca web continua complementar ao scraping das fontes cadastradas; os resultados da pesquisa desta entrega foram revisados antes da inclusão.
