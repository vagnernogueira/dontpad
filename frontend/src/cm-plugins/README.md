# CodeMirror Plugins

Este diretório contém todos os plugins customizados do CodeMirror utilizados no editor de Markdown.

## Estrutura dos Plugins

### Widgets e Decorações

- **image-widget.ts** - Renderiza imagens inline a partir da sintaxe `![alt](url)`
- **link-widget.ts** - Adiciona ícones clicáveis aos links Markdown `[texto](url)`
- **horizontal-rule-widget.ts** - Renderiza linhas horizontais (`---`, `___`, `***`) como elementos `<hr>`

### Estilização de Elementos

- **list.ts** - Aplica estilização especial para listas (ordenadas e não ordenadas)
- **code-block.ts** - Detecta e estiliza blocos de código delimitados por ``` 
- **plain-url.ts** - Detecta e estiliza URLs avulsas (não em sintaxe Markdown)

### Keymaps (Atalhos de Teclado)

- **tab-keymap.ts** - Customiza comportamento da tecla Tab (indentação com 4 espaços)
- **enter-keymap.ts** - Mantém formatação de listas e citações ao pressionar Enter
- **delete-line-keymap.ts** - Adiciona atalho Ctrl+L para deletar linha inteira
- **snippet.ts** - Sistema de snippets gerenciáveis (dt+TAB → data, hr+TAB → hora, lorem+TAB → lorem ipsum)
- **math.ts** - Avalia expressões matemáticas automaticamente ao digitar "= "

### Funcionalidades de Interação

- **multi-click.ts** - Triple click seleciona linha, quadruple click seleciona parágrafo
- **ctrl-click-navigation.ts** - Ctrl+Click para abrir links em nova aba
- **spellcheck.ts** - Liga/desliga o spellcheck nativo do navegador no editor

### Plugins Compostos

- **markdown-preview.ts** - Combina os plugins de preview de imagens e links

## Uso

Para utilizar os plugins no editor, importe-os individualmente:

```typescript
import { listCustomPlugin } from './cm-plugins/list'
import { codeBlockPlugin } from './cm-plugins/code-block'
import { customTabKeymap } from './cm-plugins/tab-keymap'
import { mathCalculationPlugin } from './cm-plugins/math'
// ... outros imports
```

Ou importe o plugin composto para preview:

```typescript
import { markdownPreviewPlugin } from './cm-plugins/markdown-preview'
```

## Estrutura de um Plugin

Cada arquivo de plugin segue esta estrutura básica:

1. **Comentário de documentação** - Explica o propósito e funcionalidades do plugin
2. **Imports necessários** - Importa tipos e funções do CodeMirror
3. **Classes/Widgets** - Define widgets customizados (se aplicável)
4. **Funções auxiliares** - Funções para construir decorações
5. **Export do plugin** - Exporta o plugin configurado usando `ViewPlugin.fromClass`

## Snippets Disponíveis

O plugin **snippet.ts** fornece os seguintes snippets prontos para uso:

| Gatilho | TAB | Resultado |
|---------|-----|-----------|
| `dt` | TAB | Data atual (DD/MM/YYYY) |
| `hr` | TAB | Hora atual (HH:MM) |
| `lorem` | TAB | Parágrafo lorem ipsum completo |
| `table` | TAB | Tabela markdown básica |
| `code` | TAB | Bloco de código com ``` |
| `link` | TAB | Link markdown `[texto](url)` |
| `img` | TAB | Imagem markdown `![alt](url)` |
| `task` | TAB | Item de checklist `- [ ]` |
| `snippets` | TAB | Lista todos os snippets disponíveis |

### Como adicionar novos snippets

Edite o array `defaultSnippets` em [snippet.ts](snippet.ts) e adicione novos objetos seguindo o padrão:

```typescript
{
  prefix: "gatilho",
  body: "texto a inserir ${VARIAVEL}",
  description: "Descrição do snippet"
}
```

### Variáveis suportadas

- `${CURRENT_DATE}` - Substitui pela data atual
- `${CURRENT_TIME}` - Substitui pela hora atual
- `${LOREM}` - Substitui por parágrafo lorem ipsum
- `${SNIPPET_LIST}` - Substitui pela lista completa de snippets disponíveis
- `${QUALQUER_TEXTO}` - Placeholders que posicionam o cursor

## Observações

- Todos os plugins foram refatorados a partir do arquivo original `cm-preview-plugin.ts`
- Cada plugin é independente e pode ser usado separadamente
- Os plugins utilizam a API do CodeMirror 6
- O plugin de snippets tem prioridade sobre a indentação TAB apenas quando há um gatilho válido
