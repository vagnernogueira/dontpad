import { ViewPlugin, Decoration, WidgetType, EditorView, MatchDecorator, DecorationSet, ViewUpdate } from "@codemirror/view"

// --- Image Widget ---
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

// --- Link Widget ---
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

// Regex to match Markdown Images: ![alt](url)
const imageDecorator = new MatchDecorator({
    regexp: /!\[.*?\]\(([^)]+)\)/g,
    decoration: (match: RegExpExecArray) => {
        return Decoration.widget({
            widget: new ImageWidget(match[1]),
            side: 1 // Draw the widget after the matched text inline
        })
    }
})

// Regex to match Markdown Links: [text](url) - Negative lookbehind to ignore images
// We use a simpler regex and just check if the match string starts with '!'
const linkDecorator = new MatchDecorator({
    regexp: /!?\[.*?\]\(([^)]+)\)/g,
    decoration: (match: RegExpExecArray) => {
        // If it starts with '!', it's an image. We skip it here, imageDecorator will handle it.
        if (match[0].startsWith('!')) {
            return null
        }
        return Decoration.widget({
            widget: new LinkWidget(match[1]),
            side: 1 // Draw right next to it inline
        })
    }
})

// --- View Plugin ---
export const markdownPreviewPlugin = [
    ViewPlugin.fromClass(
        class {
            decorations: DecorationSet
            constructor(view: EditorView) {
                this.decorations = imageDecorator.createDeco(view)
            }
            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = imageDecorator.updateDeco(update, this.decorations)
                }
            }
        },
        {
            decorations: (v: any) => v.decorations
        }
    ),
    ViewPlugin.fromClass(
        class {
            decorations: DecorationSet
            constructor(view: EditorView) {
                this.decorations = linkDecorator.createDeco(view)
            }
            update(update: ViewUpdate) {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = linkDecorator.updateDeco(update, this.decorations)
                }
            }
        },
        {
            decorations: (v: any) => v.decorations
        }
    )
]
