import type { EditorView } from '@codemirror/view'
import { defaultSnippets, type Snippet } from './snippet-registry'

const loremIpsumParagraphs = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
  'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.',
  'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.',
  'Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.',
  'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.',
  'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse.',
]

function getRandomLoremParagraph(): string {
  const randomIndex = Math.floor(Math.random() * loremIpsumParagraphs.length)
  return loremIpsumParagraphs[randomIndex]
}

function generateSnippetList(): string {
  const snippetLines = defaultSnippets
    .filter((snippet) => snippet.prefix !== 'snippets')
    .map((snippet) => `- \`${snippet.prefix}\` + TAB → ${snippet.description || snippet.body}`)

  return `**Snippets Disponiveis:**\n\n${snippetLines.join('\n')}`
}

export function resolveSnippetVariables(body: string): { text: string; cursorOffset: number } {
  let result = body
  let cursorOffset = 0

  if (result.includes('${CURRENT_DATE}')) {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    result = result.replace(/\$\{CURRENT_DATE\}/g, `${day}/${month}/${year}`)
  }

  if (result.includes('${CURRENT_TIME}')) {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    result = result.replace(/\$\{CURRENT_TIME\}/g, `${hours}:${minutes}`)
  }

  if (result.includes('${LOREM}')) {
    result = result.replace(/\$\{LOREM\}/g, () => getRandomLoremParagraph())
  }

  if (result.includes('${SNIPPET_LIST}')) {
    result = result.replace(/\$\{SNIPPET_LIST\}/g, () => generateSnippetList())
  }

  const placeholderMatch = result.match(/\$\{([^}]+)\}/)

  if (placeholderMatch) {
    cursorOffset = placeholderMatch.index ?? 0
    result = result.replace(/\$\{([^}]+)\}/g, '')
  }

  return { text: result, cursorOffset }
}

export function insertSnippet(view: EditorView, snippet: Snippet, from?: number, to?: number): boolean {
  if (!view) {
    return false
  }

  const selection = view.state.selection.main
  const insertFrom = from ?? selection.from
  const insertTo = to ?? selection.to
  const { text, cursorOffset } = resolveSnippetVariables(snippet.body)
  const cursorPosition = cursorOffset > 0 ? insertFrom + cursorOffset : insertFrom + text.length

  view.dispatch({
    changes: {
      from: insertFrom,
      to: insertTo,
      insert: text,
    },
    selection: {
      anchor: cursorPosition,
    },
  })

  view.focus()
  return true
}