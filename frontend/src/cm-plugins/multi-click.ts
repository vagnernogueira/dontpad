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

/**
 * Constantes que definem comportamento e limites do multi-click
 */
const MULTI_CLICK_CONFIG = {
  /** Tempo máximo em ms entre cliques para contar como sequência */
  CLICK_TIMEOUT: 400,
  
  /** Distância máxima em pixels entre cliques para contar como mesma posição */
  CLICK_DISTANCE: 5,
  
  /** Número máximo de cliques a processar (limita a 4: triple e quadruple) */
  MAX_CLICK_COUNT: 5
} as const

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

/**
 * Plugin do CodeMirror para múltiplos cliques
 * Usa handlers locais ao editor para melhor controle de escopo
 */
export const multiClickPlugin = ViewPlugin.fromClass(
    class {
        lastClickTime = 0
        lastClickPos = -1
        clickCount = 0

        constructor(readonly view: EditorView) {
            // Usar pointerdown no root do editor para capturar todas as pressões individuais
            // antes de handlers internos consumirem os eventos de click.
            view.dom.addEventListener('pointerdown', this.handleClick, true)
        }

        handleClick = (event: PointerEvent) => {
            // ✅ IMPORTANTE: Ignorar quando Ctrl/Cmd está pressionado
            // Deixar o plugin ctrl-click (navegação) lidar com esses eventos
            if (event.ctrlKey || event.metaKey) {
                return
            }

            // Ignorar botão direito e botão do meio
            if (event.button !== 0) return

            const now = Date.now()
            const pos = this.view.posAtCoords({ x: event.clientX, y: event.clientY })
            
            if (pos === null) return

            // Reset se:
            // 1. Tempo entre cliques > CLICK_TIMEOUT
            // 2. Distância entre cliques > CLICK_DISTANCE  
            // 3. Click count já alcançou máximo
            const timeSinceLastClick = now - this.lastClickTime
            const distanceSinceLastClick = Math.abs(pos - this.lastClickPos)
            
            if (timeSinceLastClick > MULTI_CLICK_CONFIG.CLICK_TIMEOUT || 
                distanceSinceLastClick > MULTI_CLICK_CONFIG.CLICK_DISTANCE ||
                this.clickCount >= MULTI_CLICK_CONFIG.MAX_CLICK_COUNT) {
                this.clickCount = 1
            } else {
                this.clickCount++
            }

            this.lastClickTime = now
            this.lastClickPos = pos

            // ✅ FIX: Processar imediatamente (não usar setTimeout)
            // Triple click (3 clicks) - seleciona linha inteira
            if (this.clickCount === 3) {
                event.preventDefault()
                event.stopPropagation()

                const line = this.view.state.doc.lineAt(pos)
                this.view.dispatch({
                    selection: EditorSelection.single(line.from, line.to)
                })
                return  // Importante: impedir processamento adicional
            }

            // Quadruple click (4 clicks) - seleciona parágrafo inteiro
            if (this.clickCount === 4) {
                event.preventDefault()
                event.stopPropagation()

                const { from, to } = findParagraphBounds(this.view, pos)
                this.view.dispatch({
                    selection: EditorSelection.single(from, to)
                })
                return  // Importante: impedir processamento adicional
            }

            // Para 1 e 2 clicks: deixar CodeMirror processar normalmente
        }

        destroy() {
            // Limpa listener local (pointerdown)
            this.view.dom.removeEventListener('pointerdown', this.handleClick, true)
        }
    }
)
