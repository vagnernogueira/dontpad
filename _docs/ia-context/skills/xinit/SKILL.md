---
name: xinit
description: >-
   Configura os players de IA de um projeto que já adota a estrutura ia-context.
   Use quando o usuário invocar /xinit ou pedir para inicializar, configurar ou
   reinstalar Claude Code, Gemini, Copilot, OpenAgents ou OpenCode no projeto,
   especialmente quando a demanda mencionar os symlinks, dot folders ou
   comandos-base da estrutura canônica.
---

# xinit — Inicialização Multi-Player de IA

Configura automaticamente todos os players de IA suportados em um projeto que já possui a estrutura `ia-context`.

## Quando usar esta skill

Use esta skill somente quando o projeto já tiver a estrutura `ia-context` e o objetivo for criar ou validar a configuração inicial dos players suportados.

## Pré-condições obrigatórias

Antes de qualquer criação, verifique se estas condições são satisfeitas. Se alguma falhar, interrompa e informe o usuário:

1. `_docs/ia-context/project-overlay/` existe e contém os arquivos de overlay
2. `README.md` existe na raiz do projeto
3. `_docs/ARCHITECTURE.md` existe

Verificar também a existência dos arquivos de overlay que serão linkados:

- `_docs/ia-context/project-overlay/CLAUDE.md`
- `_docs/ia-context/project-overlay/GEMINI.md`
- `_docs/ia-context/project-overlay/AGENTS.md`
- `_docs/ia-context/project-overlay/copilot-instructions.md`
- `_docs/ia-context/project-overlay/opencode.json`

Se algum arquivo de overlay estiver ausente, pule o player correspondente e registre como `SKIPPED (overlay ausente)`.

## Players suportados

### 1. Claude Code

**Artefatos:**
- Symlink `CLAUDE.md` → `_docs/ia-context/project-overlay/CLAUDE.md` (relativo)
- Diretório `.claude/commands/`
- Arquivo `.claude/commands/generate-demand.md` (arquivo real, não symlink)
- Arquivo `.claude/commands/doc-blueprint.md` (arquivo real, não symlink)

**Conteúdo exato de `.claude/commands/generate-demand.md`:**
```
Entrada do usuário: $ARGUMENTS

Execute a skill abaixo para converter essa entrada em uma demanda estruturada em Markdown.

@_docs/ia-context/core/skills/generate-demand/SKILL.md
```

**Conteúdo exato de `.claude/commands/doc-blueprint.md`:**
```
Modo solicitado: $ARGUMENTS

Execute a skill abaixo para aplicar o blueprint de documentação no modo indicado acima (`bootstrap`, `review` ou `wave-management`). Se nenhum modo for informado, pergunte antes de prosseguir.

@_docs/ia-context/core/skills/documentation-blueprint/SKILL.md
```

> Os arquivos de commands são arquivos reais com conteúdo fixo — não são symlinks. O padrão `@path` é o mecanismo nativo do Claude Code para referenciar contexto dentro de commands.

> Os commands listados são o conjunto base. Projetos podem adicionar commands específicos após o xinit.

### 2. Gemini

**Artefatos:**
- Symlink `GEMINI.md` → `_docs/ia-context/project-overlay/GEMINI.md` (relativo)

### 3. OpenAgents / Codex

**Artefatos:**
- Symlink `AGENTS.md` → `_docs/ia-context/project-overlay/AGENTS.md` (relativo)

### 4. GitHub Copilot

**Artefatos:**
- Diretório `.github/`
- Symlink `.github/copilot-instructions.md` → `../_docs/ia-context/project-overlay/copilot-instructions.md` (relativo)

### 5. OpenCode

**Artefatos:**
- Symlink `opencode.json` → `_docs/ia-context/project-overlay/opencode.json` (relativo)
- Diretório `.opencode/commands/`
- Diretório `.opencode/skills/`
- Symlink `.opencode/skills/generate-demand` → `../../_docs/ia-context/core/skills/generate-demand` (relativo)

## Regras de execução

- Usar **symlinks relativos** em todos os casos (nunca absolutos), para portabilidade entre máquinas.
- Criar um artefato **apenas se ainda não existir**. Se já existir, registrar como `SKIPPED (já existe)`.
- Criar diretórios pai quando necessário antes de criar symlinks ou arquivos dentro deles.
- Não modificar arquivos de overlay existentes — eles são pré-condição, não responsabilidade desta skill.

## Sequência de execução

Para cada player, na ordem listada acima:

1. Verificar se o arquivo de overlay fonte existe
2. Para cada artefato do player:
   a. Verificar se já existe
   b. Se não existe: criar (symlink ou arquivo, conforme especificado)
   c. Se existe: registrar como skipped
3. Registrar resultado (CREATED / SKIPPED / FAILED) por artefato

## Output contract

Ao final, reportar um resumo com três seções:

```
## Artefatos criados
- <path> → <destino> (ou "arquivo criado" para arquivos reais)

## Artefatos ignorados (já existiam)
- <path>

## Falhas
- <path>: <motivo>
```

Se não houver itens em uma seção, omiti-la ou indicar "nenhum".

Encerrar com uma linha de status geral:
- `xinit concluído — N artefato(s) criado(s), M ignorado(s), K falha(s).`
