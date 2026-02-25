/**
 * Delete Line Keymap Plugin
 * 
 * Este plugin adiciona o atalho Ctrl+L para deletar a linha inteira
 * onde o cursor está posicionado.
 * 
 * Funcionalidades:
 * - Ctrl+L: deleta a linha atual completa
 * - Remove quebra de linha adequadamente (antes ou depois)
 * - Posiciona cursor na posição apropriada após deleção
 * - Funciona em qualquer posição da linha
 */

import { keymap } from "@codemirror/view"
import { EditorView } from "@codemirror/view"

export const deleteLineKeymap = keymap.of([
    {
        key: 'Ctrl-l',
        run: (editorView: EditorView) => {
            const { state } = editorView
            const selection = state.selection.main
            const pos = selection.from
            const line = state.doc.lineAt(pos)
            console.log('[delete-line] triggered', {
                pos,
                lineNumber: line.number,
                lineFrom: line.from,
                lineTo: line.to,
                lineText: line.text
            })
            
            // Calculate the range to delete
            // If this is not the last line, include the newline character after the line
            // If this is the last line, include the newline before (if it exists)
            let deleteFrom = line.from
            let deleteTo = line.to
            
            if (line.number < state.doc.lines) {
                // Not the last line: delete line + newline after it
                deleteTo = line.to + 1
            } else if (line.number > 1) {
                // Last line and not the only line: delete newline before + line
                deleteFrom = line.from - 1
            }
            
            // Calculate new cursor position
            // Place cursor at the beginning of the next line, or at the beginning of the previous line if we deleted the last line
            let newPos = deleteFrom
            if (deleteFrom > 0 && line.number === state.doc.lines && line.number > 1) {
                // If we deleted the last line, put cursor at the end of the previous line
                newPos = deleteFrom
            }
            
            editorView.dispatch({
                changes: { from: deleteFrom, to: deleteTo },
                selection: { anchor: newPos }
            })

            console.log('[delete-line] applied', {
                deleteFrom,
                deleteTo,
                newPos
            })
            
            return true
        }
    }
])
