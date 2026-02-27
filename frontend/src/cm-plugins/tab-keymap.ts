/**
 * Tab Keymap Plugin
 * 
 * Este plugin customiza o comportamento da tecla Tab no editor para:
 * - Inserir 4 espaços ao invés de tabs
 * - Indentar múltiplas linhas quando há seleção
 * - Inserir indentação antes de palavras quando apropriado
 * - Permitir expansão de snippets quando aplicável
 * 
 * Prioridades (em ordem):
 * 1. Tab com seleção: indenta as linhas selecionadas
 * 2. Tab com snippet válido: deixa o snippetKeymap processar
 * 3. Tab sem snippet: insere indentação normal
 * 
 * Funcionalidades:
 * - Tab com seleção: indenta todas as linhas selecionadas
 * - Tab sem seleção: verifica por snippet antes de indentar
 * - Detecção de palavras: insere antes da palavra se cursor está adjacente
 */

import { keymap } from "@codemirror/view"
import { EditorView } from "@codemirror/view"

/**
 * Extract word before cursor
 * Duplicated from snippet.ts to avoid circular dependency
 */
function getWordBeforeCursor(view: EditorView): { word: string; from: number; to: number } | null {
  const { state } = view
  const pos = state.selection.main.head
  const line = state.doc.lineAt(pos)
  const lineText = line.text
  const posInLine = pos - line.from
  
  if (posInLine === 0) {
    return null
  }
  
  const wordCharRegex = /\w/
  let wordStart = posInLine
  
  while (wordStart > 0 && wordCharRegex.test(lineText[wordStart - 1])) {
    wordStart--
  }
  
  const word = lineText.substring(wordStart, posInLine)
  
  if (word.length === 0) {
    return null
  }
  
  return {
    word,
    from: line.from + wordStart,
    to: pos
  }
}

/**
 * Check if a snippet with given prefix exists
 * Duplicated from snippet.ts to avoid circular dependency
 */
function hasSnippetForPrefix(prefix: string): boolean {
  const snippetPrefixes = ['dt', 'hr', 'lorem', 'table', 'code', 'link', 'img', 'task', 'snippets']
  return snippetPrefixes.includes(prefix)
}

export const tabIndentKeymap = keymap.of([
    {
        key: 'Tab',
        run: (editorView: EditorView) => {
            const { state } = editorView
            const selection = state.selection.main

            // If there's a selection, indent all selected lines
            if (!selection.empty) {
                const changes: any[] = []
                let currentLine = state.doc.lineAt(selection.from)
                const endLine = state.doc.lineAt(selection.to)
                let offset = 0

                // Add 4 spaces to the beginning of each selected line
                while (currentLine.number <= endLine.number) {
                    changes.push({ from: currentLine.from, insert: '    ' })
                    offset += 4
                    if (currentLine.number === endLine.number) break
                    currentLine = state.doc.line(currentLine.number + 1)
                }

                // Dispatch changes and preserve expanded selection
                editorView.dispatch({
                    changes: changes,
                    selection: { anchor: selection.from + 4, head: selection.to + offset }
                })
                return true
            }

            // ETAPA 8 FIX: Check if there's a snippet to expand before applying indentation
            // If snippet exists, return false to let snippetKeymap handle it
            const wordInfo = getWordBeforeCursor(editorView)
            if (wordInfo && hasSnippetForPrefix(wordInfo.word)) {
                return false // Let snippetKeymap process the Tab event
            }

            // No snippet found: apply indentation as normal
            const pos = selection.from
            const line = state.doc.lineAt(pos)
            const lineText = line.text
            const posInLine = pos - line.from

            // Check characters before and after cursor
            const charBefore = lineText[posInLine - 1] || ' '
            const charAfter = lineText[posInLine] || ' '

            // Regex to detect word characters
            const wordCharRegex = /\w/

            // If cursor is inside a word or touching a word, insert before the word
            if (wordCharRegex.test(charBefore) || wordCharRegex.test(charAfter)) {
                // Find the start of the word
                let wordStart = posInLine
                while (wordStart > 0 && wordCharRegex.test(lineText[wordStart - 1])) {
                    wordStart--
                }

                // Insert 4 spaces before the word
                editorView.dispatch({
                    changes: { from: line.from + wordStart, insert: '    ' },
                    selection: { anchor: pos + 4 }
                })
            } else {
                // Insert 4 spaces at cursor position
                editorView.dispatch({
                    changes: { from: pos, insert: '    ' },
                    selection: { anchor: pos + 4 }
                })
            }

            return true
        }
    }
])
