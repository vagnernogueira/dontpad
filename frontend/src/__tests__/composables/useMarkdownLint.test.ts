import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { afterEach, describe, expect, it } from 'vitest'
import { useMarkdownLint } from '../../composables/useMarkdownLint'

describe('useMarkdownLint', () => {
  const activeViews: EditorView[] = []

  afterEach(() => {
    for (const view of activeViews) {
      view.destroy()
    }

    activeViews.length = 0
    document.body.innerHTML = ''
  })

  const createView = (doc: string) => {
    const parent = document.createElement('div')
    document.body.appendChild(parent)

    const view = new EditorView({
      state: EditorState.create({ doc }),
      parent,
    })

    activeViews.push(view)
    return view
  }

  it('opens the dialog state with lint issues for the current document', () => {
    const view = createView('#Titulo\n')
    const markdownLint = useMarkdownLint()

    markdownLint.openForView(view)

    expect(markdownLint.isDialogOpen.value).toBe(true)
    expect(markdownLint.issues.value).toHaveLength(1)
    expect(markdownLint.issues.value[0]?.ruleId).toBe('MD018')
  })

  it('applies a hotfix and refreshes the issue list', () => {
    const view = createView('#Titulo\n')
    const markdownLint = useMarkdownLint()

    markdownLint.openForView(view)
    const issue = markdownLint.issues.value[0]

    expect(issue?.fixInfo).not.toBeNull()

    const result = markdownLint.applyHotfix(view, issue!)

    expect(result).toBe('applied')
    expect(view.state.doc.toString()).toBe('# Titulo\n')
    expect(markdownLint.issues.value).toHaveLength(0)
    expect(markdownLint.statusMessage.value).toBe('Hotfix aplicado e lista atualizada.')
  })

  it('recalculates the list instead of applying a stale hotfix', () => {
    const view = createView('#Titulo\n')
    const markdownLint = useMarkdownLint()

    markdownLint.openForView(view)
    const staleIssue = markdownLint.issues.value[0]

    view.dispatch({
      changes: {
        from: view.state.doc.length,
        insert: 'texto',
      },
    })

    const result = markdownLint.applyHotfix(view, staleIssue!)

    expect(result).toBe('recomputed')
    expect(view.state.doc.toString()).toBe('#Titulo\ntexto')
    expect(markdownLint.issues.value.length).toBeGreaterThan(0)
    expect(markdownLint.issues.value.some((issue) => issue.ruleId === 'MD018')).toBe(true)
    expect(markdownLint.statusMessage.value).toBe('O documento mudou e a lista foi recalculada antes de aplicar o hotfix.')
  })
})