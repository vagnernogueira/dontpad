/**
 * Markdown Parsing Utilities
 * 
 * Funções centralizadas para parsing de links e URLs em documentos Markdown.
 * Reduz duplicação de regex e garante consistência entre plugins.
 */

import type { Text } from '@codemirror/state'

/**
 * Range no documento
 */
export interface Range {
  from: number
  to: number
}

/**
 * Link Markdown com sua URL
 */
export interface MarkdownLink extends Range {
  url: string
  isImage: boolean
}

/**
 * URL avulsa (plain URL)
 */
export interface PlainUrl extends Range {
  url: string
}

/**
 * Regex para links Markdown: [texto](url) ou ![alt](url)
 */
const MARKDOWN_LINK_REGEX = /(!?)\[([^\]]*)\]\(([^)]+)\)/g

/**
 * Regex para URLs avulsas
 */
const PLAIN_URL_REGEX = /\b(https?:\/\/|www\.|ftp:\/\/)[^\s<>"\[\](){}]+/gi

/**
 * Encontra todos os links Markdown em um texto
 * 
 * @param text - Texto a ser analisado
 * @param offset - Offset inicial para calcular posições absolutas
 * @returns Array de links encontrados
 */
export function findMarkdownLinks(text: string, offset: number = 0): MarkdownLink[] {
  const links: MarkdownLink[] = []
  const regex = new RegExp(MARKDOWN_LINK_REGEX)
  let match
  
  while ((match = regex.exec(text))) {
    links.push({
      from: offset + match.index,
      to: offset + match.index + match[0].length,
      url: match[3],
      isImage: match[1] === '!'
    })
  }
  
  return links
}

/**
 * Encontra todas as URLs avulsas em um texto, exceto as que estão em links Markdown
 * 
 * @param text - Texto a ser analisado
 * @param offset - Offset inicial para calcular posições absolutas
 * @returns Array de URLs avulsas
 */
export function findPlainUrls(text: string, offset: number = 0): PlainUrl[] {
  const plainUrls: PlainUrl[] = []
  
  // Primeiro encontra todos os links markdown para excluí-los
  const markdownLinks = findMarkdownLinks(text, 0)
  const markdownRanges = markdownLinks.map(link => ({
    from: link.from - offset,
    to: link.to - offset
  }))
  
  // Agora encontra URLs avulsas
  const regex = new RegExp(PLAIN_URL_REGEX)
  let match
  
  while ((match = regex.exec(text))) {
    const urlStart = match.index
    const urlEnd = match.index + match[0].length
    
    // Verifica se está dentro de um link markdown
    const isInsideMarkdownLink = markdownRanges.some(
      range => urlStart >= range.from && urlEnd <= range.to
    )
    
    if (!isInsideMarkdownLink) {
      plainUrls.push({
        from: offset + urlStart,
        to: offset + urlEnd,
        url: match[0]
      })
    }
  }
  
  return plainUrls
}

/**
 * Encontra link Markdown ou URL avulsa em uma posição específica
 * 
 * @param doc - Documento do CodeMirror
 * @param pos - Posição a verificar
 * @returns URL e range se encontrado, null caso contrário
 */
export function findUrlAtPosition(doc: Text, pos: number): { url: string, range: Range } | null {
  const line = doc.lineAt(pos)
  const lineText = line.text
  
  // Verifica links markdown primeiro
  const markdownLinks = findMarkdownLinks(lineText, line.from)
  for (const link of markdownLinks) {
    if (pos >= link.from && pos <= link.to) {
      return {
        url: link.url,
        range: { from: link.from, to: link.to }
      }
    }
  }
  
  // Verifica URLs avulsas
  const plainUrls = findPlainUrls(lineText, line.from)
  for (const url of plainUrls) {
    if (pos >= url.from && pos <= url.to) {
      return {
        url: url.url,
        range: { from: url.from, to: url.to }
      }
    }
  }
  
  return null
}

/**
 * Verifica se uma posição está dentro de um link Markdown
 * 
 * @param text - Texto da linha
 * @param posInLine - Posição relativa na linha
 * @returns true se está dentro de um link Markdown
 */
export function isInsideMarkdownLink(text: string, posInLine: number): boolean {
  const links = findMarkdownLinks(text, 0)
  return links.some(link => posInLine >= link.from && posInLine <= link.to)
}

/**
 * Normaliza URL adicionando protocolo se necessário
 * 
 * @param url - URL a normalizar
 * @returns URL com protocolo
 */
export function normalizeUrl(url: string): string {
  if (url.startsWith('www.')) {
    return 'https://' + url
  }
  if (!url.match(/^[a-z]+:\/\//i)) {
    return 'https://' + url
  }
  return url
}
