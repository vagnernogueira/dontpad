import { indentUnit } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { EditorView, runScopeHandlers } from '@codemirror/view'
import { afterEach, describe, expect, it } from 'vitest'
import { tabIndentKeymap } from '../../cm-plugins/tab-keymap'

describe('tabIndentKeymap', () => {
  const activeViews: EditorView[] = []

  afterEach(() => {
    for (const view of activeViews) {
      view.destroy()
    }

    activeViews.length = 0
  })

  it('desindenta linhas selecionadas com Shift+Tab', () => {
    const doc = '    primeiro\n    segundo'
    const parent = document.createElement('div')
    document.body.appendChild(parent)

    const view = new EditorView({
      state: EditorState.create({
        doc,
        selection: { anchor: 0, head: doc.length },
        extensions: [indentUnit.of('    '), tabIndentKeymap],
      }),
      parent,
    })

    activeViews.push(view)

    const handled = runScopeHandlers(view, new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      shiftKey: true,
    }), 'editor')

    expect(handled).toBe(true)
    expect(view.state.doc.toString()).toBe('primeiro\nsegundo')
  })

  it('desindenta a linha atual sem seleção', () => {
    const parent = document.createElement('div')
    document.body.appendChild(parent)

    const view = new EditorView({
      state: EditorState.create({
        doc: '    linha atual',
        selection: { anchor: 4, head: 4 },
        extensions: [indentUnit.of('    '), tabIndentKeymap],
      }),
      parent,
    })

    activeViews.push(view)

    const handled = runScopeHandlers(view, new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      shiftKey: true,
    }), 'editor')

    expect(handled).toBe(true)
    expect(view.state.doc.toString()).toBe('linha atual')
  })
})