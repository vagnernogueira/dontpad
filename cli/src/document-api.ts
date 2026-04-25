interface JsonRequestOptions {
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string
}

export interface ReadDocumentContentOptions {
  baseUrl: string
  documentId: string
  masterPassword?: string
  documentPassword?: string
}

export interface ReadDocumentContentResult {
  content: string
  route: 'GET /api/document-content' | 'GET /api/public-document-content'
}

async function fetchJson(url: string, options: JsonRequestOptions = {}): Promise<Response> {
  try {
    return await fetch(url, options)
  } catch {
    throw new Error(
      `Failed to reach Dontpad at ${url}. Confirm the instance URL and that the backend is running.`,
    )
  }
}

async function parseJsonPayload(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

function getContentFromPayload(payload: Record<string, unknown>): string {
  return typeof payload.content === 'string' ? payload.content : ''
}

export async function readDocumentContent(
  options: ReadDocumentContentOptions,
): Promise<ReadDocumentContentResult> {
  if (options.masterPassword) {
    const response = await fetchJson(
      `${options.baseUrl}/api/document-content?documentId=${encodeURIComponent(options.documentId)}`,
      {
        headers: {
          'x-docs-password': options.masterPassword,
        },
      },
    )

    if (response.status === 403) {
      throw new Error(
        'Master password rejected by GET /api/document-content. Update the CLI config or rerun with --master-password <password>.',
      )
    }

    if (!response.ok) {
      throw new Error(
        `GET /api/document-content failed with HTTP ${response.status}. Confirm the document path and backend availability.`,
      )
    }

    return {
      content: getContentFromPayload(await parseJsonPayload(response)),
      route: 'GET /api/document-content',
    }
  }

  const requestUrl = new URL(`${options.baseUrl}/api/public-document-content`)
  requestUrl.searchParams.set('documentId', options.documentId)
  if (options.documentPassword) {
    requestUrl.searchParams.set('password', options.documentPassword)
  }

  const response = await fetchJson(requestUrl.toString())
  if (response.status === 403) {
    throw new Error(
      'Document password rejected by GET /api/public-document-content. Rerun with --password <password> or configure a master password.',
    )
  }

  if (!response.ok) {
    throw new Error(
      `GET /api/public-document-content failed with HTTP ${response.status}. Confirm the document path or provide access credentials.`,
    )
  }

  return {
    content: getContentFromPayload(await parseJsonPayload(response)),
    route: 'GET /api/public-document-content',
  }
}