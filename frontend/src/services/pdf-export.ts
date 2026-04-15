import { renderMarkdownDocument } from './markdown-render'
import { markdownStyles } from './pdf-styles'

const PDF_EXPORT_ERROR_MESSAGE = 'Nao foi possivel gerar o PDF.'

export async function downloadPdfDocument(
  content: string,
  filename: string,
  htmlStyles: string = markdownStyles
): Promise<void> {
  const [{ default: html2pdf }, renderedDocument] = await Promise.all([
    import('html2pdf.js'),
    renderMarkdownDocument(content, htmlStyles),
  ])

  const container = document.createElement('div')
  container.className = 'pdf-export-container'
  container.style.padding = '2rem'
  container.style.color = 'black'
  container.style.backgroundColor = 'white'
  container.innerHTML = renderedDocument

  const images = container.querySelectorAll('img')
  images.forEach(img => {
    img.style.maxWidth = '100%'
    img.style.height = 'auto'
  })

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
      },
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  }

  try {
    // @ts-expect-error html2pdf.js does not provide complete call-chain typings
    await html2pdf().set(opt).from(container).save()
  } catch {
    throw new Error(PDF_EXPORT_ERROR_MESSAGE)
  }
}