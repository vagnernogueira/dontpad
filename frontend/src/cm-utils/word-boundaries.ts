/**
 * Word Boundaries Utility
 * 
 * Helper functions for detecting word boundaries in CodeMirror documents.
 * Used for smart selection expansion in formatting commands.
 */

import type { Text } from '@codemirror/state'

/**
 * Get word boundaries around a position
 * @param doc - CodeMirror document
 * @param pos - Position in the document
 * @returns Object with start and end positions of the word
 */
export function getWordBoundaries(doc: Text, pos: number): { start: number; end: number } {
  const line = doc.lineAt(pos)
  const lineText = line.text
  const posInLine = pos - line.from

  // Find start of word
  let start = posInLine
  while (start > 0 && /\w/.test(lineText[start - 1])) {
    start--
  }

  // Find end of word
  let end = posInLine
  while (end < lineText.length && /\w/.test(lineText[end])) {
    end++
  }

  return {
    start: line.from + start,
    end: line.from + end
  }
}

/**
 * Check if position contains a word character
 * @param doc - CodeMirror document
 * @param pos - Position in the document
 * @returns True if position has a word character
 */
export function isWordCharAt(doc: Text, pos: number): boolean {
  if (pos < 0 || pos >= doc.length) return false
  
  const line = doc.lineAt(pos)
  const index = pos - line.from
  
  if (index < 0 || index >= line.text.length) return false
  
  return /\w/.test(line.text[index])
}
