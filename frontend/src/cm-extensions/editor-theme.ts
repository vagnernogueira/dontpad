/**
 * Editor Theme Extension
 * 
 * Custom CodeMirror theme and syntax highlighting for markdown editing.
 * Combines visual theme with markdown-specific highlight styles.
 */

import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

interface ThemePalette {
  link: string
  inlineCodeBackground: string
  quote: string
  quoteBorder: string
  codeFence: string
  editorBackground: string
  editorSurface: string
  editorSurfaceShadow: string
  editorText: string
  editorMutedText: string
  editorCaret: string
  editorSelection: string
  editorActiveLine: string
  editorGutterText: string
  editorGutterActiveText: string
}

const lightPalette: ThemePalette = {
  link: '#0969da',
  inlineCodeBackground: '#e8eef2',
  quote: '#6a737d',
  quoteBorder: '#dfe2e5',
  codeFence: '#5a6872',
  editorBackground: '#f7f9fa',
  editorSurface: '#ffffff',
  editorSurfaceShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  editorText: '#1f2328',
  editorMutedText: '#9aa0a6',
  editorCaret: '#1f2328',
  editorSelection: 'rgba(59, 130, 246, 0.22)',
  editorActiveLine: '#f0f4f8',
  editorGutterText: '#999999',
  editorGutterActiveText: '#5a6872',
}

const darkPalette: ThemePalette = {
  link: '#7cc7ff',
  inlineCodeBackground: '#22303d',
  quote: '#9fb0c0',
  quoteBorder: '#33404d',
  codeFence: '#b6c2cf',
  editorBackground: '#0f141a',
  editorSurface: '#151b23',
  editorSurfaceShadow: '0 10px 24px -12px rgba(0, 0, 0, 0.55), 0 4px 8px -4px rgba(0, 0, 0, 0.35)',
  editorText: '#e6edf3',
  editorMutedText: '#8b949e',
  editorCaret: '#f0f6fc',
  editorSelection: 'rgba(56, 139, 253, 0.28)',
  editorActiveLine: '#1d2733',
  editorGutterText: '#7d8590',
  editorGutterActiveText: '#c9d1d9',
}

function createMarkdownHighlightStyle(palette: ThemePalette) {
  return HighlightStyle.define([
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: '700' },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
    { tag: tags.link, color: palette.link },
    {
      tag: tags.monospace,
      fontFamily: '"Fira Code", "Consolas", monospace',
      backgroundColor: palette.inlineCodeBackground,
      fontSize: '0.88em',
    },
    { tag: tags.quote, fontStyle: 'italic', color: palette.quote },
    {
      tag: tags.processingInstruction,
      fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
      color: palette.codeFence,
      fontSize: '0.88em',
    },
    { tag: tags.heading1, fontSize: '1.9em', fontWeight: '800', textDecoration: 'none' },
    { tag: tags.heading2, fontSize: '1.55em', fontWeight: '750', textDecoration: 'none' },
    { tag: tags.heading3, fontSize: '1.3em', fontWeight: '700', textDecoration: 'none' },
  ])
}

function createEditorVisualTheme(palette: ThemePalette, colorScheme: 'light' | 'dark') {
  return EditorView.theme(
    {
      '&': {
        height: '100%',
        color: 'var(--cm-editor-text)',
        backgroundColor: 'var(--cm-editor-bg)',
        colorScheme,
        '--cm-editor-bg': palette.editorBackground,
        '--cm-editor-surface': palette.editorSurface,
        '--cm-editor-surface-shadow': palette.editorSurfaceShadow,
        '--cm-editor-text': palette.editorText,
        '--cm-editor-muted-text': palette.editorMutedText,
        '--cm-editor-caret': palette.editorCaret,
        '--cm-editor-selection': palette.editorSelection,
        '--cm-editor-active-line': palette.editorActiveLine,
        '--cm-editor-gutter-text': palette.editorGutterText,
        '--cm-editor-gutter-active-text': palette.editorGutterActiveText,
        '--cm-inline-code-bg': palette.inlineCodeBackground,
        '--cm-quote-color': palette.quote,
        '--cm-quote-border': palette.quoteBorder,
      },
      '.cm-scroller': {
        overflow: 'auto',
        backgroundColor: 'var(--cm-editor-bg)',
      },
      '.cm-content': {
        color: 'var(--cm-editor-text)',
        caretColor: 'var(--cm-editor-caret)',
      },
      '.cm-gutters': {
        backgroundColor: 'var(--cm-editor-bg)',
        color: 'var(--cm-editor-gutter-text)',
        border: 'none',
      },
      '.cm-activeLine': {
        backgroundColor: 'var(--cm-editor-active-line)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'var(--cm-editor-active-line)',
        color: 'var(--cm-editor-gutter-active-text)',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--cm-editor-caret)',
      },
      '.cm-line.cm-codeBlock': {
        background: 'transparent !important',
        fontFamily: 'inherit !important',
        fontSize: 'inherit !important',
        color: 'var(--cm-editor-text) !important',
      },
      '.cm-header, .cm-heading, .cm-heading1, .cm-heading2, .cm-heading3, .cm-formatting-header, .cm-formatting-heading': {
        textDecoration: 'none !important',
        borderBottom: 'none !important',
      },
      '.cm-line.cm-header, .cm-line.cm-heading': {
        textDecoration: 'none !important',
        borderBottom: 'none !important',
      },
    },
    { dark: colorScheme === 'dark' },
  )
}
export const markdownHighlightStyle = createMarkdownHighlightStyle(lightPalette)
export const darkMarkdownHighlightStyle = createMarkdownHighlightStyle(darkPalette)
export const editorVisualTheme = createEditorVisualTheme(lightPalette, 'light')
export const darkEditorVisualTheme = createEditorVisualTheme(darkPalette, 'dark')

/**
 * Complete editor theme (visual + syntax highlighting) — LIGHT
 * Export as array to be spread into extensions
 */
export const editorTheme = [
  syntaxHighlighting(markdownHighlightStyle),
  editorVisualTheme,
]

export const darkEditorTheme = [
  syntaxHighlighting(darkMarkdownHighlightStyle),
  darkEditorVisualTheme,
]

export function getEditorTheme(isDark: boolean) {
  return isDark ? darkEditorTheme : editorTheme
}
