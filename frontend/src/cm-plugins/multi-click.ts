/**
 * Multi Click Plugin
 * 
 * Este plugin estende o comportamento de cliques múltiplos no editor:
 * - Triple click (3 cliques): seleciona a linha inteira
 * - Quadruple click (4 cliques): seleciona o parágrafo inteiro
 * 
 * Funcionalidades:
 * - Detecta sequências de cliques rápidos
 * - Triple click: seleciona linha completa
 * - Quadruple click: seleciona parágrafo (delimitado por linhas vazias)
 * - Timeout de 400ms para resetar contagem de cliques
 */

import { ViewPlugin, EditorView } from "@codemirror/view"
import { EditorSelection } from "@codemirror/state"

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

/**
 * Plugin do CodeMirror para múltiplos cliques
 */
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
