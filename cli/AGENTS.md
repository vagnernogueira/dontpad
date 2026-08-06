# AGENTS.md

Instruções para agentes de IA trabalhando no pacote `cli/` do repositório Dontpad.

## Antes de qualquer análise ou trabalho neste repo

**Obrigatório:** antes de começar qualquer análise, leitura ou edição neste diretório, verifique
se o remoto está à frente do local:

```bash
git fetch origin
git status   # ou: git rev-parse HEAD origin/main
```

Se `origin/main` estiver à frente do `HEAD` local, **avise o usuário** e pergunte se deseja dar
`git pull` (ou `git pull --rebase`) antes de prosseguir. Não presuma que o estado local reflete o
remoto.

**Por quê:** o workflow `.github/workflows/cli-release.yml` (GitHub Actions) gera commits
automáticos neste repo — bump de versão em `package.json` e do badge de release no `README.md` —
sem intervenção manual. Além disso, este repositório é usado a partir de múltiplos ambientes.
Trabalhar sobre um `HEAD` desatualizado pode gerar diffs incorretos, conflitos de rebase, ou
sobrescrever um bump de versão automático.

## Visão geral do pacote

`cli/` é um pacote Node.js + TypeScript independente (sem workspace npm na raiz), cliente de
terminal para uma instância self-hosted do Dontpad. Reutiliza os contratos HTTP/WebSocket já
existentes no backend — não expõe endpoints próprios. Veja `README.md` para uso e
`../CLAUDE.md` (raiz do monorepo) para a arquitetura completa do projeto Dontpad.

## Skill do Claude Code

A skill `dontpad-cli` (usada por agentes Claude Code) vive em `skills/SKILL.md`, com referência
detalhada de comandos em `skills/reference.md`. Mudanças de contrato do CLI (subcomandos, flags,
comportamento) devem manter esses arquivos sincronizados com o código.
