# IA Context — README

## Objetivo

O diretório `_docs/ia-context` define a estrutura oficial de contexto operacional da ferramenta de IA.

## Estrutura

- Core genérico: `_docs/ia-context/core/`
- Overlay do projeto atual: `_docs/ia-context/project-overlay/`

## Ordem de leitura recomendada

1. `_docs/ia-context/core/rules.md`
2. `_docs/ia-context/project-overlay/rules.md`
3. `_docs/ia-context/project-overlay/context.md`
4. `_docs/ia-context/core/workflow.md`
5. `_docs/ia-context/project-overlay/workflow-overrides.md`
6. `_docs/ia-context/core/output-contracts.md`
7. `_docs/ia-context/core/skills/*` (quando aplicável)
8. `_docs/ia-context/core/skills/generate-demand/templates/*` (ponto de partida da demanda, quando usar a skill de geração de demanda)

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
10. `_docs/ia-context/core/skills/*` e seus templates internos aplicáveis à demanda
11. Demais documentos auxiliares em `_docs/`

## Regra prática

- Para elaborar demandas do Dontpad, use a skill `_docs/ia-context/core/skills/generate-demand/SKILL.md` como ponto de partida.

## Arquivos de entrada por ferramenta de IA

Os arquivos abaixo estão em `_docs/ia-context/project-overlay/` e são o ponto de entrada para cada ferramenta. Todos derivam de `CLAUDE.md` (arquivo mestre).

| Arquivo | Ferramenta | Mecanismo de import | Observação |
|---------|-----------|---------------------|------------|
| `CLAUDE.md` | Claude Code | `@path/to/file` (qualquer tipo) | **Mestre** — demais derivam deste |
| `GEMINI.md` | Gemini CLI | `@./arquivo.md` (só `.md`, até 5 níveis) | Inclui `@imports` no final |
| `AGENTS.md` | OpenCode | Não suporta imports no arquivo | Tudo inline + config via `opencode.json` |
| `copilot-instructions.md` | GitHub Copilot | Não suporta imports | Tudo inline |

### Ativação via symlink

**Claude Code** (já ativo):
```bash
# criado na raiz do projeto
ln -s _docs/ia-context/project-overlay/CLAUDE.md CLAUDE.md
```

**Gemini CLI:**
```bash
ln -s _docs/ia-context/project-overlay/GEMINI.md GEMINI.md
```

**GitHub Copilot:**
```bash
ln -s ../_docs/ia-context/project-overlay/copilot-instructions.md .github/copilot-instructions.md
```

**OpenCode:**
```bash
ln -s _docs/ia-context/project-overlay/AGENTS.md AGENTS.md
ln -s _docs/ia-context/project-overlay/opencode.json opencode.json
```
Os arquivos de instrução adicionais estão configurados no `opencode.json` (ver cabeçalho do próprio `AGENTS.md`).
