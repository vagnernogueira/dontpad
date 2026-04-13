# IA Context — README

## Objetivo

O diretório `_docs/ia-context` define a estrutura oficial de contexto operacional da ferramenta de IA.

## Estrutura

- Core genérico: `_docs/ia-context/core/`
- Overlay do projeto atual: `_docs/ia-context/project-overlay/`

## Ordem de leitura recomendada

1. `_docs/ia-context/core/rules.md`
2. `_docs/ia-context/project-overlay/rules.md` (se existir)
3. `_docs/ia-context/project-overlay/context.md` (se existir)
4. `_docs/ia-context/core/workflow.md`
5. `_docs/ia-context/project-overlay/workflow-overrides.md` (se existir)
6. `_docs/ia-context/core/output-contracts.md`
7. `_docs/ia-context/skills/*/SKILL.md` (quando aplicável)


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
10. Demais documentos auxiliares em `_docs/`

## Regra prática

- Para elaborar demandas do Dontpad, use a skill canônica `_docs/ia-context/skills/generate-demand/SKILL.md` como ponto de partida.

## Arquivos de entrada por ferramenta de IA

Os arquivos abaixo estão em `_docs/ia-context/project-overlay/` e são o ponto de entrada para cada ferramenta. Todos derivam de `CLAUDE.md` (arquivo mestre).

| Arquivo | Ferramenta | Mecanismo de import | Observação |
|---------|-----------|---------------------|------------|
| `CLAUDE.md` | Claude Code | `@path/to/file` (qualquer tipo) | **Mestre** — demais derivam deste |
| `GEMINI.md` | Gemini CLI | `@./arquivo.md` (só `.md`, até 5 níveis) | Inclui `@imports` no final |
| `AGENTS.md` | OpenCode | Não suporta imports no arquivo | Tudo inline + config via `opencode.json` |
| `copilot-instructions.md` | GitHub Copilot | Não suporta imports | Tudo inline |
