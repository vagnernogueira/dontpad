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
import { findMarkdownLinks } from '../cm-utils/markdown-parsing'

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
        link.className = "cm-link-widget"
        link.href = this.url
        link.target = "_blank"
        link.rel = "noopener noreferrer"
        link.title = `Abrir: ${this.url}`
        link.innerHTML = " 🔗 "
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
        const links = findMarkdownLinks(text, from)
        
        for (const link of links) {
            // Skip images
            if (link.isImage) continue
            
            // Add widget at the end of the link
            builder.add(link.to, link.to, Decoration.widget({
                widget: new LinkWidget(link.url),
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
