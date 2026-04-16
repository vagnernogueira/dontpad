/**
 * Export Service
 * 
 * Handles markdown and PDF export functionality.
 * Decoupled from UI to enable reuse and testing.
 */

import { markdownStyles } from './pdf-styles'

const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export document content as Markdown file
 * @param content - The markdown content to export
 * @param filename - Name of the file (without .md extension)
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  triggerDownload(blob, `${filename}.md`)
}

export function downloadZip(blob: Blob, filename: string): void {
  triggerDownload(blob, `${filename}.zip`)
}

/**
 * Parse markdown to HTML using marked library
 * @param content - The markdown content to parse
 * @returns Promise resolving to HTML string
 */
export async function markdownToHtml(content: string): Promise<string> {
  const { markdownToSafeHtml } = await import('./markdown-render')
  return markdownToSafeHtml(content)
}

export async function renderMarkdownDocument(
  content: string,
  htmlStyles: string = markdownStyles
): Promise<string> {
  const { renderMarkdownDocument: renderDocumentHtml } = await import('./markdown-render')
  return renderDocumentHtml(content, htmlStyles)
}

/**
 * Export document as PDF
 * @param content - The markdown content to export
 * @param filename - Name of the file (without .pdf extension)
 * @param htmlStyles - Optional CSS styles to apply to the PDF
 */
export async function downloadPDF(
  content: string,
  filename: string,
  htmlStyles: string = markdownStyles
): Promise<void> {
  const { downloadPdfDocument } = await import('./pdf-export')
  return downloadPdfDocument(content, filename, htmlStyles)
}

export default {
  downloadMarkdown,
  downloadZip,
  markdownToHtml,
  renderMarkdownDocument,
  downloadPDF
}
