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
import { defaultSnippets, findSnippet, getWordBeforeCursor } from '../cm-utils/snippet-registry'

/**
 * Lorem ipsum paragraphs (original text)
 */
const loremIpsumParagraphs = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.",
  "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
  "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.",
  "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.",
  "Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.",
  "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.",
  "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse."
]

/**
 * Get a random lorem ipsum paragraph
 */
function getRandomLoremParagraph(): string {
  const randomIndex = Math.floor(Math.random() * loremIpsumParagraphs.length)
  return loremIpsumParagraphs[randomIndex]
}

/**
 * Generate list of all available snippets
 */
function generateSnippetList(): string {
  const snippetLines = defaultSnippets
    .filter(s => s.prefix !== 'snippets') // Don't include the snippets list itself
    .map(s => `- \`${s.prefix}\` + TAB → ${s.description || s.body}`)
  
  return `**Snippets Disponíveis:**\n\n${snippetLines.join('\n')}`
}

/**
 * Resolve variables in snippet body
 */
function resolveSnippetVariables(body: string): { text: string; cursorOffset: number } {
  let result = body
  let cursorOffset = 0
  
  // Replace ${CURRENT_DATE} with current date in DD/MM/YYYY format
  if (result.includes('${CURRENT_DATE}')) {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    const dateStr = `${day}/${month}/${year}`
    result = result.replace(/\$\{CURRENT_DATE\}/g, dateStr)
  }
  
  // Replace ${CURRENT_TIME} with current time in HH:MM format
  if (result.includes('${CURRENT_TIME}')) {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const timeStr = `${hours}:${minutes}`
    result = result.replace(/\$\{CURRENT_TIME\}/g, timeStr)
  }
  
  // Replace ${LOREM} with a random lorem ipsum paragraph
  // Use a callback to ensure the function is called for each occurrence
  if (result.includes('${LOREM}')) {
    result = result.replace(/\$\{LOREM\}/g, () => getRandomLoremParagraph())
  }
  
  // Replace ${SNIPPET_LIST} with list of all available snippets
  if (result.includes('${SNIPPET_LIST}')) {
    result = result.replace(/\$\{SNIPPET_LIST\}/g, () => generateSnippetList())
  }
  
  // Handle tabstops/placeholders (${VAR} pattern)
  // Find first placeholder and calculate cursor position
  const placeholderMatch = result.match(/\$\{([^}]+)\}/)
  if (placeholderMatch) {
    const placeholderStart = placeholderMatch.index!
    
    // Replace placeholder with empty string or placeholder name
    result = result.replace(/\$\{([^}]+)\}/g, '')
    
    // Set cursor to where the first placeholder was
    cursorOffset = placeholderStart
  }
  
  return { text: result, cursorOffset }
}

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
      
      // Expand snippet!
      const { text, cursorOffset } = resolveSnippetVariables(snippet.body)
      
      // Replace the trigger word with snippet body
      view.dispatch({
        changes: {
          from: wordInfo.from,
          to: wordInfo.to,
          insert: text
        },
        selection: {
          anchor: cursorOffset > 0 ? wordInfo.from + cursorOffset : wordInfo.from + text.length
        }
      })
      
      return true // Snippet expanded, consume the TAB event
    }
  }
])

