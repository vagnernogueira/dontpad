import { keymap } from '@codemirror/view'

export function createOpenRawDocumentKeymap(onOpenRawDocument: () => void) {
  return keymap.of([
    {
      key: 'Mod-u',
      run: () => {
        onOpenRawDocument()
        return true
      },
    },
  ])
}