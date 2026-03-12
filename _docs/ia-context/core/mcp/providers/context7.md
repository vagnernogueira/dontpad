# MCP Provider Profile — Context7

## Objetivo

Padronizar o uso do Context7 como provedor MCP de documentação em uma forma reutilizável entre projetos.

## Tipo de integração

- Preferencial: servidor MCP remoto (API)
- Alternativa: bridge/adaptador local quando o cliente MCP não suportar remoto nativamente

## Configuração mínima (template)

- `name`: `context7`
- `transport`: `http` ou `websocket` (conforme cliente)
- `auth`: token/API key por variável de ambiente
- `endpoint`: `[definir endpoint oficial do provider]`
- `status`: ativo quando credencial e endpoint válidos

## Capacidades recomendadas

- `docs.search`
- `docs.read`
- `docs.extract`
- `docs.summarize`
- `docs.cite`

> Observação: capacidades exatas podem variar por versão do servidor MCP e cliente.

## Política operacional

- Usar Context7 para pesquisa e grounding de documentação.
- Permitir operações não read-only somente quando a capacidade estiver disponível e aprovada pela política do projeto.
- Registrar evidência de chamadas e decisões de fallback.

## Segurança

- Nunca armazenar token em arquivos Markdown.
- Usar variável de ambiente/secret manager para credenciais.
- Aplicar allowlist de domínios e timeout/rate limit no cliente MCP quando suportado.
