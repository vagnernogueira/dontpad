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

**Obrigatório:** este repo **não tem** um `scripts/bump-version.sh` dedicado (diferente de repos
irmãos como `aave-cli` e `llama-cli`, que têm esse script). O padrão real aqui, confirmado pelo
histórico de commits (`chore(release): bump cli version to X.Y.Z`) e por `.github/workflows/cli-release.yml`,
é manual e deve seguir exatamente esta sequência — não invente uma variação:

1. Working tree limpa e sincronizada com `origin/main` (ver seção acima).
2. A partir de `cli/`, rode:
   ```bash
   npm version <patch|minor|major> --no-git-tag-version
   ```
   Isso atualiza `package.json` e `package-lock.json` sem criar tag automaticamente.
3. Commit **apenas** desses dois arquivos, com a mensagem exata:
   ```bash
   git add cli/package.json cli/package-lock.json
   git commit -m "chore(release): bump cli version to X.Y.Z"
   ```
4. Crie a tag com o prefixo `cli-v` — **não** `v` sozinho, que é reservado a um eventual
   versionamento do app inteiro:
   ```bash
   git tag cli-vX.Y.Z
   ```
5. Push do commit e da tag:
   ```bash
   git push origin main
   git push origin cli-vX.Y.Z
   ```
   O push da tag `cli-v*` dispara `.github/workflows/cli-release.yml`, que builda os binários,
   empacota `skills.tar.gz` e publica a GitHub Release — não há necessidade (nem script) para
   fazer isso manualmente.
6. O próprio workflow cria um commit automático de bump do badge em `README.md` direto em `main`.
   Depois que o workflow terminar, rode `git fetch origin` e sincronize o local (ver seção
   "Antes de qualquer análise ou trabalho neste repo") antes de continuar trabalhando.

## Visão geral do pacote

`cli/` é um pacote Node.js + TypeScript independente (sem workspace npm na raiz), cliente de
terminal para uma instância self-hosted do Dontpad. Reutiliza os contratos HTTP/WebSocket já
existentes no backend — não expõe endpoints próprios. Veja `README.md` para uso e
`../CLAUDE.md` (raiz do monorepo) para a arquitetura completa do projeto Dontpad.

## Skill do Claude Code

A skill `dontpad-cli` (usada por agentes Claude Code) vive em `skills/SKILL.md`, com referência
detalhada de comandos em `skills/reference.md`. Mudanças de contrato do CLI (subcomandos, flags,
comportamento) devem manter esses arquivos sincronizados com o código.
