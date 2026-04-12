# Dontpad — Contexto Operacional

> Arquivo adaptado para GitHub Copilot. Fonte canônica: `_docs/ia-context/project-overlay/CLAUDE.md`.
>
> **Ativação:** Copilot lê instruções de `.github/copilot-instructions.md`.
> Para ativar, criar symlink ou copiar este arquivo:
> ```bash
> ln -s ../_docs/ia-context/project-overlay/copilot-instructions.md .github/copilot-instructions.md
> ```
> Instruções path-específicas adicionais podem ser criadas em `.github/instructions/NAME.instructions.md`
> com frontmatter `applyTo: "glob/pattern/**"`.

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
make stop              # para container local
make build             # gera nova imagem (corrigir falhas antes de prosseguir)
make run               # sobe a aplicação com as mudanças
```

Não testar via navegador web. Para demandas multi-fase, trabalhar em etapas.

## Regras obrigatórias

Preservar comportamento atual salvo instrução explícita. Operar no escopo mínimo sem melhorias paralelas. Não inferir fatos sem evidência no código. Declarar suposições quando faltar contexto. Não alterar contrato de API pública sem justificativa. Priorizar mecanismos nativos do CodeMirror. Preferir solução simples sobre abstração prematura.

Conflito de fontes: código-fonte > `_docs/ARCHITECTURE.md` > `README.md` > overlay de projeto > docs auxiliares.

Proibido: inventar endpoints/arquivos/comportamentos · omitir conflito documental · responder sem âncora em evidências · expandir escopo sem solicitação.

## Convenções UI/Frontend

- Ícones: `lucide-vue-next` — sem SVG inline em novos componentes
- Módulos: `cm-commands/` · `cm-extensions/` · `cm-plugins/` · `cm-utils/` · `services/`

## Entrega padrão

Após toda implementação entregar: resumo das mudanças · arquivos alterados · impactos · validações recomendadas · commit message em inglês (conventional commits).

## Referência detalhada

| Documento | Conteúdo |
|-----------|----------|
| `_docs/ia-context/core/rules.md` | Regras universais e guardrails operacionais |
| `_docs/ia-context/core/workflow.md` | Fluxo de execução padrão |
| `_docs/ia-context/core/output-contracts.md` | Contratos de saída e checklist anti-alucinação |
| `_docs/ia-context/core/skills/` | Skills: generate-demand · documentation-blueprint · shadcn-vue |
| `_docs/ia-context/core/skills/generate-demand/templates/` | Templates de demanda da skill generate-demand: 01-simple → 04-full |
| `_docs/ia-context/project-overlay/context.md` | Baseline factual do produto |
