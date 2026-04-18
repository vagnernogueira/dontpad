---
name: demand-execution-planning
description: >-
  Use esta skill sempre que o usuário tiver uma demanda Markdown já pronta e
  quiser adicionar, escrever, revisar, reescrever ou fortalecer o plano de
  execução dentro da própria demanda. Acione mesmo se ele falar apenas em
  plano, planejamento, etapas ou seção, ou disser que a demanda precisa ficar
  pronta para outra IA executar. Serve para inserir ou corrigir a seção
  `Planejamento da execução`, trocar etapas vagas por etapas acionáveis e
  alinhar o plano aos arquivos, módulos e critérios já citados no `.md`,
  inclusive em demandas simple, ultra-compact, compact e full. Não use para
  criar a demanda do zero, implementar código, revisar arquitetura, montar
  cronograma da squad ou executar a demanda.
---

# Demand Execution Planning

## Quando usar esta skill

Use esta skill quando a demanda já existe em Markdown e o próximo passo é
deixá-la pronta para execução por outra IA ou por um agente executor.

Gatilhos comuns:

- `planeje a execução desta demanda`
- `revise o planejamento da execução`
- `adicione a seção Planejamento da execução`
- `complete a demanda com um plano de execução`
- `reescreva as etapas para ficarem mais acionáveis`

Não use esta skill como primeira opção para texto ainda bruto ou briefing
informal. Se a entrada ainda não estiver organizada como demanda, prefira usar
`generate-demand` primeiro e só depois aplicar esta skill.

## Objetivo operacional

Esta skill tem dois modos de operação:

### 1) plan

Use quando a demanda não tiver a seção `Planejamento da execução` ou quando as
etapas estiverem ausentes, vagas demais ou insuficientes para orientar a
execução.

### 2) review

Use quando a seção já existir, mas precisar de revisão para ficar mais clara,
sequencial, aderente ao escopo e alinhada aos critérios de aceite.

Regra principal: se a demanda não tiver a seção `Planejamento da execução`, a
skill MUST inseri-la, independentemente do template de origem.

## Referências obrigatórias

Ao ativar esta skill, ler nesta ordem:

1. A demanda alvo que será atualizada.
2. `demand-execution-planning/references/planning-placement.md` para detectar o
   ponto correto de inserção e a profundidade esperada do plano.
3. `generate-demand/exemplos/` para calibrar forma, densidade e estilo do
   template correspondente.

Mapeamento recomendado de exemplos:

| Template detectado | Exemplo comparativo |
| --- | --- |
| `simple` | `generate-demand/exemplos/demanda-20260418-0116-limpeza-filtro-explorer.md` |
| `ultra-compact` | `generate-demand/exemplos/demanda-20260318-2130-header-editor-para-componente.md` |
| `compact` | `generate-demand/exemplos/demanda-20260415-1825-explorer-selecao-unica-checkbox.md` |
| `full` | `generate-demand/exemplos/demanda-20260416-0321-backup-geral-explorer.md` |

Esses exemplos servem para calibrar estrutura e nível de detalhe. Eles MUST NOT
ser usados como fonte de requisitos para a demanda atual.

## Contrato de saída

Esta skill não produz um plano solto como saída principal. Ela deve escrever o
planejamento dentro da própria demanda.

Regras de saída:

- Se o usuário apontar um arquivo Markdown, editar o mesmo arquivo in-place.
- Se o usuário colar a demanda em texto, devolver a demanda completa já com a
  seção atualizada.
- Preservar título, seções existentes, ordem geral do documento e linguagem
  original.
- Preservar a integridade dos blocos já existentes do template; não quebrar uma
  seção estruturante no meio apenas para encaixar o planejamento.
- Usar exatamente o heading `## Planejamento da execução`.
- Se a seção já existir, revisar preferencialmente apenas essa seção, sem
  reescrever o restante da demanda sem necessidade.
- Se a seção não existir, inseri-la no ponto correto do documento, mesmo em
  templates que originalmente não a preveem.

## Como construir um bom planejamento

O planejamento deve ser curto o bastante para caber na demanda, mas concreto o
bastante para orientar a execução sem exigir interpretação excessiva.

Critérios mínimos:

- Organizar as etapas em ordem lógica de execução.
- Cada etapa deve começar com um verbo de ação claro.
- Fazer referência a arquivos, módulos, fluxos ou critérios quando a demanda já
  trouxer esses nomes.
- Quando a demanda listar arquivos, componentes, serviços, eventos ou contratos
  concretos, reaproveitar esses identificadores no planejamento em vez de cair
  em termos genéricos como `frontend`, `backend` ou `componente alvo`.
- Cobrir descoberta inicial, intervenção principal e validação final.
- Refletir o `Tipo de saída` da demanda: análise, plano, implementação ou
  revisão.
- Permanecer estritamente dentro do escopo; não introduzir melhorias paralelas.

Regras de profundidade por complexidade:

- Demandas simples ou ultra-compact: normalmente 3 etapas curtas.
- Demandas compact: normalmente 3 ou 4 etapas.
- Demandas full ou multi-módulo: normalmente 4 a 6 etapas.

Regras adicionais de ancoragem:

- Se a demanda tiver `Arquivos-alvo`, `Arquivos ou módulos-alvo` ou
  `Arquivos ou módulos suspeitos`, citar explicitamente esses artefatos em pelo
  menos 2 etapas quando isso for natural para o caso.
- Se a demanda trouxer padrões de referência, como um componente análogo,
  evento, prop, rota, serviço ou contrato, reaproveitar esses nomes na etapa em
  que eles influenciam a execução.
- Em modo `review`, preferir reforçar a ligação do planejamento com a fonte de
  verdade já nomeada na demanda em vez de reescrever o plano em termos genéricos.

Regras por tipo de saída:

- `análise`: priorizar leitura de contexto, comparação de evidências e síntese
  de conclusões verificáveis.
- `revisão`: priorizar inspeção do artefato atual, identificação de desvios e
  validação dos ajustes.
- `implementação`: priorizar mapeamento do estado atual, alteração mínima e
  validação objetiva.
- `plano`: decompor dependências, sequência de execução e checagens de saída.
- Se o tipo não estiver explícito, inferir pelo conteúdo da demanda e garantir
  pelo menos uma etapa final de validação.

Evite estes problemas comuns:

- Etapas genéricas como `fazer os ajustes necessários`.
- Etapas que repetem o texto da demanda sem adicionar ação concreta.
- Etapas genéricas que ignoram nomes já presentes na demanda, como arquivos,
  módulos, eventos ou contratos.
- Etapas que criam escopo novo, testes irrelevantes ou refatorações paralelas.
- Planos muito longos para demandas pequenas.
- Planos sem etapa final de validação ligada aos critérios de aceite.
- Inserir `## Planejamento da execução` no meio de uma lista ou bloco que o
  template usa como unidade única, quando houver um ponto natural logo após esse
  bloco.

## Detecção do template

Detecte o template observando headings e densidade da demanda:

- `simple`: possui `## Instruções`, `## Demanda` e `## Sugestão de commit final`.
- `ultra-compact`: possui `## Entrada mínima` com campos curtos como
  `Demanda`, `Objetivo`, `Escopo` e `Arquivos-alvo`.
- `compact`: possui `## Objetivo`, `## Escopo`, `## Arquivos ou módulos-alvo`,
  `## Critérios de aceite` e normalmente já contém `## Planejamento da execução`.
- `full`: possui seções adicionais como `## Restrições`,
  `## Contexto técnico adicional`, `## Riscos conhecidos` e um planejamento mais
  profundo.

Se a demanda não casar exatamente com um template, use a referência de
posicionamento e aplique a regra de fallback para documentos customizados.

## Regras de preservação estrutural

Antes de inserir uma nova seção, verificar se o template atual concentra seus
campos dentro de um único bloco maior.

- Em templates como `ultra-compact`, `## Entrada mínima` funciona como um bloco
  fechado. Nesses casos, não inserir `## Planejamento da execução` entre campos
  irmãos desse mesmo bloco; concluir o bloco e adicionar o planejamento logo
  depois.
- Quando houver listas de campos com marcadores (`- **Demanda:**`,
  `- **Objetivo:**`, `- **Tipo de saída:**`), preservar a ordem interna desses
  campos.
- Ao revisar uma demanda, evitar mover seções existentes sem necessidade.

## Workflow

1. Ler a demanda inteira antes de editar qualquer trecho.
2. Detectar template, tipo de saída e modo (`plan` ou `review`).
3. Consultar o exemplo equivalente em `generate-demand/exemplos/` apenas para
   calibrar densidade e ordem de seções.
4. Identificar se há um bloco estrutural que não deve ser quebrado, como
  `## Entrada mínima` no template ultra-compact.
5. Inserir ou revisar `## Planejamento da execução` no ponto adequado do
  documento, preservando a integridade desse bloco.
6. Garantir que as etapas sejam sequenciais, acionáveis e alinhadas ao escopo,
  critérios de aceite, restrições e artefatos já nomeados na demanda.
7. Validar que o documento final continua auto-suficiente para execução futura.

## Quality rules

- Não inventar fatos nem arquivos que a demanda não sugere.
- Não alterar objetivo, escopo, restrições ou critérios de aceite sem pedido
  explícito.
- Não transformar a skill em um gerador de demanda completo; ela atua sobre uma
  demanda que já existe.
- Manter a seção de planejamento em português quando a demanda estiver em
  português.
- Preferir frases diretas e específicas nas etapas.
- Sempre que revisar um planejamento existente, melhorar ordem, clareza e
  verificabilidade antes de aumentar o número de etapas.
- Em demandas com artefatos explicitamente nomeados, preferir planos que os
  mencionem de forma concreta.
- Em templates ultra-compact, manter `## Entrada mínima` intacto e adicionar o
  planejamento como nova seção top-level depois desse bloco.

## Final response format

Depois de atualizar a demanda, responder com:

- modo aplicado (`plan` ou `review`);
- template detectado;
- arquivo alterado ou confirmação de que a demanda completa foi reescrita;
- resumo curto do que mudou no planejamento;
- suposições aplicadas, se houver.