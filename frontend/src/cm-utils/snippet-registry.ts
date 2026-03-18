/**
 * Snippet Registry
 *
 * Shared module that owns snippet definitions and the helper function
 * `getWordBeforeCursor`. Both `tab-keymap.ts` and `snippet.ts` import
 * from here so there is a single source of truth for snippet prefixes
 * and cursor-word extraction — eliminating the previous duplication and
 * the risk of silent divergence when adding new snippets.
 */

import type { EditorView } from '@codemirror/view'

// ── Snippet types ──────────────────────────────────────────────────

export interface Snippet {
  prefix: string
  body: string
  description?: string
}

// ── Default snippet collection ─────────────────────────────────────

export const defaultSnippets: Snippet[] = [
  {
    prefix: 'dt',
    body: '${CURRENT_DATE}',
    description: 'Insere a data atual',
  },
  {
    prefix: 'hr',
    body: '${CURRENT_TIME}',
    description: 'Insere a hora atual',
  },
  {
    prefix: 'lorem',
    body: '${LOREM}',
    description: 'Insere um parágrafo lorem ipsum',
  },
  {
    prefix: 'table',
    body: '| Coluna 1 | Coluna 2 |\n|----------|----------|\n| Valor 1  | Valor 2  |',
    description: 'Insere uma tabela markdown básica',
  },
  {
    prefix: 'code',
    body: '```${LANG}\n${CODE}\n```',
    description: 'Insere um bloco de código',
  },
  {
    prefix: 'link',
    body: '[${TEXT}](${URL})',
    description: 'Insere um link markdown',
  },
  {
    prefix: 'img',
    body: '![${ALT}](${URL})',
    description: 'Insere uma imagem markdown',
  },
  {
    prefix: 'task',
    body: '- [ ] ${TASK}',
    description: 'Insere uma tarefa de checklist',
  },
  {
    prefix: 'snippets',
    body: '${SNIPPET_LIST}',
    description: 'Lista todos os snippets disponíveis',
  },
]

// ── Derived helpers ────────────────────────────────────────────────

/** Set of all registered prefixes (kept in sync with `defaultSnippets`). */
const snippetPrefixSet = new Set(defaultSnippets.map(s => s.prefix))

/**
 * Check whether a snippet with the given prefix exists.
 */
export function hasSnippetForPrefix(prefix: string): boolean {
  return snippetPrefixSet.has(prefix)
}

/**
 * Find a snippet by its prefix.
 */
export function findSnippet(prefix: string): Snippet | undefined {
  return defaultSnippets.find(s => s.prefix === prefix)
}

// ── Cursor utility ─────────────────────────────────────────────────

export interface WordInfo {
  word: string
  from: number
  to: number
}

/**
 * Extract the word immediately before the cursor.
 *
 * Returns `null` when the cursor is at the start of a line or there is
 * no word character behind it.
 */
export function getWordBeforeCursor(view: EditorView): WordInfo | null {
  const { state } = view
  const pos = state.selection.main.head
  const line = state.doc.lineAt(pos)
  const lineText = line.text
  const posInLine = pos - line.from

  if (posInLine === 0) return null

  const wordCharRegex = /\w/
  let wordStart = posInLine

  while (wordStart > 0 && wordCharRegex.test(lineText[wordStart - 1])) {
    wordStart--
  }

  const word = lineText.substring(wordStart, posInLine)
  if (word.length === 0) return null

  return { word, from: line.from + wordStart, to: pos }
}
