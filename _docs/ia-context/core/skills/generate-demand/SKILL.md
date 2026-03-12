---
name: generate-demand
description: Converte texto bruto em demanda estruturada, escolhe template por complexidade e gera arquivo em agent-workspace/planejamento.
---

# Generate Demand

## When to use this skill

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
- `_docs/ia-context/core/templates/README.md`
- `_docs/ia-context/core/mcp/tool-contracts.md`
- `_docs/ia-context/core/mcp/capability-routing.md`
- `_docs/ia-context/project-overlay/mcp-policy.md`
- `_docs/ia-context/project-overlay/mcp-servers.md`

## Output contract

- Gerar **novo arquivo Markdown** em `agent-workspace/planejamento/`.
- Não editar templates em `core/templates/*`.
- Nome recomendado: `demanda-YYYYMMDD-HHMM-slug.md`.
- O arquivo final MUST conter a seção `Contexto de execução da IA` preenchida.

## Template selection logic

1. `core/templates/01-simple.md`
   - Tarefa rápida, baixo risco, objetivo único.
2. `core/templates/02-ultra-compact.md`
   - Tarefa direta com escopo claro e poucos arquivos-alvo.
3. `core/templates/03-compact.md`
   - Bugfix/melhoria pequena com critérios de aceite e suposições.
4. `core/templates/04-full.md`
   - Demanda complexa, multi-etapas, integração entre módulos ou maior risco.

Fallback: em dúvida entre dois níveis, escolher o template mais completo.

## Steps

1. Extrair intenção principal da demanda bruta.
2. Avaliar complexidade (escopo, risco, dependências, impacto em contrato público).
3. Selecionar template adequado.
4. Preencher template preservando o sentido original.
5. Preencher `Contexto de execução da IA` com referências obrigatórias.
6. Registrar suposições quando houver lacunas críticas.
7. Salvar arquivo final em `agent-workspace/planejamento/`.

## Quality rules

- Não inventar requisitos.
- Não expandir escopo com melhorias paralelas.
- Manter critérios de aceite verificáveis.
- Garantir que o arquivo final seja auto-suficiente para execução da IA.

## Final response format

- Template escolhido + motivo.
- Caminho do arquivo gerado.
- Referências de contexto aplicadas.
- Suposições aplicadas (se houver).
