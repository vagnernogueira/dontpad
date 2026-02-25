/**
 * Code Block Plugin
 * 
 * Este plugin detecta blocos de código delimitados por ``` (code fences)
 * e aplica estilos especiais para diferenciá-los do texto normal.
 * 
 * Funcionalidades:
 * - Detecta abertura e fechamento de blocos de código (```)
 * - Aplica classes CSS diferentes para marcadores e conteúdo
 * - Rastreia estado de bloco de código através do documento
 * - Suporta especificação de linguagem após ```
 */

import { ViewPlugin, Decoration, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"

/**
 * Constrói decorações para blocos de código
 */
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

/**
 * Plugin do CodeMirror para estilização de blocos de código
 */
export const codeBlockPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet

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
