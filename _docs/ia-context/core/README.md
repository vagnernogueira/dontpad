# IA CONTEXT Core Kit

## Objetivo

Este diretório contém o núcleo **genérico e reutilizável** para uso em qualquer projeto.

## Arquivos principais

- `rules.md`: regras normativas e guardrails universais.
- `workflow.md`: fluxo operacional padrão de execução.
- `output-contracts.md`: formato de saída esperado.
- `skills/`: playbooks operacionais reutilizáveis.

## Ordem de leitura recomendada

1. `rules.md`
2. `workflow.md`
3. `output-contracts.md`
4. `skills/*` (quando aplicável)
5. `skills/generate-demand/templates/*` (ponto de partida da demanda, quando aplicável)

## Regras de uso

- Este núcleo não substitui contexto específico do projeto.
- Sempre combinar com `project-overlay/*` quando disponível.
- O guia de seleção de templates da geração de demanda está em `skills/generate-demand/SKILL.md`.

## Conceitualização breve

- **Rules**: restrições estáveis (tom, segurança, formato de saída, limites).
- **Skills**: procedimentos reutilizáveis por tipo de tarefa.
- **Workflow**: sequência de execução com etapas e critérios de bloqueio.
- **Agent**: orquestrador que aplica regras, contexto, skills e workflow.
- **Context**: estado factual e convenções do projeto.
- **Templates**: moldes de entrada mantidos junto da skill que os consome, quando fizer sentido operacional.
