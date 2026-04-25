# Dontpad CLI

Primeira entrega funcional da camada de linha de comando do Dontpad.

O módulo `cli/` é um pacote Node.js isolado, sem dependência de workspace npm na raiz e sem impacto direto nos pacotes `frontend/` e `backend/`.

## Pré-requisitos

- Node.js 20+
- npm 10+

## Instalação

```bash
cd cli
npm install
```

## Build e execução

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

## Configuração persistida

O CLI persiste sua configuração em:

- `${XDG_CONFIG_HOME}/dontpad/cli.json`, quando `XDG_CONFIG_HOME` estiver definido;
- `~/.config/dontpad/cli.json` caso contrário.

Formato atual:

```json
{
  "version": 1,
  "baseUrl": "https://dontpad.example.com",
  "wsBaseUrl": "wss://ws.example.com/app",
  "masterPassword": "optional-secret"
}
```

`wsBaseUrl` é opcional. Quando ausente, o CLI deriva `ws://` ou `wss://` a partir de `baseUrl`.

## Comandos disponíveis

### Ajuda orientada a automação

O CLI expõe ajuda textual previsível na raiz e por comando:

```bash
cd cli
npm run dev -- --help
npm run dev -- get --help
npm run dev -- update --help
npm run dev -- create --help
```

### Configuração

Criar ou atualizar a configuração:

```bash
cd cli
npm run dev -- config set --base-url https://dontpad.example.com
```

Configurar URL WebSocket explícita quando ela não puder ser derivada da HTTP:

```bash
cd cli
npm run dev -- config set --base-url https://dontpad.example.com/app --ws-base-url wss://ws.example.com/app
```

Configurar também a senha mestra opcional:

```bash
cd cli
npm run dev -- config set --base-url https://dontpad.example.com --master-password minha-senha
```

Remover a senha mestra persistida, preservando a URL:

```bash
cd cli
npm run dev -- config set --clear-master-password
```

Consultar o caminho do arquivo:

```bash
cd cli
npm run dev -- config path
```

Exibir a configuração atual:

```bash
cd cli
npm run dev -- config show
```

### Leitura e exportação

Ler um documento por path:

```bash
cd cli
npm run dev -- get me/todo
```

Ler por URL completa e salvar em arquivo local:

```bash
cd cli
npm run dev -- get https://dontpad.example.com/me/todo --output ./tmp/todo.md --no-print
```

Ler um documento protegido por senha de documento:

```bash
cd cli
npm run dev -- get secreto/roadmap --password 1234
```

O comando `get` reutiliza apenas contratos existentes:

- `GET /api/document-content` quando há `masterPassword` configurada ou informada;
- `GET /api/public-document-content` nos demais casos.

### Atualização de conteúdo

Atualizar a partir de arquivo local:

```bash
cd cli
npm run dev -- update me/todo --file ./tmp/todo.md
```

Atualizar via stdin:

```bash
cd cli
printf '# Atualizado pelo CLI\n' | npm run dev -- update me/todo --stdin
```

O comando `update` lê o estado atual via HTTP para verificação e grava o novo conteúdo pela mesma sincronização Yjs/WebSocket usada pelo editor.

### Criação de documento

Criar documento em branco:

```bash
cd cli
npm run dev -- create drafts/nova-nota
```

Criar documento com conteúdo inicial:

```bash
cd cli
npm run dev -- create drafts/nova-nota --content '# Rascunho\n'
```

O comando `create` só prossegue quando o conteúdo atual do documento estiver vazio após `trim()`, alinhado à convenção já usada no backend para documentos vazios.

## Contratos reutilizados

Sem criar endpoints novos, o CLI reutiliza:

- `GET /api/document-content`
- `GET /api/public-document-content`
- fluxo de sync Yjs via WebSocket com `WebsocketProvider`, documento em `codemirror` e parâmetro `password` para documentos protegidos

## Validação recomendada

Para evitar poluir a configuração real do usuário, use `XDG_CONFIG_HOME` temporário:

```bash
cd cli
export XDG_CONFIG_HOME="$(mktemp -d)"
npm run dev -- config set --base-url http://localhost:1234
npm run dev -- --help
npm run dev -- get --help
npm run test
npm run lint
npm run build
```

Com uma instância local do backend em execução, complemente com execuções reais de leitura, atualização e criação usando esse mesmo `XDG_CONFIG_HOME` temporário.