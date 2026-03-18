# Frontend Editor (Vue + CodeMirror + Yjs)

## Escopo

Este módulo documenta a arquitetura do frontend focada no editor colaborativo: componentes, comandos, extensões, plugins, serviços e fluxos de dados no browser.

## Donos

- Time de Desenvolvimento DontPad

## Arquivos-fonte principais

- `frontend/src/components/*.vue` — 7 componentes Vue
- `frontend/src/composables/*.ts` — 5 composables Vue 3
- `frontend/src/cm-commands/*` — 5 arquivos (formatting, history, insertions, table, index)
- `frontend/src/cm-extensions/*` — 2 arquivos (editor-theme, index)
- `frontend/src/cm-plugins/*` — 17 plugins + barrel index
- `frontend/src/cm-utils/*` — 6 módulos utilitários + barrel index
- `frontend/src/services/*` — 5 serviços + barrel index
- `frontend/src/styles/*.css` — 5 arquivos CSS modulares

## Visão da camada

```filesystem
src/
├── components/       # 7 componentes Vue
├── composables/      # 5 composables (lógica reativa extraída)
├── services/         # 5 serviços + barrel index
├── cm-commands/      # 5 arquivos (formatting, history, insertions, table, index)
├── cm-extensions/    # 2 arquivos (editor-theme, index)
├── cm-plugins/       # 17 plugins + barrel index
├── cm-utils/         # 6 módulos + barrel index
└── styles/           # 5 arquivos CSS modulares
```

- `DocumentRoute.vue` resolve modos de acesso por query params e delega fallback para edição padrão;
- `Editor.vue` orquestra composables e integrações (CodeMirror + Yjs + APIs) no modo de edição;
- `composables` encapsulam lógica reativa extraída de componentes complexos;
- `cm-commands` concentra ações stateless sobre o editor;
- `cm-extensions` aplica comportamento contínuo (tema, highlight);
- `cm-plugins` encapsula decorações DOM, keymaps e interações;
- `cm-utils` fornece utilitários puros (parsing, snippet registry, math evaluator);
- `services` isola infraestrutura (API, export, config, persistence);
- `styles` organiza CSS global em módulos por responsabilidade.

## Componentes e responsabilidades

### `Home.vue`

- Landing page inicial;
- Entrada para criação/acesso por `documentId`.

### `Editor.vue`

- Orquestra composables `useYjsEditor`, `useDocumentAccess` e `useCollaborators`;
- Gerencia diálogos (link, imagem, lock, access, profile);
- Delega regras para comandos/plugins/services;
- Utiliza `ToolbarButton.vue` para botões de toolbar padronizados.

### `DocumentRoute.vue`

- Resolve parâmetros de URL para formatos alternativos (`pdf`, `view`, `raw`);
- Centraliza regra de prioridade quando há conflito de params (`pdf` > `view` > `raw`);
- Centraliza fluxo de autenticação para documento travado em modos especiais;
- Faz fallback explícito para `Editor.vue` quando não há modo especial.

### `Explorer.vue`

- Tela administrativa protegida para gestão de documentos;
- Orquestra composables `useExplorerSession` e `useDocumentList`;
- Lista, busca, ordena e executa ações por item.

### `ToolbarButton.vue`

- Componente reutilizável que encapsula estilo base de botões de toolbar;
- Aceita props `title`, `active` e `disabled`;
- Slot default para conteúdo (texto ou ícone);
- Elimina repetição de ~20 instâncias do mesmo padrão de classes.

## Commands Pattern (`cm-commands`)

Assinatura padrão: `(view: EditorView, ...args) => boolean`.

- `formatting.ts`: inline/line format (`formatInline`, `formatLinePrefix`, `applyFormat`);
- `insertions.ts`: inserção de links/imagens Markdown;
- `history.ts`: undo/redo via `Yjs UndoManager`;
- `table.ts`: normalização de tabelas Markdown selecionadas ou sob cursor;
- `index.ts`: registry central de comandos.

## Extensions (`cm-extensions`)

- `editor-theme.ts` define highlight style e tema visual;
- `editorTheme` compõe extensões para uso direto no `EditorState`.

## Composables (`src/composables`)

| Composable | Descrição |
|---|---|
| `useYjsEditor(documentId, password)` | Setup/teardown de Yjs, CodeMirror, awareness e status de conexão |
| `useDocumentAccess(documentId, api)` | Lock, acesso, password management |
| `useCollaborators(provider, profile)` | Tracking de participantes via awareness |
| `useExplorerSession(api)` | Autenticação e ciclo de vida da sessão do Explorer |
| `useDocumentList(api, password)` | Listagem, filtro e ordenação no Explorer |

Os composables retornam objetos com refs. No template Vue, refs dentro de objetos retornados por composables **não** são auto-unwrapped — por isso os bindings usam `.value` (ex: `access.hasDocumentAccess.value`).

## Plugins e keymaps

Detalhamento completo no módulo [plugins-codemirror.md](./plugins-codemirror.md).

## Utils (`cm-utils`)

- `word-boundaries.ts`: expansão inteligente de seleção por palavra;
- `cursor.ts`: nomes/cores de awareness colaborativo;
- `markdown-parsing.ts`: helpers de parsing Markdown;
- `snippet-registry.ts`: registry compartilhado de snippets, prefixes e `getWordBeforeCursor` (consumido por `tab-keymap.ts` e `snippet.ts`);
- `math-evaluator.ts`: tokenizer + parser recursivo descendente para expressões matemáticas (extraído de `cm-plugins/math.ts`);
- `document-name.ts`: normalização de nomes de documento.

Todos os módulos são re-exportados pelo barrel `cm-utils/index.ts`.

## Services (`src/services`)

- `document-api.ts`: lock/unlock/access, operações administrativas e leitura pública para modos parametrizados (`getPublicDocumentContent`);
- `config.ts`: resolução de URLs HTTP/WS por ambiente;
- `export.ts`: download Markdown/PDF com lazy loading;
- `persistence.ts`: wrapper type-safe para `localStorage`;
- `pdf-styles.ts`: estilos de renderização para export PDF.

Todos os serviços são re-exportados pelo barrel `services/index.ts`.

## Styles (`src/styles`)

CSS global organizado em módulos importados sequencialmente por `index.css`:

| Arquivo | Conteúdo |
|---|---|
| `base.css` | Tailwind directives, variáveis CSS `:root`, estilos de `html`/`body` |
| `codemirror.css` | Estilos do CodeMirror (editor chrome, cursor, gutter) |
| `plugins.css` | Widgets de plugins CM (code blocks, links, images, checkboxes, etc.) |
| `collaboration.css` | Cursores Yjs e avatares de colaboradores |
| `responsive.css` | Media queries para mobile/tablet |

## Design tokens Tailwind

Tokens customizados registrados em `tailwind.config.js`:

| Categoria | Token | Valor | Classe utilitária |
|---|---|---|---|
| Spacing | `btn` | 7.2px | `py-btn` |
| Spacing | `btn-sm` | 5.4px | `py-btn-sm` |
| Spacing | `header` | 9px | `py-header` |
| Font | `ui` | Fira Code, system | `font-ui` |
| Font | `code` | Fira Code, Consolas | `font-code` |
| Color | `code-bg` | #e8eef2 | `bg-code-bg` |
| Screen | `xs` | 480px | `xs:...` |

## Fluxos críticos

### Acesso ao documento

1. Router resolve `/:documentId`;
2. `DocumentRoute.vue` avalia query params para detectar modo especial;
3. Em modo especial, carrega conteúdo por API e aplica `pdf`, `view` ou `raw`;
4. Se o documento estiver travado, exige senha antes de liberar conteúdo;
5. Sem modo especial, delega para `Editor.vue`, que mantém o fluxo padrão de edição colaborativa.

### Acesso por URL parametrizada

Formatos suportados:

- `/<documento>?pdf`
- `/<documento>?view`
- `/<documento>?raw`

Regras:

- Sem parâmetro especial, o comportamento padrão continua sendo edição colaborativa.
- Em conflito de parâmetros, a prioridade é `pdf` > `view` > `raw`.
- Em documento travado, o frontend solicita senha e só libera modo especial após validação bem-sucedida.

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

## Barrel indexes

Todos os diretórios de módulos possuem barrel `index.ts` para centralizar exports:

- `cm-commands/index.ts` — registry central de comandos;
- `cm-extensions/index.ts` — tema e highlight;
- `cm-plugins/index.ts` — todos os plugins e keymaps;
- `cm-utils/index.ts` — utilitários, snippet registry, math evaluator;
- `services/index.ts` — API, config, export, persistence, pdf-styles.

## Quando atualizar

Atualizar este módulo ao alterar:

- contratos entre `Editor.vue` e `cm-*`;
- inicialização do editor/Yjs;
- composables e suas interfaces;
- interfaces públicas de `services/*`;
- estrutura de arquivos CSS ou design tokens Tailwind;
- fluxos de acesso, edição ou export.
