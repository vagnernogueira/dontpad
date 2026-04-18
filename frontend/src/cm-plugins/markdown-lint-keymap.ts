import { keymap } from '@codemirror/view'

export const MARKDOWN_LINT_SHORTCUT = 'Ctrl-Alt-l'
export const MARKDOWN_LINT_SHORTCUT_LABEL = 'Ctrl+Alt+L'

export function createMarkdownLintKeymap(onOpenMarkdownLint: () => void) {
  return keymap.of([
    {
      key: MARKDOWN_LINT_SHORTCUT,
      run: () => {
        onOpenMarkdownLint()
        return true
      },
    },
  ])
}