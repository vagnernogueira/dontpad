import { ViewPlugin, Decoration, WidgetType, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder, EditorSelection } from "@codemirror/state"
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

// --- Horizontal Rule Widget ---
class HorizontalRuleWidget extends WidgetType {
    constructor() {
        super()
    }

    eq(_other: HorizontalRuleWidget) {
        return true
    }

    toDOM() {
        const wrap = document.createElement("div")
        wrap.style.display = "block"
        wrap.style.width = "100%"
        wrap.style.margin = "0"
        wrap.style.padding = "0"
        wrap.style.backgroundColor = "transparent"
        
        const hr = document.createElement("hr")
        hr.style.border = "none"
        hr.style.borderTop = "1px solid #dfe2e5"
        hr.style.margin = "8px 0"
        hr.style.padding = "0"
        hr.style.height = "0"
        hr.style.width = "100%"
        
        wrap.appendChild(hr)
        return wrap
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

function buildListDecorations(view: EditorView) {
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

function buildHorizontalRuleDecorations(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>()
  
  for (const { from, to } of view.visibleRanges) {
    let line = view.state.doc.lineAt(from)

    while (line.from <= to) {
      const lineText = line.text.trim()
      
      // Check if line contains only --- or ___ or *** (at least 3 characters)
      if (/^(-{3,}|_{3,}|\*{3,})$/.test(lineText)) {
        // Replace the entire line content with the horizontal rule widget
        const startPos = line.from
        const endPos = line.to
        
        builder.add(startPos, endPos, Decoration.replace({
          widget: new HorizontalRuleWidget()
        }))
      }

      if (line.to >= to) break
      line = view.state.doc.line(line.number + 1)
    }
  }

  return builder.finish()
}

// --- List Custom Plugin ---
export const listCustomPlugin = ViewPlugin.fromClass(
  class {
    decorations

    constructor(view: EditorView) {
      this.decorations = buildListDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildListDecorations(update.view)
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

// --- Horizontal Rule Plugin ---
export const horizontalRulePlugin = ViewPlugin.fromClass(
  class {
    decorations

    constructor(view: EditorView) {
      this.decorations = buildHorizontalRuleDecorations(view)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildHorizontalRuleDecorations(update.view)
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations
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

// --- Delete Line Keymap (Ctrl+L) ---
export const deleteLineKeymap = keymap.of([
  {
    key: 'Ctrl-l',
    run: (editorView: EditorView) => {
      const { state } = editorView
      const selection = state.selection.main
      const pos = selection.from
      const line = state.doc.lineAt(pos)
      console.log('[delete-line] triggered', {
        pos,
        lineNumber: line.number,
        lineFrom: line.from,
        lineTo: line.to,
        lineText: line.text
      })
      
      // Calculate the range to delete
      // If this is not the last line, include the newline character after the line
      // If this is the last line, include the newline before (if it exists)
      let deleteFrom = line.from
      let deleteTo = line.to
      
      if (line.number < state.doc.lines) {
        // Not the last line: delete line + newline after it
        deleteTo = line.to + 1
      } else if (line.number > 1) {
        // Last line and not the only line: delete newline before + line
        deleteFrom = line.from - 1
      }
      
      // Calculate new cursor position
      // Place cursor at the beginning of the next line, or at the beginning of the previous line if we deleted the last line
      let newPos = deleteFrom
      if (deleteFrom > 0 && line.number === state.doc.lines && line.number > 1) {
        // If we deleted the last line, put cursor at the end of the previous line
        newPos = deleteFrom
      }
      
      editorView.dispatch({
        changes: { from: deleteFrom, to: deleteTo },
        selection: { anchor: newPos }
      })

      console.log('[delete-line] applied', {
        deleteFrom,
        deleteTo,
        newPos
      })
      
      return true
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

// --- Triple/Quadruple Click Plugin ---
// Triple click: select entire line
// Quadruple click: select entire paragraph

/**
 * Helper function to find paragraph boundaries
 * A paragraph is delimited by empty lines or start/end of document
 */
function findParagraphBounds(view: EditorView, pos: number): { from: number, to: number } {
    const doc = view.state.doc
    const line = doc.lineAt(pos)
    
    // Find start of paragraph (go up until we hit an empty line or start of doc)
    let startLine = line
    while (startLine.number > 1) {
        const prevLine = doc.line(startLine.number - 1)
        if (prevLine.text.trim() === '') {
            break
        }
        startLine = prevLine
    }
    
    // Find end of paragraph (go down until we hit an empty line or end of doc)
    let endLine = line
    while (endLine.number < doc.lines) {
        const nextLine = doc.line(endLine.number + 1)
        if (nextLine.text.trim() === '') {
            break
        }
        endLine = nextLine
    }
    
    return { from: startLine.from, to: endLine.to }
}

export const multiClickPlugin = ViewPlugin.fromClass(
    class {
        lastClickTime = 0
        lastClickPos = -1
        clickCount = 0
        clickTimeout: number | null = null

        constructor(readonly view: EditorView) {
            // Add click listener to the editor's content DOM
            const contentDom = view.contentDOM
            contentDom.addEventListener('click', this.handleClick, true)
        }

        handleClick = (event: MouseEvent) => {
            const now = Date.now()
            const pos = this.view.posAtCoords({ x: event.clientX, y: event.clientY })
            
            if (pos === null) return

            console.log('[multi-click] click event', {
                timestamp: now,
                clientX: event.clientX,
                clientY: event.clientY,
                pos,
                lastClickTime: this.lastClickTime,
                timeDiff: now - this.lastClickTime
            })

            // Reset if click is more than 400ms apart or in a different position
            if (now - this.lastClickTime > 400 || Math.abs(pos - this.lastClickPos) > 5) {
                this.clickCount = 1
                console.log('[multi-click] reset counter (new sequence)')
            } else {
                this.clickCount++
                console.log('[multi-click] increment counter', { clickCount: this.clickCount })
            }

            this.lastClickTime = now
            this.lastClickPos = pos

            // Clear previous timeout
            if (this.clickTimeout !== null) {
                clearTimeout(this.clickTimeout)
            }

            // Set timeout to process multi-click after a brief delay
            this.clickTimeout = window.setTimeout(() => {
                console.log('[multi-click] processing', { clickCount: this.clickCount, pos })

                // Triple click (3 clicks)
                if (this.clickCount === 3) {
                    event.preventDefault()
                    event.stopPropagation()

                    const line = this.view.state.doc.lineAt(pos)
                    console.log('[multi-click] triple action', {
                        lineNumber: line.number,
                        lineFrom: line.from,
                        lineTo: line.to,
                        lineText: line.text
                    })

                    this.view.dispatch({
                        selection: EditorSelection.single(line.from, line.to)
                    })
                }

                // Quadruple click (4 clicks)
                if (this.clickCount === 4) {
                    event.preventDefault()
                    event.stopPropagation()

                    const { from, to } = findParagraphBounds(this.view, pos)
                    console.log('[multi-click] quadruple action', {
                        from,
                        to
                    })

                    this.view.dispatch({
                        selection: EditorSelection.single(from, to)
                    })
                }

                this.clickTimeout = null
            }, 150)
        }

        destroy() {
            const contentDom = this.view.contentDOM
            contentDom.removeEventListener('click', this.handleClick, true)
            if (this.clickTimeout !== null) {
                clearTimeout(this.clickTimeout)
            }
        }
    }
)

// --- Plain URL Detection and Styling Plugin ---

function buildPlainUrlDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()
    
    // Regex para detectar URLs (http://, https://, www., ftp://, etc.)
    const urlRegex = /\b(https?:\/\/|www\.|ftp:\/\/)[^\s<>"\[\](){}]+/gi
    
    for (let { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        
        // Primeiro, vamos encontrar todas as posições de links markdown para evitá-las
        const markdownLinkRegex = /!?\[[^\]]*\]\([^)]+\)/g
        const markdownLinkRanges: Array<{ from: number, to: number }> = []
        let mdMatch
        while ((mdMatch = markdownLinkRegex.exec(text))) {
            markdownLinkRanges.push({
                from: mdMatch.index,
                to: mdMatch.index + mdMatch[0].length
            })
        }
        
        // Agora vamos encontrar URLs avulsas e aplicar decoração
        let match
        urlRegex.lastIndex = 0 // Reset regex
        while ((match = urlRegex.exec(text))) {
            const urlStart = match.index
            const urlEnd = match.index + match[0].length
            
            // Verifica se esta URL está dentro de um link markdown
            const isInsideMarkdownLink = markdownLinkRanges.some(
                range => urlStart >= range.from && urlEnd <= range.to
            )
            
            // Se não está dentro de um link markdown, aplica a decoração
            if (!isInsideMarkdownLink) {
                builder.add(
                    from + urlStart,
                    from + urlEnd,
                    Decoration.mark({
                        class: 'cm-plain-url',
                        attributes: {
                            style: 'color: #0969da; text-decoration: underline;'
                        }
                    })
                )
            }
        }
    }
    
    return builder.finish()
}

export const plainUrlPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet
        
        constructor(view: EditorView) {
            this.decorations = buildPlainUrlDecorations(view)
        }
        
        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = buildPlainUrlDecorations(update.view)
            }
        }
    },
    {
        decorations: (plugin) => plugin.decorations
    }
)

// --- Ctrl+Click Navigation Plugin ---

export const ctrlClickNavigationPlugin = ViewPlugin.fromClass(
    class {
        ctrlPressed = false
        currentPos: number | null = null
        hoverDecoration: DecorationSet = Decoration.none
        
        constructor(readonly view: EditorView) {
            // Listen for keyboard events
            document.addEventListener('keydown', this.handleKeyDown)
            document.addEventListener('keyup', this.handleKeyUp)
            
            // Listen for mouse events on the editor
            view.dom.addEventListener('mousemove', this.handleMouseMove)
            view.dom.addEventListener('mouseleave', this.handleMouseLeave)
            view.dom.addEventListener('click', this.handleClick)
        }
        
        handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                this.ctrlPressed = true
                this.updateHoverDecoration()
            }
        }
        
        handleKeyUp = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) {
                this.ctrlPressed = false
                this.updateHoverDecoration()
            }
        }
        
        handleMouseMove = (e: MouseEvent) => {
            const pos = this.view.posAtCoords({ x: e.clientX, y: e.clientY })
            if (pos !== this.currentPos) {
                this.currentPos = pos
                this.updateHoverDecoration()
            }
        }
        
        handleMouseLeave = () => {
            this.currentPos = null
            this.updateHoverDecoration()
        }
        
        handleClick = (e: MouseEvent) => {
            if (!this.ctrlPressed && !e.ctrlKey && !e.metaKey) return
            
            const pos = this.view.posAtCoords({ x: e.clientX, y: e.clientY })
            if (pos === null) return
            
            const url = this.findUrlAtPosition(pos)
            if (url) {
                e.preventDefault()
                e.stopPropagation()
                
                // Ensure URL has protocol
                let fullUrl = url
                if (url.startsWith('www.')) {
                    fullUrl = 'https://' + url
                } else if (!url.match(/^[a-z]+:\/\//i)) {
                    fullUrl = 'https://' + url
                }
                
                window.open(fullUrl, '_blank', 'noopener,noreferrer')
            }
        }
        
        private updateHoverDecoration() {
            if (this.ctrlPressed && this.currentPos !== null) {
                const url = this.findUrlAtPosition(this.currentPos)
                if (url) {
                    // Find the exact range of the URL
                    const range = this.findUrlRangeAtPosition(this.currentPos)
                    if (range) {
                        const builder = new RangeSetBuilder<Decoration>()
                        builder.add(
                            range.from,
                            range.to,
                            Decoration.mark({
                                class: 'cm-ctrl-hover-link',
                                attributes: {
                                    style: 'cursor: pointer;'
                                }
                            })
                        )
                        this.hoverDecoration = builder.finish()
                        this.view.update([])
                        return
                    }
                }
            }
            
            // Clear decoration if not hovering over a link with Ctrl
            if (this.hoverDecoration.size > 0) {
                this.hoverDecoration = Decoration.none
                this.view.update([])
            }
        }
        
        private findUrlAtPosition(pos: number): string | null {
            const doc = this.view.state.doc
            const line = doc.lineAt(pos)
            const lineText = line.text
            const posInLine = pos - line.from
            
            // Check for markdown links [text](url)
            const markdownLinkRegex = /!?\[([^\]]*)\]\(([^)]+)\)/g
            let match
            while ((match = markdownLinkRegex.exec(lineText))) {
                const matchStart = match.index
                const matchEnd = match.index + match[0].length
                if (posInLine >= matchStart && posInLine <= matchEnd) {
                    return match[2] // Return the URL part
                }
            }
            
            // Check for plain URLs
            const urlRegex = /\b(https?:\/\/|www\.|ftp:\/\/)[^\s<>"\[\](){}]+/gi
            urlRegex.lastIndex = 0
            while ((match = urlRegex.exec(lineText))) {
                const matchStart = match.index
                const matchEnd = match.index + match[0].length
                if (posInLine >= matchStart && posInLine <= matchEnd) {
                    return match[0]
                }
            }
            
            return null
        }
        
        private findUrlRangeAtPosition(pos: number): { from: number, to: number } | null {
            const doc = this.view.state.doc
            const line = doc.lineAt(pos)
            const lineText = line.text
            const posInLine = pos - line.from
            
            // Check for markdown links [text](url)
            const markdownLinkRegex = /!?\[([^\]]*)\]\(([^)]+)\)/g
            let match
            while ((match = markdownLinkRegex.exec(lineText))) {
                const matchStart = match.index
                const matchEnd = match.index + match[0].length
                if (posInLine >= matchStart && posInLine <= matchEnd) {
                    return {
                        from: line.from + matchStart,
                        to: line.from + matchEnd
                    }
                }
            }
            
            // Check for plain URLs
            const urlRegex = /\b(https?:\/\/|www\.|ftp:\/\/)[^\s<>"\[\](){}]+/gi
            urlRegex.lastIndex = 0
            while ((match = urlRegex.exec(lineText))) {
                const matchStart = match.index
                const matchEnd = match.index + match[0].length
                if (posInLine >= matchStart && posInLine <= matchEnd) {
                    return {
                        from: line.from + matchStart,
                        to: line.from + matchEnd
                    }
                }
            }
            
            return null
        }
        
        update(update: ViewUpdate) {
            // Update on any change that might affect link positions
            if (update.docChanged) {
                this.updateHoverDecoration()
            }
        }
        
        destroy() {
            document.removeEventListener('keydown', this.handleKeyDown)
            document.removeEventListener('keyup', this.handleKeyUp)
            this.view.dom.removeEventListener('mousemove', this.handleMouseMove)
            this.view.dom.removeEventListener('mouseleave', this.handleMouseLeave)
            this.view.dom.removeEventListener('click', this.handleClick)
        }
    },
    {
        decorations: (plugin) => plugin.hoverDecoration
    }
)
