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
- Backend: Node.js + Express + WebSocket;
- Sincronização: Yjs (CRDT), com persistência incremental em LevelDB.

Características principais:

- edição colaborativa em tempo real;
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
| Editor            | CodeMirror 6, @lezer/markdown                             |
| Colaboração       | Yjs, y-websocket, y-codemirror.next                       |
| Backend           | Node.js, Express, ws, TypeScript                          |
| Persistência      | y-leveldb, LevelDB, metadados JSON                        |
| UI/UX             | Tailwind CSS, shadcn-vue, reka-ui, Lucide Vue Next        |
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
                          │ WebSocket + HTTP API
        ┌─────────────────▼──────────────┐
        │      Backend Server (Node.js)  │
        │ - Express REST                 │
        │ - WebSocket Provider (Yjs)     │
        │ - LevelDB Persistence          │
        └────────────────────────────────┘
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
- acesso por URL parametrizada (`pdf/view/raw`) usa endpoint dedicado de conteúdo e respeita lock por documento;
- documentos lockados exigem senha para acesso e handshake WS.

### 6.2 Decisões arquiteturais centrais

- **Commands Pattern** no frontend para reduzir acoplamento da UI;
- **Factory Pattern** em services para configuração e testabilidade;
- **Composables Pattern** para extrair lógica reativa de componentes Vue complexos (`useYjsEditor`, `useDocumentAccess`, `useCollaborators`, `useExplorerSession`, `useDocumentList`);
- **Component Composition** com sub-componentes focados: `EditorHeader`, `EditorToolbar`, `BaseDialog` (thin wrapper shadcn), `LinkDialog`, `ImageDialog`, `LockDialog`, `AccessDialog`, `ProfileDialog`;
- **CSS Component Layer** via `@layer components` com `@apply` para abstrações reutilizáveis de layout, botões e inputs; camada de diálogos migrada para primitivos **shadcn-vue** (`Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter` via `reka-ui`);
- **Contexto operacional shadcn-vue**: a configuração vive em `frontend/components.json`; comandos de inspeção/instalação devem rodar em `frontend/` com `npx shadcn-vue@latest ...` (ou scripts equivalentes do pacote), não na raiz com `npx shadcn@latest`;
- **CRDT (Yjs)** em vez de OT para merge automático e melhor suporte offline;
- **Lazy loading** para bibliotecas pesadas de export (`marked`, `html2pdf.js`);
- **LevelDB local** para persistência incremental simples em ambiente self-hosted;
- **Design tokens Tailwind** para spacing, fontes e cores customizadas (`btn`, `btn-sm`, `header`, `font-ui`, `font-code`, `code-bg`);
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
| `frontend/src/components/DocumentRoute.vue` | Resolução de modos por query params e fallback para edição.                                      |
| `frontend/src/components/Editor.vue`        | Componente principal do editor colaborativo (orquestra composables).                             |
| `frontend/src/components/EditorHeader.vue`  | Header bar extraída do Editor: navegação, badge do documento, status de conexão e avatares.      |
| `frontend/src/components/EditorToolbar.vue` | Toolbar de formatação, undo/redo e downloads extraída do Editor.                                 |
| `frontend/src/components/BaseDialog.vue`    | Thin wrapper shadcn-vue: encapsula `Dialog` + `DialogContent` + `DialogHeader` + `DialogFooter`. |
| `frontend/src/components/*Dialog.vue`       | Diálogos focados: Link, Image, Lock, Access, Profile (usam shadcn `Dialog` diretamente).         |
| `frontend/src/components/Explorer.vue`      | Gestão administrativa de documentos em `/explorer` (orquestra composables).                      |
| `frontend/src/components/ToolbarButton.vue` | Componente reutilizável para botões de toolbar com estilo padronizado.                           |
| `frontend/src/styles/components.css`        | Abstrações CSS com `@apply` (`btn-*`, `dialog-*`, `input-*`, `page-header`, `toolbar`).          |
| `frontend/src/composables/*`                | Composables Vue 3 para lógica reativa extraída dos componentes.                                  |
| `frontend/src/cm-utils/math-evaluator.ts`   | Parser matemático recursivo descendente (tokenizer + avaliador).                                 |
| `frontend/src/cm-utils/snippet-registry.ts` | Registry compartilhado de snippets e prefixes para tab-keymap e snippet plugins.                 |
| `frontend/src/services/document-api.ts`     | Cliente HTTP para lock/access e ações administrativas.                                           |
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
| reka-ui               | Primitivos headless UI (focus trap, aria, keyboard) | Alta        |
| shadcn-vue            | Componentes UI copiados para `components/ui/`       | Média       |
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
