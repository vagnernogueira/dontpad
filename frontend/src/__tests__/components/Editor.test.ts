import { cleanup, render, screen, waitFor } from '@testing-library/vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const editorMocks = vi.hoisted(() => ({
  init: vi.fn().mockReturnValue({
    provider: {},
  }),
  getInstance: vi.fn().mockReturnValue(null),
  destroy: vi.fn(),
  status: { value: 'disconnected' },
}))

const documentAccessMocks = vi.hoisted(() => ({
  getLockStatus: vi.fn(),
  lock: vi.fn().mockResolvedValue(true),
  unlock: vi.fn().mockResolvedValue(true),
  verifyAccess: vi.fn().mockResolvedValue(true),
}))

vi.mock('../../services/document-api', () => ({
  createDocumentAPI: () => documentAccessMocks,
}))

vi.mock('../../services/config', () => ({
  getApiBaseUrl: () => 'http://localhost:3000',
  getWsBaseUrl: () => 'ws://localhost:3000',
}))

vi.mock('../../services/export', () => ({
  downloadMarkdown: vi.fn(),
  downloadPDF: vi.fn(),
  renderMarkdownDocument: vi.fn(),
}))

vi.mock('../../services/persistence', () => ({
  get: vi.fn().mockReturnValue(true),
  set: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { documentId: 'default' },
    query: {},
    path: '/default',
    hash: '',
    fullPath: '/default',
  }),
  useRouter: () => ({
    replace: vi.fn().mockResolvedValue(undefined),
  }),
}))

vi.mock('../../composables/useYjsEditor', () => ({
  useYjsEditor: () => ({
    status: editorMocks.status,
    init: editorMocks.init,
    getInstance: editorMocks.getInstance,
    destroy: editorMocks.destroy,
  }),
}))

vi.mock('../../composables/useCollaborators', () => ({
  useCollaborators: () => ({
    myProfile: ref({ name: 'Teste', emoji: '📝' }),
    collaborators: ref([]),
    bind: vi.fn(),
    saveProfile: vi.fn(),
  }),
}))

vi.mock('../../composables/useMarkdownLint', () => ({
  useMarkdownLint: () => ({
    isDialogOpen: ref(false),
    issues: ref([]),
    statusMessage: ref(''),
    errorMessage: ref(''),
    openForView: vi.fn(),
    closeDialog: vi.fn(),
    applyHotfix: vi.fn(),
  }),
}))

vi.mock('../../composables/useEditorZoom', () => ({
  useEditorZoom: () => ({
    zoom: ref(100),
    setZoom: vi.fn(),
  }),
}))

vi.mock('../../components/editor-command-menu', () => ({
  buildEditorCommandMenu: vi.fn(() => []),
}))

const stubs = {
  EditorHeader: { template: '<div />' },
  EditorToolbar: { template: '<div />' },
  EditorCommandPalette: { template: '<div />' },
  MarkdownLintDialog: { template: '<div />' },
  ProfileDialog: { template: '<div />' },
  LinkDialog: { template: '<div />' },
  ImageDialog: { template: '<div />' },
  EmojiPickerDialog: { template: '<div />' },
  LockDialog: { template: '<div />' },
  AccessDialog: { template: '<div />' },
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

describe('Editor', () => {
  afterEach(() => {
    cleanup()
    editorMocks.init.mockClear()
    editorMocks.getInstance.mockClear()
    editorMocks.destroy.mockClear()
    vi.clearAllMocks()
  })

  it('shows loading while the access status is unresolved and only then reveals the password state', async () => {
    const deferredLockStatus = createDeferred<{ locked: boolean }>()
    documentAccessMocks.getLockStatus.mockReturnValueOnce(deferredLockStatus.promise)

    const { default: Editor } = await import('../../components/Editor.vue')

    render(Editor, {
      global: {
        stubs,
      },
    })

    expect(await screen.findByText('CARREGANDO...')).toBeInTheDocument()
    expect(screen.queryByText('Este documento está protegido por senha. Insira a senha para continuar.')).not.toBeInTheDocument()

    deferredLockStatus.resolve({ locked: true })

    await waitFor(() => {
      expect(screen.getByText('Este documento está protegido por senha. Insira a senha para continuar.')).toBeInTheDocument()
    })

    expect(screen.queryByText('CARREGANDO...')).not.toBeInTheDocument()
  })

  it('initializes the editor when the document is unlocked', async () => {
    const deferredLockStatus = createDeferred<{ locked: boolean }>()
    documentAccessMocks.getLockStatus.mockReturnValueOnce(deferredLockStatus.promise)

    const { default: Editor } = await import('../../components/Editor.vue')

    render(Editor, {
      global: {
        stubs,
      },
    })

    expect(await screen.findByText('CARREGANDO...')).toBeInTheDocument()

    deferredLockStatus.resolve({ locked: false })

    await waitFor(() => {
      expect(editorMocks.init).toHaveBeenCalled()
    })

    expect(screen.queryByText('Este documento está protegido por senha. Insira a senha para continuar.')).not.toBeInTheDocument()
  })
})
