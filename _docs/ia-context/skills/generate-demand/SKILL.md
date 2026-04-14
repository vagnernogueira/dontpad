---
name: generate-demand
description: >-
   Converte texto bruto em uma demanda estruturada em Markdown, escolhe o
   template adequado e gera o arquivo em agent-workspace/planejamento/. Use
   quando o usuário pedir para transformar notas soltas, briefings incompletos
   ou pedidos informais em uma demanda formal, inclusive com frases como "faça
   uma demanda", "estruture isso" ou "organize o pedido".
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
| `templates/03-compact.md` | Bugfixes e melhorias pequenas com critérios de aceite explícitos e planejamento de execução definido. |
| `templates/04-full.md` | Demandas complexas, multi-etapas ou com maior risco de regressão, com planejamento de execução detalhado. |

## Output contract

- Gerar **novo arquivo Markdown** em `agent-workspace/planejamento/`.
- Não editar templates em `core/skills/generate-demand/templates/*`.
- Os templates são read-only e servem como base para um novo arquivo.
- Nome recomendado: `demanda-YYYYMMDD-HHMM-slug.md`.
- O arquivo final MUST conter a seção `Contexto de execução da IA` preenchida.
- Se o template escolhido for `templates/03-compact.md` ou `templates/04-full.md`, o arquivo final MUST conter a seção `Planejamento da execução` preenchida com etapas ou fases enumeradas.

## Template selection logic

1. `core/skills/generate-demand/templates/01-simple.md`
   - Tarefa rápida, baixo risco, objetivo único.
2. `core/skills/generate-demand/templates/02-ultra-compact.md`
   - Tarefa direta com escopo claro e poucos arquivos-alvo.
3. `core/skills/generate-demand/templates/03-compact.md`
   - Bugfix/melhoria pequena com critérios de aceite, suposições e planejamento de execução.
4. `core/skills/generate-demand/templates/04-full.md`
   - Demanda complexa, multi-etapas, integração entre módulos ou maior risco, exigindo planejamento de execução mais detalhado.

Fallback: em dúvida entre dois níveis, escolher o template mais completo.

## Planning behavior for templates 3 and 4

Ao escolher `templates/03-compact.md` ou `templates/04-full.md`, a skill não deve apenas estruturar a demanda: ela também deve planejar a execução.

Regras para esse planejamento:

- Preencher a seção `Planejamento da execução` com etapas ou fases concretas, em ordem lógica de execução.
- Enumerar as etapas de forma explícita no conteúdo final.
- Manter o planejamento dentro do escopo solicitado, sem adicionar entregas paralelas.
- Se houver um agente de planejamento disponível no ambiente de IA, ele SHOULD ser usado para propor ou refinar as etapas antes de gravar o arquivo final.
- Se esse agente não estiver disponível, a própria skill MUST elaborar o planejamento com base na demanda recebida.
- O planejamento deve ser suficiente para orientar a execução posterior da demanda por outra IA ou agente executor.

## Steps

1. Extrair intenção principal da demanda bruta.
2. Avaliar complexidade (escopo, risco, dependências, impacto em contrato público).
3. Selecionar template adequado.
4. Se o template escolhido for `templates/03-compact.md` ou `templates/04-full.md`, elaborar o planejamento da execução com etapas ou fases enumeradas; usar agente de planejamento se disponível no ambiente.
5. Preencher template preservando o sentido original.
6. Preencher `Contexto de execução da IA` com referências obrigatórias.
7. Preencher `Planejamento da execução` quando aplicável.
8. Registrar suposições quando houver lacunas críticas.
9. Salvar arquivo final em `agent-workspace/planejamento/`.

## Quality rules

- Não inventar requisitos.
- Não expandir escopo com melhorias paralelas.
- Manter critérios de aceite verificáveis.
- Quando usar os templates 3 ou 4, garantir que o planejamento da execução esteja claro, enumerado e acionável.
- Garantir que o arquivo final seja auto-suficiente para execução da IA.

## Final response format

- Template escolhido + motivo.
- Caminho do arquivo gerado.
- Referências de contexto aplicadas.
- Estratégia de planejamento aplicada (`agente de planejamento` ou `planejamento manual pela skill`).
- Suposições aplicadas (se houver).
