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

/**
 * Constrói decorações para URLs avulsas
 */
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
                        class: 'cm-plain-url'
                    })
                )
            }
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
