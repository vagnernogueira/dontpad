/**
 * List Plugin
 * 
 * Este plugin aplica estilos especiais às linhas de lista em Markdown,
 * incluindo listas ordenadas (1., 2.) e não ordenadas (-, *, +).
 * 
 * Funcionalidades:
 * - Detecta linhas de lista (bullets e numeradas)
 * - Aplica classe CSS customizada para estilização
 * - Suporta indentação (até 3 espaços antes do marcador)
 */

import { ViewPlugin, Decoration, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"

const listLineRegex = /^\s{0,3}(?:[-+*]|\d+[.)])\s+/

/**
 * Constrói decorações para linhas de lista
 */
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

/**
 * Plugin do CodeMirror para estilização de listas
 */
export const listCustomPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet

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
