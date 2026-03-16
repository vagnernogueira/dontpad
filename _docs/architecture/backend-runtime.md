# Backend Runtime (Express + WebSocket + Yjs)

## Escopo

Este módulo cobre execução backend, contratos HTTP/WS, persistência CRDT, lock de documentos e responsabilidades de `server.ts` e `sync.ts`.

## Donos

- Time de Desenvolvimento DontPad

## Arquivos-fonte principais

- `backend/src/server.ts`
- `backend/src/sync.ts`
- `backend/db/document-locks.json`
- `backend/db/document-metadata.json`
- `backend/db/yjs-data/`

## Arquitetura de execução

- Processo Node único com Express + WebSocketServer;
- `server.ts` expõe rotas REST e delega sync/auth WS para `sync.ts`;
- `sync.ts` integra `y-websocket` e `y-leveldb`.

## Responsabilidades por módulo

### `server.ts`

- Boot de `Express` com `cors()` e `express.json()`;
- Criação de servidor HTTP e acoplamento WebSocket;
- Exposição das rotas de saúde, listagem, conteúdo administrativo, conteúdo público por URL parametrizada, rename, delete, lock e access;
- Delegação da validação de acesso e persistência para `sync.ts`.

### `sync.ts`

- Persistência incremental CRDT em LevelDB (`yjs-data`);
- Gestão de lock e metadados (memória + disco);
- Controle de estado de documento aberto por sessões WS;
- Hash de senha com `scrypt` + comparação `timingSafeEqual`;
- Wrapper de `setupWSConnection` com gate de autorização para docs lockados.

## Contratos HTTP

Endpoints administrativos exigem header `x-docs-password` (senha mestra válida):

- `GET /api/health`
- `GET /api/documents`
- `GET /api/document-content?documentId=...`
- `POST /api/documents/rename`
- `DELETE /api/documents`

Endpoint de conteúdo para modos por URL parametrizada (sem `x-docs-password`):

- `GET /api/public-document-content?documentId=...&password=...`
	- se documento não estiver travado: retorna conteúdo;
	- se documento estiver travado: exige senha válida do documento;
	- senha inválida: `403` com `invalid_password`.

Endpoints de lock/acesso:

- `GET /api/document-lock?documentId=...`
- `POST /api/document-lock`
- `DELETE /api/document-lock`
- `POST /api/document-access`

## Contrato WebSocket

- Frontend conecta no endpoint base de `VITE_BACKEND_WS_URL`;
- Nome do documento é derivado do path;
- Para documento lockado, handshake exige `password` na query;
- Senha inválida fecha conexão com código `4403`.

## Fluxos críticos

### Handshake autorizado

1. Cliente conecta em `/api/<doc>?password=...`;
2. `server.ts` repassa para `setupWSConnection`;
3. `sync.ts` normaliza `docName` e valida lock/senha;
4. conexão é aceita ou recusada (`4403`).

### Persistência incremental

1. Update Yjs é gerado;
2. Hook de bind registra update;
3. `storeUpdate(docName, update)` persiste em LevelDB;
4. estado é restaurado no próximo bind.

## Decisões arquiteturais

- **LevelDB + y-leveldb:** simplicidade de operação self-hosted;
- **Lock metadata em JSON:** transparência e portabilidade;
- **API + WS no mesmo processo:** menos complexidade e menor latência interna.

## Limitações conhecidas

- Lock metadata local dificulta multi-réplica sem storage compartilhado;
- Observabilidade ainda sem stack estruturada completa (métricas/tracing);
- Rate limiting HTTP não nativo.

## Quando atualizar

Atualizar este módulo ao alterar:

- contratos de rotas `/api/*`;
- handshake/autorização WS;
- mecanismo de persistência CRDT;
- estratégia de lock/senha mestre.
