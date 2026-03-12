# IA Context — README

## Objetivo

Este diretório define a estrutura oficial de contexto operacional da ferramenta de IA.

## Estrutura

- Core genérico: `core/`
- Overlay do projeto atual: `project-overlay/`

## Ordem de leitura recomendada

1. `core/rules.md`
2. `project-overlay/rules.md`
3. `project-overlay/context.md`
4. `core/workflow.md`
5. `project-overlay/workflow-overrides.md`
6. `core/output-contracts.md`
7. `core/skills/*` (quando aplicável)
8. `core/templates/*` (ponto de partida da demanda)

## Convenção de precedência (em caso de conflito)

1. Código-fonte atual
2. `_docs/ARCHITETURE.md`
3. `README.md`
4. `_docs/ia-context/core/rules.md`
5. `_docs/ia-context/project-overlay/rules.md`
6. `_docs/ia-context/project-overlay/context.md`
7. `_docs/ia-context/core/workflow.md`
8. `_docs/ia-context/project-overlay/workflow-overrides.md`
9. `_docs/ia-context/core/output-contracts.md`
10. `core/templates/*` e `core/skills/*` aplicáveis à demanda
11. Demais documentos auxiliares em `_docs/`

## Regra prática

- Para demandas do Dontpad, use `core/templates/*` com `project-overlay/*` como contexto específico.
