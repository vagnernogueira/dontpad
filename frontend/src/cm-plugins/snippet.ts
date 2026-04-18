/**
 * Snippet Plugin
 * 
 * Este plugin implementa um sistema de snippets gerenciáveis no estilo VSCode:
 * - Define snippets no formato JSON (gatilho -> corpo do snippet)
 * - Expande snippets ao pressionar TAB após digitar o gatilho
 * - Suporta variáveis dinâmicas (data, hora, lorem ipsum, etc.)
 * - Não interfere com a indentação TAB existente quando não há snippet
 * 
 * Funcionalidades:
 * - Snippets customizáveis em formato JSON
 * - Variáveis dinâmicas: ${CURRENT_DATE}, ${CURRENT_TIME}, ${LOREM}
 * - Prioridade sobre TAB de indentação apenas quando há snippet válido
 * - Expansão automática ao detectar gatilho + TAB
 * 
 * Exemplos de uso:
 * - dt + TAB → insere data atual (ex: 26/02/2026)
 * - hr + TAB → insere hora atual (ex: 14:35)
 * - lorem + TAB → insere parágrafo lorem ipsum
 */

import { keymap } from "@codemirror/view"
import { EditorView } from "@codemirror/view"
import { findSnippet, getWordBeforeCursor } from '../cm-utils/snippet-registry'
import { insertSnippet } from '../cm-utils/snippet-expansion'

/**
 * Snippet expansion keymap
 * Intercepts TAB and tries to expand snippet before falling back to indentation
 */
export const snippetKeymap = keymap.of([
  {
    key: 'Tab',
    run: (view: EditorView) => {
      const { state } = view
      const selection = state.selection.main
      
      // If there's a selection, don't try to expand snippet
      // Let the default tab handler deal with it
      if (!selection.empty) {
        return false
      }
      
      // Try to find word before cursor
      const wordInfo = getWordBeforeCursor(view)
      
      if (!wordInfo) {
        return false // No word, let default tab handler take over
      }
      
      // Try to find matching snippet
      const snippet = findSnippet(wordInfo.word)
      
      if (!snippet) {
        return false // No snippet, let default tab handler take over
      }

      return insertSnippet(view, snippet, wordInfo.from, wordInfo.to)
    }
  }
])

