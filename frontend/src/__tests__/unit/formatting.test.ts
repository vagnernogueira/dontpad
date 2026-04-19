import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { afterEach, describe, expect, it } from 'vitest'
import { applyFormat, commands } from '../../cm-commands'

const activeViews: EditorView[] = []

function createView(doc: string, from: number, to: number = from): EditorView {
  const parent = document.createElement('div')
  document.body.appendChild(parent)

  const view = new EditorView({
    state: EditorState.create({
      doc,
      selection: { anchor: from, head: to },
    }),
    parent,
  })

  activeViews.push(view)
  return view
}

afterEach(() => {
  while (activeViews.length > 0) {
    const view = activeViews.pop()
    view?.destroy()
    view?.dom.parentElement?.remove()
  }
})

describe('list formatting commands', () => {
  it('keeps the current line behavior when there is no selection', () => {
    const view = createView('alpha\nbeta', 1)

    const applied = applyFormat(view, '- ')

    expect(applied).toBe(true)
    expect(view.state.doc.toString()).toBe('- alpha\nbeta')
    expect(view.state.selection.main.from).toBe(3)
    expect(view.state.selection.main.to).toBe(3)
  })

  it('keeps the current line behavior for single-line selections', () => {
    const view = createView('alpha\nbeta', 1, 4)

    const applied = commands.numberedList(view)

    expect(applied).toBe(true)
    expect(view.state.doc.toString()).toBe('1. alpha\nbeta')
    expect(view.state.selection.main.from).toBe(4)
    expect(view.state.selection.main.to).toBe(7)
  })

  it.each([
    {
      commandName: 'bulletList',
      expected: '- alpha\n\n- beta\n- gamma',
      expectedFrom: 3,
      expectedTo: 23,
    },
    {
      commandName: 'numberedList',
      expected: '1. alpha\n\n2. beta\n3. gamma',
      expectedFrom: 4,
      expectedTo: 26,
    },
    {
      commandName: 'checklist',
      expected: '- [ ] alpha\n\n- [ ] beta\n- [ ] gamma',
      expectedFrom: 7,
      expectedTo: 35,
    },
  ] as const)('applies multiline list formatting for $commandName', ({ commandName, expected, expectedFrom, expectedTo }) => {
    const view = createView('alpha\n\nbeta\ngamma', 1, 17)

    const applied = commands[commandName](view)

    expect(applied).toBe(true)
    expect(view.state.doc.toString()).toBe(expected)
    expect(view.state.selection.main.from).toBe(expectedFrom)
    expect(view.state.selection.main.to).toBe(expectedTo)
  })
})