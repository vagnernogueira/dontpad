[![release](https://img.shields.io/badge/release-v0.1.1-blue)](https://github.com/vagnernogueira/dontpad/releases)

# Dontpad CLI

CLI para leitura, exportação, criação e atualização de documentos Markdown em uma
instância self-hosted do [Dontpad](https://github.com/vagnernogueira/dontpad),
reutilizando os mesmos contratos HTTP e WebSocket/Yjs do editor web.

O módulo `cli/` é um pacote Node.js isolado, sem dependência de workspace npm na raiz
e sem impacto direto nos pacotes `frontend/` e `backend/`.

## Pré-requisitos

- Node.js 20+ (apenas para build a partir do código-fonte)
- npm 10+ (apenas para build a partir do código-fonte)

## Instalação

### Via npm (Node.js runtime)

```bash
cd cli
npm install
```

### Via GitHub Release (binário standalone, sem Node.js)

Baixe o binário da [página de releases](https://github.com/vagnernogueira/dontpad/releases) —
procure pela tag `cli-v*` mais recente. Cada release publica artefatos para as três
plataformas suportadas:

| Plataforma     | Artefato                     | SHA-256                          |
|----------------|------------------------------|----------------------------------|
| Linux x64      | `dontpad-linux-x64`          | `dontpad-linux-x64.sha256`       |
| macOS arm64    | `dontpad-darwin-arm64`       | `dontpad-darwin-arm64.sha256`    |
| Windows x64    | `dontpad-win-x64.exe`        | `dontpad-win-x64.exe.sha256`     |

**Linux / macOS:**

```bash
# Download do binário (substitua X.Y.Z pela versão desejada)
curl -LO https://github.com/vagnernogueira/dontpad/releases/download/cli-vX.Y.Z/dontpad-linux-x64

# Verificação da soma SHA-256
curl -LO https://github.com/vagnernogueira/dontpad/releases/download/cli-vX.Y.Z/dontpad-linux-x64.sha256
sha256sum -c dontpad-linux-x64.sha256

# Tornar executável e mover para o PATH
chmod +x dontpad-linux-x64
sudo mv dontpad-linux-x64 /usr/local/bin/dontpad
```

Para macOS arm64, troque `linux-x64` por `darwin-arm64`.

**Windows (PowerShell):**

```powershell
# Download do binário (substitua X.Y.Z pela versão desejada)
Invoke-WebRequest -Uri "https://github.com/vagnernogueira/dontpad/releases/download/cli-vX.Y.Z/dontpad-win-x64.exe" -OutFile "dontpad.exe"

# Verificação da soma SHA-256
Invoke-WebRequest -Uri "https://github.com/vagnernogueira/dontpad/releases/download/cli-vX.Y.Z/dontpad-win-x64.exe.sha256" -OutFile "dontpad.exe.sha256"
Get-FileHash dontpad.exe -Algorithm SHA256 | Select-Object -ExpandProperty Hash
Get-Content dontpad.exe.sha256
```

Após a instalação, verifique:

```bash
dontpad --version
```

## Build e execução (a partir do código-fonte)

```bash
cd cli
npm run build
npm start -- --help
```

Para desenvolvimento sem build prévio:

```bash
cd cli
npm run dev -- --help
```

### Binários standalone (build local)

Para compilar executáveis autossuficientes (sem dependência do Node.js em runtime):

```bash
cd cli
npm run build
npm run build:binary
```

O script em `cli/scripts/build-binary.mjs` tenta `bun build --compile` primeiro
(compilação cruzada nativa) e faz fallback para `nexe` por alvo. Os artefatos
`são gerados na raiz do pacote para as três plataformas.

A versão exibida por `--version` é embutida em tempo de build pelo `tsup`, então
cada binário reporta sua própria versão mesmo sem um `package.json` adjacente.

## Uso

### Ajuda

```bash
dontpad --help
dontpad cli update --help
dontpad skill --help
dontpad get --help
dontpad update --help
dontpad create --help
dontpad config --help
```

### Configuração

O CLI persiste sua configuração em `${XDG_CONFIG_HOME}/dontpad/cli.json` ou
`~/.config/dontpad/cli.json`.

```bash
dontpad config set --base-url https://dontpad.example.com
dontpad config set --base-url https://dontpad.example.com --master-password minha-senha
dontpad config show
dontpad config path
```

### Leitura e exportação

```bash
dontpad get me/todo
dontpad get https://dontpad.example.com/me/todo --output ./tmp/todo.md --no-print
dontpad get secreto/roadmap --password 1234
```

### Atualização de conteúdo

```bash
dontpad update me/todo --file ./tmp/todo.md
printf '# Atualizado pelo CLI\n' | dontpad update me/todo --stdin
```

### Criação de documento

```bash
dontpad create drafts/nova-nota
dontpad create drafts/nova-nota --content '# Rascunho\n'
```

### Auto-update do binário (standalone)

> Disponível apenas no binário standalone compilado (não em instalações via npm).

O subcomando `cli update` verifica a página de releases em busca de uma tag `cli-v*`
mais recente que a versão local, baixa o artefato da plataforma atual, verifica a
soma SHA-256 e substitui o binário atomicamente:

```bash
# Apenas verificar se há nova versão
dontpad cli update --check-only

# Atualizar (com confirmação interativa)
dontpad cli update

# Atualizar sem confirmação (automação)
dontpad cli update --yes

# Reinstalar a versão atual
dontpad cli update --force --yes
```

**Segurança:**

- A URL do asset é validada contra o padrão canônico de release do repositório.
- O checksum SHA-256 é baixado separadamente e verificado.
- A substituição é atômica no mesmo filesystem; o binário anterior é preservado
  como `<binary>.bak` e restaurado em caso de falha.
- Em Windows, o auto-update é desabilitado porque um `.exe` em execução não pode
  ser substituído atomicamente.

### Gerenciamento da skill

O subcomando `skill` gerencia a instalação da skill `dontpad-cli` para Claude Code
a partir do mesmo release `cli-v*`:

```bash
dontpad skill install
dontpad skill install --force
dontpad skill install --target /opt/agents/dontpad-cli

dontpad skill update

dontpad skill status
dontpad skill status --json

dontpad skill uninstall
```

O artefato `skills.tar.gz` (SHA-256 em `skills.tar.gz.sha256`) é baixado do release,
verificado, extraído e instalado atomicamente no diretório alvo. O diretório padrão é
`~/.claude/skills/dontpad-cli`. Metadados são persistidos em `~/.config/dontpad/skill.json`.

## Contratos reutilizados

Sem criar endpoints novos, o CLI reutiliza:

- `GET /api/document-content`
- `GET /api/public-document-content`
- fluxo de sync Yjs via WebSocket com `WebsocketProvider`

## Validação recomendada

Para evitar poluir a configuração real do usuário, use `XDG_CONFIG_HOME` temporário:

```bash
cd cli
export XDG_CONFIG_HOME="$(mktemp -d)"
npm run dev -- config set --base-url http://localhost:1234
npm run dev -- --help
npm run test
npm run lint
```
