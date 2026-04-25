import { normalizeBaseUrl } from './config'

export interface ResolveDocumentReferenceOptions {
  configuredBaseUrl?: string
  baseUrlOverride?: string
}

export interface ResolvedDocumentReference {
  documentId: string
  baseUrl: string
  inputKind: 'path' | 'url'
  embeddedPassword?: string
}

function decodePathSegments(value: string): string {
  return value
    .split('/')
    .map((segment) => {
      try {
        return decodeURIComponent(segment)
      } catch {
        return segment
      }
    })
    .join('/')
}

export function normalizeDocumentId(rawValue: string): string {
  const trimmed = decodePathSegments(rawValue.trim())
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')

  return trimmed || 'default'
}

function tryParseAbsoluteUrl(value: string): URL | null {
  try {
    const parsed = new URL(value)
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed : null
  } catch {
    return null
  }
}

function stripBasePath(pathname: string, baseUrl: string): string {
  const basePath = new URL(baseUrl).pathname.replace(/\/+$/, '')

  if (!basePath || basePath === '/') {
    return pathname
  }

  if (pathname === basePath) {
    return '/'
  }

  if (pathname.startsWith(`${basePath}/`)) {
    return pathname.slice(basePath.length)
  }

  return pathname
}

export function resolveDocumentReference(
  rawInput: string,
  options: ResolveDocumentReferenceOptions = {},
): ResolvedDocumentReference {
  const input = rawInput.trim()
  if (!input) {
    throw new Error('Document path or URL is required.')
  }

  const parsedUrl = tryParseAbsoluteUrl(input)
  const configuredBaseUrl = options.configuredBaseUrl
    ? normalizeBaseUrl(options.configuredBaseUrl)
    : undefined
  const baseUrlOverride = options.baseUrlOverride ? normalizeBaseUrl(options.baseUrlOverride) : undefined

  if (!parsedUrl) {
    const baseUrl = baseUrlOverride ?? configuredBaseUrl

    if (!baseUrl) {
      throw new Error(
        'A configured baseUrl or --base-url <url> is required when the document is provided as a path.',
      )
    }

    return {
      documentId: normalizeDocumentId(input),
      baseUrl,
      inputKind: 'path',
    }
  }

  const explicitOrConfiguredBaseUrl = baseUrlOverride
    ?? (configuredBaseUrl && new URL(configuredBaseUrl).origin === parsedUrl.origin ? configuredBaseUrl : undefined)
  const baseUrl = explicitOrConfiguredBaseUrl ?? parsedUrl.origin

  return {
    documentId: normalizeDocumentId(stripBasePath(parsedUrl.pathname, baseUrl)),
    baseUrl,
    inputKind: 'url',
    ...(parsedUrl.searchParams.get('password')?.trim()
      ? { embeddedPassword: parsedUrl.searchParams.get('password')!.trim() }
      : {}),
  }
}