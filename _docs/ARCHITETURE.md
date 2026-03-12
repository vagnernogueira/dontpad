# DontPad - Arquitetura de Software (Frontend + Backend)

**Versão:** 2.1  
**Data:** 02 de Março de 2026  
**Tipo:** Editor Colaborativo de Markdown em Tempo Real  
**Arquitetura:** SPA + API/WS Backend com sincronização CRDT

---

## Índice Navegável

- [1. Visão Arquitetural](#1-visão-arquitetural)
- [2. Stack de Tecnologias Detalhado](#2-stack-de-tecnologias-detalhado)
- [3. Diagrama de Arquitetura](#3-diagrama-de-arquitetura)
- [4. Estrutura de Pastas](#4-estrutura-de-pastas)
- [5. Componentes e Módulos](#5-componentes-e-módulos)
- [6. Padrões Adotados](#6-padrões-adotados)
- [7. Arquivos Importantes](#7-arquivos-importantes)
- [8. Guia de Implementação](#8-guia-de-implementação)
- [9. Dependências Externas e Integrações](#9-dependências-externas-e-integrações)
- [Apêndices Técnicos](#apêndices-técnicos)
- [10. Histórico de Ondas](#10-histórico-de-ondas)

---

## 1. Visão Arquitetural

O DontPad é uma aplicação full-stack para edição colaborativa de documentos Markdown em tempo real. A solução combina um frontend SPA (Vue 3 + CodeMirror 6) com um backend Node.js (Express + WebSocket), utilizando CRDTs com Yjs para sincronização distribuída entre múltiplos clientes.

**Características Principais:**

- ✅ Edição colaborativa em tempo real (múltiplos usuários simultâneos)
- ✅ Proteção por senha de documentos
- ✅ API HTTP para lock/unlock, verificação de acesso e listagem de documentos
- ✅ Explorer administrativo protegido por senha mestra em `/explorer`
- ✅ Persistência de documentos colaborativos em LevelDB
- ✅ Exportação para Markdown e PDF
- ✅ Correção ortográfica integrada
- ✅ Preview de Markdown inline
- ✅ Suporte completo a Markdown (GFM - GitHub Flavored Markdown)
- ✅ Arquitetura modular com separação clara de responsabilidades (frontend e backend)
- ✅ Type-safe com TypeScript
- ✅ Responsivo (mobile-first design)

---

## 2. Stack de Tecnologias Detalhado

### Core Framework & Build Tools

| Tecnologia     | Versão | Propósito                             |
| -------------- | ------ | ------------------------------------- |
| **Vue 3**      | 3.4.21 | Framework reativo com Composition API |
| **TypeScript** | 5.2.2  | Type safety e melhor DX               |
| **Vite**       | 5.2.0  | Build tool e dev server (HMR)         |
| **Vue Router** | 4.3.0  | Roteamento SPA                        |

### Backend Runtime & API

| Tecnologia     | Versão      | Propósito                                   |
| -------------- | ----------- | ------------------------------------------- |
| **Node.js**    | 20 (Docker) | Runtime do backend                          |
| **Express**    | 4.18.2      | API HTTP (health, lock, access, listagem)   |
| **ws**         | 8.16.0      | Servidor WebSocket                          |
| **TypeScript** | 5.3.3       | Type safety e build do backend              |

### Editor & Collaboration

| Tecnologia            | Versão  | Propósito                    |
| --------------------- | ------- | ---------------------------- |
| **CodeMirror 6**      | 6.0.2   | Editor de código extensível  |
| **Yjs**               | 13.6.14 | CRDT framework para sync     |
| **y-websocket**       | 1.5.0   | WebSocket provider para Yjs  |
| **y-codemirror.next** | 0.3.5   | Binding Yjs ↔ CodeMirror     |

### Persistência & Estado

| Tecnologia                 | Versão        | Propósito                                              |
| -------------------------- | ------------- | ------------------------------------------------------ |
| **y-leveldb**              | 0.1.2         | Persistência incremental dos updates CRDT              |
| **LevelDB**                | via y-leveldb | Armazenamento de documentos no disco                   |
| **document-locks.json**    | -             | Armazena hashes/salts de senha de documentos           |
| **document-metadata.json** | -             | Armazena metadados de criação/alteração dos documentos |

### UI & Styling

| Tecnologia          | Versão  | Propósito                   |
| ------------------- | ------- | --------------------------- |
| **Tailwind CSS**    | 3.4.3   | Utility-first CSS framework |
| **Lucide Vue Next** | 0.575.0 | Biblioteca de ícones        |
| **PostCSS**         | 8.4.38  | Processamento de CSS        |

### Content Processing

| Tecnologia          | Versão | Propósito                           |
| ------------------- | ------ | ----------------------------------- |
| **Marked**          | 17.0.3 | Parser Markdown → HTML              |
| **html2pdf.js**     | 0.14.0 | Geração de PDF do HTML              |
| **@lezer/markdown** | -      | Parser incremental (via CodeMirror) |

---

## 3. Diagrama de Arquitetura

```ascii
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Vue 3 Application                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐      │   │
│  │  │   Router   │  │ Components │  │  Services  │      │   │
│  │  └─────┬──────┘  └──────┬─────┘  └──────┬─────┘      │   │
│  │        │                │                 │          │   │
│  │  ┌─────▼────────────────▼─────────────────▼──────┐   │   │
│  │  │         CodeMirror 6 Editor                   │   │   │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │   │   │
│  │  │  │ Commands │  │Extensions│  │  Plugins │     │   │   │
│  │  │  └──────────┘  └──────────┘  └──────────┘     │   │   │
│  │  └───────────────────┬───────────────────────────┘   │   │
│  │                      │                               │   │
│  │  ┌───────────────────▼───────────────────────────┐   │   │
│  │  │           Yjs CRDT Document                   │   │   │
│  │  └───────────────────┬───────────────────────────┘   │   │
│  └────────────────────┬─┴───────────────────────────────┘   │
└───────────────────────┼─────────────────────────────────────┘
                        │ WebSocket
        ┌───────────────▼────────────────┐
        │     Backend Server (Node.js)   │
        │  - WebSocket Provider (Yjs)    │
        │  - Document Lock/Access API    │
        │  - Redis Storage               │
        └────────────────────────────────┘
```

---

## 4. Estrutura de Pastas

```filesystem
.
├── .env                              # Variáveis locais de execução
├── .env.example                      # Template de variáveis de ambiente
├── .gitignore                        # Regras de versionamento
├── .markdownlint.json                # Configuração de lint para Markdown
├── docker-compose.yml                # Orquestração de serviços
├── Makefile                          # Atalhos de desenvolvimento/operação
├── README.md                         # Documentação de entrada do projeto
│
├── _docs/                            # Documentação Markdown versionada (centralizada)
│   ├── ARCHITETURE.md                # Arquitetura unificada frontend + backend
│   ├── ARCHITETURE-plugins.md        # Arquitetura dos plugins CodeMirror
│   └── ia-context/                   # IA Context e Model Context Protocol (MCP) setup
│
├── backend/
│   ├── Dockerfile                    # Build/runtime do backend
│   ├── package.json                  # Scripts e dependências do backend
│   ├── package-lock.json             # Lockfile npm do backend
│   ├── tsconfig.json                 # TypeScript config do backend
│   └── src/
│       ├── server.ts                 # Bootstrap HTTP + WS + rotas API
│       └── sync.ts                   # Sync Yjs, persistência e locks
│
└── frontend/
    ├── Dockerfile                    # Build/runtime do frontend
    ├── index.html                    # Entry HTML da SPA
    ├── package.json                  # Scripts e dependências do frontend
    ├── package-lock.json             # Lockfile npm do frontend
    ├── postcss.config.js             # Config PostCSS
    ├── tailwind.config.js            # Config Tailwind CSS
    ├── tsconfig.json                 # TypeScript config da app
    ├── tsconfig.node.json            # TypeScript config para Vite/Node tooling
    ├── vite.config.ts                # Configuração do Vite
    ├── public/                       # Assets estáticos públicos
    └── src/
        ├── App.vue                   # Componente raiz da aplicação
        ├── index.css                 # Estilos globais
        ├── main.ts                   # Entry point Vue
        ├── vite-env.d.ts             # Tipos de ambiente do Vite
        │
        ├── components/               # Componentes de tela
        │   ├── Home.vue              # Landing page
        │   ├── Editor.vue            # Editor principal colaborativo
        │   └── Explorer.vue          # Gestão administrativa de documentos
        │
        ├── cm-commands/              # Commands stateless do CodeMirror
        │   ├── formatting.ts         # Formatação inline e de linha
        │   ├── history.ts            # Undo/Redo com Yjs UndoManager
        │   ├── index.ts              # Registry/re-export de comandos
        │   └── insertions.ts         # Inserções (link/imagem)
        │
        ├── cm-extensions/            # Extensions contínuas do editor
        │   ├── editor-theme.ts       # Tema visual e highlighting
        │   └── index.ts              # Bundle de extensões
        │
        ├── cm-plugins/               # ViewPlugins e keymaps do editor
        │   ├── checkbox-widget.ts
        │   ├── code-block.ts
        │   ├── delete-line-keymap.ts
        │   ├── enter-keymap.ts
        │   ├── horizontal-rule-widget.ts
        │   ├── image-widget.ts
        │   ├── keymaps.ts
        │   ├── link-widget.ts
        │   ├── list.ts
        │   ├── markdown-preview.ts
        │   ├── math.ts
        │   ├── multi-click.ts
        │   ├── plain-url.ts
        │   ├── snippet.ts
        │   ├── spellcheck.ts
        │   └── tab-keymap.ts
        │
        ├── cm-utils/                 # Utilitários compartilhados do editor
        │   ├── cursor.ts             # Helpers de cursores colaborativos
        │   ├── markdown-parsing.ts   # Helpers de parsing Markdown
        │   └── word-boundaries.ts    # Detecção de fronteiras de palavra
        │
        └── services/                 # Serviços de infraestrutura/regra de negócio
            ├── config.ts             # Resolução de URLs API/WS
            ├── document-api.ts       # Cliente HTTP de lock/access
            ├── export.ts             # Exportação Markdown/PDF
            ├── pdf-styles.ts         # Estilos de export PDF
            └── persistence.ts        # Abstração localStorage
```

**Escopo desta árvore:** apenas arquivos e pastas versionados no repositório.

---

## 5. Componentes e Módulos

### 🎨 **Components** (`src/components/`)

**Responsabilidade:** UI e gerenciamento de estado local Vue

#### `Home.vue`

- Landing page inicial
- Navegação para criação/acesso a documentos
- Input de document ID personalizado

#### `Editor.vue` (Componente Principal)

**Responsabilidades:**

- Setup e lifecycle do CodeMirror editor
- Gerenciamento de diálogos (link, imagem, lock, access)
- Integração Yjs + WebSocket provider
- Awareness (cursores colaborativos)
- Gerenciamento de estado reativo (status conexão, spellcheck)
- Orquestração de comandos via toolbar
- Watch de mudança de rota (trocar de documento)

**NÃO faz:**

- Lógica de formatação (delegada para `cm-commands`)
- Fetch direto de APIs (delegado para `services/document-api`)
- Manipulação de localStorage (delegado para `services/persistence`)
- Export logic (delegado para `services/export`)

#### `Explorer.vue`

**Responsabilidades:**

- Proteger acesso administrativo via senha mestra;
- Listar documentos com metadados e status (travado, vazio, aberto);
- Aplicar busca por nome, ordenação por coluna e seleção única;
- Executar ações de item: renomear, remover, download markdown, download PDF e travar.

**NÃO faz:**

- Criação automática de documento ao acessar `/explorer`;
- Ações em lote (multi-seleção).

---

### ⚙️ **CM-Commands** (`src/cm-commands/`)

**Padrão:** Command Pattern  
**Assinatura:** `(view: EditorView, ...args) => boolean`  
**Responsabilidade:** Ações stateless sobre o editor

#### `formatting.ts`

**Exporta:**

- `formatInline(view, prefix, suffix)` - Bold, italic, code, strikethrough
- `formatLinePrefix(view, prefix)` - Headers, lists, quotes
- `applyFormat(view, prefix, suffix?)` - Auto-detecta inline vs line-level

**Uso:**

```typescript
applyFormat(view, '**', '**')  // Bold
applyFormat(view, '# ')        // Heading 1
```

#### `insertions.ts`

**Exporta:**

- `insertLink(view, text, url)` - Insere `[text](url)`
- `insertImage(view, alt, url)` - Insere `![alt](url)`

#### `history.ts`

**Exporta:**

- `createUndoCommand(undoManager)` - Factory para undo
- `createRedoCommand(undoManager)` - Factory para redo

**Nota:** Usa Yjs UndoManager (não CodeMirror history) para sincronização colaborativa

#### `index.ts`

**Responsabilidade:** Registry central de comandos

**Exporta:**

- Todos os comandos individuais (re-export)
- `CommandRegistry` interface
- `commands` object - Map de nome → implementação

**Benefício:** Permite lookup programático:

```typescript
commands.bold(view)  // Equivalente a formatInline(view, '**', '**')
```

---

### 🎭 **CM-Extensions** (`src/cm-extensions/`)

**Padrão:** Extension Pattern (CodeMirror)  
**Responsabilidade:** Comportamento contínuo do editor

#### `editor-theme.ts`

**Exporta:**

- `markdownHighlightStyle` - Syntax highlighting para Markdown
- `editorVisualTheme` - Tema visual (cores, fontes, gutters)
- `editorTheme` - Array combinado `[highlightStyle, visualTheme]`

**Uso:**

```typescript
extensions: [
  basicSetup,
  ...editorTheme,  // Spread theme extensions
  // ... outros
]
```

**Padrão de cores:**

- Headings: Azul escuro (#000080)
- Bold: `fontWeight: 'bold'`
- Italic: `fontStyle: 'italic'`
- Code: `fontFamily: 'monospace'`
- Links: Azul com underline
- Strikethrough: `textDecoration: 'line-through'`

---

### 🔌 **CM-Plugins** (`src/cm-plugins/`)

**Padrão:** ViewPlugin Pattern (CodeMirror)  
**Responsabilidade:** Decorações DOM e interações complexas

#### Categorias de Plugins

**1. Decoração Visual:**

- `code-block.ts` - Background cinza em blocos de código
- `horizontal-rule-widget.ts` - Renderiza `---` como linha visual
- `image-widget.ts` - Preview inline de imagens
- `link-widget.ts` - Decoração de links com hover

**2. Comportamento de Input:**

- `enter-keymap.ts` - Continuação de listas ao pressionar Enter
- `tab-keymap.ts` - Indentação inteligente com Tab
- `delete-line-keymap.ts` - Ctrl+D deleta linha
- `multi-click.ts` - Double/triple-click selection

**3. Funcionalidades Avançadas:**

- `markdown-preview.ts` - Preview Markdown inline (hover)
- `math.ts` - Cálculo matemático (e.g., digitar `2+2=` mostra `4`)
- `spellcheck.ts` - Integração spellcheck do browser
- `snippet.ts` - Expansão de snippets (e.g., `table` → tabela Markdown)
- `list.ts` - Auto-continuação de listas numeradas/bullet
- `plain-url.ts` - Auto-linkifica URLs `(https://example.com)`
- `ctrl-click-navigation.ts` - Ctrl+Click em link para abrir

#### Estrutura de um Plugin Típico

```typescript
export const myPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view)
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    // Lógica de decoração
  }
}, {
  decorations: v => v.decorations
})
```

**Padrão Compartilhado:**

- Todos plugins têm JSDoc documentation
- Exportam função/constante nomeada
- Mantêm decorações em estado interno
- Atualizam apenas quando necessário (performance)

---

### 🛠️ **CM-Utils** (`src/cm-utils/`)

**Responsabilidade:** Utilitários reutilizáveis para CodeMirror

#### `word-boundaries.ts`

**Exporta:**

- `getWordBoundaries(doc, pos)` - Retorna `{start, end}` da palavra no cursor
- `isWordCharAt(doc, pos)` - Verifica se char é parte de palavra

**Uso:** Smart selection em formatação (auto-expande para palavra inteira)

#### `cursor.ts`

**Exporta:**

- `CURSOR_COLORS` - Paleta de 8 cores para cursores colaborativos
- `getRandomCursorColor()` - Retorna cor aleatória
- `getRandomCursorName()` - Retorna nome aleatório (`Anon 0-999`)
- `getCursorAwarenessState(name, color)` - Objeto awareness para Yjs

**Uso:**

```typescript
const name = getRandomCursorName()
const color = getRandomCursorColor()
provider.awareness.setLocalStateField('user', 
  getCursorAwarenessState(name, color)
)
```

---

### 🏗️ **Services** (`src/services/`)

**Responsabilidade:** Business logic não-relacionada ao editor

#### `persistence.ts`

**Padrão:** Namespace com funções type-safe  
**Responsabilidade:** Abstração sobre localStorage

**API:**

```typescript
get<T>(key: string, defaultValue: T): T
set<T>(key: string, value: T): void
remove(key: string): void
```

**Namespace:** Todas as keys prefixadas com `dontpad:`

**Uso:**

```typescript
const spellcheck = persistence.get('spellcheck', true)
persistence.set('spellcheck', false)
```

**Type Safety:** Usa TypeScript generics para inferência de tipo

---

#### `export.ts`

**Padrão:** Async module com lazy loading  
**Responsabilidade:** Download de documentos (Markdown/PDF)

**API:**

```typescript
downloadMarkdown(content: string, filename: string): void
markdownToHtml(content: string): Promise<string>
downloadPDF(content: string, filename: string, htmlStyles?: string): Promise<void>
```

**Integração com pdf-styles.ts:**

- Importa `markdownStyles` de `pdf-styles.ts` como default
- Parâmetro `htmlStyles` é opcional (usa estilos GitHub-like por padrão)
- Permite override de estilos quando necessário

**Lazy Loading:**

```typescript
// Marked e html2pdf só carregam quando necessário
const [{ marked }, { default: html2pdf }] = await Promise.all([
  import('marked'),
  import('html2pdf.js')
])
```

**Benefício:** Reduz bundle size inicial

---

#### `document-api.ts`

**Padrão:** Class-based service com factory  
**Responsabilidade:** Comunicação com backend para lock/unlock

**API:**

```typescript
class DocumentAPI {
  verifyAccess(documentId, password): Promise<boolean>
  getLockStatus(documentId): Promise<LockStatus>
  lock(documentId, password): Promise<boolean>
  unlock(documentId, password): Promise<boolean>
}

createDocumentAPI(baseUrl): DocumentAPI
```

**Factory Pattern:** Permite dependency injection

**Uso:**

```typescript
const api = createDocumentAPI(getApiBaseUrl())
const canAccess = await api.verifyAccess('doc123', 'senha')
```

---

#### `config.ts`

**Responsabilidade:** Configuração de ambiente

**API:**

```typescript
getApiBaseUrl(): string    // HTTP API URL
getWsBaseUrl(): string     // WebSocket URL
config: { apiBaseUrl, wsBaseUrl }
```

**Detecção de Ambiente:**

- Development: `http://localhost:1234`, `ws://localhost:1234`
- Production: Lê de `import.meta.env.VITE_BACKEND_HTTP_URL` / `VITE_BACKEND_WS_URL`

---

### 5.8 Fluxo de Dados

### 1. Inicialização da Aplicação

1. Browser carrega index.html
2. Vite injeta `<script src="/src/main.ts">`
3. main.ts:
   - Cria app Vue
   - Configura router (Home, Editor)
   - Monta app em #app
4. Router navega para rota inicial

### 2. Criação/Acesso a Documento

```ascii
┌──────┐  Digite "meuDoc"   ┌──────────┐  Route to     ┌────────────┐
│ Home │ ═════════════════> │  Router  │ ═══════════>  │ Editor.vue │
└──────┘                    └──────────┘  /:documentId └────────────┘
                                                             │
                                                             ▼
                                               ensureDocumentAccess()
                                                             │
                                                             ▼
                                          ┌──────────────────┴────────────────┐
                                          │                                   │
                                    Locked? ──NO──> initEditor()       YES ──> Show Access Dialog
                                                         │                         │
                                                         ▼                         ▼
                                                   Connect WS              User enters password
                                                         │                         │
                                                         ▼                         ▼
                                                     Yjs Sync            documentAPI.verifyAccess()
                                                         │                         │
                                                         ▼                         ▼
                                                   Render Editor        ──OK──> initEditor()
```

### 3. Edição Colaborativa (CRDT Flow)

```ascii
User A types "Hello"
       │
       ▼
CodeMirror dispatches transaction
       │
       ▼
y-codemirror binding intercepts
       │
       ▼
Yjs Document updates (local)
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
WebSocket sends                    Local view updates
delta to server                    immediately (optimistic)
       │
       ▼
Server broadcasts
to all clients
       │
       ▼
User B's Yjs receives delta
       │
       ▼
User B's CodeMirror updates
(merge automático via CRDT)
```

**Vantagens do CRDT:**

- ✅ Sem conflitos de merge
- ✅ Offline-first (sync quando reconectar)
- ✅ Operações comutativas

### 4. Formatação de Texto

```ascii
User clicks "Bold" button
       │
       ▼
@click="applyFormat('**', '**')"
       │
       ▼
calls applyFormatCommand(view, '**', '**')
       │
       ▼
cm-commands/formatting.ts:
  - Detecta seleção ou cursor
  - Se palavra: expande seleção (word-boundaries)
  - Insere prefix/suffix
  - Dispatch transaction
       │
       ▼
CodeMirror updates
       │
       ▼
Yjs sync propagates (se colaborativo)
```

### 5. Export PDF

```ascii
User clicks "PDF" button
       │
       ▼
downloadPDF() em Editor.vue
       │
       ▼
calls exportService.downloadPDF(text, id, styles)
       │
       ├─> Lazy load: import('marked')
       ├─> Lazy load: import('html2pdf.js')
       │
       ▼
markdownToHtml(text) → HTML string
       │
       ▼
Inject HTML into hidden div (pdfContainer)
       │
       ▼
html2pdf() generates PDF from div
       │
       ▼
Browser downloads file
```

---

## 6. Padrões Adotados

### 1. Por que Commands Pattern?

**Problema:** Lógica de formatação estava misturada com UI

**Solução:** Extrair comandos stateless

**Benefícios:**

- ✅ Testáveis isoladamente
- ✅ Reutilizáveis (toolbar, keymap, menu)
- ✅ Fácil adicionar novos comandos
- ✅ Separação clara: UI chama comando, comando modifica editor

**Trade-off:** Mais arquivos, mas muito mais manutenível

---

### 2. Por que Factory Pattern para Services?

**Alternativa Rejeitada:** Singleton com URL hardcoded

```typescript
// ❌ Singleton (inflexível)
export const documentAPI = new DocumentAPI('http://localhost:1234')

// ✅ Factory (flexível)
export const createDocumentAPI = (baseUrl: string) => 
  new DocumentAPI(baseUrl)
```

**Benefícios:**

- ✅ Dependency injection (facilita testes)
- ✅ Múltiplas instâncias possíveis
- ✅ Configuração em tempo de execução

---

### 3. Por que Yjs em vez de Operational Transform?

**Yjs (CRDT - Conflict-free Replicated Data Type):**

- ✅ Offline-first
- ✅ Sem servidor central para conflict resolution
- ✅ Commutative operations (ordem não importa)
- ✅ Escala melhor (P2P possível)

**OT (Operational Transform):**

- ❌ Precisa servidor central
- ❌ Latência pode causar problemas
- ❌ Complexidade de implementação

---

### 4. Por que Lazy Loading em export.ts?

**Problema:** `marked` + `html2pdf` são libraries grandes (~300KB)

**Solução:** Dynamic imports

```typescript
const [{ marked }, { default: html2pdf }] = await Promise.all([
  import('marked'),
  import('html2pdf.js')
])
```

**Benefício:**

- Bundle inicial: -300KB
- Load time: -1.5s (estimado)
- Só carrega quando usuário clica em "Download PDF"

---

### 5. Por que Compartments para Spellcheck?

**CodeMirror Compartments** permitem reconfiguração dinâmica de extensões

```typescript
const spellcheckCompartment = new Compartment()

// Inicial
extensions: [
  spellcheckCompartment.of(spellcheckPlugin(true))
]

// Toggle dinâmico (sem recriar editor)
view.dispatch({
  effects: spellcheckCompartment.reconfigure(
    spellcheckPlugin(false)
  )
})
```

**Alternativa Rejeitada:** Destruir e recriar editor (perda de estado)

---

### 6.1 Convenções de Código

### TypeScript

**Type Annotations:**

```typescript
// ✅ Bom: Parâmetros sempre tipados
export const formatInline = (
  view: EditorView,
  prefix: string,
  suffix: string
): boolean => { /**/ }

// ❌ Evitar: Implicit any
export const formatInline = (view, prefix, suffix) => { /**/ }
```

**Generics:**

```typescript
// ✅ Bom: Type-safe com inferência
export const get = <T>(key: string, defaultValue: T): T => { /**/ }

// Uso:
const enabled = get('spellcheck', true)  // Type inferred: boolean
```

**Interfaces vs Types:**

```typescript
// ✅ Interfaces para objetos estendíveis
export interface CommandRegistry {
  [key: string]: Command
}

// ✅ Types para unions/intersections
export type Command = (view: EditorView, ...args: any[]) => boolean
```

---

### Naming Conventions

**Arquivos:**

- `kebab-case.ts` para arquivos
- `PascalCase.vue` para componentes

**Funções:**

- `camelCase` para funções normais
- `PascalCase` para componentes Vue

**Constantes:**

- `UPPER_SNAKE_CASE` para constantes globais
- `camelCase` para constantes locais

**Prefixos:**

- `create*` para factories
- `get*` para getters
- `is*` / `has*` para booleans

---

### Code Organization

**Ordem de imports:**

```typescript
// 1. Vue core
import { ref, reactive } from 'vue'

// 2. Third-party libraries
import { EditorView } from '@codemirror/view'

// 3. Internal modules (grouped)
import { formatInline } from '../cm-commands'
import * as persistence from '../services/persistence'
```

**Exports:**

```typescript
// ✅ Named exports (preferred)
export const myFunction = () => {}
export class MyClass {}

// ⚠️  Default exports (apenas para Vue components)
export default defineComponent({ /**/ })
```

---

### Documentation

**JSDoc para funções públicas:**

```typescript
/**
 * Applies inline formatting to the current selection or cursor position.
 * If no text is selected, inserts prefix/suffix at cursor.
 * 
 * @param view - CodeMirror EditorView instance
 * @param prefix - String to insert before selection (e.g., '**')
 * @param suffix - String to insert after selection (e.g., '**')
 * @returns true if formatting was applied successfully
 * 
 * @example
 * formatInline(view, '**', '**')  // Makes selection bold
 */
export const formatInline = (
  view: EditorView,
  prefix: string,
  suffix: string
): boolean => { /**/ }
```

---

## 7. Arquivos Importantes

| Arquivo                                 | Descrição                                                                                |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| `frontend/src/components/Editor.vue`    | Componente principal do editor colaborativo (UI, integração com CodeMirror e Yjs).       |
| `frontend/src/components/Explorer.vue`  | Componente de gestão administrativa de documentos na rota protegida `/explorer`.         |
| `frontend/src/services/document-api.ts` | Cliente HTTP para lock, unlock, acesso e operações administrativas de documentos.        |
| `frontend/src/services/config.ts`       | Resolução de URLs HTTP/WS por ambiente (`VITE_BACKEND_HTTP_URL`, `VITE_BACKEND_WS_URL`). |
| `backend/src/server.ts`                 | Bootstrap do backend (Express + WebSocket), rotas API e integração com sincronização.    |
| `backend/src/sync.ts`                   | Persistência CRDT, autenticação de acesso e operações administrativas de documentos.     |
| `backend/db/document-locks.json`        | Persistência de metadados de lock por documento (hash/salt).                             |
| `backend/db/document-metadata.json`     | Persistência de datas de criação e alteração de documentos.                              |
| `_docs/ARCHITETURE.md`                  | Documento arquitetural principal (fonte de verdade da arquitetura atual).                |
| `_docs/ARCHITETURE-plugins.md`          | Arquitetura e padrões dos plugins do CodeMirror.                                         |
| `_docs/EXPLORER.md`                     | Documentação funcional e técnica da rota administrativa `/explorer`.                     |
| `_docs/ia-context/`                     | Configuração MCP e Context7 para documentação dinâmica (CodeMirror, etc).                |
| `docker-compose.yml`                    | Orquestração de serviços para execução em produção/on-premises.                          |
| `Makefile`                              | Atalhos operacionais para ciclo de desenvolvimento e execução conteinerizada.            |
| `.env` / `.env.example`                 | Variáveis de ambiente para build/frontend e parâmetros de execução backend.              |

---

## 8. Guia de Implementação

### 8.1 Criando um Novo Comando

**Arquivo:** `src/cm-commands/my-command.ts`

```typescript
import type { EditorView } from '@codemirror/view'

/**
 * Description of what this command does
 * 
 * @param view - CodeMirror EditorView
 * @returns true if successful
 */
export const myCommand = (view: EditorView): boolean => {
  const { state } = view
  const { from, to } = state.selection.main
  
  // Your logic here
  view.dispatch({
    changes: { from, to, insert: 'new text' }
  })
  
  view.focus()
  return true
}
```

**Registrar em** `cm-commands/index.ts`:

```typescript
export { myCommand } from './my-command'

export const commands = {
  // ... existing
  myAction: (view: EditorView) => myCommand(view)
}
```

---

### 8.2 Criando um Novo Plugin

**Arquivo:** `src/cm-plugins/my-plugin.ts`

```typescript
import { ViewPlugin, ViewUpdate, DecorationSet } from '@codemirror/view'

/**
 * Plugin that does X
 */
export const myPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view)
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>()
    // Build decorations
    return builder.finish()
  }
}, {
  decorations: v => v.decorations
})
```

**Usar em Editor.vue:**

```typescript
import { myPlugin } from '../cm-plugins/my-plugin'

const state = EditorState.create({
  extensions: [
    // ... other extensions
    myPlugin
  ]
})
```

---

### 8.3 Adicionando um Novo Service

**Arquivo:** `src/services/my-service.ts`

```typescript
/**
 * Service responsible for X functionality
 */

export interface MyServiceConfig {
  apiUrl: string
}

export class MyService {
  constructor(private config: MyServiceConfig) {}

  async doSomething(param: string): Promise<Result> {
    const response = await fetch(`${this.config.apiUrl}/endpoint`)
    return response.json()
  }
}

/**
 * Factory function to create service instance
 */
export const createMyService = (config: MyServiceConfig): MyService => {
  return new MyService(config)
}
```

**Usar em Editor.vue:**

```typescript
import { createMyService } from '../services/my-service'

const myService = createMyService({ apiUrl: getApiBaseUrl() })
```

---

### 8.4 Guia de Onboarding

### Setup Local (Primeiro Dia)

```bash
# 1. Clone do repositório
git clone <repo-url>
cd dontpad

# 2. Install dependencies
cd frontend
npm install

# 3. Configure environment (opcional)
# Criar .env.local se precisar custom URLs
echo "VITE_BACKEND_HTTP_URL=http://localhost:1234" > .env.local
echo "VITE_BACKEND_WS_URL=ws://localhost:1234" >> .env.local

# 4. Start dev server
npm run dev
# Abre em http://localhost:3000

# 5. Build para produção
npm run build
# Output em dist/
```

### Estrutura de Aprendizado (Primeiras 2 Semanas)

#### Semana 1: Fundamentos

- [ ] Dia 1-2: Ler este documento (`_docs/ARCHITETURE.md`)
- [ ] Dia 2-3: Ler `_docs/ARCHITETURE-plugins.md` e consultar CodeMirror via Context7 MCP
- [ ] Dia 3-4: Explorar código:
  - `main.ts` → `App.vue` → `Home.vue` → `Editor.vue`
  - Criar documento de teste e editar
- [ ] Dia 4-5: Debugar fluxo de edição:
  - Colocar breakpoints em `applyFormat`
  - Ver como eventos CodeMirror funcionam
  - Testar colaboração (dois browsers)

#### Semana 2: Contribuindo

- [ ] Dia 1-2: Implementar comando simples (ex: inserir emoji)
- [ ] Dia 3-4: Criar plugin básico (ex: highlight de TODOs)
- [ ] Dia 5: Code review de PR existente

---

### Debugging Tips

**Vue DevTools:**

```bash
# Install extension:
# Chrome: https://chrome.google.com/webstore/detail/vuejs-devtools/...
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/

# Acessar em dev server (http://localhost:3000)
# Ver components tree, state, events
```

**CodeMirror State Inspection:**

```typescript
// No console do browser (com editor aberto):
window.view = view  // Expor view global (dev only)

// Inspecionar state
view.state.doc.toString()           // Conteúdo do documento
view.state.selection.main           // Posição do cursor
view.state.facet(EditorView.theme)  // Theme config
```

**Yjs Document Inspection:**

```typescript
// Ver conteúdo Yjs
ydoc.getText('codemirror').toString()

// Ver awareness (cursores colaborativos)
provider.awareness.getStates()
```

**Network Debugging (WebSocket):**

```ascii
Chrome DevTools → Network → WS
- Ver mensagens Yjs sync
- Filtrar por "awareness" para ver cursor updates
- "sync" messages contém CRDTs deltas
```

---

### 8.5 Testing Strategy (Recomendado)

### Unit Tests (Prioridade Alta)

**Comandos:**

```typescript
// tests/cm-commands/formatting.spec.ts
import { EditorState, EditorView } from '@codemirror/state'
import { formatInline } from '@/cm-commands/formatting'

describe('formatInline', () => {
  it('wraps selected text with prefix/suffix', () => {
    const state = EditorState.create({
      doc: 'Hello world',
      selection: { anchor: 0, head: 5 }  // "Hello"
    })
    const view = new EditorView({ state })
    
    formatInline(view, '**', '**')
    
    expect(view.state.doc.toString()).toBe('**Hello** world')
  })
})
```

**Services:**

```typescript
// tests/services/persistence.spec.ts
import * as persistence from '@/services/persistence'

describe('persistence', () => {
  beforeEach(() => localStorage.clear())
  
  it('stores and retrieves values', () => {
    persistence.set('test', { foo: 'bar' })
    const value = persistence.get('test', {})
    expect(value).toEqual({ foo: 'bar' })
  })
  
  it('returns default when key not found', () => {
    const value = persistence.get('missing', 'default')
    expect(value).toBe('default')
  })
})
```

---

### Integration Tests (Prioridade Média)

**Component Testing:**

```typescript
// tests/components/Editor.spec.ts
import { mount } from '@vue/test-utils'
import Editor from '@/components/Editor.vue'

describe('Editor', () => {
  it('initializes CodeMirror', async () => {
    const wrapper = mount(Editor, {
      props: { documentId: 'test' }
    })
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('.cm-editor').exists()).toBe(true)
  })
})
```

---

### E2E Tests (Prioridade Baixa, mas valiosa)

**Playwright/Cypress:**

```typescript
// e2e/collaboration.spec.ts
test('two users can edit simultaneously', async () => {
  const page1 = await browser.newPage()
  const page2 = await browser.newPage()
  
  await page1.goto('http://localhost:3000/test-doc')
  await page2.goto('http://localhost:3000/test-doc')
  
  await page1.type('.cm-content', 'Hello from user 1')
  await page2.waitForTimeout(500)  // Wait for sync
  
  const page2Content = await page2.textContent('.cm-content')
  expect(page2Content).toContain('Hello from user 1')
})
```

---

### 8.6 Performance Considerations

### Bundle Size Optimization

**Current Status:**

- Initial bundle: ~450KB (gzipped)
- Lazy loaded (PDF): ~300KB

**Otimizações Implementadas:**

✅ Lazy loading de `marked` e `html2pdf`
✅ Tree-shaking (Vite)
✅ Code splitting por rota

**Oportunidades Futuras:**

- [ ] Lazy load plugins (carregar sob demanda)
- [ ] Service Worker para cache agressivo
- [ ] Preload de assets críticos

---

### Runtime Performance

**CodeMirror Optimizations:**

- ✅ Decorations apenas no viewport (não documento todo)
- ✅ Update parcial em `ViewPlugin.update()` (só se docChanged)
- ✅ Debounce de network sync (Yjs builtin)

**Vue Optimizations:**

- ✅ `v-show` em vez de `v-if` para diálogos (evita remount)
- ✅ `ref` em vez de `reactive` para valores simples
- ✅ Computed properties para valores derivados

**Monitoring:**

```typescript
// Adicionar em dev mode
if (import.meta.env.DEV) {
  let lastUpdate = Date.now()
  view.updateListener.of(update => {
    const now = Date.now()
    console.log(`Update took ${now - lastUpdate}ms`)
    lastUpdate = now
  })
}
```

---

### 8.7 Security Considerations

### XSS Protection

**Markdown Rendering:**

```typescript
// ✅ Marked com sanitização
marked.parse(text, { 
  breaks: true, 
  gfm: true,
  sanitize: true  // Remove <script> tags
})
```

**User Input:**

```vue
<!-- ✅ Vue escaping automático -->
<div>{{ userText }}</div>

<!-- ❌ NUNCA use v-html com user input -->
<div v-html="userText"></div>  <!-- XSS vulnerability! -->
```

---

### Document Access Control

**Lock System:**

- Backend valida password antes de permitir WebSocket
- Frontend nunca armazena password (apenas envia para servidor)
- Re-verificação a cada reconexão

**Storage:**

```typescript
// ⚠️  localStorage é inseguro para dados sensíveis
persistence.set('spellcheck', true)  // ✅ OK (preferência)
persistence.set('password', 'segredo')  // ❌ NUNCA (credencial)
```

---

### 8.8 Troubleshooting Common Issues

### 1. Editor não inicializa

**Sintoma:** Tela branca ou erro no console

**Checklist:**

- [ ] `editorContainer.value` é null? → Adicionar `await nextTick()`
- [ ] Erro de CORS? → Verificar backend está rodando
- [ ] WebSocket connection failed? → Verificar `wsBaseUrl` em config

**Debug:**

```typescript
console.log('Container:', editorContainer.value)
console.log('WebSocket URL:', wsBaseUrl)
```

---

### 2. Colaboração não sincroniza

**Sintoma:** Edições de outro usuário não aparecem

**Checklist:**

- [ ] Ambos usuários no mesmo `documentId`?
- [ ] WebSocket conectado? → Ver `status === 'connected'`
- [ ] Firewall bloqueando WebSocket?
- [ ] Versão incompatível de Yjs?

**Debug:**

```typescript
provider.on('sync', synced => {
  console.log('Yjs synced:', synced)
})

provider.awareness.on('change', () => {
  console.log('Awareness update:', provider.awareness.getStates())
})
```

---

### 3. Build falha com TypeScript errors

**Sintoma:** `npm run build` falha

**Checklist:**

- [ ] Rodar `npm install` (dependencies atualizadas?)
- [ ] Verificar imports com paths corretos
- [ ] Type definitions instaladas? (`@types/*`)

**Common Errors:**

```ascii
TS2580: Cannot find name 'require'
→ Usar import ES6 em vez de require()

TS6133: 'X' is declared but never used
→ Remover import ou variável não-usada

TS2769: No overload matches this call
→ Verificar assinatura da função
```

---

### 8.9 Roadmap & Future Enhancements

### Curto Prazo (3-6 meses)

- [ ] **Testes Automatizados**
  - Unit tests para commands e services
  - Integration tests para Editor.vue
  - E2E tests para colaboração

- [ ] **Melhorias de UX**
  - Mobile keyboard shortcuts
  - Touch gestures para formatação
  - Drag & drop de imagens

- [ ] **Performance**
  - Service Worker para offline
  - Lazy load de plugins
  - Virtual scrolling para documentos grandes (>10k linhas)

---

### Médio Prazo (6-12 meses)

- [ ] **Features Colaborativas**
  - Comments/annotations
  - Presence indicators (who's viewing)
  - Document history/versioning

- [ ] **Editor Avançado**
  - Vim mode
  - Emacs keybindings
  - Custom themes (user-selectable)

- [ ] **Integrações**
  - GitHub sync
  - Google Drive export
  - Notion/Obsidian import

---

### Longo Prazo (12+ meses)

- [ ] **Rich Content**
  - Inline LaTeX rendering
  - Mermaid diagrams
  - Embedded media (YouTube, etc.)

- [ ] **Collaboration 2.0**
  - Voice/video chat
  - Screen sharing
  - Presentation mode

- [ ] **Extensibility**
  - Plugin marketplace
  - Custom commands API
  - Webhook integrations

---

## 9. Dependências Externas e Integrações

### 9.1 Dependências Externas e Serviços Integrados

| Dependência           | Tipo                                      | Link/Referência                             | Criticidade | Introduzida na Onda |
| --------------------- | ----------------------------------------- | ------------------------------------------- | ----------- | ------------------- |
| Yjs + y-websocket     | Biblioteca de colaboração (CRDT)          | <https://yjs.dev/>                          | Alta        | Onda 1 (MVP)        |
| CodeMirror 6          | Editor de texto extensível                | <https://codemirror.net/docs/>              | Alta        | Onda 1 (MVP)        |
| html2pdf.js           | Exportação de PDF no frontend             | <https://www.npmjs.com/package/html2pdf.js> | Média       | Onda 1 (MVP)        |
| LevelDB via y-leveldb | Persistência local do estado colaborativo | <https://github.com/yjs/y-leveldb>          | Alta        | Onda 1 (MVP)        |

### 9.2 Documentation

- **Vue 3:** `https://vuejs.org/guide/`
- **CodeMirror 6:** `https://codemirror.net/docs/`
- **Yjs:** `https://docs.yjs.dev/`
- **Tailwind CSS:** `https://tailwindcss.com/docs`
- **Vite:** `https://vitejs.dev/guide/`

### 9.3 Internal Docs

- **Centralização:** toda a documentação Markdown versionada do projeto está em `_docs/`.
- [Plugins do CodeMirror](./ARCHITETURE-plugins.md) — estrutura, uso e implementação dos plugins customizados do editor.
- **CodeMirror 6:** Consulte via [Context7 MCP Server](./ia-context/) — documentação oficial dinâmica e atualizada.
- [Arquitetura Unificada](./ARCHITETURE.md) — Documento principal de arquitetura do sistema.

### 9.4 Community

- **Vue Discord:** `https://discord.com/invite/vue`
- **CodeMirror Discuss:** `https://discuss.codemirror.net/`
- **Yjs GitHub Discussions:** `https://github.com/yjs/yjs/discussions`

---

## Apêndices Técnicos

### A. Glossary

| Termo           | Definição                                                                                          |
| --------------- | -------------------------------------------------------------------------------------------------- |
| **CRDT**        | Conflict-free Replicated Data Type - estrutura de dados que permite merge automático sem conflitos |
| **Awareness**   | Estado compartilhado em Yjs (cursores, presence)                                                   |
| **Decoration**  | Elemento visual sobreposto ao texto (CodeMirror)                                                   |
| **Transaction** | Mudança atômica no documento (CodeMirror)                                                          |
| **Extension**   | Módulo que adiciona funcionalidade ao editor                                                       |
| **ViewPlugin**  | Plugin que tem acesso à DOM view (CodeMirror)                                                      |
| **Command**     | Função stateless que opera sobre EditorView                                                        |
| **Compartment** | Extensão reconfigurável dinamicamente (CodeMirror)                                                 |
| **Facet**       | Configuração compartilhada entre extensões (CodeMirror)                                            |
| **Range Set**   | Estrutura eficiente para decorações (CodeMirror)                                                   |

---

### B. Architecture Diagrams

### Component Interaction Diagram

```ascii
┌────────────────────────────────────────────────────────────┐
│                        Editor.vue                          │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Toolbar    │───>│   Commands   │───>│  CodeMirror  │  │
│  │   Buttons    │    │   (calls)    │    │     View     │  │
│  └──────────────┘    └──────────────┘    └───────┬──────┘  │
│                                                  │         │
│  ┌──────────────┐    ┌──────────────┐            │         │
│  │   Dialogs    │───>│   Services   │            │         │
│  │ (Link, Lock) │    │  (API, etc)  │            │         │
│  └──────────────┘    └──────────────┘            │         │
│                                                  │         │
│                      ┌──────────────┐            │         │
│                      │     Yjs      │<───────────┘         │
│                      │   Document   │                      │
│                      └──────┬───────┘                      │
└─────────────────────────────┼──────────────────────────────┘
                              │
                              │ WebSocket
                              ▼
                      ┌────────────────┐
                      │ Backend Server │
                      └────────────────┘
```

---

### CodeMirror Extension Stack

```ascii
┌─────────────────────────────────────────────┐
│            EditorView (DOM)                 │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────┐  ┌───────────┐  ┌────────┐   │
│  │  Plugins  │  │  Keymap   │  │ Theme  │   │
│  │ (viewport)│  │ (events)  │  │ (CSS)  │   │
│  └─────┬─────┘  └─────┬─────┘  └───┬────┘   │
│        │              │              │      │
│        └──────────────┼──────────────┘      │
│                       │                     │
│              ┌────────▼────────┐            │
│              │  EditorState    │            │
│              │  - Document     │            │
│              │  - Selection    │            │
│              └────────┬────────┘            │
│                       │                     │
│              ┌────────▼────────┐            │
│              │   Yjs Binding   │            │
│              └────────┬────────┘            │
└───────────────────────┼─────────────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  Yjs Y.Text  │
                 └──────────────┘
```

---

### C. Arquitetura Backend

O backend do DontPad é responsável por três eixos principais:

1. Expor APIs HTTP para controle de acesso e administração de documentos;
2. Intermediar conexões WebSocket para colaboração em tempo real com Yjs;
3. Persistir estado colaborativo e metadados de proteção por senha.

---

### D. Estrutura do Backend

```filesystem
backend/
├── src/
│   ├── server.ts      # Bootstrap HTTP + WS + rotas API
│   └── sync.ts        # Integração Yjs, persistência, locks e auth WS
├── dist/              # Build TypeScript (gerado)
├── db/                # Persistência (runtime)
│   ├── yjs-data/      # Dados LevelDB dos documentos
│   └── document-locks.json  # Senhas de lock (hash + salt)
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

### E. Arquitetura de Execução (Backend)

```ascii
┌──────────────────────────────────────────────────────┐
│                  Node.js Process                     │
│  ┌────────────────────────────────────────────────┐  │
│  │                server.ts                       │  │
│  │  - Express app                                 │  │
│  │  - HTTP routes (/api/*)                        │  │
│  │  - WebSocketServer(ws)                         │  │
│  └───────────────────────┬────────────────────────┘  │
│                          │ connection                │
│  ┌───────────────────────▼────────────────────────┐  │
│  │                   sync.ts                      │  │
│  │  - setupWSConnection wrapper                   │  │
│  │  - Password gate para docs lockados            │  │
│  │  - Yjs persistence hooks (y-websocket utils)   │  │
│  └───────────────┬───────────────────┬────────────┘  │
│                  │                   │               │
│        ┌─────────▼───────────┐   ┌───▼─────────────┐ │
│        │   LeveldbPersistence│   │ document-locks  │ │
│        │   (yjs-data/)       │   │ .json           │ │
│        └─────────────────────┘   └─────────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

### F. Responsabilidades por Módulo (Backend)

### `src/server.ts`

**Responsabilidades:**

- Inicializa `Express` com `cors()` e `express.json()`;
- Cria servidor HTTP e acopla `WebSocketServer`;
- Publica rotas REST de saúde, listagem e controle de lock;
- Delega lógica de sincronização e validação para `sync.ts`.

**Rotas expostas:**

| Método   | Rota                                   | Objetivo                                                                                |
| -------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| `GET`    | `/api/health`                          | Health check do serviço                                                                 |
| `GET`    | `/api/documents`                       | Lista documentos persistidos e seus summaries (protegido por `x-docs-password`)         |
| `GET`    | `/api/document-content?documentId=...` | Retorna conteúdo markdown de um documento (protegido por `x-docs-password`)             |
| `POST`   | `/api/documents/rename`                | Renomeia documento e rota associada (protegido por `x-docs-password`)                   |
| `DELETE` | `/api/documents`                       | Remove documento permanentemente (protegido por `x-docs-password`)                      |
| `GET`    | `/api/document-lock?documentId=...`    | Consulta se documento está travado                                                      |
| `POST`   | `/api/document-lock`                   | Define/atualiza senha de lock de um documento                                           |
| `DELETE` | `/api/document-lock`                   | Remove lock (requer senha válida)                                                       |
| `POST`   | `/api/document-access`                 | Verifica permissão de acesso ao documento                                               |

---

### `src/sync.ts`

**Responsabilidades:**

- Inicializa persistência de CRDT com `y-leveldb` em `backend/db/yjs-data`;
- Gerencia lock de documentos em memória + disco (`backend/db/document-locks.json`);
- Gerencia metadados de documentos em disco (`backend/db/document-metadata.json`);
- Mantém status de documento aberto por sessões WebSocket ativas;
- Faz hash de senha com `crypto.scryptSync` e comparação com `timingSafeEqual`;
- Configura hooks de persistência via `setPersistence` do `y-websocket`;
- Implementa wrapper de `setupWSConnection` para autenticar acesso WebSocket em documentos lockados.

**Funções principais expostas:**

- `listDocumentNames()`
- `listDocumentSummaries()`
- `getDocumentContent(docName)`
- `isDocumentLocked(docName)`
- `setDocumentPassword(docName, password)`
- `removeDocumentPassword(docName)`
- `renameDocument(fromDocName, toDocName)`
- `deleteDocument(docName)`
- `verifyDocumentAccess(docName, password)`
- `verifyDocumentsMasterPassword(password)`

---

### G. Fluxos de Dados (Backend)

### 1. Handshake WebSocket com autorização

```ascii
Client conecta em /api/<doc>?password=...
      │
      ▼
server.ts -> wss.on('connection') -> setupWSConnection(conn, req)
      │
      ▼
sync.ts normaliza docName (remove prefixos api/ws/socket)
      │
      ├─ Documento sem lock -> segue
      └─ Documento lockado:
         ├─ password inválida -> close(4403, 'forbidden')
         └─ password válida -> setupWSConnectionOriginal(...)
```

### 2. Persistência incremental de documento colaborativo

```ascii
Cliente edita documento
  │
  ▼
Yjs emite update
  │
  ▼
Hook bindState (sync.ts) registra ydoc.on('update')
  │
  ▼
persistence.storeUpdate(docName, update)
  │
  ▼
LevelDB armazena update incremental
```

### 3. Ciclo de lock/unlock via API

```ascii
POST /api/document-lock
  -> valida documentId/password
  -> gera salt aleatório
  -> hash com scrypt
  -> salva em document-locks.json

DELETE /api/document-lock
  -> valida senha do documento (ou master)
  -> remove registro de lock
  -> persiste arquivo
```

---

### H. Segurança e Controle de Acesso (Backend)

### Senhas de lock por documento

- Senhas não são armazenadas em texto puro;
- Cada documento recebe `salt` exclusivo;
- Hash calculado com `scrypt`;
- Comparação de hash com `timingSafeEqual` para reduzir side-channel timing.

### Senha mestre do ambiente

- Controlada por `DOCUMENTS_MASTER_PASSWORD`;
- Permite listar documentos em `/api/documents`;
- Permite bypass administrativo em validação de lock.

### Fluxo funcional de documentos com cadeado

- O lock é acionado na UI (botão de cadeado) e persiste no backend em `backend/db/document-locks.json`;
- Após travar um documento, novas sessões exigem senha no acesso inicial;
- O desbloqueio aceita a senha do próprio documento ou a senha mestre do ambiente;
- Em conexões WebSocket de documentos protegidos, senha inválida resulta em fechamento com código `4403`.

### Respostas de erro padronizadas

- `400` para payload inválido (ex.: `document_id_required`);
- `403` para acesso negado (`invalid_password`);
- `500` para falhas internas (ex.: listagem de documentos).

---

### I. Configuração e Deploy (Visão Unificada)

### Docker Compose (produção simplificada)

**Serviços:**

- `backend`: expõe `127.0.0.1:1234`, monta volume `yjs_data`, recebe `PORT` e `DOCUMENTS_MASTER_PASSWORD`;
- `frontend`: expõe `127.0.0.1:8080`, depende do backend e injeta variáveis `VITE_BACKEND_HTTP_URL`/`VITE_BACKEND_WS_URL`.

### Variáveis de ambiente para build do frontend

No deploy conteinerizado, o frontend recebe variáveis no build para definir senha e endpoints de integração:

```bash
VITE_HOME_DOCS_PASSWORD=defina-uma-senha-forte
VITE_HOME_DOCS_SHORTCUT=Alt+R
VITE_BACKEND_HTTP_URL=https://dontpad.seudominio.com
VITE_BACKEND_WS_URL=wss://dontpad.seudominio.com/api
```

Notas operacionais:

- Sem `VITE_HOME_DOCS_PASSWORD`, o build deve falhar por requisito de segurança;
- Em cenário com proxy único no domínio do frontend, recomenda-se WebSocket com sufixo `/api`;
- No compose, `DOCUMENTS_MASTER_PASSWORD` do backend deve ser derivada de `VITE_HOME_DOCS_PASSWORD` para manter consistência operacional.

### Build backend

- Multi-stage Dockerfile (`node:20-alpine`):
  1. estágio builder compila TypeScript (`npm run build`);
  2. estágio runtime instala apenas dependências de produção e executa `npm start`.

### Operação local

- `make dev-backend` para API/WS em desenvolvimento;
- `make dev-frontend` para UI em desenvolvimento;
- `make run` / `make stop` para stack conteinerizada.

### Reverse proxy recomendado (produção)

Para exposição segura com domínio, recomenda-se publicar frontend e backend por proxy reverso.

Exemplo com Caddy:

```caddyfile
dontpad.seusite.com {
  reverse_proxy localhost:8080
}

dontpadsrv.seusite.com {
  reverse_proxy localhost:1234
}
```

Esse arranjo separa o tráfego HTTP da SPA e o tráfego WebSocket/API, simplificando TLS e roteamento.

---

### J. Fronteiras e Contratos entre Frontend e Backend

### Contratos HTTP usados pelo frontend

- `services/document-api.ts` consome endpoints `/api/document-lock` e `/api/document-access`;
- A UI de listagem de documentos depende de `/api/documents` com header `x-docs-password`.

### Contrato WebSocket

- Frontend conecta no endpoint base definido por `VITE_BACKEND_WS_URL`;
- O nome do documento é derivado do path da URL;
- Para documentos lockados, o frontend deve fornecer `password` na query string do handshake.

### Consistência de sincronização

- Backend delega resolução de concorrência ao modelo CRDT do Yjs;
- Persistência guarda updates incrementais e restaura estado no próximo bind do documento.

---

### K. Decisões Arquiteturais (Backend)

### 1. Persistência com LevelDB + y-leveldb

**Motivação:** manter backend self-hosted simples, sem dependência de SGBD externo.

**Benefícios:**

- Setup mínimo de infraestrutura;
- Escrita incremental eficiente para updates de colaboração;
- Boa aderência ao ecossistema Yjs.

### 2. Lock metadata em arquivo JSON

**Motivação:** armazenar apenas metadados de acesso (hash/salt) de forma transparente e portátil.

**Trade-off:**

- Simplicidade operacional alta;
- Não ideal para cenários de múltiplas instâncias backend sem storage compartilhado.

### 3. API + WS no mesmo processo

**Motivação:** reduzir complexidade inicial e facilitar deploy on-premises.

**Benefícios:**

- Menos moving parts;
- Menor latência de coordenação entre auth HTTP e conexão WS;
- Operação simplificada para times pequenos.

---

### L. Limitações Conhecidas e Evolução

- Lock metadata em arquivo local exige cuidado em cenários multi-réplica;
- Falta de observabilidade estruturada (métricas, tracing e logs correlacionados);
- Não há rate limiting nativo nas rotas HTTP;
- Roadmap recomendado: storage compartilhado para locks, autenticação expandida e telemetry.

---

## 10. Histórico de Ondas

### 10.1 Registro de Ondas

- **Onda 1 — MVP colaborativo**
  - **Principais alterações arquiteturais:** Definição da arquitetura base SPA + API/WS, adoção de Yjs/CodeMirror e persistência em LevelDB com lock por documento.
  - **ADRs relacionados:** N/A

### 10.2 Changelog do Documento

- **Versão 2.0**
  - **Data:** 2026-03-01
  - **Autor:** GitHub Copilot
  - **Mudanças:** Documento reorganizado para arquitetura unificada (frontend + backend), incluindo módulos, fluxos e decisões do backend.

- **Versão 1.0**
  - **Data:** 2026-02-26
  - **Autor:** GitHub Copilot
  - **Mudanças:** Documento inicial focado em frontend após refatoração Phase 1-4.

---

> **Fim do Documento**

Para dúvidas ou sugestões de melhorias neste documento, abra uma issue no repositório ou contate o tech lead.

---

> **Mantenedores Atuais:**

- Time de Desenvolvimento DontPad
- Arquitetura: [Vagner]
- Code Review: [Vagner, GitHub Copilot]

> **Status:** ✅ DOCUMENTO ATIVO - Atualizar após mudanças arquiteturais significativas
