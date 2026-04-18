import { applyFixes, type Configuration, type LintError } from 'markdownlint'
import { lint } from 'markdownlint/sync'

const LINT_SOURCE_KEY = 'current-document'

// Keep the initial profile useful for free-form notes instead of enforcing doc-site conventions.
export const markdownLintConfig: Configuration = {
  default: true,
  MD013: false,
  MD025: false,
  MD033: false,
  MD040: false,
  MD041: false,
}

export interface MarkdownLintIssue {
  key: string
  line: number
  ruleId: string
  ruleAlias: string | null
  description: string
  detail: string | null
  context: string | null
  severity: LintError['severity']
  fixInfo: LintError['fixInfo']
  documentationUrl: string | null
  rawError: LintError
}

export interface MarkdownLintTextChange {
  from: number
  to: number
  insert: string
}

const createIssueKey = (error: LintError, index: number) => {
  return [
    error.lineNumber,
    error.ruleNames.join('/'),
    error.errorDetail ?? '',
    error.errorContext ?? '',
    index,
  ].join(':')
}

const normalizeLintError = (error: LintError, index: number): MarkdownLintIssue => {
  const [ruleId = 'unknown-rule', ...aliases] = error.ruleNames

  return {
    key: createIssueKey(error, index),
    line: error.lineNumber,
    ruleId,
    ruleAlias: aliases.length > 0 ? aliases.join(', ') : null,
    description: error.ruleDescription,
    detail: error.errorDetail,
    context: error.errorContext,
    severity: error.severity,
    fixInfo: error.fixInfo,
    documentationUrl: error.ruleInformation,
    rawError: error,
  }
}

export function lintMarkdownContent(markdown: string): MarkdownLintIssue[] {
  const results = lint({
    strings: {
      [LINT_SOURCE_KEY]: markdown,
    },
    config: markdownLintConfig,
    handleRuleFailures: true,
  })

  return (results[LINT_SOURCE_KEY] ?? [])
    .map(normalizeLintError)
    .sort((left, right) => left.line - right.line || left.ruleId.localeCompare(right.ruleId))
}

export function applyMarkdownLintIssue(markdown: string, issue: MarkdownLintIssue): string {
  return applyFixes(markdown, [issue.rawError])
}

export function computeTextChange(before: string, after: string): MarkdownLintTextChange | null {
  if (before === after) {
    return null
  }

  let start = 0

  while (start < before.length && start < after.length && before[start] === after[start]) {
    start += 1
  }

  let beforeEnd = before.length - 1
  let afterEnd = after.length - 1

  while (beforeEnd >= start && afterEnd >= start && before[beforeEnd] === after[afterEnd]) {
    beforeEnd -= 1
    afterEnd -= 1
  }

  return {
    from: start,
    to: beforeEnd + 1,
    insert: after.slice(start, afterEnd + 1),
  }
}

export function computeMarkdownLintIssueChange(markdown: string, issue: MarkdownLintIssue): MarkdownLintTextChange | null {
  if (!issue.fixInfo) {
    return null
  }

  const fixedMarkdown = applyMarkdownLintIssue(markdown, issue)

  return computeTextChange(markdown, fixedMarkdown)
}