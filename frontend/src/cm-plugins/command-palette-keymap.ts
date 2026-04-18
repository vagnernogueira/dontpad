import { keymap } from '@codemirror/view'

export function createCommandPaletteKeymap(onOpenCommandPalette: () => void) {
  return keymap.of([
    {
      key: 'Ctrl-Alt-Space',
      run: () => {
        onOpenCommandPalette()
        return true
      },
    },
  ])
}