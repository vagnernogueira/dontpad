# MCP Capability Routing

## Objetivo

Definir como o agente escolhe a ferramenta certa por capacidade, mantendo comportamento previsível.

## Sequência de roteamento

1. Identificar a capacidade necessária para a tarefa.
2. Verificar se existe servidor MCP com essa capacidade no projeto.
3. Se existir, executar via MCP.
4. Se não existir, aplicar fallback local permitido.
5. Registrar decisão e evidências no output.

## Tabela de capacidade (genérica)

- `file.search`: localizar arquivos e caminhos.
- `file.read`: leitura de conteúdo.
- `file.write`: criação/edição controlada.
- `code.usages`: busca de referências de símbolos.
- `terminal.run`: execução de comandos.
- `web.fetch`: coleta de conteúdo externo quando permitido.
- `docs.search`: busca semântica em documentação.
- `docs.read`: leitura de conteúdo documental.
- `docs.extract`: extração de trechos relevantes.
- `docs.summarize`: sumarização orientada por tópico.
- `docs.cite`: geração de referências/evidências documentais.

## Política de fallback

- Prioridade: execução MCP -> execução local equivalente -> bloqueio com clarificação.
- Se fallback alterar risco/escopo, o agente deve informar explicitamente.

## Critérios de bloqueio

- Capacidade crítica indisponível e sem fallback seguro.
- Requisito de segurança/compliance não atendido.
- Ambiguidade operacional que possa alterar contrato público.
