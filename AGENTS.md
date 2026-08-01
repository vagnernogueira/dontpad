# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral

DontPad é um editor de texto colaborativo em tempo real (Markdown), estilo dontpad.com, self-hosted.
Três pacotes independentes coexistem no repositório, **sem workspace npm na raiz**:

- `backend/` — Node.js + Express + WebSocket (`ws`), sincronização CRDT via Yjs, persistência em LevelDB.
- `frontend/` — Vue 3 + Vite + TypeScript, editor CodeMirror 6, PWA (`vite-plugin-pwa`), Tailwind CSS v4, shadcn-vue.
- `cli/` — Node.js + TypeScript + commander.js, cliente de terminal que reutiliza os contratos HTTP/WS existentes (sem endpoints próprios no backend).

Cada pacote tem seu próprio `package.json`, `node_modules`, lint e testes. Instale/rode cada um separadamente.

## Comandos

### Setup

```bash
cp .env.example .env   # definir DOCUMENTS_MASTER_PASSWORD na raiz
make install            # npm install em backend/ e frontend/
cd cli && npm install   # cli/ é instalado à parte
```

### Build e testes (a partir da raiz)

```bash
make test    # roda os testes de backend/ e frontend/
make build   # roda os testes, builda a imagem do backend e a do frontend (podman)
```

### Rodar em desenvolvimento

```bash
make dev-backend    # backend/: nodemon src/server.ts
make dev-frontend   # frontend/: vite --port 3000
```

### Stack conteinerizada (Podman)

```bash
make run    # podman-compose up -d
make stop   # podman-compose down
```

### Lint e formatação (não têm alvo no Makefile — rodar por pacote)

```bash
cd backend && npm run lint      # ou lint:fix / format
cd frontend && npm run lint     # eslint src --ext .ts,.vue
cd cli && npm run lint
```

### Testes de um pacote / de um arquivo específico

Todos os pacotes usam **Vitest**.

```bash
cd backend && npm run test              # YJS_DB_PATH=.tmp/test-yjs-data DOCUMENTS_MASTER_PASSWORD= vitest run
cd backend && npx vitest run src/algum.test.ts

cd frontend && npm run test             # vitest run (ambiente jsdom)
cd frontend && npx vitest run src/__tests__/unit/algum.test.ts
cd frontend && npm run test:watch

cd cli && npm run test
```

- `frontend`: testes ficam em `src/__tests__/{unit,components,composables,cm-extensions,integration}`; setup em `src/__tests__/setup.ts`; cobertura restrita a `src/cm-utils/**` e `src/composables/**`.
- `backend`: os testes exigem `YJS_DB_PATH` apontando para um diretório temporário (já configurado nos scripts npm) para não colidir com o LevelDB de dev.

### CLI (uso manual)

```bash
cd cli
npm run build && npm start -- --help
npm run dev -- config set --base-url http://localhost:3001 --master-password minha-senha
npm run dev -- get me/todo --output ./tmp/todo.md --no-print
printf '# Atualizado\n' | npm run dev -- update me/todo --stdin
npm run dev -- create drafts/nova-nota --content '# Rascunho\n'
```

## Arquitetura

Documentação completa e viva vive em `_docs/` — **leia-a antes de mudanças estruturais**, é a fonte de verdade e deve ser atualizada junto com o código:

- [`_docs/ARCHITECTURE.md`](./_docs/ARCHITECTURE.md) — hub central: visão geral, contratos globais, decisões arquiteturais, mapa de arquivos importantes.
- [`_docs/architecture/backend-runtime.md`](./_docs/architecture/backend-runtime.md) — rotas HTTP/WS, `server.ts`/`sync.ts`, persistência.
- [`_docs/architecture/frontend-editor.md`](./_docs/architecture/frontend-editor.md) — componentes, composables, services do editor.
- [`_docs/architecture/plugins-codemirror.md`](./_docs/architecture/plugins-codemirror.md) — plugins, keymaps, snippets, parser.
- [`_docs/architecture/explorer.md`](./_docs/architecture/explorer.md) — rota administrativa `/explorer`.
- [`_docs/architecture/security.md`](./_docs/architecture/security.md) — lock de documento, senha mestre, riscos conhecidos.
- [`_docs/architecture/deploy-operations.md`](./_docs/architecture/deploy-operations.md) — build, compose, variáveis de ambiente, proxy.
- [`cli/README.md`](./cli/README.md) — documentação detalhada do CLI.

**Regra de atualização da documentação:** mudanças de contrato global (rotas, WS, autenticação) devem atualizar o hub *e* o módulo afetado; mudanças locais de implementação atualizam só o módulo correspondente.

### Fluxo de dados essencial

```
Browser (Vue 3 + CodeMirror 6 + Yjs)
    │  HTTP API + WebSocket (sync Yjs)
Backend (Express + ws, mesmo processo)
    │  y-leveldb
LevelDB (backend/db/yjs-data/)

CLI (commander.js) ──┬─ leitura: GET /api/document-content | /api/public-document-content
                      └─ escrita/criação: mesma sincronização Yjs/WebSocket do editor (sem endpoint próprio)
```

- Sincronização em tempo real usa **Yjs (CRDT)**, não OT — fonte de verdade de consistência entre clientes.
- Nome do documento é derivado do path da URL/WS; documentos são criados implicitamente ao acessar uma URL nova.
- Endpoints administrativos (`/api/documents*`, listagem, rename, delete) exigem header `x-docs-password` (senha mestra, `DOCUMENTS_MASTER_PASSWORD`).
- Endpoint público `GET /api/public-document-content` (usado pelos modos `?pdf`/`?view`/`?raw` e pelo CLI) não exige senha mestra, mas respeita lock por documento.
- Documento lockado por senha própria: handshake WS exige `password` na query; senha inválida fecha a conexão com código `4403`.
- Templates de documentos vivem sob `/_tmpl/` e só são aplicados automaticamente se o documento de destino estiver vazio/novo (`GET /api/document-templates`, público).
- Senhas de documento nunca são armazenadas em texto puro: hash com `scrypt` + comparação `timingSafeEqual`, salt exclusivo por documento.

### Padrões do frontend

- **Commands Pattern** para ações do editor, **Factory Pattern** em services, **Composables Pattern** para lógica reativa (`useYjsEditor`, `useDocumentAccess`, `useCollaborators`, `useExplorerSession`, `useDocumentList`).
- Componentes do editor decompostos: `Editor.vue` orquestra `EditorHeader.vue`, `EditorToolbar.vue`, diálogos focados (`LinkDialog`, `ImageDialog`, `LockDialog`, `AccessDialog`, `ProfileDialog`) via `BaseDialog.vue` (thin wrapper shadcn-vue).
- Barrel indexes em todos os módulos `cm-*`, `services` e `composables`.
- **Ícones:** usar `lucide-vue-next`; nunca `<svg>` inline em templates.
- **shadcn-vue:** rodar a CLI a partir de `frontend/` (`npx shadcn-vue@latest ...` ou `npm run shadcn:info`/`shadcn:add`) — nunca `npx shadcn@latest` na raiz, que não reconhece o workspace real.
- **Tailwind CSS v4 híbrido:** `frontend/src/styles/base.css` é a entrada CSS-first (`@import "tailwindcss"`); `frontend/tailwind.config.js` segue ativo via `@config` para tokens/breakpoints/plugins.
- **PWA:** gerada via `vite-plugin-pwa` (`manifest.webmanifest`, `sw.js`); fallback de navegação restrito a `/` e `/explorer` — não cachear rotas dinâmicas de documento, `?raw`, APIs HTTP ou WebSocket.
- Tipografia local via `@fontsource-variable/*` (sem dependência de Google Fonts).

### Qualidade de código

ESLint v9 (flat config) + typescript-eslint v8 + Prettier v3 em todos os pacotes; `eslint-plugin-vue` só no frontend. Backend usa `eslint.config.mjs` (ESM explícito, pacote é CommonJS). Regras notáveis: `no-explicit-any` em `warn`, `no-unused-vars` em `error` (prefixo `_` é ignorado).

### Limitações conhecidas

- Lock metadata local em JSON não é ideal em cenário multi-réplica sem storage compartilhado.
- Sem rate limiting nativo nas rotas HTTP.
- Sem edição colaborativa offline completa — documentos, auth e estado em tempo real dependem de rede.
