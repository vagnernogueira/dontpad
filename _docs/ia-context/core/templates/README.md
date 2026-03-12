# Core Templates — README

## Objetivo

Este diretório reúne os templates de entrada para demandas de desenvolvimento.

## Ordem de uso recomendada

1. `01-simple.md`
2. `02-ultra-compact.md`
3. `03-compact.md`
4. `04-full.md`

## Guia rápido de seleção

| Template              | Quando usar                                                       |
| --------------------- | ----------------------------------------------------------------- |
| `01-simple.md`        | Ajustes rápidos, tarefas curtas e baixo risco.                    |
| `02-ultra-compact.md` | Demandas diretas com escopo claro e poucos arquivos-alvo.         |
| `03-compact.md`       | Bugfixes e melhorias pequenas com critérios de aceite explícitos. |
| `04-full.md`          | Demandas complexas, multi-etapas ou com maior risco de regressão. |

## Regras de uso

- Estes templates são read-only e servem como base.
- A demanda real deve ser criada em um novo arquivo a partir do template selecionado.
- Sempre usar junto de `core/rules.md`, `core/workflow.md`, `core/output-contracts.md` e `project-overlay/*`.
