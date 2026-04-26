# Template ULTRA-COMPACT

## Contexto de execução da IA

- Pacote de contexto: `_docs/ia-context/README.md`
- Regras globais: `_docs/ia-context/core/rules.md`
- Regras do projeto: `_docs/ia-context/project-overlay/rules.md`
- Contexto do projeto: `_docs/ia-context/project-overlay/context.md`
- Workflow base: `_docs/ia-context/core/workflow.md`
- Contrato de saída: `_docs/ia-context/core/output-contracts.md`

## Entrada mínima

- **Demanda:** Extrair o bloco `<header>` de `Editor.vue` para um componente dedicado `EditorHeader.vue`, seguindo o mesmo padrão já adotado em `EditorToolbar.vue` (props + emits, sem acesso direto a composables).

- **Objetivo:** Reduzir o acoplamento de `Editor.vue`, isolar a responsabilidade visual do cabeçalho do editor e facilitar manutenção futura do header de forma independente.

- **Escopo:**
  - Incluir:
    - Criação de `frontend/src/components/EditorHeader.vue` com as props e emits necessários.
    - Substituição do bloco `<header>` inline em `Editor.vue` pelo uso do novo componente.
    - Import e registro do componente em `Editor.vue`.
  - Excluir:
    - Refatoração do `<header>` de `Explorer.vue` (estrutura diferente, demanda separada se necessário).
    - Qualquer mudança de lógica, composables ou contratos públicos.
    - Alterações de estilo ou CSS (os utilitários Tailwind e as classes `.page-header*` já existem em `components.css`).

- **Arquivos-alvo:**
  - `frontend/src/components/Editor.vue`
  - `frontend/src/components/EditorHeader.vue` *(novo)*

- **Critérios de aceite:**
  - `EditorHeader.vue` aceita as props: `documentId: string`, `collaborators` (mesmo tipo usado em `CollaboratorAvatars`), `status: string` (valor de `yjsEditor.status.value`).
  - `EditorHeader.vue` emite o evento `edit-profile` (sem payload).
  - O visual e comportamento responsivo do header permanecem idênticos ao estado atual.
  - `Editor.vue` não contém mais o bloco `<header>` inline — usa `<EditorHeader ... />`.
  - Nenhuma prop opcional fica sem valor padrão se aplicável.

- **Tipo de saída:** implementação

## Planejamento da execução

1. Ler `Editor.vue` e mapear o bloco `<header>` inline: props consumidas, emits disparados, composables referenciados e classes CSS utilizadas.
2. Criar `frontend/src/components/EditorHeader.vue` com as props `documentId`, `collaborators` e `status`, o emit `edit-profile` e o template extraído do bloco mapeado, sem acesso direto a composables.
3. Substituir o bloco `<header>` inline em `Editor.vue` pelo uso de `<EditorHeader />`, adicionando o import e o registro do componente.
4. Validar que o visual e o comportamento responsivo do header permanecem idênticos e que `Editor.vue` não contém mais o bloco `<header>` inline.

## Memorial de execução

> Ao concluir a execução: informe o usuário em uma única frase que a demanda foi atendida; depois edite este arquivo, substituindo este bloco pelo memorial real com: resumo da execução, lista de arquivos alterados, validações recomendadas e observações (se houver).

### Sugestão de commit final

> Mensagem de commit pendente. Use a skill conventional-commits para sugerir a mensagem final.
