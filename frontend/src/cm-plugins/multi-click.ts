/**
 * Multi Click Plugin
 * 
 * Este plugin estende o comportamento de cliques múltiplos no editor:
 * - Triple click (3 cliques): seleciona a linha inteira
 * - Quadruple click (4 cliques): seleciona o parágrafo inteiro
 * 
 * Funcionalidades:
 * - Detecta sequências de cliques rápidos
 * - Triple click: seleciona linha completa
 * - Quadruple click: seleciona parágrafo (delimitado por linhas vazias)
 * - Usa handlers locais ao editor (sem listeners globais)
 * - Limites claros de tempo e espaço para reset de contagem
 * - Processamento síncrono para permitir preventDefault/stopPropagation
 * 
 * Fix aplicado em 26/02/2026:
 * - Removido setTimeout que causava processamento assíncrono
 * - preventDefault/stopPropagation agora funcionam corretamente
 * - Seleção de linha/parágrafo acontece imediatamente no handler
 * - Mudado de 'click' para 'pointerdown' para capturar todos os cliques
 *   (evento 'click' é consumido pelo browser em dblclick/triple-click)
 */

import { ViewPlugin, EditorView } from "@codemirror/view"
import { EditorSelection } from "@codemirror/state"

/** Distância máxima em pixels para considerar que um click virou arraste */
const SINGLE_CLICK_DRAG_THRESHOLD = 5

interface PendingSingleClick {
    pos: number
    clientX: number
    clientY: number
}

/**
 * Helper function to find paragraph boundaries
 * A paragraph is delimited by empty lines or start/end of document
 */
function findParagraphBounds(view: EditorView, pos: number): { from: number, to: number } {
    const doc = view.state.doc
    const line = doc.lineAt(pos)
    
    // Find start of paragraph (go up until we hit an empty line or start of doc)
    let startLine = line
    while (startLine.number > 1) {
        const prevLine = doc.line(startLine.number - 1)
        if (prevLine.text.trim() === '') {
            break
        }
        startLine = prevLine
    }
    
    // Find end of paragraph (go down until we hit an empty line or end of doc)
    let endLine = line
    while (endLine.number < doc.lines) {
        const nextLine = doc.line(endLine.number + 1)
        if (nextLine.text.trim() === '') {
            break
        }
        endLine = nextLine
    }
    
    return { from: startLine.from, to: endLine.to }
}

function isPositionInsideSelection(view: EditorView, pos: number): boolean {
    return view.state.selection.ranges.some((range) => !range.empty && pos >= range.from && pos <= range.to)
}

function hasPointerMovedBeyondThreshold(event: PointerEvent, pending: PendingSingleClick): boolean {
    const movedX = event.clientX - pending.clientX
    const movedY = event.clientY - pending.clientY
    return Math.hypot(movedX, movedY) > SINGLE_CLICK_DRAG_THRESHOLD
}

function stopEvent(event: MouseEvent | PointerEvent) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation?.()
}

/**
 * Plugin do CodeMirror para múltiplos cliques
 * Usa handlers locais ao editor para melhor controle de escopo
 */
export const multiClickPlugin = ViewPlugin.fromClass(
    class {
        pendingSingleClick: PendingSingleClick | null = null

        constructor(readonly view: EditorView) {
            view.dom.addEventListener('mousedown', this.handleMouseDown, true)
            view.dom.addEventListener('pointermove', this.handlePointerMove, true)
            view.dom.addEventListener('pointerup', this.handlePointerUp, true)
            view.dom.addEventListener('pointercancel', this.clearPendingSingleClick, true)
        }

        clearPendingSingleClick = () => {
            this.pendingSingleClick = null
        }

        handleMouseDown = (event: MouseEvent) => {
            if (event.ctrlKey || event.metaKey || event.button !== 0) {
                this.pendingSingleClick = null
                return
            }

            const pos = this.view.posAtCoords({ x: event.clientX, y: event.clientY })
            if (pos === null) {
                this.pendingSingleClick = null
                return
            }

            if (event.detail === 1) {
                if (event.shiftKey) {
                    this.pendingSingleClick = null
                    return
                }

                this.pendingSingleClick = isPositionInsideSelection(this.view, pos)
                    ? {
                        pos,
                        clientX: event.clientX,
                        clientY: event.clientY,
                    }
                    : null
                return
            }

            this.pendingSingleClick = null

            if (event.detail === 3) {
                stopEvent(event)

                const line = this.view.state.doc.lineAt(pos)
                this.view.dispatch({
                    selection: EditorSelection.single(line.from, line.to)
                })
                this.view.focus()
                return
            }

            if (event.detail === 4) {
                stopEvent(event)

                const { from, to } = findParagraphBounds(this.view, pos)
                this.view.dispatch({
                    selection: EditorSelection.single(from, to)
                })
                this.view.focus()
            }
        }

        handlePointerMove = (event: PointerEvent) => {
            if (!this.pendingSingleClick) return

            if (hasPointerMovedBeyondThreshold(event, this.pendingSingleClick)) {
                this.pendingSingleClick = null
            }
        }

        handlePointerUp = (event: PointerEvent) => {
            const pendingSingleClick = this.pendingSingleClick
            this.pendingSingleClick = null

            if (!pendingSingleClick || event.button !== 0) return
            if (event.shiftKey || event.ctrlKey || event.metaKey) return
            if (hasPointerMovedBeyondThreshold(event, pendingSingleClick)) return

            this.view.dispatch({
                selection: EditorSelection.single(pendingSingleClick.pos)
            })
            this.view.focus()
        }

        destroy() {
            this.view.dom.removeEventListener('mousedown', this.handleMouseDown, true)
            this.view.dom.removeEventListener('pointermove', this.handlePointerMove, true)
            this.view.dom.removeEventListener('pointerup', this.handlePointerUp, true)
            this.view.dom.removeEventListener('pointercancel', this.clearPendingSingleClick, true)
        }
    }
)
