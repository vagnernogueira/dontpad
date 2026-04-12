# Dontpad — Contexto Operacional

> Arquivo adaptado para OpenCode (AGENTS.md). Fonte canônica: `_docs/ia-context/project-overlay/CLAUDE.md`.
> OpenCode não suporta @imports em AGENTS.md — todo conteúdo crítico está inline.
> Os arquivos de referência adicionais estão configurados em `opencode.json` (symlink na raiz).

## Produto

Editor colaborativo de Markdown em tempo real.
SPA Vue 3 + Node.js backend com sincronização CRDT (Yjs).
Núcleo: colaboração em tempo real, lock por senha, exportação e plugins CodeMirror 6.

## Stack

- **Frontend:** Vue 3 · TypeScript · Vite · Tailwind CSS · CodeMirror 6 · Yjs
- **Backend:** Node.js · TypeScript · Express · WebSocket (`ws`) · Yjs
- **Persistência:** `y-leveldb` (LevelDB local) · `backend/db/document-locks.json`

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
npm run lint           # executa lint no pacote afetado
npm run test           # executa testes existentes
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

Após toda implementação entregar:
1. Resumo objetivo das mudanças
2. Lista de arquivos alterados
3. Impactos identificados
4. Validações recomendadas
5. Sugestão de commit message em inglês (conventional commits)

## Referência detalhada

| Documento | Conteúdo |
|-----------|----------|
| `_docs/ia-context/core/rules.md` | Regras universais e guardrails operacionais |
| `_docs/ia-context/core/workflow.md` | Fluxo de execução padrão |
| `_docs/ia-context/core/output-contracts.md` | Contratos de saída e checklist anti-alucinação |
| `_docs/ia-context/core/skills/` | Skills: generate-demand · documentation-blueprint · shadcn-vue |
| `_docs/ia-context/core/skills/generate-demand/templates/` | Templates de demanda da skill generate-demand: 01-simple → 04-full |
| `_docs/ia-context/project-overlay/context.md` | Baseline factual do produto |
