/**
 * Plain URL Plugin
 * 
 * Este plugin detecta URLs avulsas no texto (que não estão dentro de
 * sintaxe Markdown de links) e aplica estilização para destacá-las.
 * 
 * Funcionalidades:
 * - Detecta URLs com http://, https://, www., ftp://
 * - Ignora URLs dentro de links Markdown [texto](url)
 * - Aplica cor e sublinhado para indicar que são links
 * - Mantém URLs como texto editável
 */

import { ViewPlugin, Decoration, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { findPlainUrls } from '../cm-utils/markdown-parsing'

/**
 * Constrói decorações para URLs avulsas
 */
function buildPlainUrlDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()
    
    for (let { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        const plainUrls = findPlainUrls(text, from)
        
        for (const url of plainUrls) {
            builder.add(
                url.from,
                url.to,
                Decoration.mark({
                    class: 'cm-plain-url'
                })
            )
        }
    }
    
    return builder.finish()
}

/**
 * Plugin do CodeMirror para detecção e estilização de URLs avulsas
 */
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
