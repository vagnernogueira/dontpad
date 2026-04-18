import { EditorState } from '@codemirror/state'
import { EditorView, runScopeHandlers } from '@codemirror/view'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createCommandPaletteKeymap } from '../../cm-plugins/command-palette-keymap'

describe('createCommandPaletteKeymap', () => {
  const activeViews: EditorView[] = []

  afterEach(() => {
    for (const view of activeViews) {
      view.destroy()
    }

    activeViews.length = 0
  })

  it('opens the command palette on Ctrl+Alt+Space', () => {
    const onOpenCommandPalette = vi.fn()
    const parent = document.createElement('div')
    document.body.appendChild(parent)

    const view = new EditorView({
      state: EditorState.create({
        doc: 'conteudo',
        extensions: [createCommandPaletteKeymap(onOpenCommandPalette)],
      }),
      parent,
    })

    activeViews.push(view)

    const handled = runScopeHandlers(view, new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      ctrlKey: true,
      altKey: true,
    }), 'editor')

    expect(handled).toBe(true)
    expect(onOpenCommandPalette).toHaveBeenCalledTimes(1)
  })
})