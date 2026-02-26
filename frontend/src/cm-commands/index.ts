/**
 * Command Registry
 * 
 * Central export point for all editor commands.
 * Provides convenient imports and a command registry for programmatic access.
 */

// Re-export all commands
export { applyFormat, formatInline, formatLinePrefix } from './formatting'
export { insertLink, insertImage } from './insertions'
export { createUndoCommand, createRedoCommand } from './history'

// Import commands for registry
import { formatInline, formatLinePrefix } from './formatting'

// Type definitions for the registry
import type { EditorView } from '@codemirror/view'

export type Command = (view: EditorView, ...args: any[]) => boolean

export interface CommandRegistry {
  [key: string]: Command
}

/**
 * Default command registry
 * Maps command names to their implementations
 */
export const commands = {
  // Formatting commands
  bold: (view: EditorView) => formatInline(view, '**', '**'),
  italic: (view: EditorView) => formatInline(view, '*', '*'),
  strikethrough: (view: EditorView) => formatInline(view, '~~', '~~'),
  inlineCode: (view: EditorView) => formatInline(view, '`', '`'),
  codeBlock: (view: EditorView) => formatInline(view, '```\n', '\n```'),
  
  // Line-level formatting
  heading1: (view: EditorView) => formatLinePrefix(view, '# '),
  heading2: (view: EditorView) => formatLinePrefix(view, '## '),
  heading3: (view: EditorView) => formatLinePrefix(view, '### '),
  bulletList: (view: EditorView) => formatLinePrefix(view, '- '),
  numberedList: (view: EditorView) => formatLinePrefix(view, '1. '),
  checklist: (view: EditorView) => formatLinePrefix(view, '- [ ] '),
  quote: (view: EditorView) => formatLinePrefix(view, '> '),
} as CommandRegistry
