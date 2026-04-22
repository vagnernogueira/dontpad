# Plugins CodeMirror

## Escopo

Detalha arquitetura dos plugins do editor: taxonomia, composição, precedência de keymaps, snippets e limites do parser matemático.

## Donos

- Time de Desenvolvimento DontPad

## Arquivos-fonte principais

- `frontend/src/cm-plugins/*.ts` — plugins visuais, keymaps estaticos, keymaps contextuais e barrel `index.ts`
- `frontend/src/cm-utils/snippet-registry.ts` — registry compartilhado de snippets
- `frontend/src/cm-utils/math-evaluator.ts` — parser matemático extraído

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
- `command-palette-keymap.ts`
- `markdown-lint-keymap.ts`
- `open-raw-document-keymap.ts`
- `snippet.ts`
- `math.ts`
- `keymaps.ts`

### Interação e composição

- `multi-click.ts`
- `spellcheck.ts`
- `markdown-preview.ts`

## Composição no Editor

Os plugins e keymaps estaticos reutilizaveis sao preferencialmente re-exportados pelo barrel `cm-plugins/index.ts`.
Keymaps contextuais que dependem de callbacks do `Editor.vue` podem ser importados diretamente por `useYjsEditor.ts`.

Empilhamento recomendado no `Editor.vue` (via composable `useYjsEditor`):

1. plugins visuais base;
2. plugins de interação;
3. keymaps contextuais compostos em `useYjsEditor.ts` quando dependem de callbacks do editor;
4. keymaps estaticos agregados em `keymaps.ts`;
5. preview composto via `markdown-preview.ts`.

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

1. prioridade alta para keymaps contextuais que precisam bloquear atalhos nativos do navegador/editor;
2. prioridade alta para Tab (indentação);
3. prioridade alta para deleção de linha;
4. prioridade normal para Enter contextual;
5. prioridade normal para cálculo matemático;
6. prioridade normal para normalização de tabela (`Alt+Shift+T`);
7. prioridade baixa para snippets.

## Atalhos customizados relevantes

- `Mod+U`: abre o modo raw do documento em nova aba (`open-raw-document-keymap.ts`);
- `Ctrl+Alt+Space`: abre a paleta de comandos (`command-palette-keymap.ts`);
- `Ctrl+Alt+L`: abre o lint de Markdown (`markdown-lint-keymap.ts`);
- `Ctrl+L`: remove linha atual (`delete-line-keymap.ts`);
- `Alt+Shift+T`: normaliza tabela Markdown selecionada ou sob cursor (`table-normalize-keymap.ts`).

Observacao:
Atalhos como `Tab`, `Shift-Tab`, `Enter` contextual e o trigger de math por espaco continuam documentados nas secoes de precedencia e taxonomia, mesmo quando nao aparecem nesta lista resumida de atalhos mais visiveis.

## Snippets padrão

Arquivo de definição: `frontend/src/cm-utils/snippet-registry.ts` (módulo compartilhado).
Arquivo de integração CM: `frontend/src/cm-plugins/snippet.ts`.

O registry é consumido tanto por `snippet.ts` (expansão) quanto por `tab-keymap.ts` (detecção de prefixo para delegação), eliminando duplicação.

- `dt`, `hr`, `lorem`, `table`, `code`, `link`, `img`, `task`, `snippets`.

Variáveis suportadas:

- `${CURRENT_DATE}`
- `${CURRENT_TIME}`
- `${LOREM}`
- `${SNIPPET_LIST}`
- placeholders `${QUALQUER_TEXTO}`

## Limites do parser de math

O parser matemático vive em `frontend/src/cm-utils/math-evaluator.ts` (tokenizer + parser recursivo descendente, ~374 linhas). O plugin `cm-plugins/math.ts` (~92 linhas) contém apenas a integração com o keymap do CodeMirror.

Suporta:

- operadores `+ - * / % ^`, parênteses e unário `+/-`;
- funções matemáticas whitelisted (`sqrt`, `sin`, `cos`, `tan`, etc.);
- constantes `pi` e `e`.

Expressões fora do conjunto são rejeitadas.

## Quando atualizar

Atualizar este módulo ao alterar:

- ordem de precedência dos keymaps;
- atalhos customizados, seus comandos ou o ponto de composicao entre keymaps estaticos e contextuais;
- contrato de snippets/variáveis;
- lista de plugins disponíveis;
- regras do parser matemático.
