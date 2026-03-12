# Explorer de Documentos

## Escopo

Documenta a funcionalidade administrativa da rota protegida `/explorer`: acesso, listagem, ações por item e contratos de backend.

## Donos

- Time de Desenvolvimento DontPad

## Arquivos-fonte principais

- `frontend/src/components/Explorer.vue`
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
- regras de autorização da rota `/explorer`;
- contratos de endpoints administrativos;
- ações disponíveis por item.
