# Plugins CodeMirror

## Escopo

Detalha arquitetura dos plugins do editor: taxonomia, composição, precedência de keymaps, snippets e limites do parser matemático.

## Donos

- Time de Desenvolvimento DontPad

## Arquivos-fonte principais

- `frontend/src/cm-plugins/checkbox-widget.ts`
- `frontend/src/cm-plugins/code-block.ts`
- `frontend/src/cm-plugins/delete-line-keymap.ts`
- `frontend/src/cm-plugins/enter-keymap.ts`
- `frontend/src/cm-plugins/horizontal-rule-widget.ts`
- `frontend/src/cm-plugins/image-widget.ts`
- `frontend/src/cm-plugins/keymaps.ts`
- `frontend/src/cm-plugins/link-widget.ts`
- `frontend/src/cm-plugins/list.ts`
- `frontend/src/cm-plugins/markdown-preview.ts`
- `frontend/src/cm-plugins/math.ts`
- `frontend/src/cm-plugins/multi-click.ts`
- `frontend/src/cm-plugins/plain-url.ts`
- `frontend/src/cm-plugins/snippet.ts`
- `frontend/src/cm-plugins/spellcheck.ts`
- `frontend/src/cm-plugins/table-normalize-keymap.ts`
- `frontend/src/cm-plugins/tab-keymap.ts`

## Taxonomia

### Widgets e decorações

- `checkbox-widget.ts`
- `image-widget.ts`
- `link-widget.ts`
- `horizontal-rule-widget.ts`

### Estilização contextual

- `list.ts`
- `code-block.ts`
- `plain-url.ts`

### Keymaps e entrada

- `tab-keymap.ts`
- `enter-keymap.ts`
- `delete-line-keymap.ts`
- `table-normalize-keymap.ts`
- `snippet.ts`
- `math.ts`
- `keymaps.ts`

### Interação e composição

- `multi-click.ts`
- `spellcheck.ts`
- `markdown-preview.ts`

## Composição no Editor

Empilhamento recomendado no `Editor.vue`:

1. plugins visuais base;
2. plugins de interação;
3. keymaps agregados em `keymaps.ts`;
4. preview composto via `markdown-preview.ts`.

## Estrutura padrão de implementação

Formatos aceitos:

1. `ViewPlugin` com `DecorationSet`;
2. `Keymap` dedicado;
3. módulo agregador.

Padrões esperados:

- export nomeado;
- JSDoc em APIs públicas;
- coesão por responsabilidade;
- atualização condicional (`docChanged` / `viewportChanged`).

## Precedência de keymaps

Ordem arquitetural:

1. prioridade alta para Tab (indentação);
2. prioridade alta para deleção de linha;
3. prioridade normal para Enter contextual;
4. prioridade normal para cálculo matemático;
5. prioridade normal para normalização de tabela (`Alt+Shift+T`);
6. prioridade baixa para snippets.

## Atalhos customizados relevantes

- `Ctrl+L`: remove linha atual (`delete-line-keymap.ts`);
- `Alt+Shift+T`: normaliza tabela Markdown selecionada ou sob cursor (`table-normalize-keymap.ts`).

## Snippets padrão

Arquivo: `frontend/src/cm-plugins/snippet.ts`.

- `dt`, `hr`, `lorem`, `table`, `code`, `link`, `img`, `task`, `snippets`.

Variáveis suportadas:

- `${CURRENT_DATE}`
- `${CURRENT_TIME}`
- `${LOREM}`
- `${SNIPPET_LIST}`
- placeholders `${QUALQUER_TEXTO}`

## Limites do parser de math

Suporte restrito a:

- operadores `+ - * / % ^`, parênteses e unário `+/-`;
- funções matemáticas whitelisted (`sqrt`, `sin`, `cos`, `tan`, etc.);
- constantes `pi` e `e`.

Expressões fora do conjunto são rejeitadas.

## Quando atualizar

Atualizar este módulo ao alterar:

- ordem de precedência dos keymaps;
- atalhos customizados e seus comandos;
- contrato de snippets/variáveis;
- lista de plugins disponíveis;
- regras do parser matemático.
