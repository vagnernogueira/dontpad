/**
 * Insertion Commands
 * 
 * CodeMirror commands for inserting markdown elements like links and images.
 */

import type { EditorView } from '@codemirror/view'

/**
 * Insert a markdown link at the current cursor position
 * 
 * @param view - CodeMirror EditorView instance
 * @param text - Link text (display text)
 * @param url - Link URL
 * @returns true if successful
 */
export function insertLink(view: EditorView, text: string, url: string): boolean {
  if (!view || !url) return false

  const linkText = text || 'link'
  const markdown = `[${linkText}](${url})`

  const { state } = view
  const selection = state.selection.main

  view.dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: markdown
    },
    selection: {
      anchor: selection.from + markdown.length,
      head: selection.from + markdown.length
    }
  })

  view.focus()
  return true
}

/**
 * Insert a markdown image at the current cursor position
 * 
 * @param view - CodeMirror EditorView instance
 * @param alt - Image alt text (description)
 * @param url - Image URL
 * @returns true if successful
 */
export function insertImage(view: EditorView, alt: string, url: string): boolean {
  if (!view || !url) return false

  const altText = alt || 'imagem'
  const markdown = `![${altText}](${url})`

  const { state } = view
  const selection = state.selection.main

  view.dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: markdown
    },
    selection: {
      anchor: selection.from + markdown.length,
      head: selection.from + markdown.length
    }
  })

  view.focus()
  return true
}
