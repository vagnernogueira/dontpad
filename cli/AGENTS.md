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

## Bump de versão / gerar release

**Obrigatório:** este repo tem um script **compartilhado** de bump de versão na raiz do monorepo
(`../scripts/bump-version.sh` a partir de `cli/`, ou `scripts/bump-version.sh` a partir da raiz) —
**use sempre esse script**, nunca `npm version` manual nem uma sequência de git à mão. Ele cobre os
dois modos de release do monorepo (`app` = backend+frontend, `cli` = este pacote); para o CLI:

```bash
cd /home/vagner/dontpad   # rodar a partir da RAIZ do repo, não de cli/
scripts/bump-version.sh cli X.Y.Z
```

O script (com `set -euo pipefail` e rollback automático em caso de falha):

1. Valida a working tree limpa e o formato `X.Y.Z` do argumento.
2. Atualiza `cli/package.json` e `cli/package-lock.json`.
3. Cria o commit `chore(release): bump cli version to X.Y.Z`.
4. Cria a tag **anotada** `cli-vX.Y.Z` (prefixo `cli-v`, não `v` sozinho — reservado ao modo `app`).
5. Roda `git push --follow-tags`, que dispara `.github/workflows/cli-release.yml` (build dos
   binários, empacotamento de `skills.tar.gz`, publicação da GitHub Release).

Não edite `package.json`/`package-lock.json` manualmente para isso e não crie a tag à mão — o
script já garante working tree limpa, mensagem de commit e push atômicos.

O próprio workflow, depois de rodar, cria um commit automático de bump do badge em
`cli/README.md` direto em `main`. Depois que ele terminar, rode `git fetch origin` e sincronize o
local (ver seção "Antes de qualquer análise ou trabalho neste repo") antes de continuar
trabalhando.

## Visão geral do pacote

`cli/` é um pacote Node.js + TypeScript independente (sem workspace npm na raiz), cliente de
terminal para uma instância self-hosted do Dontpad. Reutiliza os contratos HTTP/WebSocket já
existentes no backend — não expõe endpoints próprios. Veja `README.md` para uso e
`../CLAUDE.md` (raiz do monorepo) para a arquitetura completa do projeto Dontpad.

## Skill do Claude Code

A skill `dontpad-cli` (usada por agentes Claude Code) vive em `skills/SKILL.md`, com referência
detalhada de comandos em `skills/reference.md`. Mudanças de contrato do CLI (subcomandos, flags,
comportamento) devem manter esses arquivos sincronizados com o código.
