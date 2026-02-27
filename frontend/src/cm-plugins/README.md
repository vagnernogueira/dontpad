# CodeMirror Plugins

Este diretório contém todos os plugins customizados do CodeMirror utilizados no editor de Markdown.

## Estrutura dos Plugins

### Widgets e Decorações

- **image-widget.ts** - Renderiza imagens inline a partir da sintaxe `![alt](url)`
- **link-widget.ts** - Adiciona ícones clicáveis aos links Markdown `[texto](url)`
- **checkbox-widget.ts** - Torna o texto de checklists (`[ ]`, `[x]`, `[X]`) clicável sem substituir por ícones
- **horizontal-rule-widget.ts** - Renderiza linhas horizontais (`---`, `___`, `***`) como elementos `<hr>`

### Estilização de Elementos

- **list.ts** - Aplica estilização especial para listas (ordenadas e não ordenadas)
- **code-block.ts** - Detecta e estiliza blocos de código delimitados por ``` 
- **plain-url.ts** - Detecta e estiliza URLs avulsas (não em sintaxe Markdown)

### Keymaps (Atalhos de Teclado)

- **tab-keymap.ts** - Customiza comportamento da tecla Tab (indentação com 4 espaços)
- **enter-keymap.ts** - Mantém formatação de listas, task lists e citações ao pressionar Enter; sai da lista quando item está vazio
- **delete-line-keymap.ts** - Adiciona atalho Ctrl+L para deletar linha inteira
- **snippet.ts** - Sistema de snippets gerenciáveis (dt+TAB → data, hr+TAB → hora, lorem+TAB → lorem ipsum)
- **math.ts** - Avalia expressões matemáticas automaticamente ao digitar "= "
- **keymaps.ts** - Agrupamento de todos os keymaps com precedência explícita

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
// ... outros imports
```

Para os keymaps, prefira importar o agrupamento com precedência:

```typescript
import { editorKeymaps } from './cm-plugins/keymaps'

// Nas extensions:
extensions: [
  ...editorKeymaps,  // Todos os keymaps com precedência configurada
  // outros plugins
]
```

Keymaps individuais ainda podem ser importados se necessário:

```typescript
import { tabIndentKeymap } from './cm-plugins/tab-keymap'
import { mathCalculationKeymap } from './cm-plugins/math'
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
- O plugin de snippets tem prioridade baixa; Tab de indentação tem prioridade alta

### Precedência de Keymaps

Os keymaps seguem uma hierarquia de precedência explícita para evitar conflitos:

1. **Alta prioridade** (`Prec.high`):
   - Tab de indentação (sempre tem prioridade sobre snippets)
   - Delete line (Ctrl+L)

2. **Prioridade normal**:
   - Enter para listas e citações
   - Math calculation (espaço após "=")

3. **Baixa prioridade** (`Prec.low`):
   - Snippets (só ativam quando não há seleção e gatilho é válido)

Esta estrutura garante que comandos essenciais (como indentação) nunca sejam bloqueados por funcionalidades auxiliares (como snippets).

## Limites do Parser de Math

O parser de math é propositalmente simples e seguro, com suporte apenas ao conjunto abaixo:

- Operadores: `+`, `-`, `*`, `/`, `%`, `^`, parênteses e unário `+`/`-`.
- Funções: `sqrt`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `log`, `ln`, `log10`, `exp`, `abs`, `floor`, `ceil`, `round`, `min`, `max`, `pow`.
- Constantes: `pi`, `e`.
- Argumentos de funções separados por vírgula.

Fora desse conjunto, a expressão é rejeitada (sem execução de código externo).
