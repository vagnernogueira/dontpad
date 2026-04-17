import { describe, expect, it } from 'vitest'
import { darkEditorTheme, editorTheme, getEditorTheme } from '../../cm-extensions/editor-theme'

describe('editor-theme', () => {
  it('selects the correct theme bundle for each color mode', () => {
    expect(darkEditorTheme).not.toBe(editorTheme)
    expect(getEditorTheme(false)).toBe(editorTheme)
    expect(getEditorTheme(true)).toBe(darkEditorTheme)
  })
})