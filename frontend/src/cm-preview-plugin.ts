import { ViewPlugin, Decoration, WidgetType, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { keymap } from "@codemirror/view"

// --- Image Widget ---
class ImageWidget extends WidgetType {
    constructor(readonly url: string) {
        super()
    }

    eq(other: ImageWidget) {
        return this.url === other.url
    }

    toDOM() {
        const wrap = document.createElement("div")
        wrap.style.display = "block"
        wrap.style.marginTop = "0.5rem"
        wrap.style.marginBottom = "0.5rem"

        const img = document.createElement("img")
        img.src = this.url
        img.style.maxHeight = "250px"
        img.style.maxWidth = "100%"
        img.style.borderRadius = "0.375rem" // Tailwind rounded-md
        img.style.boxShadow = "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" // shadow
        img.style.objectFit = "contain"
        img.style.backgroundColor = "#f3f4f6" // gray-100 placeholder background

        // Handle broken images gracefully
        img.onerror = () => {
            img.style.display = "none"
            const errorMsg = document.createElement("span")
            errorMsg.textContent = " ⚠️ Imagem não carregada"
            errorMsg.style.color = "#dc2626"
            errorMsg.style.fontSize = "0.875rem"
            wrap.appendChild(errorMsg)
        }

        wrap.appendChild(img)
        return wrap
    }
}

// --- Link Widget ---
class LinkWidget extends WidgetType {
    constructor(readonly url: string) {
        super()
    }

    eq(other: LinkWidget) {
        return this.url === other.url
    }

    toDOM() {
        const link = document.createElement("a")
        link.href = this.url
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        link.title = `Abrir: ${this.url}`
        link.innerHTML = " 🔗 "
        link.style.textDecoration = "none"
        link.style.fontSize = "0.9em"
        link.style.cursor = "pointer"
        // Stop propagation so clicking the link doesn't move the CodeMirror cursor
        link.onmousedown = (e) => e.stopPropagation()
        return link
    }
}

// --- Helper Functions ---

function buildImageDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()
    for (let { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        const regex = /!\[.*?\]\(([^)]+)\)/g
        let match
        while ((match = regex.exec(text))) {
            const pos = from + match.index + match[0].length
            builder.add(pos, pos, Decoration.widget({
                widget: new ImageWidget(match[1]),
                side: 1
            }))
        }
    }
    return builder.finish()
}

function buildLinkDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()
    for (let { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        const regex = /!?\[.*?\]\(([^)]+)\)/g
        let match
        while ((match = regex.exec(text))) {
            // Skip if it's an image
            if (match[0].startsWith('!')) continue

            const pos = from + match.index + match[0].length
            builder.add(pos, pos, Decoration.widget({
                widget: new LinkWidget(match[1]),
                side: 1
            }))
        }
    }
    return builder.finish()
}

const listLineRegex = /^\s{0,3}(?:[-+*]|\d+[.)])\s+/

function buildListIndentDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>()

  for (const { from, to } of view.visibleRanges) {
    let line = view.state.doc.lineAt(from)

    while (line.from <= to) {
      if (listLineRegex.test(line.text)) {
        builder.add(line.from, line.from, Decoration.line({ class: 'cm-list-line' }))
      }

      if (line.to >= to) break
      line = view.state.doc.line(line.number + 1)
    }
  }

  return builder.finish()
}

function buildCodeBlockDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>()
  const doc = view.state.doc

  // Track code block state across the entire document
  let inCodeBlock = false

  for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
    const line = doc.line(lineNum)
    const lineText = line.text
    
    // Check if this line is in visible range
    const isVisible = view.visibleRanges.some(
      range => line.from <= range.to && line.to >= range.from
    )
    
    // Toggle code block state when we encounter exactly 3 backticks
    // Must match: (optional spaces) + ``` + (optional language)
    if (/^\s*```/.test(lineText)) {
      if (!inCodeBlock) {
        inCodeBlock = true
        if (isVisible) {
          builder.add(line.from, line.from, Decoration.line({ class: 'cm-code-block-marker' }))
        }
      } else {
        inCodeBlock = false
        if (isVisible) {
          builder.add(line.from, line.from, Decoration.line({ class: 'cm-code-block-marker' }))
        }
      }
    } else if (inCodeBlock && isVisible) {
      // Lines inside code block (only decorate if visible)
      builder.add(line.from, line.from, Decoration.line({ class: 'cm-code-block-line' }))
    }
  }

  return builder.finish()
}

// --- List Indent Plugin ---
export const listIndentPlugin = ViewPlugin.fromClass(
  class {
    decorations

    constructor(view: EditorView) {
      this.decorations = buildListIndentDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildListIndentDecorations(update.view)
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations
  }
)

// --- Code Block Plugin ---
export const codeBlockPlugin = ViewPlugin.fromClass(
  class {
    decorations

    constructor(view: EditorView) {
      this.decorations = buildCodeBlockDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildCodeBlockDecorations(update.view)
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations
  }
)

// --- Auto-indent Lists Plugin ---
export const autoIndentListPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {
      if (!update.docChanged) return

      update.changes.iterChanges((_fromA, _toA, fromB, _toB, text) => {
        // Only process single character insertions
        if (text.length !== 1) return

        const char = text.toString()[0]
        // Check if it's a list/quote marker
        if (!['-', '*', '+', '1', '2', '3', '4', '5', '6', '7', '8', '9', '>', '#'].includes(char)) return

        const state = update.view.state
        const line = state.doc.lineAt(fromB)
        const lineText = line.text
        const posInLine = fromB - line.from

        // Get text before cursor position
        const beforeCursor = lineText.slice(0, posInLine)
        // Only process if at line start (only whitespace before)
        if (!/^\s*$/.test(beforeCursor)) return

        // For list markers (-, *, +) at line start
        if (['-', '*', '+'].includes(char)) {
          const leadingSpaces = beforeCursor.match(/^(\s*)/)?.[1]?.length || 0
          if (leadingSpaces < 4) {
            const spacesToAdd = 4 - leadingSpaces
            update.view.dispatch({
              changes: { from: line.from, insert: ' '.repeat(spacesToAdd) }
            })
          }
        }
        // NOTE: Blockquotes (>) should NOT have 4 spaces indentation
        // In Markdown, 4 spaces = code block. Blockquotes must have 0-3 spaces.
      })
    }
  }
)

// --- Custom Tab Keymap ---
export const customTabKeymap = keymap.of([
  {
    key: 'Tab',
    run: (editorView: EditorView) => {
      const { state } = editorView
      const selection = state.selection.main

      // If there's a selection, indent all selected lines
      if (!selection.empty) {
        const changes: any[] = []
        let currentLine = state.doc.lineAt(selection.from)
        const endLine = state.doc.lineAt(selection.to)
        let offset = 0

        // Add 4 spaces to the beginning of each selected line
        while (currentLine.number <= endLine.number) {
          changes.push({ from: currentLine.from, insert: '    ' })
          offset += 4
          if (currentLine.number === endLine.number) break
          currentLine = state.doc.line(currentLine.number + 1)
        }

        // Dispatch changes and preserve expanded selection
        editorView.dispatch({
          changes: changes,
          selection: { anchor: selection.from + 4, head: selection.to + offset }
        })
        return true
      }

      // No selection: insert 4 spaces at cursor or before word
      const pos = selection.from
      const line = state.doc.lineAt(pos)
      const lineText = line.text
      const posInLine = pos - line.from

      // Check characters before and after cursor
      const charBefore = lineText[posInLine - 1] || ' '
      const charAfter = lineText[posInLine] || ' '

      // Regex to detect word characters
      const wordCharRegex = /\w/

      // If cursor is inside a word or touching a word, insert before the word
      if (wordCharRegex.test(charBefore) || wordCharRegex.test(charAfter)) {
        // Find the start of the word
        let wordStart = posInLine
        while (wordStart > 0 && wordCharRegex.test(lineText[wordStart - 1])) {
          wordStart--
        }

        // Insert 4 spaces before the word
        editorView.dispatch({
          changes: { from: line.from + wordStart, insert: '    ' },
          selection: { anchor: pos + 4 }
        })
      } else {
        // Insert 4 spaces at cursor position
        editorView.dispatch({
          changes: { from: pos, insert: '    ' },
          selection: { anchor: pos + 4 }
        })
      }

      return true
    }
  }
])

// --- Enter Keymap (maintain list/quote formatting) ---
export const enterKeymap = keymap.of([
  {
    key: 'Enter',
    run: (editorView: EditorView) => {
      const { state } = editorView
      const selection = state.selection.main
      const pos = selection.from
      const line = state.doc.lineAt(pos)
      const lineText = line.text

      // Match list markers or blockquotes at the start of current line
      const listMatch = lineText.match(/^(\s*)([-*+]|(\d+)[.)])(\s+)/)
      const quoteMatch = lineText.match(/^(\s{0,3})(>)(\s+)/)

      if (listMatch) {
        // List item: maintain format on new line
        const indent = listMatch[1]
        const marker = listMatch[2]
        const space = listMatch[4]
        const newLineContent = `\n${indent}${marker}${space}`
        
        editorView.dispatch({
          changes: { from: pos, insert: newLineContent },
          selection: { anchor: pos + newLineContent.length }
        })
        return true
      } else if (quoteMatch) {
        // Blockquote: maintain format on new line (0-3 spaces, NOT 4)
        const indent = quoteMatch[1]
        const marker = quoteMatch[2]
        const space = quoteMatch[3]
        const newLineContent = `\n${indent}${marker}${space}`
        
        editorView.dispatch({
          changes: { from: pos, insert: newLineContent },
          selection: { anchor: pos + newLineContent.length }
        })
        return true
      }

      // No special formatting, use default Enter behavior
      return false
    }
  }
])

// --- Image & Link Preview Plugins ---
export const markdownPreviewPlugin = [
    ViewPlugin.fromClass(
        class {
            decorations: DecorationSet
            constructor(view: EditorView) {
                this.decorations = buildImageDecorations(view)
            }
            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = buildImageDecorations(update.view)
                }
            }
        },
        {
            decorations: (v: any) => v.decorations
        }
    ),
    ViewPlugin.fromClass(
        class {
            decorations: DecorationSet
            constructor(view: EditorView) {
                this.decorations = buildLinkDecorations(view)
            }
            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = buildLinkDecorations(update.view)
                }
            }
        },
        {
            decorations: (v: any) => v.decorations
        }
    )
]
