/**
 * Editor Theme Extension
 * 
 * Custom CodeMirror theme and syntax highlighting for markdown editing.
 * Combines visual theme with markdown-specific highlight styles.
 */

import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'

/**
 * Markdown-specific syntax highlighting
 */
export const markdownHighlightStyle = HighlightStyle.define([
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  // Links do markdown (sem underline para não afetar checkboxes e imagens)
  { tag: tags.link, color: '#0969da' },
  // Código inline (entre acentos graves simples)
  {
    tag: tags.monospace,
    fontFamily: '"Fira Code", "Consolas", monospace',
    backgroundColor: '#e8eef2',
    fontSize: '0.88em'
  },
  { tag: tags.quote, fontStyle: 'italic', color: '#6a737d' },
  // Blocos de código delimitados por ``` (code fences)
  {
    tag: tags.processingInstruction,
    fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
    color: '#5a6872',
    fontSize: '0.88em'
  },
  // Heading styles LAST para máxima precedência (removem underline acidentalmente herdado)
  { tag: tags.heading1, fontSize: '1.9em', fontWeight: '800', textDecoration: 'none' },
  { tag: tags.heading2, fontSize: '1.55em', fontWeight: '750', textDecoration: 'none' },
  { tag: tags.heading3, fontSize: '1.3em', fontWeight: '700', textDecoration: 'none' }
])

/**
 * Custom editor visual theme
 */
export const editorVisualTheme = EditorView.theme({
  "&": { height: "100%" },
  ".cm-scroller": { overflow: "auto" },
  // Desabilita estilo de código para blocos indentados (4 espaços)
  // Mantém apenas blocos delimitados por ``` (code fences)
  ".cm-line.cm-codeBlock": {
    background: "transparent !important",
    fontFamily: "inherit !important",
    fontSize: "inherit !important",
    color: "inherit !important"
  },
  ".cm-header, .cm-heading, .cm-heading1, .cm-heading2, .cm-heading3, .cm-formatting-header, .cm-formatting-heading": {
    textDecoration: "none !important",
    borderBottom: "none !important"
  },
  ".cm-line.cm-header, .cm-line.cm-heading": {
    textDecoration: "none !important",
    borderBottom: "none !important"
  }
})

/**
 * Complete editor theme (visual + syntax highlighting) — LIGHT
 * Export as array to be spread into extensions
 */
export const editorTheme = [
  syntaxHighlighting(markdownHighlightStyle),
  editorVisualTheme
]

// ── Dark theme ────────────────────────────────────────────────────────────────

export const darkMarkdownHighlightStyle = HighlightStyle.define([
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: '#6c5ce7' },                        // midnight-bloom primary
  {
    tag: tags.monospace,
    fontFamily: '"Fira Code", "Consolas", monospace',
    backgroundColor: '#2f3436',                                 // midnight-bloom card
    fontSize: '0.88em'
  },
  { tag: tags.quote, fontStyle: 'italic', color: '#a3a3a3' }, // midnight-bloom muted-foreground
  {
    tag: tags.processingInstruction,
    fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
    color: '#a3a3a3',
    fontSize: '0.88em'
  },
  { tag: tags.heading1, fontSize: '1.9em', fontWeight: '800', textDecoration: 'none' },
  { tag: tags.heading2, fontSize: '1.55em', fontWeight: '750', textDecoration: 'none' },
  { tag: tags.heading3, fontSize: '1.3em', fontWeight: '700', textDecoration: 'none' }
])

export const darkEditorVisualTheme = EditorView.theme({
  "&": { height: "100%", backgroundColor: "#1a1d23", color: "#e5e5e5" }, // midnight-bloom bg / fg
  ".cm-scroller": { overflow: "auto" },
  ".cm-content": { caretColor: "#e5e5e5" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#6c5ce7" }, // primary
  ".cm-selectionBackground, .cm-focused .cm-selectionBackground": { backgroundColor: "#444444" }, // muted
  "::selection": { backgroundColor: "#444444" },
  ".cm-gutters": { backgroundColor: "#1a1d23", color: "#a3a3a3", borderRight: "1px solid #444444" },
  ".cm-activeLineGutter": { backgroundColor: "#2f3436" },     // card
  ".cm-activeLine": { backgroundColor: "#2f343660" },
  ".cm-line.cm-codeBlock": {
    background: "transparent !important",
    fontFamily: "inherit !important",
    fontSize: "inherit !important",
    color: "inherit !important"
  },
  ".cm-header, .cm-heading, .cm-heading1, .cm-heading2, .cm-heading3, .cm-formatting-header, .cm-formatting-heading": {
    textDecoration: "none !important",
    borderBottom: "none !important"
  },
  ".cm-line.cm-header, .cm-line.cm-heading": {
    textDecoration: "none !important",
    borderBottom: "none !important"
  }
}, { dark: true })

/**
 * Complete editor theme (visual + syntax highlighting) — DARK
 */
export const darkEditorTheme = [
  syntaxHighlighting(darkMarkdownHighlightStyle),
  darkEditorVisualTheme
]
