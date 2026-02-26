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
import { findUrlAtPosition, normalizeUrl } from '../cm-utils/markdown-parsing'

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
            
            const result = findUrlAtPosition(this.view.state.doc, pos)
            if (result) {
                e.preventDefault()
                e.stopPropagation()
                
                const fullUrl = normalizeUrl(result.url)
                window.open(fullUrl, '_blank', 'noopener,noreferrer')
            }
        }
        
        private updateHoverDecoration() {
            if (this.ctrlPressed && this.currentPos !== null) {
                const result = findUrlAtPosition(this.view.state.doc, this.currentPos)
                if (result) {
                    const builder = new RangeSetBuilder<Decoration>()
                    builder.add(
                        result.range.from,
                        result.range.to,
                        Decoration.mark({
                            class: 'cm-ctrl-hover-link'
                        })
                    )
                    this.hoverDecoration = builder.finish()
                    this.view.update([])
                    return
                }
            }
            
            // Clear decoration if not hovering over a link with Ctrl
            if (this.hoverDecoration.size > 0) {
                this.hoverDecoration = Decoration.none
                this.view.update([])
            }
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
