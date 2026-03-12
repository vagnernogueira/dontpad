# Dontpad — MCP Policy

## Objetivo

Definir políticas de uso de MCP específicas do projeto Dontpad.

## Diretrizes

- Preferir MCP quando a capacidade estiver disponível e reduzir risco operacional.
- Evitar MCP para ações fora do escopo da demanda.
- Exigir evidência de execução para operações críticas (edição em lote, comandos destrutivos, etc.).
- Não restringir MCP a somente leitura por padrão: permitir operações de escrita/ação quando houver capacidade explícita e escopo autorizado.

## Provedor prioritário

- Provedor principal para documentação: `context7`.
- Referência de configuração: `project-overlay/mcp-servers.md`.
- Estado operacional atual: `ativo`.

## Política de autorização por capacidade

`docs.*`: permitido por padrão dentro do escopo da demanda.

Capacidades não documentais (escrita/ação) devem exigir:

1. capacidade explícita no servidor;
2. validação de impacto no escopo;
3. registro de evidência no resultado.

## Política de segurança

- Não usar capacidades MCP que acessem recursos não relacionados ao workspace.
- Não executar comandos destrutivos sem justificativa explícita no resultado.
- Tratar credenciais como dependência crítica (bloquear se ausentes).
- Segredos/token MCP devem existir apenas em variáveis de ambiente ou secret manager.

## Política de fallback

- Seguir `core/mcp/capability-routing.md`.
- Se fallback local for usado, registrar motivo e impacto.

## Checklist de decisão MCP

- [ ] Capacidade necessária está definida?
- [ ] Servidor MCP adequado está ativo?
- [ ] Escopo da demanda continua preservado?
- [ ] Evidência de execução foi registrada?
