# Frontend Editor (Vue + CodeMirror + Yjs)

## Escopo

Este módulo documenta a arquitetura do frontend focada no editor colaborativo: componentes, comandos, extensões, plugins, serviços e fluxos de dados no browser.

## Donos

- Time de Desenvolvimento DontPad

## Arquivos-fonte principais

- `frontend/src/components/*.vue` — 14 componentes Vue
- `frontend/src/components/ui/` — 13 diretórios de componentes shadcn-vue (`alert`, `alert-dialog`, `avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `input`, `label`, `separator`, `switch`, `table`)
- `frontend/src/lib/utils.ts` — utilitário `cn()` (clsx + tailwind-merge)
- `frontend/src/composables/*.ts` — 5 composables Vue 3
- `frontend/src/cm-commands/*` — 5 arquivos (formatting, history, insertions, table, index)
- `frontend/src/cm-extensions/*` — 2 arquivos (editor-theme, index)
- `frontend/src/cm-plugins/*` — 17 plugins + barrel index
- `frontend/src/cm-utils/*` — 6 módulos utilitários + barrel index
- `frontend/src/services/*` — 5 serviços + barrel index
- `frontend/src/styles/*.css` — 5 arquivos CSS modulares (inclui camada de componentes)

## Visão da camada

```filesystem
src/
├── components/       # 14 componentes Vue
│   └── ui/           # componentes shadcn-vue compartilhados (13 diretórios)
├── lib/              # utils.ts — cn()
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
- a base visual usa Tailwind CSS v4 em `src/styles/base.css`, mantendo `tailwind.config.js` referenciado via `@config` para tokens e plugins;
- `styles` organiza CSS global em módulos por responsabilidade.

## Componentes e responsabilidades

### `Home.vue`

- Landing page inicial;
- Entrada para criação/acesso por `documentId`;
- Lista templates reais carregados por `document-api.ts` a partir de `GET /api/document-templates`;
- Mantém a opção virtual `blank` como primeira linha e seleção padrão;
- Encaminha o template selecionado para a rota do documento apenas quando a escolha for diferente de `blank`.

### `Editor.vue`

- Orquestra composables `useYjsEditor`, `useDocumentAccess` e `useCollaborators`;
- Delega header para `EditorHeader.vue`;
- Delega toolbar para `EditorToolbar.vue`;
- Delega diálogos para componentes focados (`LinkDialog`, `ImageDialog`, `LockDialog`, `AccessDialog`, `ProfileDialog`);
- Consome o query param transitório `template`, repassa o valor para a conexão colaborativa e remove o param da URL após a inicialização;
- Delega regras para comandos/plugins/services.

### `EditorHeader.vue`

- Header bar extraída do `Editor.vue` (descoplada em 2026-03-18);
- Renderiza navegação (link Início + `ArrowLeft`), badge `/documentId`, avatares de colaboradores e indicador de status de conexão;
- Aceita props `documentId`, `collaborators`, `status`;
- Emite `@edit-profile` ao clicar nos avatares;
- Isola completamente o markup e as classes `.page-header`, `.page-header-link`, `.page-header-badge`.

### `EditorToolbar.vue`

- Toolbar de formatação extraída do Editor;
- Contém undo/redo, botões de formatação Markdown, downloads;
- Utiliza `ToolbarButton.vue` para cada ação;
- Emite eventos para o `Editor.vue` orquestrar (`@format`, `@undo`, `@redo`, `@open-link`, etc.).

### `BaseDialog.vue`

- Thin wrapper shadcn-vue: encapsula `Dialog` + `DialogContent` + `DialogHeader` + `DialogTitle` + `DialogFooter` do pacote `@/components/ui/dialog`;
- Aceita `title` e `cardClass` como props;
- Slot default para conteúdo e slot `#actions` para botões do footer;
- Fecha ao atualizar o estado do `Dialog` para `false` (via `@update:open`);
- Mantido para retro-compatibilidade; todos os diálogos do projeto usam shadcn `Dialog` diretamente.

### Diálogos focados

| Componente | Responsabilidade |
|---|---|
| `LinkDialog.vue` | Inserção de link Markdown com campos texto/URL |
| `ImageDialog.vue` | Inserção de imagem Markdown com campos alt/URL |
| `LockDialog.vue` | Travar/destravar documento com senha |
| `AccessDialog.vue` | Solicitar senha para abrir documento protegido |
| `ProfileDialog.vue` | Edição de perfil do colaborador (emoji, nome, telemetria) |

Todos usam **diretamente** os primitivos shadcn-vue (`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` de `@/components/ui/dialog`) — não dependem de `BaseDialog.vue`. O foco inicial em cada diálogo é gerenciado via `@open-auto-focus.prevent` no `DialogContent`, eliminando o padrão anterior de `onMounted` + `nextTick`. Focus trap, Escape e `aria-modal` são gerenciados automaticamente por `reka-ui`.

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
| `useYjsEditor(documentId, password, templateId?)` | Setup/teardown de Yjs, CodeMirror, awareness, status de conexão e envio opcional do template inicial no handshake WS |
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

- `document-api.ts`: lock/unlock/access, operações administrativas, listagem pública de templates (`listTemplates`) e leitura pública para modos parametrizados (`getPublicDocumentContent`);
- `config.ts`: resolução de URLs HTTP/WS por ambiente;
- `export.ts`: download Markdown/PDF com lazy loading;
- `persistence.ts`: wrapper type-safe para `localStorage`;
- `pdf-styles.ts`: estilos de renderização para export PDF.

Todos os serviços são re-exportados pelo barrel `services/index.ts`.

## Styles (`src/styles`)

CSS global organizado em módulos importados sequencialmente por `index.css`:

| Arquivo | Conteúdo |
|---|---|
| `base.css` | Entrada do Tailwind CSS v4 com `@import "tailwindcss"`, `@config "../../tailwind.config.js"`, `@custom-variant dark`, variáveis CSS do projeto/shadcn-vue e estilos de `html`/`body` |
| `components.css` | Abstrações CSS com `@layer components` e `@apply` (layout, botões, inputs); classes de diálogo (`.dialog-*`) mantidas apenas como fallback |
| `codemirror.css` | Estilos do CodeMirror (editor chrome, cursor, gutter) |
| `plugins.css` | Widgets de plugins CM (code blocks, links, images, checkboxes, etc.) |
| `collaboration.css` | Cursores Yjs e avatares de colaboradores |
| `responsive.css` | Media queries para mobile/tablet |

### Tailwind CSS v4 (modelo atual)

- `frontend/src/styles/base.css` é o ponto de entrada do Tailwind no frontend e também o arquivo apontado por `frontend/components.json` para a CLI do shadcn-vue.
- O projeto usa Tailwind CSS v4 em modo híbrido: o CSS é inicializado por `@import "tailwindcss"`, mas `frontend/tailwind.config.js` continua ativo via `@config`.
- `tailwind.config.js` concentra tokens customizados (`spacing`, `fontFamily`, `colors`, `borderRadius`), breakpoint `xs` e plugins como `tailwindcss-animate`.
- A documentação não deve tratar este setup como uma configuração v4 puramente CSS-first com todos os tokens migrados para `@theme inline`, porque esse não é o estado atual do repositório.

### CSS Component Layer (`components.css`)

Utiliza `@layer components` com `@apply` para criar abstrações reutilizáveis que substituem padrões inline repetidos. Classes disponíveis:

| Categoria | Classes | Uso |
|---|---|---|
| Layout | `.page-header`, `.page-header-link`, `.page-header-badge` | Header renderizado por `EditorHeader.vue` e Explorer |
| Layout | `.toolbar`, `.toolbar-divider` | Container de toolbar e divisores verticais |
| Botões | `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-icon` | Botões de ação padronizados |
| Botões | `.btn-dialog-cancel`, `.btn-dialog-confirm`, `.btn-dialog-danger` | Botões de footer de diálogo (usam os primitivos shadcn como container) |
| Inputs | `.input-field`, `.input-label` | Campos de formulário padronizados |
| Diálogos | `.dialog-overlay`, `.dialog-card`, `.dialog-card-sm`, `.dialog-title`, `.dialog-footer` | Estrutura legacy — mantida para retrocompatibilidade; não usada pelos diálogos migrados |

Por estar em `@layer components`, essas classes podem ser sobrescritas por utilidades Tailwind quando necessário.

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
| Colors (shadcn) | `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `card`, `popover` | `hsl(var(--*))` | `bg-background`, `text-foreground`, etc. |
| Border radius (shadcn) | `lg`, `md`, `sm` | `var(--radius)` derivados | `rounded-lg`, `rounded-md`, `rounded-sm` |

## Fluxos críticos

### Acesso ao documento

1. Router resolve `/:documentId`;
2. `DocumentRoute.vue` avalia query params para detectar modo especial;
3. Em modo especial, carrega conteúdo por API e aplica `pdf`, `view` ou `raw`;
4. Se o documento estiver travado, exige senha antes de liberar conteúdo;
5. Sem modo especial, delega para `Editor.vue`, que mantém o fluxo padrão de edição colaborativa.

### Criação a partir de template

1. `Home.vue` carrega a lista pública de templates e mantém `blank` como seleção inicial;
2. Ao submeter o formulário com um template real selecionado, a navegação inclui `?template=<nome-do-template>`;
3. `Editor.vue` lê esse valor e o envia para `useYjsEditor` como parâmetro opcional da conexão colaborativa;
4. Após a inicialização, o query param é removido da URL para evitar reaplicação em refreshs internos;
5. O backend decide se o conteúdo do template pode ou não ser copiado para o documento de destino.

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

## shadcn-vue (`src/components/ui/`)

Components copiados via CLI (`npx shadcn-vue@latest add`) para `src/components/ui/`. Não são dependência versionada — pertencem ao projeto e podem ser editados. A verificação operacional atual (`npm run shadcn:info` em `frontend/`) identifica o frontend como `vite`, usa `src/styles/base.css`, `tailwind.config.js` e reporta `tailwindVersion: v4`.

Contexto operacional: a configuração da CLI vive em `frontend/components.json`. Para inspecionar ou adicionar componentes, executar os comandos dentro de `frontend/` com `npx shadcn-vue@latest ...` ou scripts do pacote. Executar `npx shadcn@latest` na raiz do workspace produz falso negativo (`framework: Manual`) porque consulta a ferramenta/diretório errados para este projeto Vue.

| Diretório | Papel principal | Status |
|---|---|---|
| `ui/alert/` | Feedback inline com `Alert`, `AlertTitle`, `AlertDescription` | Instalado |
| `ui/alert-dialog/` | Confirmações bloqueantes e ações destrutivas | Instalado |
| `ui/avatar/` | Avatares e fallback visual de colaboradores | Instalado |
| `ui/badge/` | Badges e rótulos visuais compactos | Instalado |
| `ui/button/` | `Button` com variantes via `class-variance-authority` | Instalado |
| `ui/card/` | Containers visuais estruturados | Instalado |
| `ui/checkbox/` | Seleção booleana em formulários | Instalado |
| `ui/dialog/` | Diálogos, overlay, header/footer e variações de conteúdo | Instalado |
| `ui/input/` | Campos de texto base | Instalado |
| `ui/label/` | Labels de formulário | Instalado |
| `ui/separator/` | Separadores visuais horizontais/verticais | Instalado |
| `ui/switch/` | Toggle booleano | Instalado |
| `ui/table/` | Estrutura tabular reutilizável | Instalado |

Dependência headless: `reka-ui` (gerencia focus trap, Escape, `aria-modal`, `role=dialog`, portal DOM).  
Utilidade de classes: `cn()` em `src/lib/utils.ts` (combina `clsx` + `tailwind-merge`).

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
- props/eventos de `EditorHeader.vue` ou `EditorToolbar.vue`;
- inicialização do editor/Yjs;
- composables e suas interfaces;
- interfaces públicas de `services/*`;
- componentes instalados em `src/components/ui/` (shadcn-vue);
- `frontend/components.json`, `src/styles/base.css` ou `tailwind.config.js` quando mudarem a integração do Tailwind CSS v4;
- estrutura de arquivos CSS, CSS Component Layer ou design tokens Tailwind;
- fluxos de acesso, edição ou export.
