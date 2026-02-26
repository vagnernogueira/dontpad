/**
 * Horizontal Rule Plugin
 * 
 * Este plugin detecta linhas horizontais em Markdown (---, ___, ***)
 * e as renderiza visualmente como elementos <hr> no editor.
 * 
 * Funcionalidades:
 * - Usa syntax tree do Markdown para detectar horizontal rules
 * - Substitui a linha de texto por um elemento <hr> visual
 * - Mantém o texto original no documento para compatibilidade
 */

import { ViewPlugin, Decoration, WidgetType, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { syntaxTree } from "@codemirror/language"

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
 * Constrói decorações para linhas horizontais usando a syntax tree
 */
function buildHorizontalRuleDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()
    const tree = syntaxTree(view.state)

    for (const { from, to } of view.visibleRanges) {
        tree.iterate({
            from,
            to,
            enter: (node) => {
                // HorizontalRule é o nó que representa uma linha horizontal em Markdown
                if (node.name === "HorizontalRule") {
                    // Replace the entire line content with the horizontal rule widget
                    builder.add(node.from, node.to, Decoration.replace({
                        widget: new HorizontalRuleWidget()
                    }))
                }
            }
        })
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
