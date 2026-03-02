# CodeMirror 6 — Documentação Técnica Completa

> Fonte: https://codemirror.net/docs/  
> Data de download: 2026-03-01

---

## Índice

1. [System Guide — Visão Geral da Arquitetura](#1-system-guide--visão-geral-da-arquitetura)
2. [System Guide — Modelo de Dados](#2-system-guide--modelo-de-dados)
3. [System Guide — A View](#3-system-guide--a-view)
4. [System Guide — Estendendo o CodeMirror](#4-system-guide--estendendo-o-codemirror)
5. [Reference Manual — @codemirror/state](#5-reference-manual--codemirrorstate)
6. [Reference Manual — @codemirror/view](#6-reference-manual--codemirrorview)
7. [Reference Manual — @codemirror/language](#7-reference-manual--codemirrorlanguage)
8. [Reference Manual — @codemirror/commands](#8-reference-manual--codemirrorcommands)
9. [Reference Manual — @codemirror/search](#9-reference-manual--codemirrorsearch)
10. [Reference Manual — @codemirror/autocomplete](#10-reference-manual--codemirrorautocomplete)
11. [Reference Manual — @codemirror/lint](#11-reference-manual--codemirrorlint)
12. [Reference Manual — @codemirror/merge](#12-reference-manual--codemirrormerge)
13. [Reference Manual — codemirror (bundle)](#13-reference-manual--codemirror-bundle)
14. [Lista de Extensions Core](#14-lista-de-extensions-core)
15. [Guia de Migração (v5 → v6)](#15-guia-de-migração-v5--v6)

---

## 1. System Guide — Visão Geral da Arquitetura

> Fonte: https://codemirror.net/docs/guide/

### Modularidade

CodeMirror é estruturado como uma coleção de módulos separados que, juntos, fornecem um editor de texto/código completo. Os pacotes core indispensáveis são:

- **`@codemirror/state`** — estruturas de dados que representam o estado do editor e as mudanças nesse estado.
- **`@codemirror/view`** — componente de UI que exibe o estado ao usuário e traduz ações de edição em atualizações de estado.
- **`@codemirror/commands`** — comandos de edição e key bindings.

**Editor mínimo:**

```js
import {EditorState} from "@codemirror/state"
import {EditorView, keymap} from "@codemirror/view"
import {defaultKeymap} from "@codemirror/commands"

let startState = EditorState.create({
  doc: "Hello World",
  extensions: [keymap.of(defaultKeymap)]
})

let view = new EditorView({
  state: startState,
  parent: document.body
})
```

**Com basicSetup:**

```js
import {EditorView, basicSetup} from "codemirror"
import {javascript} from "@codemirror/lang-javascript"

let view = new EditorView({
  extensions: [basicSetup, javascript()],
  parent: document.body
})
```

Os pacotes são distribuídos como **ES6 modules** — é necessário um bundler (Rollup, Vite, etc.).

---

### Core Funcional, Shell Imperativo

- O estado do editor (`EditorState`, `Text`) é **imutável e funcional**.
- Operações produzem novos valores em vez de mutações.
- A `EditorView` é a camada imperativa que lida com o DOM.

```js
let state = EditorState.create({doc: "123"})
// NÃO faça isso:
// state.doc = Text.of("abc") // ERRADO!
```

---

### Estado e Atualizações

Inspirado em Redux/Elm: o estado da view é determinado pelo `EditorState`.

```js
let transaction = view.state.update({changes: {from: 0, insert: "0"}})
console.log(transaction.state.doc.toString()) // "0123"
view.dispatch(transaction) // aplica ao DOM
```

---

### Extensões

O sistema de extensões permite:
- Configurar opções (ex: `tabSize`)
- Definir novos campos no estado (`StateField`)
- Estilizar o editor (`theme`)
- Injetar componentes imperativos (`ViewPlugin`)

```js
import {keymap} from "@codemirror/view"
import {EditorState, Prec} from "@codemirror/state"

function dummyKeymap(tag) {
  return keymap.of([{
    key: "Ctrl-Space",
    run() { console.log(tag); return true }
  }])
}

let state = EditorState.create({extensions: [
  dummyKeymap("A"),
  dummyKeymap("B"),
  Prec.high(dummyKeymap("C")) // C tem precedência maior
]})
```

---

### Offsets de Documento

CodeMirror usa **números simples** para endereçar posições no documento:
- Contam **code units UTF-16**
- Quebras de linha = 1 unidade

```js
import {EditorState} from "@codemirror/state"
let state = EditorState.create({doc: "1234"})
let tr = state.update({changes: [{from: 1, to: 3}, {from: 0, insert: "0"}]})
console.log(tr.changes.mapPos(4)) // 3

import {Text} from "@codemirror/state"
let doc = Text.of(["line 1", "line 2", "line 3"])
console.log(doc.line(2))    // {from: 7, to: 13, ...}
console.log(doc.lineAt(15)) // {from: 14, to: 20, ...}
```

---

## 2. System Guide — Modelo de Dados

### Mudanças de Documento

Document changes são valores imutáveis (`ChangeSet`) que descrevem ranges substituídos. Todas as posições de mudança referem-se ao documento original.

### Seleção

```js
import {EditorState, EditorSelection} from "@codemirror/state"

let state = EditorState.create({
  doc: "hello",
  selection: EditorSelection.create([
    EditorSelection.range(0, 4),
    EditorSelection.cursor(5)
  ]),
  extensions: EditorState.allowMultipleSelections.of(true)
})
console.log(state.selection.ranges.length) // 2

let tr = state.update(state.replaceSelection("!"))
console.log(tr.state.doc.toString()) // "!o!"
```

**changeByRange** para operar em cada range:

```js
let state = EditorState.create({doc: "abcd", selection: {anchor: 1, head: 3}})
let tr = state.update(state.changeByRange(range => {
  let upper = state.sliceDoc(range.from, range.to).toUpperCase()
  return {
    changes: {from: range.from, to: range.to, insert: upper},
    range: EditorSelection.range(range.from, range.from + upper.length)
  }
}))
console.log(tr.state.doc.toString()) // "aBCd"
```

---

### Facets

Facets são **pontos de extensão** — múltiplas extensões podem fornecer valores e o facet computa um valor combinado.

```js
import {EditorState} from "@codemirror/state"

let state = EditorState.create({
  extensions: [
    EditorState.tabSize.of(16),
    EditorState.changeFilter.of(() => true)
  ]
})
console.log(state.facet(EditorState.tabSize))      // 16
console.log(state.facet(EditorState.changeFilter)) // [() => true]
```

Facets com valor computado:

```js
let info = Facet.define<string>()
let state = EditorState.create({
  doc: "abc\ndef",
  extensions: [
    info.of("hello"),
    info.compute(["doc"], state => `lines: ${state.doc.lines}`)
  ]
})
console.log(state.facet(info))
// ["hello", "lines: 2"]
```

---

### Transações

Transações combinam (todos opcionais):
- **`changes`** — mudanças de documento
- **`selection`** — nova seleção explícita
- **`scrollIntoView`** — flag de scroll
- **`annotations`** — metadados (ex: `userEvent`)
- **`effects`** — efeitos adicionais (ex: dobrar código)
- Reconfiguração de estado via `Compartment`

```js
// Dispatch direto
cm.dispatch({
  changes: {from, to, insert: text}
})

// Criar transação e despachar depois
let tr = state.update({changes: {from: 0, insert: "0"}})
view.dispatch(tr)
```

---

## 3. System Guide — A View

### Viewport

O CodeMirror **não renderiza o documento inteiro** quando ele é grande. Ele mantém apenas a parte visível mais uma margem. Isso é o **viewport**.

- `view.viewport` — range do viewport atual
- `view.visibleRanges` — ranges que são efetivamente desenhados (exclui conteúdo colapsado)
- Coordenadas de posições fora do viewport não funcionam (não estão no DOM)

---

### Ciclo de Atualização

- `dispatch()` faz escrita no DOM sem leitura de layout.
- Leitura (validação do viewport, scroll, etc.) ocorre em uma **measure phase** via `requestAnimationFrame`.
- Use `requestMeasure()` para agendar código de medição.
- Ao terminar com uma view: **chame `view.destroy()`**.

---

### Estrutura DOM

```html
<div class="cm-editor [theme scope classes]">
  <div class="cm-scroller">
    <div class="cm-content" contenteditable="true">
      <div class="cm-line">Content goes here</div>
      <div class="cm-line">...</div>
    </div>
  </div>
</div>
```

- `cm-editor` — flex vertical container
- `cm-scroller` — deve ter `overflow: auto` se o editor tiver scroll próprio
- `cm-content` — element editável com MutationObserver
- Gutters são adicionados no início do `cm-scroller` (flexbox horizontal)

---

### Estilos e Temas

```js
import {EditorView} from "@codemirror/view"

// Tema customizado
let view = new EditorView({
  extensions: EditorView.theme({
    ".cm-content": {color: "darkorange"},
    "&.cm-focused .cm-content": {color: "orange"}
  })
})

// Base theme (light/dark)
let myBaseTheme = EditorView.baseTheme({
  "&dark .cm-mySelector": { background: "dimgrey" },
  "&light .cm-mySelector": { background: "ghostwhite" }
})
```

Em CSS externo:

```css
.cm-editor .cm-content { color: purple; }
```

---

### Comandos

Commands são funções `(view: EditorView) => boolean`:
- `false` — não se aplica na situação atual
- `true` — executado com sucesso

```js
let myKeyExtension = keymap.of([
  {
    key: "Alt-c",
    run: view => {
      view.dispatch(view.state.replaceSelection("?"))
      return true
    }
  }
])
```

`StateCommand` é subtipo de `Command` para comandos que só operam no estado:

```ts
type StateCommand = (target: {state: EditorState, dispatch: (tr: Transaction) => void}) => boolean
```

---

## 4. System Guide — Estendendo o CodeMirror

### State Fields

```js
import {EditorState, StateField} from "@codemirror/state"

let countDocChanges = StateField.define({
  create() { return 0 },
  update(value, tr) { return tr.docChanged ? value + 1 : value }
})

let state = EditorState.create({extensions: countDocChanges})
state = state.update({changes: {from: 0, insert: "."}}).state
console.log(state.field(countDocChanges)) // 1
```

Com `StateEffect`:

```js
import {StateField, StateEffect} from "@codemirror/state"

let setFullScreenMode = StateEffect.define<boolean>()

let fullScreenMode = StateField.define({
  create() { return false },
  update(value, tr) {
    for (let e of tr.effects)
      if (e.is(setFullScreenMode)) value = e.value
    return value
  }
})
```

---

### View Plugins

```js
import {ViewPlugin} from "@codemirror/view"

const docSizePlugin = ViewPlugin.fromClass(class {
  constructor(view) {
    this.dom = view.dom.appendChild(document.createElement("div"))
    this.dom.style.cssText =
      "position: absolute; inset-block-start: 2px; inset-inline-end: 5px"
    this.dom.textContent = view.state.doc.length
  }

  update(update) {
    if (update.docChanged)
      this.dom.textContent = update.state.doc.length
  }

  destroy() { this.dom.remove() }
})
```

- View plugins **não devem guardar estado não-derivado**.
- Se um plugin travar, é automaticamente desabilitado.

---

### Decorações

Quatro tipos:
- **Mark decorations** — adicionam estilo/atributos DOM a ranges de texto
- **Widget decorations** — inserem DOM element em posição do documento
- **Replace decorations** — ocultam/substituem partes do documento
- **Line decorations** — adicionam atributos ao elemento wrapper da linha

Decorações são fornecidas via facet `EditorView.decorations` e armazenadas em `RangeSet` (imutável).

---

### Arquitetura de Extensões

Boas práticas:
- Exportar uma função que retorna os valores de extensão
- Usar deduplicação de extensões idênticas (criar instâncias estáticas)
- Usar facets privados para configuração reconciliável

---

## 5. Reference Manual — @codemirror/state

### EditorState

#### `interface EditorStateConfig`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `doc?` | `string \| Text` | Documento inicial |
| `selection?` | `EditorSelection \| {anchor, head?}` | Seleção inicial |
| `extensions?` | `Extension` | Extensões a associar |

#### `class EditorState`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `doc` | `Text` | Documento atual |
| `selection` | `EditorSelection` | Seleção atual |
| `tabSize` | `number` | Tamanho do tab em colunas |
| `lineBreak` | `string` | String de quebra de linha |
| `readOnly` | `boolean` | Editor em modo leitura |
| `update(...specs)` | `→ Transaction` | Cria transação |
| `replaceSelection(text)` | `→ TransactionSpec` | Substitui seleção |
| `changeByRange(f)` | `→ TransactionSpec` | Muda por range |
| `changes(spec?)` | `→ ChangeSet` | Cria change set |
| `toText(string)` | `→ Text` | Cria Text a partir de string |
| `sliceDoc(from?, to?)` | `→ string` | Fatiamento de documento |
| `facet(facet)` | `→ Output` | Lê valor de facet |
| `field(field)` | `→ Value` | Lê campo de estado |
| `toJSON(fields?)` | `→ any` | Serializa para JSON |
| `phrase(phrase, ...insert)` | `→ string` | Tradução de frases |
| `languageDataAt(name, pos, side?)` | `→ T[]` | Dados de linguagem |

**Facets estáticos:**
- `EditorState.allowMultipleSelections` — habilita múltiplas seleções
- `EditorState.tabSize` — tamanho do tab
- `EditorState.lineSeparator` — separador de linha
- `EditorState.readOnly` — modo leitura
- `EditorState.phrases` — frases de tradução
- `EditorState.changeFilter` — filtra mudanças
- `EditorState.transactionFilter` — filtra transações
- `EditorState.transactionExtender` — adiciona metadata a transações

---

### Text

#### `class Text`

Documentos são armazenados como **árvore imutável**.

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `length` | `number` | Tamanho em code units |
| `lines` | `number` | Número de linhas (>= 1) |
| `lineAt(pos)` | `→ Line` | Linha na posição |
| `line(n)` | `→ Line` | Linha pelo número (1-based) |
| `replace(from, to, text)` | `→ Text` | Substituição imutável |
| `append(other)` | `→ Text` | Concatenação |
| `slice(from, to?)` | `→ Text` | Fatia |
| `sliceString(from, to?, lineSep?)` | `→ string` | Fatia como string |
| `eq(other)` | `→ boolean` | Igualdade |
| `iter(dir?)` | `→ TextIterator` | Iterador |
| `iterRange(from, to?)` | `→ TextIterator` | Iterador de range |
| `iterLines(from?, to?)` | `→ TextIterator` | Iterador de linhas |
| `toString()` | `→ string` | Documento como string |
| `toJSON()` | `→ string[]` | Linhas como array |
| `static of(text)` | `→ Text` | Criação a partir de array |
| `static empty` | `Text` | Documento vazio |

#### `class Line`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `from` | `number` | Início da linha |
| `to` | `number` | Fim da linha (antes da quebra) |
| `number` | `number` | Número da linha (1-based) |
| `text` | `string` | Conteúdo da linha |
| `length` | `number` | Comprimento da linha |

#### Utilitários de Coluna

- `countColumn(string, tabSize, to?)` — conta posição de coluna
- `findColumn(string, col, tabSize, strict?)` — encontra offset a partir de coluna

#### Code Points e Caracteres

- `codePointAt(str, pos)` — code point na posição
- `fromCodePoint(code)` — string do code point
- `codePointSize(code)` — tamanho em posições JS
- `findClusterBreak(str, pos, forward?, includeExtending?)` — próximo grapheme cluster

---

### Changes and Transactions

#### `class ChangeDesc`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `length` | `number` | Tamanho antes da mudança |
| `newLength` | `number` | Tamanho após a mudança |
| `empty` | `boolean` | Sem mudanças reais |
| `iterGaps(f)` | — | Itera partes não modificadas |
| `iterChangedRanges(f, individual?)` | — | Itera ranges modificados |
| `invertedDesc` | `ChangeDesc` | Descrição invertida |
| `composeDesc(other)` | `→ ChangeDesc` | Efeito combinado |
| `mapDesc(other, before?)` | `→ ChangeDesc` | Mapeamento sobre outras mudanças |
| `mapPos(pos, assoc?)` | `→ number` | Mapeia posição |
| `toJSON()` | `→ number[]` | Serialização |
| `static fromJSON(json)` | `→ ChangeDesc` | Deserialização |

#### `enum MapMode`

- `Simple` — posição válida mesmo se contexto deletado
- `TrackDel` — null se deletado atravessando a posição
- `TrackBefore` — null se caractere antes foi deletado
- `TrackAfter` — null se caractere depois foi deletado

#### `class ChangeSet extends ChangeDesc`

| Membro adicional | Tipo | Descrição |
|-----------------|------|-----------|
| `apply(doc)` | `→ Text` | Aplica ao documento |
| `invert(doc)` | `→ ChangeSet` | Inverte |
| `compose(other)` | `→ ChangeSet` | Compõe |
| `iterChanges(f, individual?)` | — | Itera com texto inserido |
| `desc` | `ChangeDesc` | Descrição sem texto |
| `toJSON()` | `→ any` | Serialização |
| `static of(changes, length, lineSep?)` | `→ ChangeSet` | Criação |

---

### Extending Editor State

#### `class Facet<Input, Output>`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `of(value)` | `→ Extension` | Fornece valor estático |
| `compute(deps, get)` | `→ Extension` | Valor computado |
| `from(field, get?)` | `→ Extension` | A partir de StateField |
| `static define(config?)` | `→ Facet` | Define novo facet |

#### `class StateField<Value>`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `static define(config)` | `→ StateField` | Define campo |
| `init(create)` | `→ Extension` | Valor inicial diferente |

**Config:**
- `create(state)` — valor inicial
- `update(value, tr)` — atualização
- `compare?(a, b)` — comparação de igualdade
- `provide?(field)` — fornece facets

#### `class StateEffect<Value>`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `is(type)` | `→ boolean` | Verifica tipo |
| `value` | `Value` | Valor do efeito |
| `map(f)` | `→ StateEffect` | Mapeia posições |
| `static define(config?)` | `→ StateEffectType` | Define tipo de efeito |
| `static reconfigure` | `StateEffectType<Extension>` | Reconfigura extensões |
| `static appendConfig` | `StateEffectType<Extension>` | Adiciona configuração |

#### `class Compartment`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `of(ext)` | `→ Extension` | Envolve extensão em compartimento |
| `reconfigure(content)` | `→ StateEffect` | Cria efeito de reconfiguração |
| `get(state)` | `→ Extension` | Conteúdo atual no estado |

#### `namespace Prec`

- `Prec.highest(ext)` — maior precedência
- `Prec.high(ext)`
- `Prec.default(ext)` — padrão
- `Prec.low(ext)`
- `Prec.lowest(ext)` — menor precedência

---

### Range Sets

#### `abstract class RangeValue`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `startSide` | `number` | Bias no início |
| `endSide` | `number` | Bias no fim |
| `mapMode` | `MapMode` | Como mapear range vazio |
| `point` | `boolean` | Se é range de ponto |
| `range(from, to?)` | `→ Range<T>` | Cria range |

#### `class RangeSet<T>`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `size` | `number` | Número de ranges |
| `update(updateSpec)` | `→ RangeSet` | Atualiza (imutável) |
| `map(changes)` | `→ RangeSet` | Mapeia através de mudanças |
| `between(from, to, f)` | — | Itera ranges no intervalo |
| `iter(from?)` | `→ RangeCursor` | Cursor de iteração |
| `static empty` | `RangeSet` | Conjunto vazio |
| `static of(ranges, sort?)` | `→ RangeSet` | Criação |

#### `class RangeSetBuilder<T>`

```js
let builder = new RangeSetBuilder()
builder.add(from, to, value)
let set = builder.finish()
```

---

## 6. Reference Manual — @codemirror/view

### EditorView

#### `interface EditorViewConfig extends EditorStateConfig`

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `state?` | `EditorState` | Estado inicial |
| `extensions?` | `Extension` | Extensões (se state não fornecido) |
| `parent?` | `Element \| DocumentFragment` | Elemento pai |
| `root?` | `Document \| ShadowRoot` | Root opcional |
| `dispatchTransactions?` | `fn` | Override do dispatch |
| `scrollTo?` | `StateEffect` | Efeito de scroll inicial |

#### `class EditorView`

**Propriedades:**

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `state` | `EditorState` | Estado atual |
| `viewport` | `{from, to}` | Viewport desenhado |
| `visibleRanges` | `{from, to}[]` | Ranges visíveis |
| `inView` | `boolean` | Visível ao usuário |
| `composing` | `boolean` | Composição IME ativa |
| `compositionStarted` | `boolean` | Composição iniciada |
| `dom` | `HTMLElement` | Elemento wrapper |
| `scrollDOM` | `HTMLElement` | Elemento scroller |
| `contentDOM` | `HTMLElement` | Elemento de conteúdo |
| `hasFocus` | `boolean` | Se tem foco |
| `textDirection` | `Direction` | Direção do texto |
| `lineWrapping` | `boolean` | Se line wrapping está ativo |
| `defaultLineHeight` | `number` | Altura padrão de linha |
| `defaultCharacterWidth` | `number` | Largura padrão de caractere |
| `documentTop` | `number` | Posição topo do documento |
| `documentPadding` | `{top, bottom}` | Padding do documento |
| `scaleX` | `number` | Escala X por CSS transform |
| `contentHeight` | `number` | Altura total do conteúdo |

**Métodos:**

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `dispatch(...specs)` | — | Despacha transação |
| `update(transactions)` | — | Aplica transações à view |
| `state` setter | — | Substitui estado |
| `focus()` | — | Foca o editor |
| `destroy()` | — | Destrói a view |
| `domAtPos(pos, side?)` | `→ {node, offset}` | DOM na posição |
| `posAtDOM(node, offset?)` | `→ number` | Posição a partir de DOM |
| `posAtCoords(coords, precise?)` | `→ number \| null` | Posição a partir de coordenadas |
| `coordsAtPos(pos, side?)` | `→ Rect \| null` | Coordenadas na posição |
| `coordsForChar(pos)` | `→ Rect \| null` | Coordenadas de caractere |
| `lineBlockAt(pos)` | `→ BlockInfo` | Bloco de linha na posição |
| `lineBlockAtHeight(height)` | `→ BlockInfo` | Bloco de linha na altura |
| `moveByChar(start, forward, by?)` | `→ SelectionRange` | Move cursor por caractere |
| `moveByGroup(start, forward)` | `→ SelectionRange` | Move por grupo |
| `moveVertically(start, forward, distance?)` | `→ SelectionRange` | Move verticalmente |
| `requestMeasure(request?)` | — | Agenda medição |
| `plugin(plugin)` | `→ T \| null` | Obtém plugin |
| `scrollIntoView(pos, options?)` | — | Rola para posição |
| `scrollSnapshot()` | `→ StateEffect` | Snapshot de scroll |

**Facets e Extensions estáticos:**

| Facet | Descrição |
|-------|-----------|
| `EditorView.updateListener` | Listener para updates |
| `EditorView.editable` | Se editável |
| `EditorView.mouseSelectionStyle` | Estilo de seleção por mouse |
| `EditorView.dragMovesSelection` | Drag move vs copy |
| `EditorView.clickAddsSelectionRange` | Click adiciona range |
| `EditorView.domEventHandlers` | Handlers de eventos DOM |
| `EditorView.domEventObservers` | Observers de eventos DOM |
| `EditorView.inputHandler` | Intercepta input do usuário |
| `EditorView.clipboardInputFilter` | Filtra texto do clipboard |
| `EditorView.clipboardOutputFilter` | Filtra texto para clipboard |
| `EditorView.scrollHandler` | Handler de scroll |
| `EditorView.focusChangeEffect` | Efeito em mudança de foco |
| `EditorView.perLineTextDirection` | Direção de texto por linha |
| `EditorView.exceptionSink` | Captura exceções |
| `EditorView.decorations` | Decorações |
| `EditorView.outerDecorations` | Decorações externas |
| `EditorView.atomicRanges` | Ranges atômicos |
| `EditorView.bidiIsolatedRanges` | Ranges bidi isolados |
| `EditorView.scrollMargins` | Margens de scroll |
| `EditorView.styleModule` | Módulo CSS |
| `EditorView.editorAttributes` | Atributos do wrapper |
| `EditorView.contentAttributes` | Atributos do content |
| `EditorView.lineWrapping` | Habilita line wrapping |
| `EditorView.announce` | Anúncio para screen readers |
| `EditorView.darkTheme` | Tema escuro ativo |
| `EditorView.cspNonce` | CSP nonce |

**Métodos estáticos:**

| Membro | Descrição |
|--------|-----------|
| `EditorView.theme(spec, options?)` | Cria extensão de tema |
| `EditorView.baseTheme(spec)` | Cria base theme |
| `EditorView.scrollIntoView(pos, options?)` | Retorna efeito de scroll |
| `EditorView.findFromDOM(dom)` | Encontra view a partir do DOM |

---

### Extending the View

#### `interface PluginValue`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `update?(update)` | `fn` | Chamado em cada update |
| `docViewUpdate?()` | `fn` | Após renderização |
| `destroy?()` | `fn` | Ao remover o plugin |

#### `class ViewPlugin<V>`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `static fromClass(cls, spec?)` | `→ ViewPlugin` | Cria a partir de classe |
| `static define(create, spec?)` | `→ ViewPlugin` | Cria a partir de função |

**Spec:**
- `eventHandlers` — handlers de eventos DOM
- `eventObservers` — observers de eventos DOM
- `provide(plugin)` — fornece facets
- `decorations(instance)` — fornece decorações

#### `class ViewUpdate`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `changes` | `ChangeSet` | Mudanças de documento |
| `startState` | `EditorState` | Estado anterior |
| `view` | `EditorView` | View associada |
| `state` | `EditorState` | Novo estado |
| `transactions` | `Transaction[]` | Transações envolvidas |
| `viewportChanged` | `boolean` | Viewport mudou |
| `viewportMoved` | `boolean` | Viewport moveu |
| `heightChanged` | `boolean` | Altura mudou |
| `geometryChanged` | `boolean` | Geometria mudou |
| `focusChanged` | `boolean` | Foco mudou |
| `docChanged` | `boolean` | Documento mudou |
| `selectionSet` | `boolean` | Seleção foi definida |

---

### Key Bindings

#### `interface KeyBinding`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `key?` | `string` | Key binding padrão |
| `mac?` | `string` | Override para macOS |
| `win?` | `string` | Override para Windows |
| `linux?` | `string` | Override para Linux |
| `run?` | `Command` | Executado ao pressionar |
| `shift?` | `Command` | Shift + key |
| `any?` | `fn` | Para qualquer tecla |
| `scope?` | `string` | Escopo (default: "editor") |
| `preventDefault?` | `boolean` | Prevenir default |
| `stopPropagation?` | `boolean` | Parar propagação |

O facet `keymap` é usado para registrar key bindings:

```js
keymap.of([{key: "Ctrl-Enter", run: myCommand}])
```

---

### Decorations

#### `class Decoration extends RangeValue`

**Métodos estáticos:**

```js
// Mark decoration
Decoration.mark({
  inclusive?: boolean,
  inclusiveStart?: boolean,
  inclusiveEnd?: boolean,
  attributes?: {[attr: string]: string},
  class?: string,
  tagName?: string,
  // ...
})

// Widget decoration
Decoration.widget({
  widget: WidgetType,
  side?: number,      // positivo = depois do cursor, negativo = antes
  inlineOrder?: boolean,
  block?: boolean,
})

// Replace decoration
Decoration.replace({
  widget?: WidgetType,
  inclusive?: boolean,
  inclusiveStart?: boolean,
  inclusiveEnd?: boolean,
  block?: boolean,
})

// Line decoration
Decoration.line({
  attributes?: {[attr: string]: string},
  class?: string,
})

Decoration.none  // range set vazio
Decoration.set(of, sort?)  // cria range set
```

#### `abstract class WidgetType`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `toDOM(view)` | `→ HTMLElement` | Cria DOM do widget |
| `updateDOM(dom, view)` | `→ boolean` | Atualiza DOM existente |
| `eq(widget)` | `→ boolean` | Igualdade |
| `ignoreEvent(event)` | `→ boolean` | Ignorar evento |
| `coordsAt(dom, pos, side)` | `→ Rect \| null` | Coordenadas customizadas |
| `destroy(dom)` | — | Cleanup ao remover |
| `estimatedHeight` | `number` | Altura estimada |
| `lineBreaks` | `number` | Quebras de linha que adiciona |
| `customView` | — | Vista customizada |

#### `class MatchDecorator`

Ajuda a manter decorações para código que corresponde a uma regexp regular:

```js
import {MatchDecorator} from "@codemirror/view"

const decorator = new MatchDecorator({
  regexp: /\[\[(\w+)\]\]/g,
  decoration: match => Decoration.mark({class: "link"})
})
```

Config:
- `regexp` — RegExp (deve ter flag `g`)
- `decoration?` — Decoration ou função
- `decorate?` — função de decoração alternativa
- `boundary?` — expressão de fronteira
- `maxLength?` — comprimento máximo por linha (padrão: 1000)

Métodos:
- `createDeco(view)` — computa todas as decorações no viewport
- `updateDeco(update, deco)` — atualiza decorações para update

---

### Gutters

```js
import {lineNumbers, gutter, gutters, GutterMarker} from "@codemirror/view"

// Numeração de linhas
lineNumbers({
  formatNumber?: fn,
  domEventHandlers?: {...}
})

// Gutter customizado
gutter({
  class?: string,
  renderEmptyElements?: boolean,
  markers?: fn(view) => RangeSet,
  lineMarker?: fn(view, line, otherMarkers) => GutterMarker | null,
  widgetMarker?: fn(view, widget, block) => GutterMarker | null,
  lineMarkerChange?: fn(update) => boolean,
  initialSpacer?: fn(view) => GutterMarker | null,
  updateSpacer?: fn(spacer, update) => GutterMarker,
  domEventHandlers?: {...},
  side?: "before" | "after",
})

gutters({fixed?: boolean})
```

#### `abstract class GutterMarker extends RangeValue`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `toDOM?(view)` | `→ Node` | Cria elemento DOM |
| `destroy?(dom)` | — | Destrói elemento |
| `eq(other)` | `→ boolean` | Igualdade |
| `elementClass` | `string` | Classe CSS do elemento |

---

### Tooltips

```js
import {showTooltip, tooltips, hoverTooltip} from "@codemirror/view"
```

#### `interface Tooltip`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `pos` | `number` | Posição no documento |
| `end?` | `number` | Fim do range anotado |
| `create(view)` | `→ TooltipView` | Cria DOM do tooltip |
| `above?` | `boolean` | Acima/abaixo da posição |
| `strictSide?` | `boolean` | Lado estrito |
| `arrow?` | `boolean` | Mostrar seta |

#### `interface TooltipView`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `dom` | `HTMLElement` | Elemento DOM |
| `offset?` | `{x, y}` | Ajuste de posição |
| `getCoords?(pos)` | `→ Rect` | Coordenadas customizadas |
| `overlap?` | `boolean` | Pode sobrepor conteúdo |
| `mount?(view)` | — | Após montar |
| `update?(update)` | — | Atualização |
| `destroy?()` | — | Destruição |
| `positioned?(space)` | — | Após posicionamento |
| `resize?` | `boolean` | Permite resize |

---

### Panels

Para adicionar painéis (busca, linting, etc.):

```js
import {showPanel, getPanel} from "@codemirror/view"
```

#### `interface Panel`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `dom` | `HTMLElement` | Elemento do painel |
| `mount?()` | — | Após adicionado |
| `update?(update)` | — | Atualização |
| `destroy?()` | — | Remoção |
| `top?` | `boolean` | No topo ou rodapé |

---

### Layers

Camadas para elementos desenhados por coordenadas (ex: cursor, seleção):

```js
import {layer, RectangleMarker} from "@codemirror/view"

layer({
  above: boolean,
  markers(view): LayerMarker[],
  update?(update, layer): boolean,
  destroy?(layer, view): void,
  mount?(layer, view): void,
  class?: string,
})
```

#### `class RectangleMarker implements LayerMarker`

```js
new RectangleMarker(className, left, top, width, height)
```

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `className` | `string` | Classe CSS |
| `left` | `number` | Posição esquerda |
| `top` | `number` | Posição topo |
| `width` | `number \| null` | Largura |
| `height` | `number` | Altura |
| `static forRange(view, className, range)` | `→ RectangleMarker[]` | Para range de seleção |

---

### Seleção Retangular

```js
import {rectangularSelection, crosshairCursor} from "@codemirror/view"

rectangularSelection({
  eventFilter?: fn(event: MouseEvent) => boolean
})

crosshairCursor({key?: "Alt" | "Control" | "Shift" | "Meta"})
```

---

## 7. Reference Manual — @codemirror/language

### Language

#### `class Language`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `parser` | `Parser` | Parser da linguagem |
| `name` | `string` | Nome |
| `data` | `Facet` | Facet de dados da linguagem |
| `allowsNesting` | `boolean` | Permite sub-linguagens |
| `isActiveAt(state, pos, side?)` | `→ boolean` | Linguagem ativa na posição |
| `findRegions(state)` | `→ {from,to}[]` | Regiões da linguagem |

#### `class LanguageSupport`

```js
new LanguageSupport(language: Language, support?: Extension)
```

#### `class LanguageDescription`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `name` | `string` | Nome da linguagem |
| `alias?` | `string[]` | Nomes alternativos |
| `extensions?` | `string[]` | Extensões de arquivo |
| `filename?` | `RegExp` | Padrão de nome de arquivo |
| `load?` | `→ Promise<LanguageSupport>` | Carrega a linguagem |
| `support?` | `LanguageSupport` | Se já carregada |

**Métodos estáticos:**
- `LanguageDescription.of(config)` — cria descrição
- `LanguageDescription.matchFilename(descs, filename)` — match por arquivo
- `LanguageDescription.matchLanguageName(descs, name, fuzzy?)` — match por nome

---

### ParseContext

```js
syntaxTree(state)         // Obtém a árvore de sintaxe atual
ensureSyntaxTree(state, upto, timeout?)  // Garante árvore até posição
syntaxTreeAvailable(state, upto?)        // Verifica disponibilidade
syntaxParserRunning(view)  // Verifica se parser está rodando
forceParsing(view, upto?, timeout?)      // Força parsing
```

---

### Highlighting

```js
import {syntaxHighlighting, HighlightStyle, defaultHighlightStyle} from "@codemirror/language"
import {tags} from "@lezer/highlight"

const myHighlightStyle = HighlightStyle.define([
  {tag: tags.keyword, color: "#fc6"},
  {tag: tags.comment, color: "#f5d", fontStyle: "italic"},
])

syntaxHighlighting(myHighlightStyle)
```

**Tags comuns de `@lezer/highlight`:**
- `tags.keyword`, `tags.operator`, `tags.punctuation`
- `tags.comment`, `tags.lineComment`, `tags.blockComment`
- `tags.string`, `tags.regexp`, `tags.escape`
- `tags.number`, `tags.integer`, `tags.float`
- `tags.bool`, `tags.null`, `tags.undefined`
- `tags.variableName`, `tags.function(tags.variableName)`
- `tags.typeName`, `tags.className`, `tags.propertyName`
- `tags.heading`, `tags.strong`, `tags.emphasis`
- `tags.link`, `tags.url`, `tags.monospace`

---

### Folding

```js
import {
  foldService, foldNodeProp, foldInside,
  foldCode, unfoldCode, toggleFold, foldAll, unfoldAll,
  foldKeymap, codeFolding, foldGutter,
  foldEffect, unfoldEffect, foldedRanges
} from "@codemirror/language"
```

**Keybindings padrão:**
- `Ctrl-Shift-[` (Cmd-Alt-[ no macOS): `foldCode`
- `Ctrl-Shift-]` (Cmd-Alt-] no macOS): `unfoldCode`
- `Ctrl-Alt-[`: `foldAll`
- `Ctrl-Alt-]`: `unfoldAll`

```js
codeFolding({
  placeholderDOM?: fn(view, onclick, prepared) => HTMLElement,
  placeholderText?: string,       // padrão: "…"
  preparePlaceholder?: fn(state, range) => any,
})

foldGutter({
  markerDOM?: fn(open) => HTMLElement,
  openText?: string,       // padrão: "⌄"
  closedText?: string,     // padrão: "›"
  domEventHandlers?: {...},
})
```

---

### Indentation

```js
import {
  indentService, indentNodeProp,
  getIndentation, indentRange,
  indentUnit, getIndentUnit, indentString,
  IndentContext, TreeIndentContext,
  indentOnInput,
  delimitedIndent, continuedIndent, flatIndent
} from "@codemirror/language"
```

#### `class IndentContext`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `unit` | `number` | Unidade de indentação (colunas) |
| `state` | `EditorState` | Estado |
| `lineAt(pos, bias?)` | `→ {text, from}` | Linha na posição |
| `textAfterPos(pos, bias?)` | `→ string` | Texto após posição |
| `column(pos, bias?)` | `→ number` | Coluna da posição |
| `countColumn(line, pos?)` | `→ number` | Posição de coluna |
| `lineIndent(pos, bias?)` | `→ number` | Indentação da linha |
| `simulatedBreak` | `number \| null` | Quebra de linha simulada |

#### `class TreeIndentContext extends IndentContext`

| Membro adicional | Tipo | Descrição |
|----------------|------|-----------|
| `pos` | `number` | Posição a indentar |
| `node` | `SyntaxNode` | Nó de sintaxe |
| `textAfter` | `string` | Texto após a posição |
| `baseIndent` | `number` | Indentação base |
| `baseIndentFor(node)` | `→ number` | Indentação para nó |
| `continue()` | `→ number \| null` | Continua estratégia |

---

### Bracket Matching

```js
import {bracketMatching, matchBrackets} from "@codemirror/language"

bracketMatching({
  afterCursor?: boolean,    // padrão: true
  brackets?: string,        // padrão: "()[]{}"
  maxScanDistance?: number, // padrão: 10000
  renderMatch?: fn(match, state) => Range<Decoration>[]
})
```

---

### Stream Parser

Para migrar linguagens do CodeMirror 5:

```js
import {StreamParser, StreamLanguage, StringStream} from "@codemirror/language"

const myLanguage = StreamLanguage.define({
  name?: string,
  startState?(indentUnit): State,
  token(stream: StringStream, state: State): string | null,
  blankLine?(state, indentUnit): void,
  copyState?(state): State,
  indent?(state, textAfter, context): number | null | undefined,
  languageData?: {...},
  tokenTable?: {...},
})
```

---

## 8. Reference Manual — @codemirror/commands

### Keymaps

#### `standardKeymap: KeyBinding[]`

Bindings padrão de plataforma:
- Arrow keys: movimentação de cursor
- Ctrl/Cmd+Arrow: movimento por grupo / linha
- Home/End: início/fim de linha
- Shift: seleção
- Backspace/Delete: deleção de caractere

#### `defaultKeymap: KeyBinding[]`

Inclui `standardKeymap` mais:
- `Alt-ArrowLeft/Right` (Ctrl no macOS): movimento pela sintaxe
- `Alt-ArrowUp/Down`: mover linha
- `Shift-Alt-ArrowUp/Down`: copiar linha
- `Escape`: simplificar seleção
- `Ctrl-Enter`: inserir linha abaixo
- `Alt-l` (Ctrl-l no macOS): selecionar linha
- `Ctrl-i`: selecionar parágrafo
- `Ctrl-[`/`]`: indent/unindent
- `Ctrl-Alt-\`: indentar seleção
- `Shift-Ctrl-k`: deletar linha
- `Shift-Ctrl-\`: ir para bracket correspondente
- `Ctrl-/`: toggle comentário
- `Shift-Alt-a`: toggle comentário de bloco

#### `emacsStyleKeymap: KeyBinding[]`

Bindings no estilo Emacs.

#### `indentWithTab: KeyBinding`

Liga Tab a `indentMore` e Shift-Tab a `indentLess`.

---

### Comandos de Seleção

**Por caractere:** `cursorCharLeft`, `cursorCharRight`, `selectCharLeft`, `selectCharRight`

**Por grupo:** `cursorGroupLeft`, `cursorGroupRight`, `selectGroupLeft`, `selectGroupRight`, `cursorGroupForwardWin`, `selectGroupForwardWin`

**Por subword:** `cursorSubwordForward`, `selectSubwordForward`, `cursorSubwordBackward`, `selectSubwordBackward`

**Vertical:** `cursorLineUp`, `selectLineUp`, `cursorLineDown`, `selectLineDown`, `cursorPageUp`, `selectPageUp`, `cursorPageDown`, `selectPageDown`, `addCursorAbove`, `addCursorBelow`

**Limite de linha:** `cursorLineBoundaryLeft`, `cursorLineBoundaryRight`, `selectLineBoundaryLeft`, `selectLineBoundaryRight`, `cursorLineStart`, `cursorLineEnd`, `selectLineStart`, `selectLineEnd`, `cursorLineBoundaryBackward`, `cursorLineBoundaryForward`

**Sintaxe:** `cursorSyntaxLeft`, `cursorSyntaxRight`, `selectSyntaxLeft`, `selectSyntaxRight`

**Documento:** `cursorDocStart`, `selectDocStart`, `cursorDocEnd`, `selectDocEnd`, `selectAll`

**Seleção:** `selectLine`, `selectParentSyntax`, `simplifySelection`

**Cursor:** `cursorMatchingBracket`, `selectMatchingBracket`

---

### Manipulação de Linha

- `splitLine` — insere quebra de linha
- `moveLineUp` / `moveLineDown` — move linhas selecionadas
- `copyLineUp` / `copyLineDown` — copia linhas selecionadas
- `deleteLine` — deleta linhas selecionadas
- `deleteTrailingWhitespace` — remove espaços no final

---

### Deleção

- `deleteCharBackward` / `deleteCharForward`
- `deleteGroupBackward` / `deleteGroupForward`
- `deleteLineBoundaryBackward` / `deleteLineBoundaryForward`
- `deleteToLineStart` / `deleteToLineEnd`

---

### Indentação

- `indentSelection` — auto-indentar seleção
- `indentMore` — adiciona unidade de indentação
- `indentLess` — remove unidade de indentação
- `insertTab` — insere tab ou indenta

---

### Undo History

```js
import {history, historyKeymap, undo, redo, undoDepth, redoDepth} from "@codemirror/commands"

history({
  minDepth?: number,        // padrão: 100
  newGroupDelay?: number,   // padrão: 500ms
  joinToEvent?: fn(tr, isAdjacent) => boolean
})
```

**Keybindings:** Ctrl-z (undo), Ctrl-y / Ctrl-Shift-z (redo), Ctrl-u (undo seleção), Alt-u (redo seleção)

**Comandos:** `undo`, `redo`, `undoSelection`, `redoSelection`

**Funções:** `undoDepth(state)`, `redoDepth(state)`, `isolateHistory(tr, value)`

---

### Comentários

```js
import {toggleComment, toggleLineComment, toggleBlockComment} from "@codemirror/commands"
```

#### `interface CommentTokens`

```js
{
  block?: {open: string, close: string},  // ex: {open: "/*", close: "*/"}
  line?: string                           // ex: "//"
}
```

Registrado como language data `"commentTokens"`.

---

## 9. Reference Manual — @codemirror/search

### Keybindings Padrão

```
Mod-f:           openSearchPanel
F3, Mod-g:       findNext
Shift-F3:        findPrevious
Mod-Alt-g:       gotoLine
Mod-d:           selectNextOccurrence
```

### Configuração

```js
import {search, searchKeymap} from "@codemirror/search"

search({
  top?: boolean,           // painel no topo (padrão: false)
  caseSensitive?: boolean,
  literal?: boolean,
  regexp?: boolean,
  wholeWord?: boolean,
  createPanel?: fn(view) => SearchPanel,
  scrollToMatch?: fn(range, view) => StateEffect,
})
```

### Comandos

- `findNext`, `findPrevious`
- `selectMatches`, `selectSelectionMatches`
- `selectNextOccurrence`
- `replaceNext`, `replaceAll`
- `openSearchPanel`, `closeSearchPanel`
- `gotoLine`

### SearchQuery

```js
import {SearchQuery, getSearchQuery, setSearchQuery} from "@codemirror/search"

new SearchQuery({
  search: string,
  caseSensitive?: boolean,
  literal?: boolean,
  regexp?: boolean,
  replace?: string,
  wholeWord?: boolean,
  test?: fn(match, state, from, to) => boolean,
})
```

**Propriedades:** `search`, `caseSensitive`, `literal`, `regexp`, `replace`, `valid`, `wholeWord`

**Métodos:** `eq(other)`, `getCursor(state, from?, to?)`

### SearchCursor

```js
import {SearchCursor} from "@codemirror/search"

let cursor = new SearchCursor(doc, query, from?, to?, normalize?, test?)
cursor.next()
cursor.nextOverlapping()
// cursor.value = {from, to}
// cursor.done = boolean
```

### RegExpCursor

```js
import {RegExpCursor} from "@codemirror/search"

let cursor = new RegExpCursor(doc, query, options?, from?, to?)
// options: {ignoreCase?, test?}
cursor.next()
// cursor.value = {from, to, match: RegExpExecArray}
```

### Selection Matching

```js
import {highlightSelectionMatches} from "@codemirror/search"

highlightSelectionMatches({
  minSelectionLength?: number,  // padrão: 1
  maxMatches?: number,          // padrão: 100
  wholeWords?: boolean,
})
```

---

## 10. Reference Manual — @codemirror/autocomplete

### Configuração

```js
import {autocompletion} from "@codemirror/autocomplete"

autocompletion({
  activateOnTyping?: boolean,
  activateOnTypingDelay?: number,
  selectOnOpen?: boolean,
  override?: CompletionSource[],
  closeOnBlur?: boolean,
  maxRenderedOptions?: number,
  defaultKeymap?: boolean,
  icons?: boolean,
  addToOptions?: {render: fn, position: number}[],
  optionClass?: fn(completion) => string,
  aboveCursor?: boolean,
  tooltipClass?: fn(state) => string,
  compareCompletions?: fn(a, b) => number,
  interactionDelay?: number,
  updateSyncTime?: number,
})
```

### Sources

#### `class CompletionContext`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `state` | `EditorState` | Estado atual |
| `pos` | `number` | Posição do cursor |
| `explicit` | `boolean` | Triggered explicitamente |
| `view?` | `EditorView` | View (se disponível) |
| `tokenBefore(types)` | `→ {from, to, text, type} \| null` | Token antes |
| `matchBefore(expr)` | `→ {from, to, text} \| null` | Match antes |
| `aborted` | `boolean` | Query abortada |
| `addEventListener(type, listener, options?)` | — | Listener de abort |

#### `interface CompletionResult`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `from` | `number` | Início do range completado |
| `to?` | `number` | Fim do range (padrão: pos) |
| `options` | `Completion[]` | Completions disponíveis |
| `validFor?` | `RegExp \| fn` | Quando re-query não é necessário |
| `filter?` | `boolean` | Filtrar automaticamente |
| `getMatch?` | `fn` | Ranges de match no label |
| `update?` | `fn` | Atualização síncrona |
| `map?` | `fn` | Mapear para mudanças posteriores |
| `commitCharacters?` | `string[]` | Caracteres que commitam |

#### `interface Completion`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `label` | `string` | Texto de completão |
| `displayLabel?` | `string` | Label exibido |
| `detail?` | `string` | Detalhe adicional |
| `info?` | `string \| fn` | Info extra |
| `apply?` | `string \| fn` | Como aplicar |
| `type?` | `string` | Tipo (para ícone) |
| `boost?` | `number` | Ajuste de ranking |
| `section?` | `string \| CompletionSection` | Seção do dropdown |
| `commitCharacters?` | `string[]` | Commits específicos |
| `validFor?` | `RegExp \| fn` | Validade |

### Comandos

- `startCompletion` — inicia autocompletion
- `closeCompletion` — fecha completion
- `acceptCompletion` — aceita completão atual
- `moveCompletionSelection(forward, by?)` — move seleção

### Snippets

```js
import {snippet, snippetCompletion, nextSnippetField, prevSnippetField, clearSnippet} from "@codemirror/autocomplete"

snippetCompletion("function #{name}(#{params}) {\n\t#{}\n}", {
  label: "function",
  type: "keyword",
})
```

**Sintaxe**: `#{}` = campo de snippet, `#{name}` = campo com placeholder.

### Bracket Closing

```js
import {closeBrackets, closeBracketsKeymap} from "@codemirror/autocomplete"

closeBrackets()  // extension

// Config via language data "closeBrackets"
interface CloseBracketConfig {
  brackets?: string[],         // padrão: ["(", "[", "{", "'", '"']
  before?: string,             // fecha apenas se próximo caractere estiver aqui
  stringPrefixes?: string[],   // prefixos de string
}
```

### Funções Utilitárias

- `ifIn(nodeNames, source)` — completion source condicional por tipo de nó
- `ifNotIn(nodeNames, source)` — complemento de `ifIn`
- `completeFromList(list)` — completion a partir de array de strings/objetos
- `insertCompletionText(state, text, from, to)` — spec de transação para inserção

---

## 11. Reference Manual — @codemirror/lint

### Configuração

```js
import {linter, lintGutter, lintKeymap} from "@codemirror/lint"

linter(source: LintSource, config?: {
  delay?: number,       // padrão: 750ms
  needsRefresh?: fn(update) => boolean,
  markerFilter?: fn(diagnostics, state) => Diagnostic[],
  tooltipFilter?: fn(diagnostics, state) => Diagnostic[],
  hideOn?: fn(tr, from, to) => boolean | null,
  autoPanel?: boolean,
})

lintGutter()
```

### Tipos

#### `interface Diagnostic`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `from` | `number` | Início da posição relevante |
| `to` | `number` | Fim da posição |
| `severity` | `"error" \| "hint" \| "info" \| "warning"` | Severidade |
| `markClass?` | `string` | Classe CSS adicional |
| `source?` | `string` | Fonte do diagnóstico |
| `message` | `string` | Mensagem |
| `renderMessage?` | `fn(view) => Node` | Render customizado |
| `actions?` | `Action[]` | Ações disponíveis |

#### `interface Action`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `name` | `string` | Nome da ação |
| `apply(view, from, to)` | — | Executa a ação |

### Comandos

- `openLintPanel` — abre painel de lint
- `closeLintPanel` — fecha painel
- `nextDiagnostic` — próximo diagnóstico
- `previousDiagnostic` — diagnóstico anterior
- `lintKeymap` — keybindings padrão (Ctrl-Shift-m, F8)

### Funções

- `setDiagnostics(state, diagnostics)` — define diagnósticos via transação
- `setDiagnosticsEffect` — `StateEffectType` para definir diagnósticos
- `diagnosticCount(state)` — conta diagnósticos ativos
- `forceLinting(view)` — força linting imediatamente
- `type LintSource = fn(view) => Diagnostic[] | Promise<Diagnostic[]>`

---

## 12. Reference Manual — @codemirror/merge

### Side-by-side Merge View

```js
import {MergeView} from "@codemirror/merge"

let view = new MergeView({
  a: EditorStateConfig,
  b: EditorStateConfig,
  parent?: Element | DocumentFragment,
  root?: Document | ShadowRoot,
  // MergeConfig:
  orientation?: "a-b" | "b-a",
  revertControls?: "a-to-b" | "b-to-a",
  renderRevertControl?: fn() => HTMLElement,
  highlightChanges?: boolean,
  gutter?: boolean,
  collapseUnchanged?: {margin?: number, minSize?: number},
  diffConfig?: DiffConfig,
})
```

**Propriedades:** `a`, `b`, `dom`, `chunks`

**Métodos:** `reconfigure(config)`, `destroy()`

### Unified Merge View

```js
import {unifiedMergeView} from "@codemirror/merge"

unifiedMergeView({
  original: Text | string,
  highlightChanges?: boolean,
  gutter?: boolean,
  syntaxHighlightDeletions?: boolean,
  allowInlineDiffs?: boolean,
  syntaxHighlightDeletionsMaxLength?: number,
  mergeControls?: boolean | fn(type, action) => HTMLElement,
  diffConfig?: DiffConfig,
})
```

### Chunks

#### `class Chunk`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `changes` | `Change[]` | Mudanças individuais (relativas ao início) |
| `fromA` | `number` | Início no documento A |
| `toA` | `number` | Fim no documento A |
| `fromB` | `number` | Início no documento B |
| `toB` | `number` | Fim no documento B |
| `precise` | `boolean` | Se o diff foi preciso |
| `endA` | `number` | Fim válido em A |
| `endB` | `number` | Fim válido em B |
| `static build(a, b, conf?)` | `→ Chunk[]` | Constrói chunks |
| `static updateA(...)` | `→ Chunk[]` | Atualiza para changes em A |
| `static updateB(...)` | `→ Chunk[]` | Atualiza para changes em B |

### Diffing

```js
import {diff, presentableDiff} from "@codemirror/merge"

diff(a: string, b: string, config?: DiffConfig): Change[]
presentableDiff(a: string, b: string, config?: DiffConfig): Change[]
```

#### `interface DiffConfig`

| Membro | Tipo | Descrição |
|--------|------|-----------|
| `scanLimit?` | `number` | Limite de diff computation |
| `timeout?` | `number` | Timeout em ms |
| `override?` | `fn(a, b)` | Algoritmo customizado |

---

## 13. Reference Manual — codemirror (bundle)

### `basicSetup: Extension`

Bundle de extensões que inclui:
- Default command bindings
- Line numbers
- Special character highlighting
- Undo history
- Fold gutter
- Custom selection drawing
- Drop cursor
- Multiple selections
- Reindentation on input
- Default highlight style
- Bracket matching
- Bracket closing
- Autocompletion
- Rectangular selection and crosshair cursor
- Active line highlighting
- Active line gutter highlighting
- Selection match highlighting
- Search
- Linting

### `minimalSetup: Extension`

Conjunto mínimo:
- Default keymap
- Undo history
- Special character highlighting
- Custom selection drawing
- Default highlight style

---

## 14. Lista de Extensions Core

> Fonte: https://codemirror.net/docs/extensions/

### Edição — Whitespace

| Extension | Descrição |
|-----------|-----------|
| `EditorState.tabSize` | Tamanho do tab em espaços |
| `EditorState.lineSeparator` | Separador de linha customizado |
| `indentUnit` | Whitespace de indentação |
| `indentOnInput` | Reindentação em certos inputs |

### Edição — Read-only

| Extension | Descrição |
|-----------|-----------|
| `EditorView.editable` | Comportamento editável (cursor, etc.) |
| `EditorState.readOnly` | Proibe comandos de edição |

### Edição — Helpers

| Extension | Descrição |
|-----------|-----------|
| `EditorState.allowMultipleSelections` | Múltiplas seleções |
| `autocompletion` | Sugestões de completação |
| `closeBrackets` | Fecha brackets automaticamente |
| `codeFolding` | Dobramento de código |
| `atomicRanges` | Ranges atômicos (cursor pula) |
| `history` | Undo/redo |
| `search` | Painel de busca |

### Apresentação — Estilos

| Extension | Descrição |
|-----------|-----------|
| `EditorView.theme` | Tema customizado |
| `EditorView.baseTheme` | Base theme para extensões |
| `EditorView.styleModule` | Módulo CSS |
| `EditorView.editorAttributes` | Atributos do wrapper |
| `EditorView.contentAttributes` | Atributos do content |
| `EditorView.decorations` | Decorações de conteúdo |

### Apresentação — Features

| Extension | Descrição |
|-----------|-----------|
| `drawSelection` | Desenha seleção customizada |
| `EditorView.lineWrapping` | Line wrapping |
| `highlightActiveLine` | Destaca linha com cursor |
| `highlightSpecialChars` | Substitui chars não-imprimíveis |
| `scrollPastEnd` | Scroll além do fim |
| `bracketMatching` | Destaca bracket correspondente |
| `highlightSelectionMatches` | Destaca matches da seleção |
| `placeholder` | Texto placeholder |
| `EditorState.phrases` | Tradução de frases da UI |

### Apresentação — Gutters

| Extension | Descrição |
|-----------|-----------|
| `lineNumbers` | Numeração de linhas |
| `foldGutter` | Indicadores de fold |
| `lintGutter` | Erros de lint |
| `gutters` | Configuração de gutters |
| `highlightActiveLineGutter` | Destaca gutter da linha ativa |
| `gutter` | Gutter customizado |

### Apresentação — Tooltips

| Extension | Descrição |
|-----------|-----------|
| `tooltips` | Configura tooltips |
| `hoverTooltip` | Tooltip em hover |

### Input Handling

| Extension | Descrição |
|-----------|-----------|
| `EditorView.domEventHandlers` | Handlers de eventos DOM |
| `dropCursor` | Cursor de drop |
| `keymap` | Registro de keymaps |
| `EditorView.inputHandler` | Intercepta input |
| `EditorView.mouseSelectionStyle` | Estilo de seleção por mouse |
| `rectangularSelection` | Seleção retangular (Alt+drag) |
| `crosshairCursor` | Cursor crosshair com Alt |

### Language

| Extension | Descrição |
|-----------|-----------|
| `Language` | Seleciona a linguagem |
| `Language.data` | Dados da linguagem |
| `syntaxHighlighting` | Estilo de highlighting |
| `foldService` | Fonte de folding |
| `indentService` | Fonte de auto-indentação |
| `linter` | Registra linter |

### Primitivos

| Extension | Descrição |
|-----------|-----------|
| `StateField` | Campo de estado customizado |
| `ViewPlugin` | Plugin imperativo da view |
| `EditorView.exceptionSink` | Captura exceções |
| `EditorView.updateListener` | Listener de updates |
| `EditorState.changeFilter` | Filtra mudanças |
| `EditorState.transactionFilter` | Filtra transações |
| `EditorState.transactionExtender` | Estende transações |

### Bundles

| Extension | Descrição |
|-----------|-----------|
| `basicSetup` | Setup completo |
| `minimalSetup` | Setup mínimo |

---

## 15. Guia de Migração (v5 → v6)

> Fonte: https://codemirror.net/docs/migration/

### Sistema de Módulos

- v5: UMD, `<script>` tags ou CommonJS
- v6: **ES6 modules** — necessário bundler (Rollup, Vite, etc.)
- Dividido em pacotes `@codemirror/*`
- Linguagens em pacotes separados (`@codemirror/lang-javascript`, etc.)
- Modos do v5 disponíveis via `@codemirror/legacy-modes`

### Criando um Editor

```js
// v5
let cm = CodeMirror(document.body, {mode: "javascript", value: "..."})

// v6
import {EditorView, keymap} from "@codemirror/view"
import {defaultKeymap, history, historyKeymap} from "@codemirror/commands"
import {syntaxHighlighting, defaultHighlightStyle} from "@codemirror/language"
import {javascript} from "@codemirror/lang-javascript"

let view = new EditorView({
  extensions: [
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    javascript(),
    syntaxHighlighting(defaultHighlightStyle),
  ],
  parent: document.body
})
```

### Posições

```js
// v5: {line, ch}
// v6: offset numérico

// Conversão:
function posToOffset(doc, pos) {
  return doc.line(pos.line + 1).from + pos.ch
}
function offsetToPos(doc, offset) {
  let line = doc.lineAt(offset)
  return {line: line.number - 1, ch: offset - line.from}
}

// Nota: v6 linhas começam em 1, v5 em 0
```

### Leitura do Documento e Seleção

```js
// v5 → v6
cm.getValue()            → cm.state.doc.toString()
cm.getRange(a, b)        → cm.state.sliceDoc(a, b)
cm.getLine(n)            → cm.state.doc.line(n + 1).text
cm.lineCount()           → cm.state.doc.lines
cm.getCursor()           → cm.state.selection.main.head
cm.listSelections()      → cm.state.selection.ranges
cm.getSelection()        → cm.state.sliceDoc(cm.state.selection.main.from, cm.state.selection.main.to)
cm.somethingSelected()   → cm.state.selection.ranges.some(r => !r.empty)
```

### Fazendo Mudanças

```js
// v5 → v6
cm.replaceRange(text, from, to)  → cm.dispatch({changes: {from, to, insert: text}})
cm.setValue(text)                → cm.dispatch({changes: {from: 0, to: cm.state.doc.length, insert: text}})
cm.replaceSelection(text)        → cm.dispatch(cm.state.replaceSelection(text))

// Seleção
cm.setCursor(pos)                → cm.dispatch({selection: {anchor: pos}})
cm.setSelection(anchor, head)    → cm.dispatch({selection: {anchor, head}})
cm.setSelections(ranges)         → cm.dispatch({selection: EditorSelection.create(ranges)})
```

### Estrutura DOM

```
// v5      →  v6
CodeMirror       → cm-editor
CodeMirror-line  → cm-line
CodeMirror-scroll → cm-scroller
CodeMirror-sizer → cm-content
CodeMirror-focused → cm-focused
CodeMirror-gutters → cm-gutters
CodeMirror-gutter  → cm-gutter
CodeMirror-gutter-elt → cm-gutterElement

cm.focus()            → cm.focus()
cm.hasFocus()         → cm.hasFocus
cm.getWrapperElement() → cm.dom
cm.getScrollerElement() → cm.scrollDOM
cm.getInputField()    → cm.contentDOM
```

### Configuração

```js
// v5: opções nomeadas
let cm = CodeMirror(el, {tabSize: 2})

// v6: extensões em compartimentos
import {Compartment} from "@codemirror/state"
let tabSize = new Compartment

let view = new EditorView({
  extensions: [tabSize.of(EditorState.tabSize.of(2))],
})

function setTabSize(size) {
  view.dispatch({
    effects: tabSize.reconfigure(EditorState.tabSize.of(size))
  })
}
```

### Eventos → Transações e State Fields

```js
// v5
cm.on("change", (cm, change) => { ... })

// v6: state field (para estado)
const myField = StateField.define({
  create() { return initialValue },
  update(value, tr) { return computeNewValue(value, tr) }
})

// v6: update listener (para side effects)
EditorView.updateListener.of(update => {
  if (update.docChanged) { ... }
})

// v6: view plugin (para effects na view)
ViewPlugin.fromClass(class {
  update(update) { ... }
})
```

### Comandos

```js
// v5: registro central
CodeMirror.commands.myCommand = function(cm) { ... }

// v6: funções simples
function myCommand(view) {
  // ...
  return true  // se executado
}
keymap.of([{key: "Ctrl-m", run: myCommand}])
```

### Marked Text → Decorations

```js
// v5
let mark = cm.markText(from, to, {className: "highlight"})
mark.clear()

// v6
const addMarks = StateEffect.define()
const filterMarks = StateEffect.define()
const markField = StateField.define({
  create() { return Decoration.none },
  update(value, tr) {
    value = value.map(tr.changes)
    for (let effect of tr.effects) {
      if (effect.is(addMarks)) value = value.update({add: effect.value, sort: true})
      else if (effect.is(filterMarks)) value = value.update({filter: effect.value})
    }
    return value
  },
  provide: f => EditorView.decorations.from(f)
})

// Adicionar:
const strikeMark = Decoration.mark({attributes: {style: "text-decoration: line-through"}})
view.dispatch({effects: addMarks.of([strikeMark.range(1, 4)])})

// Remover:
view.dispatch({effects: filterMarks.of((from, to) => to <= a || from >= b)})
```

### CodeMirror.fromTextArea

```js
// Equivalente v6:
function editorFromTextArea(textarea, extensions) {
  let view = new EditorView({doc: textarea.value, extensions})
  textarea.parentNode.insertBefore(view.dom, textarea)
  textarea.style.display = "none"
  if (textarea.form) textarea.form.addEventListener("submit", () => {
    textarea.value = view.state.doc.toString()
  })
  return view
}
```

---

## Links Adicionais

- [Site oficial](https://codemirror.net/)
- [Exemplos](https://codemirror.net/examples/)
- [Documentação](https://codemirror.net/docs/)
- [Playground](https://codemirror.net/try/)
- [Fórum](https://discuss.codemirror.net/)
- [GitHub](https://github.com/codemirror/dev/)
- [Changelog](https://codemirror.net/docs/changelog/)
- [CodeMirror 5](https://codemirror.net/5/)
- [Comunidade/Pacotes](https://codemirror.net/docs/community/)
