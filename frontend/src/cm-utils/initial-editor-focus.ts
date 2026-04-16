export interface InitialEditorFocusTarget {
  dom: {
    isConnected: boolean
  }
  dispatch: (transaction: { selection: { anchor: number; head: number } }) => void
  state?: {
    selection: {
      main: {
        anchor: number
        head: number
      }
    }
  }
  focus: () => void
}

export interface EditorSelectionSnapshot {
  anchor: number
  head: number
}

export type ScheduleFrame = (callback: () => void) => void

const defaultScheduleFrame: ScheduleFrame = (callback) => {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => callback())
    return
  }

  setTimeout(callback, 0)
}

export function focusEditorAtStart(
  view: InitialEditorFocusTarget,
  scheduleFrame: ScheduleFrame = defaultScheduleFrame,
) {
  focusEditorSelection(view, { anchor: 0, head: 0 }, scheduleFrame)
}

export function captureEditorSelection(view: InitialEditorFocusTarget): EditorSelectionSnapshot {
  return {
    anchor: view.state?.selection.main.anchor ?? 0,
    head: view.state?.selection.main.head ?? 0,
  }
}

export function focusEditorSelection(
  view: InitialEditorFocusTarget,
  selection: EditorSelectionSnapshot,
  scheduleFrame: ScheduleFrame = defaultScheduleFrame,
) {
  scheduleFrame(() => {
    if (!view.dom.isConnected) return

    view.dispatch({
      selection,
    })
    view.focus()
  })
}