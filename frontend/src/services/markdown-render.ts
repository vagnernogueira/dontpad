import DOMPurify from 'dompurify'
import { marked } from 'marked'

export async function markdownToSafeHtml(content: string): Promise<string> {
  const renderedHtml = await marked.parse(content, { breaks: true, gfm: true })

  return DOMPurify.sanitize(renderedHtml, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'style'],
  })
}

export function wrapMarkdownDocument(htmlContent: string, htmlStyles: string): string {
  return `${htmlStyles}<div class="markdown-body">${htmlContent}</div>`
}

export async function renderMarkdownDocument(content: string, htmlStyles: string): Promise<string> {
  const htmlContent = await markdownToSafeHtml(content)
  return wrapMarkdownDocument(htmlContent, htmlStyles)
}