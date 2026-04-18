import { EditorState } from '@codemirror/state'
import { EditorView, runScopeHandlers } from '@codemirror/view'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createMarkdownLintKeymap } from '../../cm-plugins/markdown-lint-keymap'

describe('createMarkdownLintKeymap', () => {
  const activeViews: EditorView[] = []

  afterEach(() => {
    for (const view of activeViews) {
      view.destroy()
    }

    activeViews.length = 0
  })

  it('opens the markdown lint dialog on Ctrl+Alt+L', () => {
    const onOpenMarkdownLint = vi.fn()
    const parent = document.createElement('div')
    document.body.appendChild(parent)

    const view = new EditorView({
      state: EditorState.create({
        doc: 'conteudo',
        extensions: [createMarkdownLintKeymap(onOpenMarkdownLint)],
      }),
      parent,
    })

    activeViews.push(view)

    const handled = runScopeHandlers(view, new KeyboardEvent('keydown', {
      key: 'l',
      code: 'KeyL',
      ctrlKey: true,
      altKey: true,
    }), 'editor')

    expect(handled).toBe(true)
    expect(onOpenMarkdownLint).toHaveBeenCalledTimes(1)
  })
})