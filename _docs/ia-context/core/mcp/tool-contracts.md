# MCP Tool Contracts

## Objetivo

Padronizar chamadas de ferramentas em formato único para reduzir variação entre provedores MCP.

## Contrato de entrada

Campos mínimos:

- `capability`: capacidade desejada (ex.: `file.search`, `code.read`, `terminal.run`, `docs.search`, `docs.read`).
- `intent`: objetivo da chamada.
- `input`: parâmetros operacionais da ferramenta.
- `constraints` (opcional): limites de segurança/escopo.

## Contrato de saída

Campos mínimos:

- `status`: `ok` | `error` | `fallback`.
- `evidence`: resultado objetivo da chamada (dados retornados).
- `notes`: observações relevantes para decisão.
- `error` (quando houver): motivo da falha.
- `fallbackUsed`: estratégia aplicada quando não houve execução primária.

## Regras obrigatórias

- O agente **MUST** validar escopo antes da chamada.
- O agente **MUST** registrar a evidência retornada.
- O agente **MUST** aplicar fallback quando a capacidade estiver indisponível.
- O agente **MUST NOT** inventar resultados de ferramenta.
