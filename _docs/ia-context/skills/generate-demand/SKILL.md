---
name: generate-demand
description: >-
    Use esta skill sempre que o usuário trouxer texto bruto, notas soltas,
    briefing parcial ou um pedido informal e quiser transformar isso em uma
    demanda Markdown pronta para execução por IA. Acione mesmo se ele não disser
    "demanda", mas pedir para estruturar, formalizar, organizar, consolidar ou
    preparar o pedido para outra IA ou agente executar. Esta skill escolhe o
    template correto em `templates/`, gera um novo arquivo em `agent-workspace/`,
    diretório relativo à raiz do repositório, preenche `Contexto de execução da
    IA` e deixa handoffs explícitos para `demand-execution-planning` em
    `Planejamento da execução`, para o preenchimento posterior de `Memorial de
    execução` e para `conventional-commits` em `Sugestão de commit final`. Não
    use para elaborar o planejamento em detalhe, implementar a demanda ou
    revisar apenas uma demanda já pronta sem recriá-la.
---

# Generate Demand

## Convenções normativas

Nesta skill, use estas palavras com sentido normativo:

- `MUST`: requisito obrigatório.
- `MUST NOT`: comportamento proibido.
- `MUST HAVE`: seção, campo ou artefato obrigatório no resultado final.
- `SHOULD`: recomendação forte; só desvie se houver motivo claro no caso.
- `MAY`: opção permitida quando não conflitar com o contrato principal.

## Quando usar esta skill

Use esta skill quando a entrada ainda não estiver organizada como demanda, mas
já existir informação suficiente para produzir um `.md` executável por IA.

Gatilhos comuns:

- `faça uma demanda com isso`
- `estruture esse pedido`
- `organize essas notas em uma demanda`
- `transforme esse briefing em uma demanda`
- `deixe isso pronto para outra IA executar`

Acione esta skill mesmo quando o usuário não citar templates, Markdown ou
`agent-workspace/`, desde que a necessidade real seja transformar texto bruto em
uma demanda formal.

## Quando não usar esta skill

Não use esta skill como primeira opção nestes casos:

- A demanda já existe em Markdown e o trabalho agora é só preencher ou revisar
   `## Planejamento da execução`. Nesse caso, use `demand-execution-planning`.
- O trabalho pedido é implementar a demanda, revisar código ou executar o plano.
- O objetivo é apenas sugerir a mensagem de commit. Nesse caso, use
   `conventional-commits`.

## Objetivo operacional

Esta skill existe para converter entrada bruta em um artefato único, claro e
auto-suficiente para execução posterior por IA.

Ao ativar esta skill, você MUST:

1. extrair objetivo, escopo, restrições, arquivos citados e critérios implícitos
    do texto bruto;
2. escolher o menor template que comporte o caso sem perder contexto relevante;
3. gerar uma nova demanda Markdown em `agent-workspace/`, relativo à raiz do
    repositório;
4. preservar handoffs explícitos para planejamento, memorial e commit, sem
    executar essas etapas dentro desta skill.

## Referências obrigatórias

Leia estas referências nesta ordem antes de escrever a demanda:

1. `_docs/ia-context/README.md`
2. `_docs/ia-context/core/rules.md`
3. `_docs/ia-context/project-overlay/rules.md`
4. `_docs/ia-context/project-overlay/context.md`
5. `_docs/ia-context/core/workflow.md`
6. `_docs/ia-context/core/output-contracts.md`

Você MUST tratar arquivos de override em
`_docs/ia-context/project-overlay/` como contexto opcional. Só inclua um
override, como `workflow-overrides.md`, se ele realmente existir no repositório
alvo e se for aplicável à demanda. Se o arquivo não existir, você MUST NOT
citar esse override em `Contexto de execução da IA`.

## Templates desta skill

Use os templates locais em `templates/` como base read-only. Eles existem para
padronizar densidade, ordem de seções e profundidade da demanda.

Ordem preferencial de seleção:

1. `templates/01-simple.md`
2. `templates/02-ultra-compact.md`
3. `templates/03-compact.md`
4. `templates/04-full.md`

Guia rápido de seleção:

| Template | Quando usar |
| --- | --- |
| `templates/01-simple.md` | Ajuste rápido, objetivo único, baixo risco e pouca ambiguidade. |
| `templates/02-ultra-compact.md` | Demanda direta, escopo claro e poucos arquivos-alvo. |
| `templates/03-compact.md` | Bugfix ou melhoria pequena com critérios de aceite explícitos. |
| `templates/04-full.md` | Caso multi-etapas, com maior risco, dependências ou impacto transversal. |

Regra de fallback: se você estiver em dúvida entre dois níveis, SHOULD escolher
o template mais completo. É melhor sobrar estrutura do que perder contexto
operacional importante.

## Exemplos comparativos

Quando houver dúvida sobre forma, granularidade ou aderência ao template,
consultar o exemplo correspondente em `exemplos/`.

Mapeamento recomendado:

| Template | Exemplo comparativo |
| --- | --- |
| `templates/01-simple.md` | `exemplos/demanda-20260418-0116-limpeza-filtro-explorer.md` |
| `templates/02-ultra-compact.md` | `exemplos/demanda-20260318-2130-header-editor-para-componente.md` |
| `templates/03-compact.md` | `exemplos/demanda-20260415-1825-explorer-selecao-unica-checkbox.md` |
| `templates/04-full.md` | `exemplos/demanda-20260416-0321-backup-geral-explorer.md` |

Os exemplos SHOULD servir apenas para calibrar estrutura, tom e densidade. Eles
MUST NOT introduzir requisitos, arquivos, validações ou estratégias que não
vieram da demanda atual.

## Contrato de saída

Esta skill produz um novo arquivo Markdown. Ela não reescreve templates nem
substitui as skills downstream responsáveis pelos handoffs.

Regras obrigatórias:

- O arquivo final MUST ser criado em `agent-workspace/`, diretório relativo à
   raiz do repositório alvo. Se a pasta não existir, você MUST criá-la.
- O arquivo final MUST usar um template local em `templates/` como base, mas
   você MUST NOT editar arquivos em `templates/`.
- O arquivo final SHOULD usar o nome `demanda-YYYYMMDD-HHMM-slug.md`.
- O arquivo final MUST HAVE a seção `Contexto de execução da IA` preenchida.
- `Contexto de execução da IA` MUST listar as referências obrigatórias na ordem
   acima e MAY acrescentar overrides existentes e aplicáveis.
- `Contexto de execução da IA` MUST omitir referências de override quando não
   houver override existente e aplicável.
- O arquivo final MUST HAVE a seção `Planejamento da execução` com exatamente o
   heading `## Planejamento da execução`.
- O arquivo final MUST HAVE a seção `Memorial de execução`.
- O arquivo final MUST HAVE a seção `Sugestão de commit final`.
- O arquivo final MUST preservar o objetivo real da demanda recebida, sem
   inventar requisitos, arquivos ou etapas paralelas.
- O arquivo final MUST permanecer auto-suficiente para outra IA executar a
   demanda sem depender da conversa original para entender objetivo, escopo,
   restrições e critérios de sucesso.

## Lógica de seleção de template

1. `templates/01-simple.md`
    - Tarefa rápida, baixo risco, objetivo único e pouca dependência externa.
2. `templates/02-ultra-compact.md`
   - Tarefa direta com escopo claro e poucos arquivos-alvo.
3. `templates/03-compact.md`
   - Bugfix/melhoria pequena com critérios de aceite e suposições explícitas.
4. `templates/04-full.md`
   - Demanda complexa, multi-etapas, integração entre módulos ou maior risco.

Fallback: em dúvida entre dois níveis, escolher o template mais completo.

## Handoff de planejamento

O planejamento existe para a próxima skill operar sobre uma demanda já pronta.
Por isso, esta skill MUST estruturar a demanda, mas MUST NOT elaborar o plano de
execução dentro dela.

Regras para esse handoff:

- A seção `Planejamento da execução` MUST permanecer presente no arquivo final.
- A seção MUST usar este placeholder para manter consistência entre templates:
   `> Planejamento pendente. Use a skill demand-execution-planning para preencher ou revisar esta seção.`
- Você MUST NOT antecipar etapas, fases, estratégias detalhadas ou validações de
   execução dentro desta skill.
- Você MUST NOT substituir `demand-execution-planning` por planejamento manual.
- A resposta final MUST orientar explicitamente o uso de
   `demand-execution-planning` como próximo passo.

## Handoff de memorial

O memorial registra o que aconteceu na execução, não o que ainda vai acontecer.
Por isso, a geração inicial da demanda MUST deixar apenas um handoff curto.

Regras para esse handoff:

- A seção `Memorial de execução` MUST permanecer presente no arquivo final.
- A versão inicial da demanda MUST conter uma observação curta de handoff nessa
   seção.
- Você MUST NOT registrar resumo de execução, arquivos alterados, impactos ou
   validações antes que o atendimento ou a execução tenham sido concluídos.
- Você MUST usar uma observação compatível com o template escolhido:
   - `simple` e `ultra-compact`: `> Memorial pendente. Ao final da execução ou atendimento da demanda, adicione o resumo da execução, a lista de arquivos alterados e as validações recomendadas.`
   - `compact`: `> Memorial pendente. Ao final da execução ou atendimento da demanda, adicione o resumo da execução, a lista de arquivos alterados, os impactos identificados ou esperados, as validações executadas e as validações recomendadas.`
   - `full`: `> Memorial pendente. Ao final da execução ou atendimento da demanda, adicione a descrição da execução, a lista de arquivos alterados, os impactos identificados ou esperados, as validações executadas e as validações recomendadas.`
- A resposta final MUST orientar explicitamente que `Memorial de execução` só
   deve ser preenchido no encerramento do atendimento ou da execução.

## Handoff de commit

A mensagem de commit depende do resultado final do trabalho. Por isso, esta
skill MUST preservar a seção, mas MUST NOT propor a mensagem concreta.

Regras para esse handoff:

- A seção `Sugestão de commit final` MUST permanecer presente no arquivo final.
- A seção MUST usar este placeholder:
   `> Mensagem de commit pendente. Use a skill conventional-commits para sugerir a mensagem final.`
- Você MUST NOT escrever uma mensagem de commit candidata nesta skill.
- A resposta final MUST orientar explicitamente o uso de `conventional-commits`
   com base na demanda gerada e, se necessário, no diff final.

## Workflow

1. Ler a entrada inteira antes de escrever qualquer trecho.
2. Extrair intenção principal, tipo de saída, restrições, artefatos citados e
    critérios de aceite explícitos ou implícitos.
3. Confirmar mentalmente que o problema é gerar uma nova demanda, não apenas
    revisar planejamento ou sugerir commit.
4. Ler as referências obrigatórias e verificar se há overrides existentes e
    aplicáveis no repositório alvo.
5. Escolher o template adequado em `templates/`.
6. Se houver dúvida de estrutura, granularidade ou ordem de seções, consultar o
    exemplo comparativo correspondente em `exemplos/`.
7. Preencher o template preservando o sentido original da solicitação e
    transformando ambiguidades em suposições explícitas apenas quando isso for
    necessário para manter a demanda executável.
8. Preencher `Contexto de execução da IA` com as referências obrigatórias e com
    overrides existentes e aplicáveis, sem citar arquivos inexistentes.
9. Inserir o handoff de `Planejamento da execução` sem antecipar etapas de
    execução.
10. Inserir o handoff de `Memorial de execução` compatível com o template.
11. Inserir o handoff de `Sugestão de commit final` sem sugerir a mensagem.
12. Validar que o documento final está auto-suficiente, coerente com o escopo e
    salvo em `agent-workspace/`, relativo à raiz do repositório.
13. Responder de forma curta e operacional, indicando os próximos handoffs.

## Checklist de qualidade

- Você MUST NOT inventar requisitos, arquivos, módulos, validações ou riscos que
   a demanda não sugere.
- Você MUST NOT expandir o escopo com melhorias paralelas, refactors laterais ou
   tarefas não pedidas.
- Você MUST manter critérios de aceite verificáveis sempre que eles existirem ou
   puderem ser inferidos com segurança.
- Você MUST preservar nomes de arquivos, módulos, rotas, eventos, contratos ou
   componentes já citados pelo usuário.
- Você MUST citar overrides apenas quando eles existirem no repositório e forem
   aplicáveis à demanda.
- Você MUST NOT preencher `Planejamento da execução` com conteúdo operacional;
   deixe apenas o handoff.
- Você MUST NOT preencher `Memorial de execução` com conteúdo de execução antes
   do encerramento do atendimento.
- Você MUST NOT preencher `Sugestão de commit final` com uma mensagem concreta.
- Você SHOULD manter a linguagem da demanda em português quando a entrada estiver
   em português, preservando termos técnicos e identificadores no idioma original
   quando necessário.
- Você SHOULD preferir frases diretas, densas e acionáveis.

Antes de salvar, confirme mentalmente:

- o heading é exatamente `## Planejamento da execução`;
- `Contexto de execução da IA` não cita overrides inexistentes;
- o memorial contém apenas handoff compatível com o template;
- a seção de commit não contém mensagem candidata;
- o escopo final continua fiel ao texto bruto do usuário.

## Formato da resposta final

Depois de gerar a demanda, a resposta final MUST seguir esta estrutura:

- `Template escolhido:` informar o template e o motivo curto da escolha.
- `Arquivo gerado:` informar o caminho do arquivo salvo em `agent-workspace/`.
- `Referências aplicadas:` listar as referências obrigatórias e os overrides
   existentes que foram incluídos.
- `Handoff de planejamento:` indicar explicitamente `usar demand-execution-planning`.
- `Handoff de memorial:` indicar explicitamente `preencher ao final do atendimento/execução`.
- `Handoff de commit:` indicar explicitamente `usar conventional-commits`.
- `Suposições aplicadas:` listar as suposições materiais; se não houver, dizer
   `nenhuma`.
