import { describe, expect, it, vi } from 'vitest'
import {
  captureEditorSelection,
  focusEditorAtStart,
  focusEditorSelection,
} from '../../cm-utils/initial-editor-focus'

describe('focusEditorAtStart', () => {
  it('positions the caret at the first column and focuses the editor', () => {
    const dispatch = vi.fn()
    const focus = vi.fn()
    const scheduleFrame = vi.fn((callback: () => void) => callback())

    focusEditorAtStart(
      {
        dom: { isConnected: true },
        dispatch,
        focus,
      },
      scheduleFrame,
    )

    expect(scheduleFrame).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith({
      selection: { anchor: 0, head: 0 },
    })
    expect(focus).toHaveBeenCalledTimes(1)
  })

  it('does not focus or dispatch when the editor is no longer mounted', () => {
    const dispatch = vi.fn()
    const focus = vi.fn()
    const scheduleFrame = vi.fn((callback: () => void) => callback())

    focusEditorAtStart(
      {
        dom: { isConnected: false },
        dispatch,
        focus,
      },
      scheduleFrame,
    )

    expect(dispatch).not.toHaveBeenCalled()
    expect(focus).not.toHaveBeenCalled()
  })

  it('captures the current editor selection', () => {
    expect(
      captureEditorSelection({
        dom: { isConnected: true },
        state: {
          selection: {
            main: {
              anchor: 4,
              head: 9,
            },
          },
        },
        dispatch: vi.fn(),
        focus: vi.fn(),
      }),
    ).toEqual({ anchor: 4, head: 9 })
  })

  it('restores an explicit selection before focusing', () => {
    const dispatch = vi.fn()
    const focus = vi.fn()
    const scheduleFrame = vi.fn((callback: () => void) => callback())

    focusEditorSelection(
      {
        dom: { isConnected: true },
        dispatch,
        focus,
      },
      { anchor: 7, head: 7 },
      scheduleFrame,
    )

    expect(dispatch).toHaveBeenCalledWith({
      selection: { anchor: 7, head: 7 },
    })
    expect(focus).toHaveBeenCalledTimes(1)
  })
})