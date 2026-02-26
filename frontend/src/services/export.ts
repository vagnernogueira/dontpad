/**
 * Export Service
 * 
 * Handles markdown and PDF export functionality.
 * Decoupled from UI to enable reuse and testing.
 */

/**
 * Export document content as Markdown file
 * @param content - The markdown content to export
 * @param filename - Name of the file (without .md extension)
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Parse markdown to HTML using marked library
 * @param content - The markdown content to parse
 * @returns Promise resolving to HTML string
 */
export async function markdownToHtml(content: string): Promise<string> {
  const { marked } = await import('marked')
  return marked.parse(content, { breaks: true, gfm: true })
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
  htmlStyles: string = ''
): Promise<void> {
  const [{ default: html2pdf }, htmlContent] = await Promise.all([
    import('html2pdf.js'),
    markdownToHtml(content)
  ])

  // Create container for PDF rendering
  const container = document.createElement('div')
  container.className = 'pdf-export-container'
  container.style.padding = '2rem'
  container.style.color = 'black'
  container.style.backgroundColor = 'white'
  container.innerHTML = `
    ${htmlStyles}
    <div class="markdown-body">
      ${htmlContent}
    </div>
  `

  // Set max-width on images
  const images = container.querySelectorAll('img')
  images.forEach(img => {
    img.style.maxWidth = '100%'
    img.style.height = 'auto'
  })

  // PDF options
  const opt = {
    margin: 15,
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }

  // Generate and download PDF
  // @ts-ignore
  html2pdf().set(opt).from(container).save()
}

export default {
  downloadMarkdown,
  markdownToHtml,
  downloadPDF
}
