import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import NodeWebSocket from 'ws'

const CONNECTION_TIMEOUT_MS = 5000
const VERIFY_TIMEOUT_MS = 4000
const VERIFY_INTERVAL_MS = 100

export interface SyncDocumentContentOptions {
  wsBaseUrl: string
  documentId: string
  content: string
  password?: string
  readBack: () => Promise<string>
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function waitForInitialSync(provider: WebsocketProvider): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(
        new Error(
          'Timed out while waiting for the Yjs WebSocket session to sync. Confirm wsBaseUrl, document access, and backend connectivity.',
        ),
      )
    }, CONNECTION_TIMEOUT_MS)

    const cleanup = () => {
      clearTimeout(timeout)
      provider.off('sync', handleSync)
      provider.off('connection-close', handleConnectionClose)
    }

    const handleSync = (isSynced: boolean) => {
      if (!isSynced) {
        return
      }

      cleanup()
      resolve()
    }

    const handleConnectionClose = (event: unknown) => {
      const code =
        typeof event === 'object' && event !== null && 'code' in event
          ? (event as { code?: number }).code
          : undefined

      if (code === 4403) {
        cleanup()
        reject(
          new Error(
            'Yjs WebSocket access denied. Provide --password <password> for locked documents or confirm the configured credentials.',
          ),
        )
      }
    }

    provider.on('sync', handleSync)
    provider.on('connection-close', handleConnectionClose)
  })
}

async function waitForPersistedContent(
  readBack: () => Promise<string>,
  expectedContent: string,
): Promise<void> {
  const startedAt = Date.now()
  let lastObservedContent = ''

  while (Date.now() - startedAt < VERIFY_TIMEOUT_MS) {
    lastObservedContent = await readBack()
    if (lastObservedContent === expectedContent) {
      return
    }

    await delay(VERIFY_INTERVAL_MS)
  }

  throw new Error(
    `Document content did not round-trip after the Yjs update. Last observed content length: ${lastObservedContent.length}.`,
  )
}

function replaceDocumentContent(ydoc: Y.Doc, nextContent: string): void {
  const ytext = ydoc.getText('codemirror')

  ydoc.transact(() => {
    if (ytext.length > 0) {
      ytext.delete(0, ytext.length)
    }

    if (nextContent.length > 0) {
      ytext.insert(0, nextContent)
    }
  })

  if (ytext.length === 0 && nextContent.length === 0) {
    // Force an update so a new empty document is persisted.
    ydoc.transact(() => {
      ytext.insert(0, '\n')
    })
    ydoc.transact(() => {
      ytext.delete(0, 1)
    })
  }
}

export async function syncDocumentContent(options: SyncDocumentContentOptions): Promise<void> {
  const ydoc = new Y.Doc()
  const provider = new WebsocketProvider(options.wsBaseUrl, options.documentId, ydoc, {
    WebSocketPolyfill: NodeWebSocket as unknown as typeof WebSocket,
    params: options.password ? { password: options.password } : undefined,
  })

  try {
    await waitForInitialSync(provider)
    replaceDocumentContent(ydoc, options.content)
    await waitForPersistedContent(options.readBack, options.content)
  } finally {
    provider.destroy()
    ydoc.destroy()
  }
}