/**
 * Enter Keymap Plugin
 * 
 * Este plugin customiza o comportamento da tecla Enter para manter
 * a formatação de listas e citações ao criar uma nova linha.
 * 
 * Funcionalidades:
 * - Detecta itens de lista (-, *, +, 1., etc.) e mantém o formato
 * - Detecta task lists (- [ ] ou - [x]) e mantém o formato
 * - Sai da lista quando o item atual está vazio
 * - Detecta citações (>) e mantém o formato
 * - Preserva indentação da linha anterior
 * - Retorna ao comportamento padrão se não houver formatação especial
 */

import { keymap } from "@codemirror/view"
import { EditorView } from "@codemirror/view"
import { parseCheckboxStatus } from '../cm-utils/markdown-parsing'

export const enterKeymap = keymap.of([
    {
        key: 'Enter',
        run: (editorView: EditorView) => {
            const { state } = editorView
            const selection = state.selection.main
            const pos = selection.from
            const line = state.doc.lineAt(pos)
            const lineText = line.text

            const checkboxStatus = parseCheckboxStatus(lineText)

            // Match task list items: - [ ] or - [x] or - [X] and ordered lists (1. / 1))
            const taskMatch = lineText.match(/^(\s*)(-|\d+[.)])\s+\[([xX\s])\](\s+)(.*)$/)
            
            // Match regular list markers or blockquotes at the start of current line
            const listMatch = lineText.match(/^(\s*)([-*+]|(\d+)[.)])(\s+)(.*)$/)
            const quoteMatch = lineText.match(/^(\s{0,3})(>)(\s+)/)

            if (checkboxStatus !== null && taskMatch) {
                const indent = taskMatch[1]
                const marker = taskMatch[2]
                const space = taskMatch[4]
                const content = taskMatch[5]
                
                // If the task item is empty (no content after checkbox), exit the list
                if (!content.trim()) {
                    // Remove the entire list marker line and create a new empty line
                    editorView.dispatch({
                        changes: { from: line.from, to: line.to, insert: '' },
                        selection: { anchor: line.from }
                    })
                    return true
                }
                
                // Task item has content: maintain format with unchecked checkbox on new line
                const newLineContent = `\n${indent}${marker} [ ]${space}`
                
                editorView.dispatch({
                    changes: { from: pos, insert: newLineContent },
                    selection: { anchor: pos + newLineContent.length }
                })
                return true
            } else if (listMatch) {
                const indent = listMatch[1]
                const marker = listMatch[2]
                const space = listMatch[4]
                const content = listMatch[5]
                
                // If the list item is empty (no content after marker), exit the list
                if (!content.trim()) {
                    // Remove the entire list marker line and create a new empty line
                    editorView.dispatch({
                        changes: { from: line.from, to: line.to, insert: '' },
                        selection: { anchor: line.from }
                    })
                    return true
                }
                
                // List item has content: maintain format on new line
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
