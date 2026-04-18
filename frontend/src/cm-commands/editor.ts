import type { EditorView } from '@codemirror/view'

export function deleteCurrentLine(view: EditorView): boolean {
  if (!view) {
    return false
  }

  const { state } = view
  const selection = state.selection.main
  const position = selection.from
  const line = state.doc.lineAt(position)

  let deleteFrom = line.from
  let deleteTo = line.to

  if (line.number < state.doc.lines) {
    deleteTo = line.to + 1
  } else if (line.number > 1) {
    deleteFrom = line.from - 1
  }

  let newPosition = deleteFrom

  if (deleteFrom > 0 && line.number === state.doc.lines && line.number > 1) {
    newPosition = deleteFrom
  }

  view.dispatch({
    changes: { from: deleteFrom, to: deleteTo },
    selection: { anchor: newPosition },
  })

  view.focus()
  return true
}