# Template SIMPLES

## Contexto de execução da IA

- Pacote de contexto: `_docs/ia-context/README.md`
- Regras globais: `_docs/ia-context/core/rules.md`
- Regras do projeto: `_docs/ia-context/project-overlay/rules.md`
- Contexto do projeto: `_docs/ia-context/project-overlay/context.md`
- Workflow base: `_docs/ia-context/core/workflow.md`
- Overrides de workflow (se houver): `_docs/ia-context/project-overlay/workflow-overrides.md`
- Contrato de saída: `_docs/ia-context/core/output-contracts.md`

## Instruções

- Use `core/rules.md` e o contexto do overlay de projeto.
- Faça apenas o escopo solicitado, com mudanças mínimas.
- Não invente fatos; explicite suposições.

## Demanda

Ajustar o texto do botão de limpeza do filtro no Explorer para usar a label `Limpar filtro` em vez do texto atual, preservando o comportamento existente do clique e sem alterar layout, ícone, atalhos ou qualquer outra ação do componente. A mudança deve ficar restrita ao frontend e apenas ao ponto em que a label é renderizada.

## Sugestão de commit final

- Mensagem sugerida: `fix(explorer): ajusta label do botão de limpar filtro`