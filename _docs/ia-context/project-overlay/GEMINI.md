# Dontpad — Contexto Operacional

> Arquivo adaptado para Gemini CLI. Fonte canônica: `_docs/ia-context/project-overlay/CLAUDE.md`.
> Imports abaixo carregam referência detalhada via `@file.md` (Gemini CLI feature).

## Produto

Editor colaborativo de Markdown em tempo real.
SPA Vue 3 + Node.js backend com sincronização CRDT (Yjs).
Núcleo: colaboração em tempo real, lock por senha, exportação e plugins CodeMirror 6.

## Stack

**Frontend:** Vue 3 · TypeScript · Vite · Tailwind CSS · CodeMirror 6 · Yjs
**Backend:** Node.js · TypeScript · Express · WebSocket (`ws`) · Yjs
**Persistência:** `y-leveldb` (LevelDB local) · `backend/db/document-locks.json`

## APIs existentes

| Método | Rota | Auth |
|--------|------|------|
| GET | `/api/health` | — |
| GET | `/api/documents` | header `x-docs-password` |
| GET · POST · DELETE | `/api/document-lock` | — |
| POST | `/api/document-access` | — |

## Comandos

```bash
npm run build          # valida sintaxe após implementação
make stop              # para container local
make build             # gera nova imagem (corrigir falhas antes de prosseguir)
make run               # sobe a aplicação com as mudanças
```

> Não testar via navegador web. Para demandas multi-fase, trabalhar em etapas.

## Regras obrigatórias

- **MUST** preservar comportamento atual salvo instrução explícita em contrário
- **MUST** operar no escopo mínimo — sem melhorias paralelas não solicitadas
- **MUST NOT** inferir fatos sem evidência no código ou documentação
- **MUST** declarar suposições quando faltar contexto
- **MUST NOT** alterar contrato de API pública sem justificativa explícita
- **SHOULD** priorizar mecanismos nativos do CodeMirror quando aplicável
- **SHOULD** preferir solução simples sobre abstração prematura

### Conflito de fontes (precedência decrescente)

Código-fonte > `_docs/ARCHITECTURE.md` > `README.md` > `_docs/ia-context/project-overlay/` > docs auxiliares em `_docs/`

Em conflito: explicitar, adotar fonte de maior precedência, registrar a decisão.

### Anti-padrões

Inventar endpoints/arquivos/comportamentos · omitir conflito documental · responder sem âncora em evidências · expandir escopo sem solicitação.

## Convenções UI/Frontend

- Ícones: `lucide-vue-next` — sem SVG inline em novos componentes
- Módulos: `cm-commands/` · `cm-extensions/` · `cm-plugins/` · `cm-utils/` · `services/`

## Entrega padrão

Após toda implementação entregar: resumo das mudanças · arquivos alterados · impactos · validações recomendadas · commit message em inglês (conventional commits).

---

## Referência detalhada (imports)

> Gemini CLI carrega os arquivos abaixo via `@file.md`.
> Caminhos relativos ao diretório deste arquivo (`_docs/ia-context/project-overlay/`).
> Se este arquivo for lido via symlink na raiz, ajustar para caminhos absolutos a partir da raiz do projeto.

@./context.md
@./workflow-overrides.md
@../core/rules.md
@../core/workflow.md
@../core/output-contracts.md
