# Template COMPACT

## Demanda - Seleção única no Explorer

## Contexto de execução da IA

- Pacote de contexto: _docs/ia-context/README.md
- Regras globais: _docs/ia-context/core/rules.md
- Regras do projeto: _docs/ia-context/project-overlay/rules.md
- Contexto do projeto: _docs/ia-context/project-overlay/context.md
- Workflow base: _docs/ia-context/core/workflow.md
- Overrides de workflow: _docs/ia-context/project-overlay/workflow-overrides.md
- Contrato de saída: _docs/ia-context/core/output-contracts.md

## Demanda

O componente Explorer exibe uma tabela de documentos com seleção por checkbox. A regra de negócio é manter apenas um item selecionado por vez. Hoje o estado lógico da seleção existe, mas o estado visual dos checkboxes ficou inconsistente após a adoção de componentes shadcn: ao selecionar um segundo item, o item anterior perde a seleção lógica, porém seu checkbox continua marcado.

A IA deve ajustar a implementação para que o checkbox sempre reflita o item atualmente selecionado, sem alterar o restante do comportamento do Explorer.

## Objetivo

Restaurar a coerência entre seleção lógica e seleção visual da tabela do Explorer, garantindo seleção única em um único item por vez.

## Escopo

- Incluir:
  - Sincronizar o estado do checkbox com a seleção atual.
  - Garantir que a troca de item desmarque visualmente o item anterior.
  - Preservar o comportamento atual das demais ações do Explorer.
- Excluir:
  - Refatorações amplas de layout.
  - Mudanças em busca, ordenação, renomeação, exclusão ou acesso aos documentos.
  - Alterações de contrato público fora do Explorer.

## Arquivos ou módulos-alvo

- frontend/src/composables/useDocumentList.ts
- frontend/src/components/Explorer.vue

## Planejamento da execução

- Etapa 1: Identificar onde a seleção única é armazenada e como a tabela/checkbox consome esse estado.
- Etapa 2: Ajustar o binding do checkbox e/ou o handler de interação para que somente o item selecionado permaneça marcado.
- Etapa 3: Validar que a seleção anterior é desmarcada quando um novo item é escolhido e que não há regressão no restante do Explorer.

## Critérios de aceite

- Ao selecionar um segundo item, apenas o novo item permanece marcado.
- O item anteriormente selecionado fica desmarcado imediatamente.
- O comportamento de seleção do Explorer continua limitado a um único item por vez.
- Nenhuma funcionalidade adjacente do Explorer sofre alteração perceptível.

## Critérios de conclusão (Passa/Falha)

- [ ] Escopo solicitado concluído sem desvios.
- [ ] Critérios de aceite comprovados com resultado objetivo.
- [ ] Sem alteração de contrato público não autorizada.

## Registro de suposições

- Assunção: o estado canônico da seleção continua sendo `selectedDocumentName` no composable.
  Risco: se o checkbox estiver operando como componente não totalmente controlado, a correção pode exigir ajuste adicional de binding.
  Validação esperada: teste manual ou automatizado confirmando que a marcação visual acompanha a seleção lógica ao alternar entre itens.

## Tipo de saída esperada

implementação

## Sugestão de commit final

- Mensagem sugerida: `fix(explorer): corrige seleção única visual nos checkboxes`