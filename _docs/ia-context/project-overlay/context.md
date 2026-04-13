# Dontpad — Contexto do Projeto

## Escopo do projeto (baseline)

- Produto: editor colaborativo de Markdown em tempo real.
- Arquitetura: SPA Vue + backend HTTP/WS com sincronização CRDT (Yjs).
- Núcleo funcional: colaboração, lock por senha, exportação e plugins CodeMirror.

## Baseline factual ancorado no estado atual

### Stack principal

- Frontend: Vue 3, TypeScript, Vite, Tailwind, CodeMirror 6, Yjs.
- Backend: Node.js, TypeScript, Express, WebSocket (`ws`), Yjs.
- Qualidade de código: ESLint v9 (flat config), typescript-eslint v8, eslint-plugin-vue v9 (frontend), Prettier v3.

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

### Qualidade de código

- Configs ESLint por pacote: `frontend/eslint.config.js`, `backend/eslint.config.mjs`.
- Config Prettier compartilhada na raiz: `.prettierrc`.
- Scripts disponíveis em cada pacote: `npm run lint`, `npm run lint:fix`, `npm run format`.
- `no-explicit-any` em `warn`; `no-unused-vars` em `error` (variáveis `_` ignoradas); `vue/multi-word-component-names` desativado.

### Regras de UI/Frontend

- Ícones: preferir `lucide-vue-next`.
- Evitar SVG inline em novos componentes.
- Estrutura modular em `cm-commands`, `cm-extensions`, `cm-plugins`, `cm-utils`, `services`.
- Operações shadcn devem usar o pacote `frontend` como diretório de execução e a CLI `shadcn-vue` (`cd frontend && npx shadcn-vue@latest info`). `npx shadcn@latest` na raiz reporta `Manual` e não representa ausência de configuração.

### Contexto de IA

- A camada de skills é mantida apenas na forma canônica `SKILL.md`; arquivos legados de compatibilidade não fazem parte do fluxo suportado.
