import type { EditorView } from '@codemirror/view'
import { ref } from 'vue'
import {
  computeMarkdownLintIssueChange,
  lintMarkdownContent,
  type MarkdownLintIssue,
} from '../services/markdown-lint'

export type MarkdownLintApplyResult = 'applied' | 'noop' | 'recomputed'

export function useMarkdownLint() {
  const isDialogOpen = ref(false)
  const issues = ref<MarkdownLintIssue[]>([])
  const lastAnalyzedContent = ref('')
  const statusMessage = ref('')
  const errorMessage = ref('')

  const runLint = (markdown: string) => {
    try {
      issues.value = lintMarkdownContent(markdown)
      errorMessage.value = ''
    } catch {
      issues.value = []
      errorMessage.value = 'Nao foi possivel analisar o conteudo Markdown atual.'
    }

    lastAnalyzedContent.value = markdown
    isDialogOpen.value = true
  }

  const openForView = (view: EditorView) => {
    statusMessage.value = ''
    runLint(view.state.doc.toString())
  }

  const closeDialog = () => {
    isDialogOpen.value = false
    statusMessage.value = ''
    errorMessage.value = ''
  }

  const applyHotfix = (view: EditorView, issue: MarkdownLintIssue): MarkdownLintApplyResult => {
    const currentContent = view.state.doc.toString()
    statusMessage.value = ''

    if (currentContent !== lastAnalyzedContent.value) {
      runLint(currentContent)
      statusMessage.value = 'O documento mudou e a lista foi recalculada antes de aplicar o hotfix.'
      return 'recomputed'
    }

    const change = computeMarkdownLintIssueChange(currentContent, issue)

    if (!change) {
      runLint(currentContent)
      statusMessage.value = 'Nenhuma alteracao automatica estava disponivel para este item.'
      return 'noop'
    }

    view.dispatch({ changes: change })
    runLint(view.state.doc.toString())
    statusMessage.value = 'Hotfix aplicado e lista atualizada.'
    return 'applied'
  }

  return {
    isDialogOpen,
    issues,
    statusMessage,
    errorMessage,
    openForView,
    closeDialog,
    applyHotfix,
  }
}