---
name: generate-demand
description: >-
   Converte texto bruto em uma demanda estruturada em Markdown, escolhe o
   template adequado e gera o arquivo em agent-workspace/planejamento/. Use
   quando o usuário pedir para transformar notas soltas, briefings incompletos
   ou pedidos informais em uma demanda formal, inclusive com frases como "faça
   uma demanda", "estruture isso" ou "organize o pedido". Quando a demanda
   exigir planejamento da execução, a skill deve encaminhar essa etapa para
   `demand-execution-planning`. Quando houver seção de sugestão de commit, a
   skill deve encaminhar essa etapa para `conventional-commits`.
---

# Generate Demand

## Quando usar esta skill

Use esta skill quando a entrada vier em texto livre (curto, direto ou desorganizado) e você precisar gerar uma demanda formal em Markdown para execução por IA.

Gatilhos comuns:

- `Elabore uma demanda ...`
- `Faça uma demanda ...`
- variações equivalentes (`crie uma demanda`, `estruture esta demanda`).

## Required project references

Ao ativar esta skill, considerar como referências de contexto:

- `_docs/ia-context/README.md`
- `_docs/ia-context/core/rules.md`
- `_docs/ia-context/project-overlay/rules.md`
- `_docs/ia-context/project-overlay/context.md`
- `_docs/ia-context/core/workflow.md`
- `_docs/ia-context/project-overlay/workflow-overrides.md`
- `_docs/ia-context/core/output-contracts.md`

## Templates bundled with this skill

Esta skill usa como base os templates mantidos em `_docs/ia-context/core/skills/generate-demand/templates/`.

Ordem de uso recomendada:

1. `templates/01-simple.md`
2. `templates/02-ultra-compact.md`
3. `templates/03-compact.md`
4. `templates/04-full.md`

Guia rápido de seleção:

| Template | Quando usar |
| --- | --- |
| `templates/01-simple.md` | Ajustes rápidos, tarefas curtas e baixo risco. |
| `templates/02-ultra-compact.md` | Demandas diretas com escopo claro e poucos arquivos-alvo. |
| `templates/03-compact.md` | Bugfixes e melhorias pequenas com critérios de aceite explícitos e seção reservada para planejamento da execução. |
| `templates/04-full.md` | Demandas complexas, multi-etapas ou com maior risco de regressão, com seção reservada para planejamento da execução posterior. |

## Comparative examples

Se o modelo precisar de uma base comparativa para calibrar estrutura, granularidade ou escolha de template, ele SHOULD consultar os exemplos disponíveis em `generate-demand/exemplos/`.

Mapeamento recomendado:

| Template | Exemplo comparativo |
| --- | --- |
| `templates/01-simple.md` | `generate-demand/exemplos/demanda-20260418-0116-limpeza-filtro-explorer.md` |
| `templates/02-ultra-compact.md` | `generate-demand/exemplos/demanda-20260318-2130-header-editor-para-componente.md` |
| `templates/03-compact.md` | `generate-demand/exemplos/demanda-20260415-1825-explorer-selecao-unica-checkbox.md` |
| `templates/04-full.md` | `generate-demand/exemplos/demanda-20260416-0321-backup-geral-explorer.md` |

Esses exemplos são apenas referência de forma e densidade de informação. A skill MUST preservar o escopo da demanda recebida e não copiar conteúdo que introduza requisitos inexistentes.

## Output contract

- Gerar **novo arquivo Markdown** em `agent-workspace/planejamento/`.
- Não editar templates em `core/skills/generate-demand/templates/*`.
- Os templates são read-only e servem como base para um novo arquivo.
- Nome recomendado: `demanda-YYYYMMDD-HHMM-slug.md`.
- O arquivo final MUST conter a seção `Contexto de execução da IA` preenchida.
- Se o template escolhido for `templates/03-compact.md` ou `templates/04-full.md`, o arquivo final MUST conter a seção `Planejamento da execução`, mas essa seção MUST ficar em branco ou conter apenas uma observação curta orientando o uso da skill `demand-execution-planning`.
- O arquivo final MUST manter a seção `Sugestão de commit final`, mas essa seção MUST ficar em branco ou conter apenas uma observação curta orientando o uso da skill `conventional-commits`.
- Ao concluir a geração da demanda, a resposta final MUST orientar explicitamente o modelo a usar a skill `demand-execution-planning` para preencher ou revisar o planejamento da execução.
- Ao concluir a geração da demanda, a resposta final MUST orientar explicitamente o modelo a usar a skill `conventional-commits` para sugerir a mensagem de commit.

## Template selection logic

1. `core/skills/generate-demand/templates/01-simple.md`
   - Tarefa rápida, baixo risco, objetivo único.
2. `core/skills/generate-demand/templates/02-ultra-compact.md`
   - Tarefa direta com escopo claro e poucos arquivos-alvo.
3. `core/skills/generate-demand/templates/03-compact.md`
   - Bugfix/melhoria pequena com critérios de aceite, suposições e seção reservada para planejamento de execução posterior.
4. `core/skills/generate-demand/templates/04-full.md`
   - Demanda complexa, multi-etapas, integração entre módulos ou maior risco, exigindo seção reservada para planejamento de execução posterior.

Fallback: em dúvida entre dois níveis, escolher o template mais completo.

## Planning handoff for templates 3 and 4

Ao escolher `templates/03-compact.md` ou `templates/04-full.md`, a skill deve estruturar a demanda, mas não deve elaborar o planejamento da execução.

Regras para esse handoff:

- Manter a seção `Planejamento da execução` presente no arquivo final.
- Deixar essa seção em branco ou preencher apenas com uma observação curta, por exemplo: `> Planejamento pendente. Use a skill demand-execution-planning para preencher ou revisar esta seção.`
- Não antecipar etapas, fases ou estratégias detalhadas nessa skill.
- Não substituir a skill `demand-execution-planning` por planejamento manual dentro desta skill.
- Ao finalizar, instruir explicitamente o próximo passo: usar `demand-execution-planning` sobre a demanda recém-gerada.

## Commit handoff

Quando o template incluir a seção `Sugestão de commit final`, a skill deve preservá-la, mas não deve propor a mensagem de commit diretamente.

Regras para esse handoff:

- Manter a seção `Sugestão de commit final` presente no arquivo final.
- Deixar essa seção em branco ou preencher apenas com uma observação curta, por exemplo: `> Mensagem de commit pendente. Use a skill conventional-commits para sugerir a mensagem final.`
- Não escrever mensagem de commit candidata nesta skill.
- Ao finalizar, instruir explicitamente o próximo passo: usar `conventional-commits` com base na demanda gerada e, se necessário, no diff final.

## Steps

1. Extrair intenção principal da demanda bruta.
2. Avaliar complexidade (escopo, risco, dependências, impacto em contrato público).
3. Selecionar template adequado.
4. Se houver dúvida de estrutura, granularidade ou aderência ao template, consultar o exemplo comparativo correspondente em `generate-demand/exemplos/`.
5. Se o template escolhido for `templates/03-compact.md` ou `templates/04-full.md`, preparar a seção `Planejamento da execução` apenas como placeholder para preenchimento posterior via `demand-execution-planning`.
6. Preencher template preservando o sentido original.
7. Preencher `Contexto de execução da IA` com referências obrigatórias.
8. Quando aplicável, manter `Planejamento da execução` vazio ou com uma observação curta de handoff para `demand-execution-planning`.
9. Manter `Sugestão de commit final` vazia ou com uma observação curta de handoff para `conventional-commits`.
10. Registrar suposições quando houver lacunas críticas.
11. Salvar arquivo final em `agent-workspace/planejamento/`.
12. Na resposta final, orientar o modelo a usar a skill `demand-execution-planning` na demanda gerada.
13. Na resposta final, orientar o modelo a usar a skill `conventional-commits` para sugerir a mensagem de commit.

## Quality rules

- Não inventar requisitos.
- Não expandir escopo com melhorias paralelas.
- Manter critérios de aceite verificáveis.
- Usar exemplos de `generate-demand/exemplos/` apenas como base comparativa de estrutura e nível de detalhe, nunca como fonte de requisitos.
- Quando usar os templates 3 ou 4, não preencher o planejamento da execução com conteúdo operacional; deixar apenas o placeholder ou a observação de handoff.
- Não preencher `Sugestão de commit final` com uma mensagem concreta; deixar apenas o placeholder ou a observação de handoff para `conventional-commits`.
- Garantir que o arquivo final seja auto-suficiente para execução da IA.
- Garantir que a resposta final indique explicitamente o uso da skill `demand-execution-planning` como próximo passo.
- Garantir que a resposta final indique explicitamente o uso da skill `conventional-commits` para a mensagem de commit.

## Final response format

- Template escolhido + motivo.
- Caminho do arquivo gerado.
- Referências de contexto aplicadas.
- Encaminhamento aplicado para planejamento (`usar demand-execution-planning`).
- Encaminhamento aplicado para commit (`usar conventional-commits`).
- Suposições aplicadas (se houver).
