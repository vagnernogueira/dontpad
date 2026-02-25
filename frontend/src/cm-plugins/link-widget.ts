/**
 * Link Widget Plugin
 * 
 * Este plugin detecta links Markdown ([text](url)) e adiciona um ícone
 * clicável ao lado do link para abrir em uma nova aba.
 * 
 * Funcionalidades:
 * - Detecta padrão [text](url) no texto (ignora imagens com !)
 * - Adiciona ícone 🔗 clicável ao lado do link
 * - Abre links em nova aba ao clicar
 * - Previne interferência com a seleção do editor
 */

import { ViewPlugin, Decoration, WidgetType, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"

/**
 * Widget customizado que renderiza um ícone de link clicável
 */
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

/**
 * Constrói decorações para todos os links no documento visível
 */
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

/**
 * Plugin do CodeMirror que adiciona ícones clicáveis aos links
 */
export const linkPreviewPlugin = ViewPlugin.fromClass(
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
