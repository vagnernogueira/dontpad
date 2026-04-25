import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { readConfig, resolveWsBaseUrl, type DontpadCliConfig } from './config'
import { readDocumentContent } from './document-api'
import { resolveDocumentReference } from './document-ref'

export interface SharedDocumentOptions {
  baseUrl?: string
  wsBaseUrl?: string
  masterPassword?: string
  password?: string
}

export interface ResolvedDocumentCommandContext {
  config: DontpadCliConfig | null
  documentId: string
  baseUrl: string
  wsBaseUrl: string
  masterPassword?: string
  password?: string
}

export async function resolveDocumentCommandContext(
  documentInput: string,
  options: SharedDocumentOptions,
): Promise<ResolvedDocumentCommandContext> {
  const config = await readConfig()
  const resolvedReference = resolveDocumentReference(documentInput, {
    configuredBaseUrl: config?.baseUrl,
    baseUrlOverride: options.baseUrl,
  })

  return {
    config,
    documentId: resolvedReference.documentId,
    baseUrl: resolvedReference.baseUrl,
    wsBaseUrl: options.wsBaseUrl
      ? resolveWsBaseUrl({ baseUrl: resolvedReference.baseUrl, wsBaseUrl: options.wsBaseUrl })
      : resolveWsBaseUrl({ baseUrl: resolvedReference.baseUrl, wsBaseUrl: config?.wsBaseUrl }),
    masterPassword: options.masterPassword ?? config?.masterPassword,
    password: options.password ?? resolvedReference.embeddedPassword,
  }
}

export async function readCurrentDocumentContent(
  context: Pick<ResolvedDocumentCommandContext, 'baseUrl' | 'documentId' | 'masterPassword' | 'password'>,
): Promise<string> {
  const result = await readDocumentContent({
    baseUrl: context.baseUrl,
    documentId: context.documentId,
    masterPassword: context.masterPassword,
    documentPassword: context.password,
  })

  return result.content
}

export async function writeMarkdownFile(filePath: string, content: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, content, 'utf8')
}