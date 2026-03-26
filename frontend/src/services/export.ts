/**
 * Export Service
 * 
 * Handles markdown and PDF export functionality.
 * Decoupled from UI to enable reuse and testing.
 */

import { markdownStyles } from './pdf-styles'

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
  htmlStyles: string = markdownStyles
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
    html2canvas: { 
      scale: 2, 
      useCORS: true,
      onclone: (clonedDoc: Document, clonedElement: HTMLElement) => {
        clonedElement.style.setProperty('--background', '#ffffff', 'important')
        clonedElement.style.setProperty('--foreground', '#1f2937', 'important')
        clonedElement.style.setProperty('--card', '#ffffff', 'important')
        clonedElement.style.setProperty('--card-foreground', '#1f2937', 'important')
        clonedElement.style.setProperty('--popover', '#ffffff', 'important')
        clonedElement.style.setProperty('--popover-foreground', '#1f2937', 'important')
        clonedElement.style.setProperty('--primary', '#8b5cf6', 'important')
        clonedElement.style.setProperty('--primary-foreground', '#ffffff', 'important')
        clonedElement.style.setProperty('--secondary', '#f3f4f6', 'important')
        clonedElement.style.setProperty('--secondary-foreground', '#1f2937', 'important')
        clonedElement.style.setProperty('--muted', '#f3f4f6', 'important')
        clonedElement.style.setProperty('--muted-foreground', '#6b7280', 'important')
        clonedElement.style.setProperty('--accent', '#f3f4f6', 'important')
        clonedElement.style.setProperty('--accent-foreground', '#1f2937', 'important')
        clonedElement.style.setProperty('--destructive', '#ef4444', 'important')
        clonedElement.style.setProperty('--destructive-foreground', '#ffffff', 'important')
        clonedElement.style.setProperty('--border', '#e5e7eb', 'important')
        clonedElement.style.setProperty('--input', '#e5e7eb', 'important')
        clonedElement.style.setProperty('--ring', '#8b5cf6', 'important')

        clonedElement.style.backgroundColor = '#ffffff'
        clonedElement.style.color = '#1f2937'

        const style = clonedDoc.createElement('style')
        style.textContent = `
          * {
            color: #1f2937 !important;
            background-color: #ffffff !important;
            border-color: #e5e7eb !important;
          }
          :root {
            --background: #ffffff !important;
            --foreground: #1f2937 !important;
            --card: #ffffff !important;
            --card-foreground: #1f2937 !important;
            --popover: #ffffff !important;
            --popover-foreground: #1f2937 !important;
            --primary: #8b5cf6 !important;
            --primary-foreground: #ffffff !important;
            --secondary: #f3f4f6 !important;
            --secondary-foreground: #1f2937 !important;
            --muted: #f3f4f6 !important;
            --muted-foreground: #6b7280 !important;
            --accent: #f3f4f6 !important;
            --accent-foreground: #1f2937 !important;
            --destructive: #ef4444 !important;
            --destructive-foreground: #ffffff !important;
            --border: #e5e7eb !important;
            --input: #e5e7eb !important;
            --ring: #8b5cf6 !important;
          }
        `
        clonedDoc.head.appendChild(style)
      }
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }

  // Generate and download PDF
  // @ts-expect-error html2pdf.js does not provide complete call-chain typings
  html2pdf().set(opt).from(container).save()
}

export default {
  downloadMarkdown,
  markdownToHtml,
  downloadPDF
}
