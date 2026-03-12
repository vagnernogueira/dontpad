# Core MCP — README

## Objetivo

Definir um padrão agnóstico para uso de ferramentas via MCP (Model Context Protocol), sem acoplar o fluxo a um servidor específico.

## Arquivos principais

- `tool-contracts.md`: contrato canônico de entrada/saída para chamadas de ferramentas.
- `capability-routing.md`: regras para roteamento por capacidade e fallback.
- `providers/`: perfis reutilizáveis de provedores MCP.

## Provedor padrão documentado

- `providers/context7.md`: perfil base do MCP Context7 para replicação em outros projetos.

## Regras de uso

- MCP é uma camada de execução de ferramentas, não substitui `core/rules.md` nem `core/workflow.md`.
- Se MCP estiver indisponível, seguir com fallback conforme contrato.
- Toda decisão de roteamento deve ser reportada no resultado.
