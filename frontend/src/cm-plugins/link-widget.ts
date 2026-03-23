/**
 * Link Widget Plugin
 * 
 * Este plugin detecta e torna clicáveis QUALQUER URL no texto:
 * - Links Markdown ([text](url)): ícone 🔗 ao lado
 * - URLs avulsas (https://..., www., ftp://): ícone 🔗 ao lado
 * - Abre em nova aba ao clicar no ícone
 * 
 * Funcionalidades:
 * - Detecta padrão [text](url) no texto (ignora imagens com !)
 * - Detecta URLs avulsas (https://, www., ftp://)
 * - Adiciona ícone 🔗 clicável ao lado de cada URL
 * - Abre links em nova aba ao clicar no ícone
 * - Previne interferência com a seleção do editor
 * - Mostra cursor pointer ao passar sobre URLs (via CSS)
 */

import { ViewPlugin, Decoration, WidgetType, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { findMarkdownLinks, findPlainUrls, normalizeUrl } from '../cm-utils/markdown-parsing'

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
        // Use a URL normalizada para abrir
        link.href = normalizeUrl(this.url)
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
 * Detecta QUALQUER URL: links Markdown + URLs avulsas (plain URLs)
 */
function buildLinkDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()
    
    for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        
        // Coleta decorações de ambas as fontes para ordenar por posição
        const decos: { pos: number; deco: Decoration }[] = []
        
        // Links Markdown
        const markdownLinks = findMarkdownLinks(text, from)
        for (const link of markdownLinks) {
            if (link.isImage) continue
            decos.push({ pos: link.to, deco: Decoration.widget({
                widget: new LinkWidget(link.url),
                side: 1
            })})
        }
        
        // URLs avulsas (plain URLs)
        const plainUrls = findPlainUrls(text, from)
        for (const url of plainUrls) {
            decos.push({ pos: url.to, deco: Decoration.widget({
                widget: new LinkWidget(url.url),
                side: 1
            })})
        }
        
        // RangeSetBuilder exige adição em ordem crescente de posição
        decos.sort((a, b) => a.pos - b.pos)
        for (const d of decos) {
            builder.add(d.pos, d.pos, d.deco)
        }
    }
    
    return builder.finish()
}

/**
 * Plugin do CodeMirror que adiciona ícones clicáveis para QUALQUER URL
 * Detecta automaticamente:
 * - Links Markdown: [texto](url)
 * - URLs simples: https://..., www., ftp://...
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
        decorations: (v: { decorations: DecorationSet }) => v.decorations
    }
)
