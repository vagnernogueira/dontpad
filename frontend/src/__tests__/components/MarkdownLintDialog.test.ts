import { cleanup, fireEvent, render, screen } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MarkdownLintDialog from '../../components/MarkdownLintDialog.vue'
import { lintMarkdownContent, type MarkdownLintIssue } from '../../services/markdown-lint'

const dialogStubs = {
  Dialog: { props: ['open'], template: '<div v-if="open"><slot /></div>' },
  DialogContent: { template: '<div><slot /></div>' },
  DialogHeader: { template: '<div><slot /></div>' },
  DialogTitle: { template: '<div><slot /></div>' },
  DialogDescription: { template: '<div><slot /></div>' },
  ScrollArea: { template: '<div><slot /></div>' },
  Table: { template: '<table><slot /></table>' },
  TableHeader: { template: '<thead><slot /></thead>' },
  TableBody: { template: '<tbody><slot /></tbody>' },
  TableRow: { template: '<tr><slot /></tr>' },
  TableHead: { template: '<th><slot /></th>' },
  TableCell: { template: '<td><slot /></td>' },
  Badge: { template: '<span><slot /></span>' },
  Button: {
    emits: ['click'],
    template: '<button type="button" @click="$emit(\'click\')"><slot /></button>',
  },
}

function createIssues(): { issueWithFix: MarkdownLintIssue; issueWithoutFix: MarkdownLintIssue } {
  const [issueWithFix] = lintMarkdownContent('#Titulo\n')
  const issueWithoutFix: MarkdownLintIssue = {
    ...issueWithFix,
    key: 'md041-no-fix',
    ruleId: 'MD041',
    ruleAlias: 'first-line-heading, first-line-h1',
    description: 'First line in a file should be a top-level heading',
    detail: null,
    context: 'texto inicial',
    fixInfo: null,
    documentationUrl: null,
    rawError: {
      ...issueWithFix.rawError,
      ruleNames: ['MD041', 'first-line-heading', 'first-line-h1'],
      ruleDescription: 'First line in a file should be a top-level heading',
      errorDetail: null,
      errorContext: 'texto inicial',
      fixInfo: null,
      ruleInformation: null,
    },
  }

  return { issueWithFix, issueWithoutFix }
}

describe('MarkdownLintDialog', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows the empty state when there are no lint issues', async () => {
    render(MarkdownLintDialog, {
      props: {
        open: true,
        issues: [],
      },
      global: {
        stubs: dialogStubs,
      },
    })

    expect(await screen.findByText('Nenhuma inconformidade encontrada para o conteudo atual.')).toBeInTheDocument()
  })

  it('renders issue details and only offers hotfix when fix metadata exists', async () => {
    const onApplyHotfix = vi.fn()
    const { issueWithFix, issueWithoutFix } = createIssues()

    render(MarkdownLintDialog, {
      props: {
        open: true,
        issues: [issueWithFix, issueWithoutFix],
        'onApply-hotfix': onApplyHotfix,
      },
      global: {
        stubs: dialogStubs,
      },
    })

    expect(await screen.findByText('Lint de Markdown')).toBeInTheDocument()
    expect(screen.getAllByText(String(issueWithFix.line))).toHaveLength(2)
    expect(screen.getByText(issueWithFix.ruleId)).toBeInTheDocument()
    expect(screen.getByText(issueWithFix.description)).toBeInTheDocument()
    expect(screen.getByText('Sem hotfix')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Hotfix' }))

    expect(onApplyHotfix).toHaveBeenCalledWith(issueWithFix)
  })
})