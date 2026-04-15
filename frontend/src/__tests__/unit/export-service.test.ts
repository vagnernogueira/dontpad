import { describe, expect, it } from 'vitest'
import { markdownToHtml, renderMarkdownDocument } from '../../services/export'

describe('export service', () => {
  it('sanitizes dangerous html from markdown output', async () => {
    const html = await markdownToHtml('Hello<script>alert(1)</script><img src="x" onerror="alert(1)">')

    expect(html).toContain('Hello')
    expect(html).toContain('<img src="x">')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
  })

  it('wraps rendered markdown in the expected document container', async () => {
    const html = await renderMarkdownDocument('# Title', '<style>.markdown-body{color:black;}</style>')

    expect(html).toContain('<div class="markdown-body">')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('.markdown-body{color:black;}')
  })
})