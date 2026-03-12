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

## Configuração do Context7 neste projeto

- `name`: `context7`
- `transport`: remoto (`http` ou `websocket`, conforme cliente MCP)
- `auth`: token por variável de ambiente (ex.: `CONTEXT7_API_KEY`)
- `endpoint`: `https://mcp.context7.com/mcp`
- `status`: ativo e preferencial para documentação

## Capacidades e modo de operação

- Capacidades primárias: `docs.search`, `docs.read`, `docs.extract`, `docs.summarize`, `docs.cite`.
- Operações além de leitura são permitidas quando suportadas pelo servidor e aprovadas por `project-overlay/mcp-policy.md`.

## Regras

- Qualquer mudança no inventário deve atualizar `project-overlay/mcp-policy.md`.
- Capacidades ausentes devem acionar fallback definido no core.
