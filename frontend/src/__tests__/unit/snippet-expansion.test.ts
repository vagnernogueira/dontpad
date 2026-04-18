import type { EditorView } from '@codemirror/view'
import { describe, expect, it, vi } from 'vitest'
import { insertSnippet } from '../../cm-utils/snippet-expansion'

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

describe('insertSnippet', () => {
  it('replaces the active selection and positions the caret at the first placeholder', () => {
    const view = createView(2, 5)

    const inserted = insertSnippet(view, {
      prefix: 'img',
      body: '![${ALT}](${URL})',
      description: 'Imagem markdown',
    })

    expect(inserted).toBe(true)
    expect(view.dispatch).toHaveBeenCalledWith({
      changes: {
        from: 2,
        to: 5,
        insert: '![]()',
      },
      selection: {
        anchor: 4,
      },
    })
    expect(view.focus).toHaveBeenCalledTimes(1)
  })
})