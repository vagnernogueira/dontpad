/**
 * Horizontal Rule Plugin
 * 
 * Este plugin detecta linhas horizontais em Markdown (---, ___, ***)
 * e as renderiza visualmente como elementos <hr> no editor.
 * 
 * Funcionalidades:
 * - Detecta padrões ---, ___, ou *** (mínimo 3 caracteres)
 * - Substitui a linha de texto por um elemento <hr> visual
 * - Mantém o texto original no documento para compatibilidade
 */

import { ViewPlugin, Decoration, WidgetType, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"

/**
 * Widget que renderiza uma linha horizontal (<hr>)
 */
class HorizontalRuleWidget extends WidgetType {
    constructor() {
        super()
    }

    eq(_other: HorizontalRuleWidget) {
        return true
    }

    toDOM() {
        const wrap = document.createElement("div")
        wrap.className = "cm-hr-widget"
        
        const hr = document.createElement("hr")
        hr.className = "cm-hr-widget-line"
        
        wrap.appendChild(hr)
        return wrap
    }
}

/**
 * Constrói decorações para linhas horizontais
 */
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

/**
 * Plugin do CodeMirror que renderiza linhas horizontais
 */
export const horizontalRulePlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet

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
