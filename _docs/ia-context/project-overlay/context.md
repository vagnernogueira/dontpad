# Dontpad — Contexto do Projeto

## Escopo do projeto (baseline)

- Produto: editor colaborativo de Markdown em tempo real.
- Arquitetura: SPA Vue + backend HTTP/WS com sincronização CRDT (Yjs).
- Núcleo funcional: colaboração, lock por senha, exportação e plugins CodeMirror.

## Baseline factual ancorado no estado atual

### Stack principal

- Frontend: Vue 3, TypeScript, Vite, Tailwind, CodeMirror 6, Yjs.
- Backend: Node.js, TypeScript, Express, WebSocket (`ws`), Yjs.

### Persistência e sincronização

- Persistência colaborativa via `y-leveldb` (LevelDB local).
- Lock de documentos em `backend/db/document-locks.json`.
- Sincronização em tempo real via `y-websocket`.

### APIs existentes

- `GET /api/health`
- `GET /api/documents` (protegida por `x-docs-password`)
- `GET /api/document-lock`
- `POST /api/document-lock`
- `DELETE /api/document-lock`
- `POST /api/document-access`

### Regras de UI/Frontend

- Ícones: preferir `lucide-vue-next`.
- Evitar SVG inline em novos componentes.
- Estrutura modular em `cm-commands`, `cm-extensions`, `cm-plugins`, `cm-utils`, `services`.
