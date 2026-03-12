# Frontend Editor (Vue + CodeMirror + Yjs)

## Escopo

Este módulo documenta a arquitetura do frontend focada no editor colaborativo: componentes, comandos, extensões, plugins, serviços e fluxos de dados no browser.

## Donos

- Time de Desenvolvimento DontPad

## Arquivos-fonte principais

- `frontend/src/components/Editor.vue`
- `frontend/src/components/Home.vue`
- `frontend/src/components/Explorer.vue`
- `frontend/src/cm-commands/*`
- `frontend/src/cm-extensions/*`
- `frontend/src/cm-plugins/*`
- `frontend/src/cm-utils/*`
- `frontend/src/services/*`

## Visão da camada

- `Editor.vue` orquestra lifecycle, estado reativo e integrações (CodeMirror + Yjs + APIs);
- `cm-commands` concentra ações stateless sobre o editor;
- `cm-extensions` aplica comportamento contínuo (tema, highlight);
- `cm-plugins` encapsula decorações DOM, keymaps e interações;
- `services` isola infraestrutura (API, export, config, persistence).

## Componentes e responsabilidades

### `Home.vue`

- Landing page inicial;
- Entrada para criação/acesso por `documentId`.

### `Editor.vue`

- Inicializa e monta `EditorView`;
- Gerencia diálogos (link, imagem, lock, access);
- Integra provider Yjs/WebSocket e awareness;
- Reage a mudança de rota para troca de documento;
- Delega regras para comandos/plugins/services.

### `Explorer.vue`

- Tela administrativa protegida para gestão de documentos;
- Lista, busca, ordena e executa ações por item.

## Commands Pattern (`cm-commands`)

Assinatura padrão: `(view: EditorView, ...args) => boolean`.

- `formatting.ts`: inline/line format (`formatInline`, `formatLinePrefix`, `applyFormat`);
- `insertions.ts`: inserção de links/imagens Markdown;
- `history.ts`: undo/redo via `Yjs UndoManager`;
- `index.ts`: registry central de comandos.

## Extensions (`cm-extensions`)

- `editor-theme.ts` define highlight style e tema visual;
- `editorTheme` compõe extensões para uso direto no `EditorState`.

## Plugins e keymaps

Detalhamento completo no módulo [plugins-codemirror.md](./plugins-codemirror.md).

## Utils (`cm-utils`)

- `word-boundaries.ts`: expansão inteligente de seleção por palavra;
- `cursor.ts`: nomes/cores de awareness colaborativo;
- `markdown-parsing.ts`: helpers de parsing.

## Services (`src/services`)

- `document-api.ts`: lock/unlock/access e operações administrativas;
- `config.ts`: resolução de URLs HTTP/WS por ambiente;
- `export.ts`: download Markdown/PDF com lazy loading;
- `persistence.ts`: wrapper type-safe para `localStorage`;
- `pdf-styles.ts`: estilos de renderização para export PDF.

## Fluxos críticos

### Acesso ao documento

1. Router resolve `/:documentId`;
2. `Editor.vue` valida lock/acesso;
3. Em sucesso, inicializa editor + provider Yjs;
4. Renderiza sessão colaborativa.

### Edição colaborativa

1. CodeMirror gera transaction local;
2. binding Yjs aplica update no CRDT local;
3. update é propagado por WebSocket;
4. demais clientes recebem merge automático (CRDT).

### Export PDF

1. Usuário aciona export;
2. `export.ts` carrega `marked` + `html2pdf.js` sob demanda;
3. Markdown é renderizado em HTML;
4. Browser gera e baixa o PDF.

## Quando atualizar

Atualizar este módulo ao alterar:

- contratos entre `Editor.vue` e `cm-*`;
- inicialização do editor/Yjs;
- interfaces públicas de `services/*`;
- fluxos de acesso, edição ou export.
