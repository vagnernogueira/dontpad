import { cleanup, render, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

const getPublicDocumentContentMock = vi.fn()
const renderMarkdownDocumentMock = vi.fn()

vi.mock('../../services/document-api', () => ({
  createDocumentAPI: () => ({
    getPublicDocumentContent: getPublicDocumentContentMock,
  }),
}))

vi.mock('../../services/config', () => ({
  getApiBaseUrl: () => 'http://localhost:3000',
}))

vi.mock('../../services/export', () => ({
  renderMarkdownDocument: renderMarkdownDocumentMock,
  downloadPDF: vi.fn(),
}))

describe('DocumentRoute', () => {
  beforeEach(() => {
    document.title = 'Dontpad'
    getPublicDocumentContentMock.mockReset()
    renderMarkdownDocumentMock.mockReset()
    getPublicDocumentContentMock.mockResolvedValue({
      ok: true,
      content: '# Documento',
    })
    renderMarkdownDocumentMock.mockResolvedValue('<article>Documento renderizado</article>')
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    document.title = 'Dontpad'
  })

  it('updates the browser title with the current breadcrumb and restores it on leave', async () => {
    const { default: DocumentRoute } = await import('../../components/DocumentRoute.vue')

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div>home</div>' } },
        { path: '/:documentId(.*)', name: 'document', component: DocumentRoute },
      ],
    })

    await router.push('/me/todo?view=1')
    await router.isReady()

    render({ template: '<router-view />' }, {
      global: {
        plugins: [router],
      },
    })

    await waitFor(() => {
      expect(document.title).toBe('Dontpad - me/todo')
    })

    await router.push('/')

    await waitFor(() => {
      expect(document.title).toBe('Dontpad')
    })
  })
})