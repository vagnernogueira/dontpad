---
name: dontpad-cli
description: Wrapper para o CLI do Dontpad (https://github.com/vagnernogueira/dontpad). Use esta skill sempre que o usuário quiser ler, criar, atualizar ou configurar documentos no Dontpad via linha de comando. Inclui detecção automática da instalação, orientação para instalar o CLI se não estiver disponível, e execução de todos os comandos do dontpad (get, update, create, config). Dispare quando o usuário mencionar "dontpad", "nota no dontpad", "ler do dontpad", "atualizar dontpad", "criar documento dontpad", ou qualquer operação envolvendo o CLI do Dontpad.
---

# Dontpad CLI

Wrapper inteligente para o CLI do Dontpad. Valida pré-requisitos, executa comandos e retorna saída estruturada.

## Passo 1 — Detectar instalação

Antes de executar qualquer comando, verifique se o CLI está disponível. Execute na seguinte ordem de preferência:

```bash
# 1. Verificar se está instalado globalmente
which dontpad 2>/dev/null

# 2. Verificar se existe via npm link ou ~/.local/bin
ls ~/.local/bin/dontpad 2>/dev/null

# 3. Verificar se o repositório está clonado localmente
find ~ -maxdepth 5 -name "package.json" -path "*/dontpad/cli/*" 2>/dev/null | head -1
```

### Resultado esperado

- **Instalado globalmente** (`which dontpad` retorna um caminho): use `dontpad <comando>` diretamente.
- **Repositório clonado localmente**: use `cd <caminho-do-cli> && npm run dev -- <comando>`.
- **Não encontrado**: siga o guia de instalação abaixo antes de prosseguir.

## Passo 2 — Orientar instalação (se necessário)

Se o CLI não estiver disponível, informe o usuário com os passos exatos:

```
O CLI do Dontpad não foi encontrado no seu sistema. Para instalar:

1. Clone o repositório:
   git clone https://github.com/vagnernogueira/dontpad.git ~/dontpad

2. Instale as dependências e compile:
   cd ~/dontpad/cli
   npm install
   npm run build

3. (Opcional) Instale globalmente para usar como `dontpad`:
   cd ~/dontpad/cli
   npm link

4. Configure o servidor:
   dontpad config set --base-url https://SEU-SERVIDOR-DONTPAD.com

   Ou, se ainda não tiver link global:
   cd ~/dontpad/cli && npm run dev -- config set --base-url https://SEU-SERVIDOR-DONTPAD.com
```

Pré-requisitos: Node.js 20+ e npm 10+. Verifique com `node --version` e `npm --version`.

## Passo 3 — Executar comandos

Após detectar como o CLI está disponível, construa o comando adequado:

| Modo | Prefixo do comando |
|---|---|
| Global (`npm link`) | `dontpad` |
| Local (repo clonado) | `cd <caminho-cli> && npm run dev --` |

### Comandos disponíveis

#### Configuração

```bash
# Definir servidor (obrigatório na primeira vez)
dontpad config set --base-url https://dontpad.vagnernogueira.com

# Definir URL WebSocket explícita (quando não derivável da HTTP)
dontpad config set --base-url https://dontpad.vagnernogueira.com --ws-base-url wss://dontpad.vagnernogueira.com/app

# Definir senha mestra (para acesso administrativo)
dontpad config set --master-password minha-senha

# Ver configuração atual
dontpad config show

# Ver caminho do arquivo de configuração
dontpad config path

# Remover senha mestra sem alterar a URL
dontpad config set --clear-master-password
```

Configuração persiste em `~/.config/dontpad/cli.json` (ou `$XDG_CONFIG_HOME/dontpad/cli.json`).

#### Leitura de documentos (`get`)

```bash
# Ler por URL completa
dontpad get https://dontpad.vagnernogueira.com/teste

# Ler e salvar em arquivo local (sem imprimir no terminal)
dontpad get https://dontpad.vagnernogueira.com/teste --output ./teste.md --no-print

# Ler documento protegido por senha
dontpad get https://dontpad.vagnernogueira.com/secreto/roadmap --password 1234
```

#### Atualização de documentos (`update`)

```bash
# Atualizar a partir de arquivo local
dontpad update https://dontpad.vagnernogueira.com/teste --file ./teste.md

# Atualizar via stdin
printf '# Conteúdo atualizado\n' | dontpad update https://dontpad.vagnernogueira.com/teste --stdin

# Atualizar com conteúdo direto (via argumento)
dontpad update https://dontpad.vagnernogueira.com/teste --content '# Novo conteúdo'
```

O comando `update` substitui o conteúdo completo do documento usando sincronização Yjs/WebSocket.

#### Criação de documentos (`create`)

```bash
# Criar documento em branco
dontpad create drafts/nova-nota

# Criar com conteúdo inicial
dontpad create drafts/nova-nota --content '# Rascunho inicial'
```

O comando `create` só prossegue se o documento estiver vazio (após `trim()`).

#### Ajuda

```bash
dontpad --help
dontpad get --help
dontpad update --help
dontpad create --help
dontpad config --help
```

## Passo 4 — Retornar saída estruturada

Após executar um comando, apresente o resultado de forma clara:

**Para `get`:** mostre o conteúdo do documento (ou confirme o arquivo salvo).

**Para `update` / `create`:** confirme sucesso ou mostre o erro retornado.

**Para `config`:** mostre os valores configurados atualmente.

Em caso de erro, inspecione a mensagem e sugira a correção (ex: URL não configurada → rode `dontpad config set --base-url ...`).

## Snippets prontos para operações comuns

```bash
# Ler e editar um documento
dontpad get https://dontpad.vagnernogueira.com/teste --output /tmp/teste.md
# ... edite o arquivo ...
dontpad update https://dontpad.vagnernogueira.com/teste --file /tmp/teste.md

# Atualizar documento com conteúdo via pipe
echo "# Conteúdo atualizado\n$(date)" | dontpad update https://dontpad.vagnernogueira.com/teste --stdin

# Backup de um documento
dontpad get https://dontpad.vagnernogueira.com/teste --output ~/backups/teste-$(date +%Y%m%d).md --no-print

# Verificar configuração atual antes de operar
dontpad config show
```
