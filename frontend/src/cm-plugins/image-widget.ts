/**
 * Image Widget Plugin
 * 
 * Este plugin detecta a sintaxe Markdown de imagens (![alt](url)) e renderiza
 * visualmente as imagens inline no editor CodeMirror.
 * 
 * Funcionalidades:
 * - Detecta padrão ![alt](url) no texto
 * - Renderiza a imagem usando um widget visual
 * - Aplica estilos para dimensionamento e aparência
 * - Trata erros de carregamento de imagem
 */

import { ViewPlugin, Decoration, WidgetType, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"

/**
 * Widget customizado que renderiza uma imagem no editor
 */
class ImageWidget extends WidgetType {
    constructor(readonly url: string) {
        super()
    }

    eq(other: ImageWidget) {
        return this.url === other.url
    }

    toDOM() {
        const wrap = document.createElement("div")
        wrap.style.display = "block"
        wrap.style.marginTop = "0.5rem"
        wrap.style.marginBottom = "0.5rem"

        const img = document.createElement("img")
        img.src = this.url
        img.style.maxHeight = "250px"
        img.style.maxWidth = "100%"
        img.style.borderRadius = "0.375rem" // Tailwind rounded-md
        img.style.boxShadow = "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)" // shadow
        img.style.objectFit = "contain"
        img.style.backgroundColor = "#f3f4f6" // gray-100 placeholder background

        // Handle broken images gracefully
        img.onerror = () => {
            img.style.display = "none"
            const errorMsg = document.createElement("span")
            errorMsg.textContent = " ⚠️ Imagem não carregada"
            errorMsg.style.color = "#dc2626"
            errorMsg.style.fontSize = "0.875rem"
            wrap.appendChild(errorMsg)
        }

        wrap.appendChild(img)
        return wrap
    }
}

/**
 * Constrói decorações para todas as imagens no documento visível
 */
function buildImageDecorations(view: EditorView) {
    const builder = new RangeSetBuilder<Decoration>()
    for (let { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to)
        const regex = /!\[.*?\]\(([^)]+)\)/g
        let match
        while ((match = regex.exec(text))) {
            const pos = from + match.index + match[0].length
            builder.add(pos, pos, Decoration.widget({
                widget: new ImageWidget(match[1]),
                side: 1
            }))
        }
    }
    return builder.finish()
}

/**
 * Plugin do CodeMirror que renderiza imagens inline
 */
export const imagePreviewPlugin = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet
        constructor(view: EditorView) {
            this.decorations = buildImageDecorations(view)
        }
        update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged) {
                this.decorations = buildImageDecorations(update.view)
            }
        }
    },
    {
        decorations: (v: any) => v.decorations
    }
)
