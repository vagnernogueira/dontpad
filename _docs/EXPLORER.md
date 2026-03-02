# Explorer de Documentos

## Objetivo

Documentar a funcionalidade de gestão administrativa de documentos na rota protegida /explorer.

## Acesso

- Rota: /explorer
- Requisito: senha mestra válida
- Fonte da senha mestra: variável de ambiente DOCUMENTS_MASTER_PASSWORD no backend
- Comportamento obrigatório: acessar /explorer não cria documento automaticamente

## Conceitos

- Documento vazio: conteúdo inexistente ou com apenas espaços/quebras de linha. Regra: trim() resulta em string vazia.
- Documento aberto: existe ao menos uma sessão WebSocket ativa para a rota do documento.

## Listagem

A tela lista todos os documentos com as colunas:

- Seleção (checkbox com seleção única)
- Nome
- Data de criação
- Data de alteração
- Travado (S/N)
- Vazio (S/N)
- Aberto (S/N)

Regras de listagem:

- Ordenação padrão por data de alteração (mais recentes primeiro)
- Ordenação por qualquer coluna
- Busca por nome com filtro por contains
- Clique no nome abre documento em nova aba

## Funcionalidades de item

As ações operam somente sobre o documento selecionado:

- Renomear
- Remover
- Download em markdown
- Download em PDF
- Travar

## Backend e endpoints

Todos os endpoints administrativos exigem header x-docs-password com a senha mestra válida.

- GET /api/documents
  - Retorna lista de documentos e summaries usados no Explorer
- GET /api/document-content?documentId=...
  - Retorna conteúdo markdown do documento para exportação
- POST /api/documents/rename
  - Renomeia documento
- DELETE /api/documents
  - Remove documento

Endpoints de lock e acesso continuam válidos:

- GET /api/document-lock?documentId=...
- POST /api/document-lock
- DELETE /api/document-lock
- POST /api/document-access

## Arquivos principais

- frontend/src/components/Explorer.vue
- frontend/src/services/document-api.ts
- frontend/src/main.ts
- backend/src/server.ts
- backend/src/sync.ts
