import { EditorState } from '@codemirror/state'
import { EditorView, runScopeHandlers } from '@codemirror/view'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createOpenRawDocumentKeymap } from '../../cm-plugins/open-raw-document-keymap'

describe('createOpenRawDocumentKeymap', () => {
  const activeViews: EditorView[] = []

  afterEach(() => {
    for (const view of activeViews) {
      view.destroy()
    }

    activeViews.length = 0
  })

  it('opens the raw document on Mod-u', () => {
    const onOpenRawDocument = vi.fn()
    const parent = document.createElement('div')
    document.body.appendChild(parent)

    const view = new EditorView({
      state: EditorState.create({
        doc: 'conteudo',
        extensions: [createOpenRawDocumentKeymap(onOpenRawDocument)],
      }),
      parent,
    })

    activeViews.push(view)

    const handled = runScopeHandlers(view, new KeyboardEvent('keydown', {
      key: 'u',
      code: 'KeyU',
      ctrlKey: true,
    }), 'editor')

    expect(handled).toBe(true)
    expect(onOpenRawDocument).toHaveBeenCalledTimes(1)
  })
})