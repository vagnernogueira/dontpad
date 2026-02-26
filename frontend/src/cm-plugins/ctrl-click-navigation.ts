/**
 * Ctrl+Click Navigation Plugin
 * 
 * Este plugin adiciona funcionalidade de navegação por links usando Ctrl+Click:
 * - Holding Ctrl e passando o mouse sobre links mostra cursor pointer
 * - Ctrl+Click abre o link em nova aba
 * - Funciona com links Markdown [texto](url) e URLs avulsas
 * 
 * Funcionalidades:
 * - Detecta tecla Ctrl/Cmd pressionada
 * - Identifica links sob o cursor do mouse
 * - Aplica estilo visual quando hovering com Ctrl
 * - Abre links em nova aba ao clicar com Ctrl
 * - Adiciona protocolo https:// automaticamente se necessário
 */

import { ViewPlugin, Decoration, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"

/**
 * Plugin do CodeMirror para navegação com Ctrl+Click
 */
export const ctrlClickNavigationPlugin = ViewPlugin.fromClass(
    class {
        ctrlPressed = false
        currentPos: number | null = null
        hoverDecoration: DecorationSet = Decoration.none
        
        constructor(readonly view: EditorView) {
            // Listen for keyboard events
            document.addEventListener('keydown', this.handleKeyDown)
            document.addEventListener('keyup', this.handleKeyUp)
            
            // Listen for mouse events on the editor
            view.dom.addEventListener('mousemove', this.handleMouseMove)
            view.dom.addEventListener('mouseleave', this.handleMouseLeave)
            view.dom.addEventListener('click', this.handleClick)
        }
        
        handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                this.ctrlPressed = true
                this.updateHoverDecoration()
            }
        }
        
        handleKeyUp = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) {
                this.ctrlPressed = false
                this.updateHoverDecoration()
            }
        }
        
        handleMouseMove = (e: MouseEvent) => {
            const pos = this.view.posAtCoords({ x: e.clientX, y: e.clientY })
            if (pos !== this.currentPos) {
                this.currentPos = pos
                this.updateHoverDecoration()
            }
        }
        
        handleMouseLeave = () => {
            this.currentPos = null
            this.updateHoverDecoration()
        }
        
        handleClick = (e: MouseEvent) => {
            if (!this.ctrlPressed && !e.ctrlKey && !e.metaKey) return
            
            const pos = this.view.posAtCoords({ x: e.clientX, y: e.clientY })
            if (pos === null) return
            
            const url = this.findUrlAtPosition(pos)
            if (url) {
                e.preventDefault()
                e.stopPropagation()
                
                // Ensure URL has protocol
                let fullUrl = url
                if (url.startsWith('www.')) {
                    fullUrl = 'https://' + url
                } else if (!url.match(/^[a-z]+:\/\//i)) {
                    fullUrl = 'https://' + url
                }
                
                window.open(fullUrl, '_blank', 'noopener,noreferrer')
            }
        }
        
        private updateHoverDecoration() {
            if (this.ctrlPressed && this.currentPos !== null) {
                const url = this.findUrlAtPosition(this.currentPos)
                if (url) {
                    // Find the exact range of the URL
                    const range = this.findUrlRangeAtPosition(this.currentPos)
                    if (range) {
                        const builder = new RangeSetBuilder<Decoration>()
                        builder.add(
                            range.from,
                            range.to,
                            Decoration.mark({
                                class: 'cm-ctrl-hover-link'
                            })
                        )
                        this.hoverDecoration = builder.finish()
                        this.view.update([])
                        return
                    }
                }
            }
            
            // Clear decoration if not hovering over a link with Ctrl
            if (this.hoverDecoration.size > 0) {
                this.hoverDecoration = Decoration.none
                this.view.update([])
            }
        }
        
        private findUrlAtPosition(pos: number): string | null {
            const doc = this.view.state.doc
            const line = doc.lineAt(pos)
            const lineText = line.text
            const posInLine = pos - line.from
            
            // Check for markdown links [text](url)
            const markdownLinkRegex = /!?\[([^\]]*)\]\(([^)]+)\)/g
            let match
            while ((match = markdownLinkRegex.exec(lineText))) {
                const matchStart = match.index
                const matchEnd = match.index + match[0].length
                if (posInLine >= matchStart && posInLine <= matchEnd) {
                    return match[2] // Return the URL part
                }
            }
            
            // Check for plain URLs
            const urlRegex = /\b(https?:\/\/|www\.|ftp:\/\/)[^\s<>"\[\](){}]+/gi
            urlRegex.lastIndex = 0
            while ((match = urlRegex.exec(lineText))) {
                const matchStart = match.index
                const matchEnd = match.index + match[0].length
                if (posInLine >= matchStart && posInLine <= matchEnd) {
                    return match[0]
                }
            }
            
            return null
        }
        
        private findUrlRangeAtPosition(pos: number): { from: number, to: number } | null {
            const doc = this.view.state.doc
            const line = doc.lineAt(pos)
            const lineText = line.text
            const posInLine = pos - line.from
            
            // Check for markdown links [text](url)
            const markdownLinkRegex = /!?\[([^\]]*)\]\(([^)]+)\)/g
            let match
            while ((match = markdownLinkRegex.exec(lineText))) {
                const matchStart = match.index
                const matchEnd = match.index + match[0].length
                if (posInLine >= matchStart && posInLine <= matchEnd) {
                    return {
                        from: line.from + matchStart,
                        to: line.from + matchEnd
                    }
                }
            }
            
            // Check for plain URLs
            const urlRegex = /\b(https?:\/\/|www\.|ftp:\/\/)[^\s<>"\[\](){}]+/gi
            urlRegex.lastIndex = 0
            while ((match = urlRegex.exec(lineText))) {
                const matchStart = match.index
                const matchEnd = match.index + match[0].length
                if (posInLine >= matchStart && posInLine <= matchEnd) {
                    return {
                        from: line.from + matchStart,
                        to: line.from + matchEnd
                    }
                }
            }
            
            return null
        }
        
        update(update: ViewUpdate) {
            // Update on any change that might affect link positions
            if (update.docChanged) {
                this.updateHoverDecoration()
            }
        }
        
        destroy() {
            document.removeEventListener('keydown', this.handleKeyDown)
            document.removeEventListener('keyup', this.handleKeyUp)
            this.view.dom.removeEventListener('mousemove', this.handleMouseMove)
            this.view.dom.removeEventListener('mouseleave', this.handleMouseLeave)
            this.view.dom.removeEventListener('click', this.handleClick)
        }
    },
    {
        decorations: (plugin) => plugin.hoverDecoration
    }
)
