/**
 * Formatting Commands
 * 
 * CodeMirror commands for applying markdown formatting.
 * Handles both inline formats (bold, italic, code) and line-level formats (headers, lists).
 */

import type { EditorView } from '@codemirror/view'
import { getWordBoundaries, isWordCharAt } from '../cm-utils/word-boundaries'

/**
 * Apply inline formatting (wraps selection with prefix/suffix)
 * Examples: bold (**text**), italic (*text*), code (`text`)
 * 
 * @param view - CodeMirror EditorView instance
 * @param prefix - Opening marker (e.g., '**' for bold)
 * @param suffix - Closing marker (e.g., '**' for bold)
 * @returns true if successful
 */
export function formatInline(view: EditorView, prefix: string, suffix: string): boolean {
  if (!view) return false

  const { state } = view
  const selection = state.selection.main
  let formatStart = selection.from
  let formatEnd = selection.to

  // Handle word expansion for smart selection
  if (selection.empty) {
    // No selection: expand to word boundaries around cursor
    const wordBounds = getWordBoundaries(state.doc, selection.from)
    if (wordBounds.start < wordBounds.end) {
      formatStart = wordBounds.start
      formatEnd = wordBounds.end
    }
  } else {
    // Has selection: expand to include complete words at both ends when needed
    if (isWordCharAt(state.doc, formatStart)) {
      const wordBoundsAtStart = getWordBoundaries(state.doc, formatStart)
      formatStart = wordBoundsAtStart.start
    }

    if (isWordCharAt(state.doc, formatEnd - 1)) {
      const wordBoundsAtEnd = getWordBoundaries(state.doc, formatEnd - 1)
      formatEnd = wordBoundsAtEnd.end
    }
  }

  const selectedText = state.sliceDoc(formatStart, formatEnd)

  // If we still don't have text to format, just insert at cursor
  if (!selectedText) {
    view.dispatch({
      changes: {
        from: selection.from,
        insert: `${prefix}${suffix}`
      },
      selection: {
        anchor: selection.from + prefix.length,
        head: selection.from + prefix.length
      }
    })
  } else {
    // Wrap the selected text with markers
    view.dispatch({
      changes: {
        from: formatStart,
        to: formatEnd,
        insert: `${prefix}${selectedText}${suffix}`
      },
      selection: {
        anchor: formatStart + prefix.length,
        head: formatEnd + prefix.length
      }
    })
  }

  view.focus()
  return true
}

/**
 * Apply line-level formatting (adds prefix at start of line)
 * Examples: headers (# text), lists (- text), quotes (> text)
 * 
 * @param view - CodeMirror EditorView instance
 * @param prefix - Line prefix (e.g., '# ' for heading)
 * @returns true if successful
 */
export function formatLinePrefix(view: EditorView, prefix: string): boolean {
  if (!view) return false

  const { state } = view
  const selection = state.selection.main

  // Apply prefix to the start of the current line
  const line = state.doc.lineAt(selection.from)
  view.dispatch({
    changes: { from: line.from, insert: prefix },
    selection: { 
      anchor: selection.from + prefix.length, 
      head: selection.to + prefix.length 
    }
  })

  view.focus()
  return true
}

/**
 * Apply general formatting (detects inline vs line-level automatically)
 * 
 * @param view - CodeMirror EditorView instance
 * @param prefix - Opening marker or line prefix
 * @param suffix - Closing marker (empty for line-level formats)
 * @returns true if successful
 */
export function applyFormat(view: EditorView, prefix: string, suffix: string = ''): boolean {
  // Detect if it's a line-level format (ends with space and has no suffix)
  const isLineFormat = !suffix && prefix.endsWith(' ')

  if (isLineFormat) {
    return formatLinePrefix(view, prefix)
  } else {
    return formatInline(view, prefix, suffix)
  }
}
