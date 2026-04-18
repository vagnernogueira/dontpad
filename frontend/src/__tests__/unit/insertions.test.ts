import { describe, expect, it, vi } from 'vitest'
import type { EditorView } from '@codemirror/view'
import { insertEmoji } from '../../cm-commands/insertions'

function createView(from: number, to: number = from): EditorView {
  return {
    state: {
      selection: {
        main: {
          from,
          to,
        },
      },
    },
    dispatch: vi.fn(),
    focus: vi.fn(),
  } as unknown as EditorView
}

describe('insertEmoji', () => {
  it('replaces the active selection and moves the caret after the emoji', () => {
    const view = createView(3, 8)

    const inserted = insertEmoji(view, '😄')

    expect(inserted).toBe(true)
    expect(view.dispatch).toHaveBeenCalledWith({
      changes: {
        from: 3,
        to: 8,
        insert: '😄',
      },
      selection: {
        anchor: 5,
        head: 5,
      },
    })
    expect(view.focus).toHaveBeenCalledTimes(1)
  })

  it('does nothing when the emoji is empty', () => {
    const view = createView(0)

    expect(insertEmoji(view, '')).toBe(false)
    expect(view.dispatch).not.toHaveBeenCalled()
    expect(view.focus).not.toHaveBeenCalled()
  })
})