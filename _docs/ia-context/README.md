# IA Context — README

## Objetivo

O diretório `_docs/ia-context` define a estrutura oficial de contexto operacional da ferramenta de IA.

## Estrutura

- Core genérico: `_docs/ia-context/core/`
- Overlay do projeto atual: `_docs/ia-context/project-overlay/`

## Camada MCP (agnóstica)

- Core MCP: `_docs/ia-context/core/mcp/`
- Políticas do projeto: `_docs/ia-context/project-overlay/mcp-servers.md` e `_docs/ia-context/project-overlay/mcp-policy.md`

## Ordem de leitura recomendada

1. `_docs/ia-context/core/rules.md`
2. `_docs/ia-context/project-overlay/rules.md`
3. `_docs/ia-context/project-overlay/context.md`
4. `_docs/ia-context/core/workflow.md`
5. `_docs/ia-context/project-overlay/workflow-overrides.md`
6. `_docs/ia-context/core/output-contracts.md`
7. `_docs/ia-context/core/mcp/README.md`
8. `_docs/ia-context/core/mcp/tool-contracts.md`
9. `_docs/ia-context/core/mcp/capability-routing.md`
10. `_docs/ia-context/project-overlay/mcp-policy.md`
11. `_docs/ia-context/project-overlay/mcp-servers.md`
12. `_docs/ia-context/core/skills/*` (quando aplicável)
13. `_docs/ia-context/core/templates/*` (ponto de partida da demanda)

## Convenção de precedência (em caso de conflito)

1. Código-fonte atual
2. `_docs/ARCHITECTURE.md`
3. `README.md`
4. `_docs/ia-context/core/rules.md`
5. `_docs/ia-context/project-overlay/rules.md`
6. `_docs/ia-context/project-overlay/context.md`
7. `_docs/ia-context/core/workflow.md`
8. `_docs/ia-context/project-overlay/workflow-overrides.md`
9. `_docs/ia-context/core/output-contracts.md`
10. `_docs/ia-context/core/mcp/tool-contracts.md`
11. `_docs/ia-context/core/mcp/capability-routing.md`
12. `_docs/ia-context/project-overlay/mcp-policy.md`
13. `_docs/ia-context/project-overlay/mcp-servers.md`
14. `_docs/ia-context/core/templates/*` e `_docs/ia-context/core/skills/*` aplicáveis à demanda
15. Demais documentos auxiliares em `_docs/`

## Regra prática

- Para elaborar demandas do Dontpad, use a skill `_docs/ia-context/core/skills/generate-demand/SKILL.md` como ponto de partida.
