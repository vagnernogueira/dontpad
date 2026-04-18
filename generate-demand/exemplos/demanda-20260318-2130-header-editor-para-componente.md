# Template ULTRA-COMPACT

## Contexto de execução da IA

- Pacote de contexto: `_docs/ia-context/README.md`
- Regras globais: `_docs/ia-context/core/rules.md`
- Regras do projeto: `_docs/ia-context/project-overlay/rules.md`
- Contexto do projeto: `_docs/ia-context/project-overlay/context.md`
- Workflow base: `_docs/ia-context/core/workflow.md`
- Overrides de workflow: `_docs/ia-context/project-overlay/workflow-overrides.md`
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

## Sugestão de commit final

- Mensagem sugerida: `refactor(editor): extrai header para componente dedicado`
