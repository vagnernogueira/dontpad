# Dontpad — Regras Específicas

## Fontes canônicas e precedência no projeto

1. Código-fonte atual (verdade operacional)
2. `_docs/ARCHITECTURE.md`
3. `README.md`
4. `_docs/ia-context/core/rules.md`
5. `_docs/ia-context/project-overlay/rules.md`
6. `_docs/ia-context/project-overlay/context.md`
7. `_docs/ia-context/core/workflow.md`
8. `_docs/ia-context/project-overlay/workflow-overrides.md`
9. `_docs/ia-context/core/output-contracts.md`
10. `core/skills/*` e seus templates internos aplicáveis à demanda
11. Demais documentos auxiliares em `_docs/`

## Prioridades técnicas específicas

- O agente **SHOULD** priorizar mecanismos nativos do CodeMirror quando aplicável.
- O agente **MUST** preservar comportamento atual, salvo instrução explícita em contrário.
- O agente **MUST** evitar alterações de API pública sem justificativa explícita.
