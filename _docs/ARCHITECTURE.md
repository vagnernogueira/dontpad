# DontPad - Arquitetura de Software (Hub IA-First)

**Tipo de documento:** Hub de Arquitetura (central + módulos)  
**Arquitetura de produto:** SPA + API/WS Backend com sincronização CRDT

---

## Índice Navegável

- [Guia de Uso da Documentação](#guia-de-uso-da-documentação)
- [1. Visão Arquitetural](#1-visão-arquitetural)
- [2. Stack de Tecnologias (Resumo)](#2-stack-de-tecnologias-resumo)
- [3. Diagrama de Arquitetura](#3-diagrama-de-arquitetura)
- [4. Estrutura IA-First de Documentação](#4-estrutura-ia-first-de-documentação)
- [5. Mapa de Módulos Arquiteturais](#5-mapa-de-módulos-arquiteturais)
- [6. Contratos e Decisões Centrais](#6-contratos-e-decisões-centrais)
- [7. Arquivos Importantes](#7-arquivos-importantes)
- [8. Dependências Externas e Integrações](#8-dependências-externas-e-integrações)
- [9. Histórico de Ondas e Changelog](#9-histórico-de-ondas-e-changelog)

---

## Guia de Uso da Documentação

### Para leitura humana (onboarding)

1. Ler este hub por completo;
2. Navegar para os módulos conforme o tema da tarefa.

### Para uso com IA (recuperação eficiente)

1. Consultar primeiro este hub para contexto e contratos;
2. Buscar o módulo específico do domínio afetado;
3. Evitar carregar módulos não relacionados para reduzir ruído de contexto.

### Regra de atualização

- mudanças de contrato global devem atualizar o hub **e** o módulo afetado;
- mudanças locais de implementação devem atualizar somente o módulo correspondente;
- manter links bidirecionais entre hub e módulos.

---

## 1. Visão Arquitetural

O DontPad é uma aplicação full-stack para edição colaborativa de documentos Markdown em tempo real.

- Frontend SPA: Vue 3 + CodeMirror 6;
- CLI opcional: Node.js + commander.js para automação operacional e integração por terminal;
- Backend: Node.js + Express + WebSocket;
- Sincronização: Yjs (CRDT), com persistência incremental em LevelDB.

Características principais:

- edição colaborativa em tempo real;
- CLI isolado para configurar acesso e operar leitura, exportação, atualização e criação de documentos;
- criação de documentos a partir de templates em `/_tmpl/` pela Home;
- proteção por senha de documentos;
- Explorer administrativo em `/explorer` com senha mestra;
- exportação para Markdown e PDF;
- acesso por URL parametrizada para formatos `pdf`, `view` e `raw`;
- arquitetura modular com separação clara de responsabilidades.

---

## 2. Stack de Tecnologias (Resumo)

| Camada            | Tecnologias principais                                    |
| ----------------- | --------------------------------------------------------- |
| Frontend          | Vue 3, TypeScript, Vite, Vue Router                       |
| CLI               | Node.js, TypeScript, commander.js                         |
| Editor            | CodeMirror 6, @lezer/markdown                             |
| Colaboração       | Yjs, y-websocket, y-codemirror.next                       |
| Backend           | Node.js, Express, ws, TypeScript                          |
| Persistência      | y-leveldb, LevelDB, metadados JSON                        |
| UI/UX             | Tailwind CSS v4 (modelo híbrido com `base.css` + `@config`), shadcn-vue, reka-ui, Lucide Vue Next |
| Export            | marked, html2pdf.js                                       |
| Qualidade de código | ESLint v9 (flat config), typescript-eslint v8, eslint-plugin-vue v9, Prettier v3 |

Detalhes extensos de implementação por camada estão nos módulos listados na seção 5.

---

## 3. Diagrama de Arquitetura

```ascii
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Vue 3 Application                       │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐      │   │
│  │  │   Router   │  │ Components │  │ Composables│      │   │
│  │  └─────┬──────┘  └──────┬─────┘  └──────┬─────┘      │   │
│  │        │                │               │            │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐      │   │
│  │  │  Services  │  │ CM Plugins │  │ CM Commands│      │   │
│  │  └─────┬──────┘  └──────┬─────┘  └──────┬─────┘      │   │
│  │        │                │               │            │   │
│  │  ┌─────▼────────────────▼───────────────▼────────┐   │   │
│  │  │         CodeMirror 6 + Yjs                    │   │   │
│  │  └───────────────────┬───────────────────────────┘   │   │
│  └──────────────────────┼───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
        │ HTTP API + WebSocket Sync
┌─────────────────────────▼───────────────────────────────────┐
│                    Backend Server (Node.js)                 │
│ - Express REST                                              │
│ - WebSocket Provider (Yjs)                                  │
│ - LevelDB Persistence                                       │
└─────────────────────────┬───────────────────────────────────┘
        │
      ┌─────────────▼─────────────┐
      │      CLI Package          │
      │ - commander.js bootstrap  │
      │ - HTTP document reads     │
      │ - Yjs WebSocket writes    │
      └───────────────────────────┘
```

---

## 4. Estrutura IA-First de Documentação

Padrão adotado: **hub central + módulos especializados**.

- O hub (`_docs/ARCHITECTURE.md`) concentra visão, contratos e mapa de navegação;
- Detalhamento técnico fica em `_docs/architecture/*.md`;
- Cada módulo define escopo, donos, arquivos-fonte e gatilhos de atualização.

```filesystem
_docs/
├── ARCHITECTURE.md                # Hub central (este documento)
└── architecture/
    ├── frontend-editor.md         # Editor, componentes, commands/plugins/services
    ├── backend-runtime.md         # Runtime backend, rotas, WS, persistência
    ├── plugins-codemirror.md      # Taxonomia/plugins/keymaps/snippets/math
    ├── explorer.md                # Arquitetura funcional da rota /explorer
    ├── security.md                # Segurança, lock, auth, riscos
    └── deploy-operations.md       # Build, compose, env, operação e proxy
```

---

## 5. Mapa de Módulos Arquiteturais

- [Frontend Editor](./architecture/frontend-editor.md) — camada de UI/editor e fluxos no browser.
- [CLI](../cli/README.md) — pacote isolado para automação e operações de documentos por terminal.
- [Backend Runtime](./architecture/backend-runtime.md) — execução backend, contratos HTTP/WS e persistência.
- [Plugins CodeMirror](./architecture/plugins-codemirror.md) — plugins, keymaps, snippets e limites do parser.
- [Explorer de Documentos](./architecture/explorer.md) — regras funcionais e endpoints administrativos.
- [Segurança e Controle de Acesso](./architecture/security.md) — lock, senha mestre, autorização e riscos.
- [Deploy e Operações](./architecture/deploy-operations.md) — execução local, compose, env e publicação.

---

## 6. Contratos e Decisões Centrais

### 6.1 Contratos globais

- colaboração em tempo real usa Yjs (CRDT) como fonte de consistência;
- acesso administrativo exige `x-docs-password` válido;
- o CLI reutiliza apenas contratos já existentes: leitura por `GET /api/document-content` ou `GET /api/public-document-content`, e escrita/criação pela mesma sincronização Yjs/WebSocket do editor;
- templates de documentos são listados por endpoint público dedicado e só podem ser aplicados automaticamente em documento novo ou vazio;
- acesso por URL parametrizada (`pdf/view/raw`) usa endpoint dedicado de conteúdo e respeita lock por documento;
- documentos lockados exigem senha para acesso e handshake WS.

### 6.2 Decisões arquiteturais centrais

- **Commands Pattern** no frontend para reduzir acoplamento da UI;
- **CLI autocontido** em `cli/`, sem workspace npm na raiz e sem alterar os contratos públicos do backend;
- **Factory Pattern** em services para configuração e testabilidade;
- **Composables Pattern** para extrair lógica reativa de componentes Vue complexos (`useYjsEditor`, `useDocumentAccess`, `useCollaborators`, `useExplorerSession`, `useDocumentList`);
- **Component Composition** com sub-componentes focados: `EditorHeader`, `EditorToolbar`, `BaseDialog` (thin wrapper shadcn), `LinkDialog`, `ImageDialog`, `LockDialog`, `AccessDialog`, `ProfileDialog`;
- **Camada UI shadcn-vue expandida** em `frontend/src/components/ui/`, hoje com `alert`, `alert-dialog`, `avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `input`, `label`, `separator`, `switch` e `table` versionados no repositório;
- **Tailwind CSS v4 em modo híbrido**: `frontend/src/styles/base.css` é o ponto de entrada CSS-first com `@import "tailwindcss"`, enquanto `frontend/tailwind.config.js` segue referenciado via `@config` para tokens, breakpoints e plugins;
- **CSS Component Layer** via `@layer components` com `@apply` para abstrações reutilizáveis de layout, botões e inputs; camada de diálogos migrada para primitivos **shadcn-vue** (`Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter` via `reka-ui`);
- **Contexto operacional shadcn-vue**: a configuração vive em `frontend/components.json`; comandos de inspeção/instalação devem rodar em `frontend/` com `npx shadcn-vue@latest ...` (ou scripts equivalentes do pacote), não na raiz com `npx shadcn@latest`;
- **Orquestração explícita de foco do editor**: o fluxo de montagem do CodeMirror e a restauração de seleção após diálogos usam helpers dedicados em `frontend/src/cm-utils/initial-editor-focus.ts`, evitando depender do retorno automático de foco do browser ou do `Dialog`;
- **CRDT (Yjs)** em vez de OT para merge automático e melhor suporte offline;
- **Lazy loading** para bibliotecas pesadas de export (`marked`, `html2pdf.js`);
- **LevelDB local** para persistência incremental simples em ambiente self-hosted;
- **Design tokens Tailwind v4** para spacing, fontes e cores customizadas (`btn`, `btn-sm`, `header`, `font-ui`, `font-code`, `code-bg`);
- **Barrel indexes** em todos os módulos `cm-*`, `services` e `composables` para centralizar exports.

### 6.3 Estratégia de qualidade de código (lint)

- **ESLint v9** com flat config (`eslint.config.js`) — padrão atual, configurado por pacote;
- **typescript-eslint v8** — parser e regras para TypeScript em ambas as camadas;
- **eslint-plugin-vue v9** — regras Vue 3 + parser de `.vue` (frontend only);
- **Prettier v3** — formatação de código; config compartilhada em `.prettierrc` na raiz;
- **eslint-config-prettier** — desativa regras ESLint que conflitam com Prettier;
- Scripts disponíveis em cada pacote: `lint`, `lint:fix`, `format`;
- Backend usa `eslint.config.mjs` (ESM explícito) por ser pacote CommonJS sem `"type": "module"`;
- Regras adotadas: `no-explicit-any` em `warn`, `no-unused-vars` em `error` (variáveis `_` ignoradas), `vue/multi-word-component-names` desativado (compatível com `App.vue`).

### 6.4 Limitações conhecidas (resumo)

- lock metadata local não é ideal em multi-réplica sem storage compartilhado;
- ausência de rate limiting nativo nas rotas;
- observabilidade ainda pode evoluir para métricas/tracing estruturados.

---

## 7. Arquivos Importantes

| Arquivo                                     | Descrição                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `frontend/src/components/Home.vue`          | Landing page com criação de documentos e seleção de templates vindos de `/_tmpl/`.              |
| `frontend/src/components/DocumentRoute.vue` | Resolução de modos por query params e fallback para edição.                                      |
| `frontend/src/components/Editor.vue`        | Componente principal do editor colaborativo; orquestra composables, diálogos e a restauração de seleção/foco do CodeMirror. |
| `frontend/src/composables/useYjsEditor.ts`  | Inicialização e teardown do Yjs + CodeMirror, incluindo autofocus inicial do cursor na posição zero após montar o `EditorView`. |
| `frontend/src/components/EditorHeader.vue`  | Header bar extraída do Editor: navegação, badge do documento, status de conexão e avatares.      |
| `frontend/src/components/EditorToolbar.vue` | Toolbar de formatação, undo/redo e downloads extraída do Editor.                                 |
| `frontend/src/components/BaseDialog.vue`    | Thin wrapper shadcn-vue: encapsula `Dialog` + `DialogContent` + `DialogHeader` + `DialogFooter`. |
| `frontend/src/components/ui/*`              | Componentes shadcn-vue versionados no projeto (`alert`, `alert-dialog`, `avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `input`, `label`, `separator`, `switch`, `table`). |
| `frontend/src/components/*Dialog.vue`       | Diálogos focados: Link, Image, Lock, Access, Profile (usam shadcn `Dialog` diretamente).         |
| `frontend/src/components/Explorer.vue`      | Gestão administrativa de documentos em `/explorer` (orquestra composables).                      |
| `frontend/src/components/ToolbarButton.vue` | Componente reutilizável para botões de toolbar com estilo padronizado.                           |
| `frontend/components.json`                  | Configuração da CLI shadcn-vue, aliases e arquivo CSS principal (`src/styles/base.css`).         |
| `frontend/src/styles/base.css`              | Entrada CSS do Tailwind v4; importa `tailwindcss`, registra `@custom-variant dark` e referencia `tailwind.config.js` via `@config`. |
| `frontend/src/styles/components.css`        | Abstrações CSS com `@apply` (`btn-*`, `dialog-*`, `input-*`, `page-header`, `toolbar`).          |
| `frontend/src/composables/*`                | Composables Vue 3 para lógica reativa extraída dos componentes.                                  |
| `frontend/src/cm-utils/initial-editor-focus.ts` | Helper local do editor para foco inicial em linha 1/coluna 1 e captura/restauração explícita da seleção ao abrir e fechar diálogos. |
| `frontend/src/cm-utils/math-evaluator.ts`   | Parser matemático recursivo descendente (tokenizer + avaliador).                                 |
| `frontend/src/cm-utils/snippet-registry.ts` | Registry compartilhado de snippets e prefixes para tab-keymap e snippet plugins.                 |
| `frontend/src/__tests__/unit/initial-editor-focus.test.ts` | Testes unitários do fluxo de foco inicial e restauração de seleção do editor.                    |
| `frontend/src/services/document-api.ts`     | Cliente HTTP para lock/access e ações administrativas.                                           |
| `cli/src/cli.ts`                            | Bootstrap do CLI com `commander`, help estruturado e registro dos comandos `config`, `get`, `update` e `create`. |
| `cli/src/config.ts`                         | Persistência de `baseUrl`, `wsBaseUrl` opcional e `masterPassword` opcional para o CLI.         |
| `cli/src/document-api.ts`                   | Cliente HTTP do CLI para leitura de conteúdo, reutilizando os contratos existentes.              |
| `cli/src/document-sync.ts`                  | Escrita e criação via sincronização Yjs/WebSocket reutilizada do produto.                        |
| `backend/src/server.ts`                     | Bootstrap backend (Express + WS + rotas API).                                                    |
| `backend/src/sync.ts`                       | Persistência CRDT, lock e autenticação WS.                                                       |
| `_docs/ARCHITECTURE.md`                     | Hub arquitetural (fonte de verdade central).                                                     |
| `_docs/architecture/*.md`                   | Módulos especializados de arquitetura IA-first.                                                  |

---

## 8. Dependências Externas e Integrações

| Dependência           | Tipo                                                | Criticidade |
| --------------------- | --------------------------------------------------- | ----------- |
| Yjs + y-websocket     | Colaboração (CRDT)                                  | Alta        |
| CodeMirror 6          | Editor extensível                                   | Alta        |
| LevelDB via y-leveldb | Persistência colaborativa                           | Alta        |
| commander.js          | Parsing, help e composição do CLI                   | Média       |
| reka-ui               | Primitivos headless UI (focus trap, aria, keyboard) | Alta        |
| shadcn-vue            | Componentes UI copiados para `components/ui/` e versionados no repositório | Média       |
| html2pdf.js           | Export PDF frontend                                 | Média       |

Referências externas:

- [Vue 3](https://vuejs.org/guide/)
- [CodeMirror 6](https://codemirror.net/docs/)
- [Yjs](https://docs.yjs.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite](https://vitejs.dev/guide/)
- [Contexto IA interno](./ia-context/)

---

## 9. Histórico de Ondas e Changelog

### 9.1 Registro de Ondas

- **Onda 1 — MVP colaborativo**
  - Principais alterações arquiteturais: base SPA + API/WS, adoção de Yjs/CodeMirror e persistência em LevelDB.

### 9.2 Changelog do Documento

- **Versão 3.9**
  - **Data:** 2026-04-25
  - **Autor:** GitHub Copilot
  - **Mudanças:** Hub atualizado para incluir o pacote `cli/` como terceiro módulo do sistema, com referência aos comandos `config/get/update/create`, aos contratos HTTP reutilizados para leitura e ao fluxo Yjs/WebSocket reutilizado para escrita e criação.

- **Versão 3.8**
  - **Data:** 2026-04-16
  - **Autor:** GitHub Copilot
  - **Mudanças:** Documentação alinhada ao autofocus inicial do CodeMirror, à restauração explícita da seleção do editor após fechar diálogos e aos novos arquivos `frontend/src/cm-utils/initial-editor-focus.ts` e `frontend/src/__tests__/unit/initial-editor-focus.test.ts`.

- **Versão 3.7**
  - **Data:** 2026-04-15
  - **Autor:** GitHub Copilot
  - **Mudanças:** Documentação alinhada ao suporte a templates de documentos na Home, com seleção baseada em `/_tmpl/`, novo endpoint público `GET /api/document-templates` e aplicação automática apenas para documento novo ou vazio.

- **Versão 3.6**
  - **Data:** 2026-04-14
  - **Autor:** GitHub Copilot
  - **Mudanças:** Documentação alinhada ao estado atual do frontend com Tailwind CSS v4 em modelo híbrido (`base.css` + `@config` para `tailwind.config.js`), inventário expandido de `frontend/src/components/ui/` e inclusão de arquivos operacionais relevantes da camada de UI.

- **Versão 3.5**
  - **Data:** 2026-03-23
  - **Autor:** Claude Sonnet 4.6
  - **Mudanças:** Adoção de estratégia de lint unificada. ESLint v9 (flat config) + typescript-eslint v8 + eslint-plugin-vue v9 + Prettier v3 configurados em frontend e backend. Scripts `lint`, `lint:fix` e `format` adicionados a ambos os pacotes. Seção 6.3 (qualidade de código) adicionada ao hub. Linha "Qualidade de código" adicionada à tabela de stack (seção 2).

- **Versão 3.4**
  - **Data:** 2026-03-18
  - **Autor:** GitHub Copilot
  - **Mudanças:** Extração de `EditorHeader.vue` do `Editor.vue` (header bar descoplada como componente próprio). Contagem de componentes: 13 → 14.

- **Versão 3.3**
  - **Data:** 2026-03-18
  - **Autor:** GitHub Copilot
  - **Mudanças:** Adoção de shadcn-vue (Fase 1 + 2): infraestrutura (`components.json`, `src/lib/utils.ts`, CSS variables em `base.css`, tokens shadcn em `tailwind.config.js`), instalação de `dialog` e `button`, migração de todos os 6 diálogos para primitivos `reka-ui` (focus trap, aria-modal, Escape nativo). Stack UI/UX adicionada: `reka-ui`, `shadcn-vue`.

- **Versão 3.2**
  - **Data:** 2026-03-18
  - **Autor:** GitHub Copilot
  - **Mudanças:** Componentização avançada do Editor (EditorToolbar, BaseDialog, 5 diálogos focados). CSS Component Layer com `@apply` para 19 classes reutilizáveis. Aplicação das classes em Editor, Explorer, ProfileDialog e DocumentRoute. Contagem de componentes: 7 → 13.

- **Versão 3.1**
  - **Data:** 2026-03-18
  - **Autor:** GitHub Copilot
  - **Mudanças:** Atualização para refletir refatoração completa do frontend: composables extraídos de Editor/Explorer, ToolbarButton.vue, snippet-registry.ts, math-evaluator.ts, barrel indexes, CSS modular, design tokens Tailwind.

- **Versão 3.0**
  - **Data:** 2026-03-12
  - **Autor:** GitHub Copilot
  - **Mudanças:** Refatoração para modelo IA-first (hub central + módulos em `_docs/architecture`).

- **Versão 2.3**
  - **Data:** 2026-03-12
  - **Autor:** GitHub Copilot
  - **Mudanças:** Consolidação da documentação do Explorer no documento principal e remoção do documento dedicado.

- **Versão 2.2**
  - **Data:** 2026-03-12
  - **Autor:** GitHub Copilot
  - **Mudanças:** Consolidação da arquitetura de plugins no documento principal.
