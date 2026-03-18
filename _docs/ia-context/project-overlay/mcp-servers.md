# Dontpad — MCP Servers

## Objetivo

Catalogar servidores MCP habilitados no projeto e as capacidades disponíveis.

## Inventário de servidores

Preencher para cada servidor:

- `name`: nome lógico do servidor.
- `transport`: stdio | http | websocket.
- `capabilities`: lista de capacidades atendidas.
- `auth`: tipo de autenticação exigida.
- `status`: ativo | inativo.

## Tabela operacional (template)

| name | transport | capabilities | auth | status |
| --- | --- | --- | --- | --- |
| context7 | http/ws (remoto) | docs.search, docs.read, docs.extract, docs.summarize, docs.cite | token (env) | ativo |
| shadcn | stdio (local, npx) | registry.list, registry.search, registry.install, registry.info | nenhuma | pendente (aguarda adoção shadcn-vue) |

## Configuração do Context7 neste projeto

- `name`: `context7`
- `transport`: remoto (`http` ou `websocket`, conforme cliente MCP)
- `auth`: token por variável de ambiente (ex.: `CONTEXT7_API_KEY`)
- `endpoint`: `https://mcp.context7.com/mcp`
- `status`: ativo e preferencial para documentação

## Capacidades e modo de operação

- Capacidades primárias: `docs.search`, `docs.read`, `docs.extract`, `docs.summarize`, `docs.cite`.
- Operações além de leitura são permitidas quando suportadas pelo servidor e aprovadas por `project-overlay/mcp-policy.md`.

## Configuração do shadcn MCP Server

- `name`: `shadcn`
- `transport`: stdio local via `npx shadcn@latest mcp`
- `auth`: nenhuma (acessa registry público; registries privados usam env vars no `components.json`)
- `status`: pendente — ativar após `npx shadcn-vue@latest init` no projeto
- `skill de contexto`: `_docs/ia-context/core/skills/shadcn-vue/SKILL.md`

### Configuração VS Code (`.vscode/mcp.json`)

```json
{
  "servers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

> O arquivo `.vscode/mcp.json` já está criado no workspace. Para ativar, abrir o arquivo
> e clicar em **Start** ao lado do servidor shadcn.

### Capacidades disponíveis

- `registry.list` — listar todos os componentes disponíveis no registry shadcn
- `registry.search` — buscar componente por nome ou funcionalidade
- `registry.install` — instalar componente via linguagem natural (executa `npx shadcn-vue@latest add`)
- `registry.info` — retorna configuração atual do projeto (`components.json`)

### Exemplo de uso com o agente

```
"adicione o componente Dialog e Tooltip ao projeto"
"quais componentes shadcn estão instalados?"
"encontre um componente de alerta de confirmação"
```

---

## Regras

- Qualquer mudança no inventário deve atualizar `project-overlay/mcp-policy.md`.
- Capacidades ausentes devem acionar fallback definido no core.
- O servidor shadcn exige `components.json` presente no projeto para funcionar corretamente.
