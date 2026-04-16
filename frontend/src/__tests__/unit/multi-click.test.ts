import { afterEach, describe, expect, it, vi } from 'vitest'
import { EditorSelection, EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { multiClickPlugin } from '../../cm-plugins/multi-click'

interface MultiClickPluginInstance {
  handleMouseDown: (event: MouseEvent) => void
  handlePointerMove: (event: PointerEvent) => void
  handlePointerUp: (event: PointerEvent) => void
}

interface PointerEventOverrides {
  button?: number
  clientX?: number
  clientY?: number
  ctrlKey?: boolean
  detail?: number
  metaKey?: boolean
  shiftKey?: boolean
}

const activeViews: EditorView[] = []

function createView(doc: string): { view: EditorView; plugin: MultiClickPluginInstance } {
  const parent = document.createElement('div')
  document.body.appendChild(parent)

  const view = new EditorView({
    state: EditorState.create({
      doc,
      extensions: [multiClickPlugin],
    }),
    parent,
  })

  const plugin = view.plugin(multiClickPlugin) as MultiClickPluginInstance | null
  if (!plugin) {
    throw new Error('multiClickPlugin was not initialized')
  }

  activeViews.push(view)
  return { view, plugin }
}

function createPointerEvent(overrides: PointerEventOverrides = {}): PointerEvent {
  return {
    button: 0,
    clientX: 10,
    clientY: 10,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    detail: 1,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as PointerEvent
}

function createMouseEvent(overrides: PointerEventOverrides = {}): MouseEvent {
  return {
    button: 0,
    clientX: 10,
    clientY: 10,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    detail: 1,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    ...overrides,
  } as unknown as MouseEvent
}

afterEach(() => {
  vi.restoreAllMocks()

  while (activeViews.length > 0) {
    const view = activeViews.pop()
    view?.destroy()
    view?.dom.parentElement?.remove()
  }
})

describe('multiClickPlugin', () => {
  it('collapses the selection to the clicked position on single click inside the selection', () => {
    const { view, plugin } = createView('hello world')
    vi.spyOn(view, 'posAtCoords').mockReturnValue(3)
    const focusSpy = vi.spyOn(view, 'focus')

    view.dispatch({
      selection: EditorSelection.single(0, 5),
    })

    plugin.handleMouseDown(createMouseEvent())
    plugin.handlePointerUp(createPointerEvent())

    expect(view.state.selection.main.from).toBe(3)
    expect(view.state.selection.main.to).toBe(3)
    expect(focusSpy).toHaveBeenCalledTimes(1)
  })

  it.each(['shiftKey', 'ctrlKey', 'metaKey'] as const)('does not intercept clicks with %s pressed', (modifier) => {
    const { view, plugin } = createView('hello world')
    vi.spyOn(view, 'posAtCoords').mockReturnValue(3)
    const focusSpy = vi.spyOn(view, 'focus')

    view.dispatch({
      selection: EditorSelection.single(0, 5),
    })

    plugin.handleMouseDown(createMouseEvent({ [modifier]: true }))
    plugin.handlePointerUp(createPointerEvent({ [modifier]: true }))

    expect(view.state.selection.main.from).toBe(0)
    expect(view.state.selection.main.to).toBe(5)
    expect(focusSpy).not.toHaveBeenCalled()
  })

  it('does not collapse the selection when the pointer moves before release', () => {
    const { view, plugin } = createView('hello world')
    vi.spyOn(view, 'posAtCoords').mockReturnValue(3)

    view.dispatch({
      selection: EditorSelection.single(0, 5),
    })

    plugin.handleMouseDown(createMouseEvent({ clientX: 10, clientY: 10 }))
    plugin.handlePointerMove(createPointerEvent({ clientX: 20, clientY: 20 }))
    plugin.handlePointerUp(createPointerEvent({ clientX: 20, clientY: 20 }))

    expect(view.state.selection.main.from).toBe(0)
    expect(view.state.selection.main.to).toBe(5)
  })

  it('selects the whole line on triple click', () => {
    const { view, plugin } = createView('one\ntwo\n\nthree')
    const pos = 5
    vi.spyOn(view, 'posAtCoords').mockReturnValue(pos)

    plugin.handleMouseDown(createMouseEvent({ detail: 3 }))

    const line = view.state.doc.lineAt(pos)
    expect(view.state.selection.main.from).toBe(line.from)
    expect(view.state.selection.main.to).toBe(line.to)
  })

  it('selects the whole line on triple click even when nearby clicks map to different document offsets', () => {
    const { view, plugin } = createView('one\ntwo\n\nthree')
    vi.spyOn(view, 'posAtCoords')
      .mockReturnValueOnce(4)
      .mockReturnValueOnce(7)
      .mockReturnValueOnce(5)

    plugin.handleMouseDown(createMouseEvent({ clientX: 10, clientY: 10, detail: 1 }))
    plugin.handleMouseDown(createMouseEvent({ clientX: 11, clientY: 10, detail: 2 }))
    plugin.handleMouseDown(createMouseEvent({ clientX: 10, clientY: 11, detail: 3 }))

    const line = view.state.doc.lineAt(5)
    expect(view.state.selection.main.from).toBe(line.from)
    expect(view.state.selection.main.to).toBe(line.to)
  })

  it('prevents native browser selection on triple click mousedown', () => {
    const { view, plugin } = createView('one\ntwo\n\nthree')
    vi.spyOn(view, 'posAtCoords').mockReturnValue(5)

    const mouseEvent = createMouseEvent({ detail: 3 })
    plugin.handleMouseDown(mouseEvent)

    expect(mouseEvent.preventDefault).toHaveBeenCalledTimes(1)
    expect(mouseEvent.stopPropagation).toHaveBeenCalledTimes(1)
    expect(mouseEvent.stopImmediatePropagation).toHaveBeenCalledTimes(1)
  })

  it('selects the whole paragraph on quadruple click', () => {
    const { view, plugin } = createView('one\ntwo\n\nthree')
    const pos = 5
    vi.spyOn(view, 'posAtCoords').mockReturnValue(pos)

    plugin.handleMouseDown(createMouseEvent({ detail: 4 }))

    expect(view.state.selection.main.from).toBe(0)
    expect(view.state.selection.main.to).toBe(7)
  })

  it('selects the whole paragraph on quadruple click even when nearby clicks map to different document offsets', () => {
    const { view, plugin } = createView('one\ntwo\n\nthree')
    vi.spyOn(view, 'posAtCoords')
      .mockReturnValueOnce(4)
      .mockReturnValueOnce(7)
      .mockReturnValueOnce(5)
      .mockReturnValueOnce(6)

    plugin.handleMouseDown(createMouseEvent({ clientX: 10, clientY: 10, detail: 1 }))
    plugin.handleMouseDown(createMouseEvent({ clientX: 11, clientY: 10, detail: 2 }))
    plugin.handleMouseDown(createMouseEvent({ clientX: 10, clientY: 11, detail: 3 }))
    plugin.handleMouseDown(createMouseEvent({ clientX: 11, clientY: 11, detail: 4 }))

    expect(view.state.selection.main.from).toBe(0)
    expect(view.state.selection.main.to).toBe(7)
  })

  it('prevents native browser selection on quadruple click mousedown', () => {
    const { view, plugin } = createView('one\ntwo\n\nthree')
    vi.spyOn(view, 'posAtCoords').mockReturnValue(5)

    const mouseEvent = createMouseEvent({ detail: 4 })
    plugin.handleMouseDown(mouseEvent)

    expect(mouseEvent.preventDefault).toHaveBeenCalledTimes(1)
    expect(mouseEvent.stopPropagation).toHaveBeenCalledTimes(1)
    expect(mouseEvent.stopImmediatePropagation).toHaveBeenCalledTimes(1)
  })
})