# Explorer de Documentos

## Escopo

Documenta a funcionalidade administrativa da rota protegida `/explorer`: acesso, listagem, ações por item e contratos de backend.

## Donos

- Time de Desenvolvimento DontPad

## Arquivos-fonte principais

- `frontend/src/components/Explorer.vue` — componente de UI (orquestra composables)
- `frontend/src/composables/useExplorerSession.ts` — autenticação e ciclo de vida da sessão
- `frontend/src/composables/useDocumentList.ts` — listagem, filtro e ordenação
- `frontend/src/services/document-api.ts`
- `frontend/src/main.ts`
- `backend/src/server.ts`
- `backend/src/sync.ts`

## Acesso

- rota: `/explorer`;
- requisito: senha mestra válida;
- fonte da senha mestra: `DOCUMENTS_MASTER_PASSWORD` no backend;
- comportamento obrigatório: acessar `/explorer` não cria documento automaticamente.

## Conceitos

- **Documento vazio:** `trim()` do conteúdo retorna string vazia;
- **Documento aberto:** há ao menos uma sessão WebSocket ativa para o documento.

## Arquitetura do componente

`Explorer.vue` orquestra dois composables:

- `useExplorerSession(api)` — controla autenticação com senha mestra, estado da sessão (`hasAccess`, `masterPasswordInput`, `authError`) e método `unlock`;
- `useDocumentList(api, password)` — gerencia listagem, busca (`search`), ordenação, seleção (`selectedDocumentName`) e refresh.

O componente foca exclusivamente em template, eventos de UI e ações que delegam para os composables.

## Listagem

Colunas da tela:

- seleção (checkbox com seleção única);
- nome;
- data de criação;
- data de alteração;
- travado (S/N);
- vazio (S/N);
- aberto (S/N).

Regras:

- ordenação padrão por alteração (desc);
- ordenação por qualquer coluna;
- busca por nome com `contains`;
- clique no nome abre o documento em nova aba.

## Ações por item

- renomear;
- remover;
- download Markdown;
- download PDF;
- travar.

## Endpoints usados

Todos endpoints administrativos exigem `x-docs-password` válido.

- `GET /api/documents`
- `GET /api/document-content?documentId=...`
- `POST /api/documents/rename`
- `DELETE /api/documents`

Endpoints de lock/acesso também utilizados:

- `GET /api/document-lock?documentId=...`
- `POST /api/document-lock`
- `DELETE /api/document-lock`
- `POST /api/document-access`

## Quando atualizar

Atualizar este módulo ao alterar:

- comportamento de seleção/listagem no Explorer;
- composables `useExplorerSession` ou `useDocumentList`;
- regras de autorização da rota `/explorer`;
- contratos de endpoints administrativos;
- ações disponíveis por item.
