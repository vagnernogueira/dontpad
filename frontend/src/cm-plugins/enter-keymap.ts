/**
 * Enter Keymap Plugin
 * 
 * Este plugin customiza o comportamento da tecla Enter para manter
 * a formatação de listas e citações ao criar uma nova linha.
 * 
 * Funcionalidades:
 * - Detecta itens de lista (-, *, +, 1., etc.) e mantém o formato
 * - Detecta citações (>) e mantém o formato
 * - Preserva indentação da linha anterior
 * - Retorna ao comportamento padrão se não houver formatação especial
 */

import { keymap } from "@codemirror/view"
import { EditorView } from "@codemirror/view"

export const enterKeymap = keymap.of([
    {
        key: 'Enter',
        run: (editorView: EditorView) => {
            const { state } = editorView
            const selection = state.selection.main
            const pos = selection.from
            const line = state.doc.lineAt(pos)
            const lineText = line.text

            // Match list markers or blockquotes at the start of current line
            const listMatch = lineText.match(/^(\s*)([-*+]|(\d+)[.)])(\s+)/)
            const quoteMatch = lineText.match(/^(\s{0,3})(>)(\s+)/)

            if (listMatch) {
                // List item: maintain format on new line
                const indent = listMatch[1]
                const marker = listMatch[2]
                const space = listMatch[4]
                const newLineContent = `\n${indent}${marker}${space}`
                
                editorView.dispatch({
                    changes: { from: pos, insert: newLineContent },
                    selection: { anchor: pos + newLineContent.length }
                })
                return true
            } else if (quoteMatch) {
                // Blockquote: maintain format on new line (0-3 spaces, NOT 4)
                const indent = quoteMatch[1]
                const marker = quoteMatch[2]
                const space = quoteMatch[3]
                const newLineContent = `\n${indent}${marker}${space}`
                
                editorView.dispatch({
                    changes: { from: pos, insert: newLineContent },
                    selection: { anchor: pos + newLineContent.length }
                })
                return true
            }

            // No special formatting, use default Enter behavior
            return false
        }
    }
])
