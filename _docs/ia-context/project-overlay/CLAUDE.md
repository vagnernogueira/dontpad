# Dontpad — Contexto Operacional

> Arquivo mestre. Os demais (`GEMINI.md`, `AGENTS.md`, `copilot-instructions.md`) derivam deste.
> Estrutura de contexto completa: `_docs/ia-context/`

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
- **MUST** tratar MCP como camada opcional com fallback — nunca declarar sucesso sem evidência retornada

### Conflito de fontes (precedência decrescente)

Código-fonte > `_docs/ARCHITECTURE.md` > `README.md` > `_docs/ia-context/project-overlay/` > docs auxiliares em `_docs/`

Em conflito: explicitar, adotar fonte de maior precedência, registrar a decisão.

### Anti-padrões

Inventar endpoints/arquivos/comportamentos · omitir conflito documental · responder sem âncora em evidências · expandir escopo sem solicitação.

## Convenções UI/Frontend

- Ícones: `lucide-vue-next` — sem SVG inline em novos componentes
- Módulos: `cm-commands/` · `cm-extensions/` · `cm-plugins/` · `cm-utils/` · `services/`

## MCP disponíveis

| Server | Transport | Capabilities | Status |
|--------|-----------|-------------|--------|
| `context7` | http/ws | docs.search · docs.read · docs.extract · docs.summarize · docs.cite | ativo |
| `shadcn` | stdio (npx) | registry.list · registry.search · registry.install · registry.info | pendente |

Endpoint context7: `https://mcp.context7.com/mcp` · auth: `CONTEXT7_API_KEY` (env)
Política completa: `_docs/ia-context/project-overlay/mcp-policy.md`

## Entrega padrão

Após toda implementação entregar:
1. Resumo objetivo das mudanças
2. Lista de arquivos alterados
3. Impactos identificados
4. Validações recomendadas
5. Sugestão de commit message em inglês (conventional commits)

## Contexto carregado automaticamente

> Os arquivos abaixo são importados via `@path` — Claude Code os inclui no contexto desta sessão.

@_docs/ia-context/project-overlay/context.md
@_docs/ia-context/core/rules.md
@_docs/ia-context/core/output-contracts.md
@_docs/ia-context/project-overlay/workflow-overrides.md

## Referência adicional (consultar conforme necessidade)

| Documento | Conteúdo |
|-----------|----------|
| `_docs/ia-context/core/workflow.md` | Fluxo de execução padrão |
| `_docs/ia-context/core/mcp/` | Framework MCP agnóstico (tool-contracts, capability-routing) |
| `_docs/ia-context/core/skills/` | Skills: generate-demand · documentation-blueprint · shadcn-vue |
| `_docs/ia-context/core/templates/` | Templates de demanda: 01-simple → 04-full |
| `_docs/ia-context/project-overlay/mcp-policy.md` | Política de autorização MCP |
| `_docs/ia-context/project-overlay/mcp-servers.md` | Inventário e configuração dos servidores MCP |
| `_docs/ARCHITECTURE.md` | Arquitetura do sistema |
