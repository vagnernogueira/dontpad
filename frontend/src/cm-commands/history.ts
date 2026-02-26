/**
 * History Commands
 * 
 * CodeMirror commands for undo/redo operations.
 * These wrap Yjs UndoManager for collaborative editing support.
 */

import type { EditorView } from '@codemirror/view'
import type * as Y from 'yjs'

/**
 * Create an undo command that uses Yjs UndoManager
 * 
 * @param undoManager - Yjs UndoManager instance
 * @returns Command function
 */
export function createUndoCommand(undoManager: Y.UndoManager) {
  return (view: EditorView): boolean => {
    if (!undoManager) return false
    undoManager.undo()
    if (view) view.focus()
    return true
  }
}

/**
 * Create a redo command that uses Yjs UndoManager
 * 
 * @param undoManager - Yjs UndoManager instance
 * @returns Command function
 */
export function createRedoCommand(undoManager: Y.UndoManager) {
  return (view: EditorView): boolean => {
    if (!undoManager) return false
    undoManager.redo()
    if (view) view.focus()
    return true
  }
}
