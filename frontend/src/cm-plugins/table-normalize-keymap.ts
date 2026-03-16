import { keymap } from '@codemirror/view'
import { normalizeMarkdownTable } from '../cm-commands'

export const tableNormalizeKeymap = keymap.of([
  {
    key: 'Alt-Shift-t',
    run: normalizeMarkdownTable
  }
])