import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const listSummariesMock = vi.fn()
const verifyAccessMock = vi.fn()
const getLockStatusMock = vi.fn()
const lockMock = vi.fn()
const unlockMock = vi.fn()
const getDocumentContentMock = vi.fn()
const getPublicDocumentContentMock = vi.fn()
const renameDocumentMock = vi.fn()
const removeDocumentMock = vi.fn()

vi.mock('../../services/document-api', () => ({
  createDocumentAPI: () => ({
    listSummaries: listSummariesMock,
    verifyAccess: verifyAccessMock,
    getLockStatus: getLockStatusMock,
    lock: lockMock,
    unlock: unlockMock,
    getDocumentContent: getDocumentContentMock,
    getPublicDocumentContent: getPublicDocumentContentMock,
    renameDocument: renameDocumentMock,
    removeDocument: removeDocumentMock,
  })
}))

vi.mock('../../services/config', () => ({
  getApiBaseUrl: () => 'http://localhost:3000'
}))

vi.mock('../../services/export', () => ({
  downloadMarkdown: vi.fn(),
  downloadPDF: vi.fn(),
}))

const initialSummaries = [
  {
    name: 'alpha-doc',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    locked: false,
    empty: false,
    open: false,
  },
  {
    name: 'beta-doc',
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-04T00:00:00.000Z',
    locked: false,
    empty: false,
    open: false,
  },
]

const contentFilteredSummaries = [
  initialSummaries[0],
  {
    name: 'gamma-doc',
    createdAt: '2024-01-05T00:00:00.000Z',
    updatedAt: '2024-01-06T00:00:00.000Z',
    locked: false,
    empty: false,
    open: false,
  },
]

describe('Explorer content filter flow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
    listSummariesMock.mockReset()
    verifyAccessMock.mockReset()
    getLockStatusMock.mockReset()
    lockMock.mockReset()
    unlockMock.mockReset()
    getDocumentContentMock.mockReset()
    getPublicDocumentContentMock.mockReset()
    renameDocumentMock.mockReset()
    removeDocumentMock.mockReset()

    listSummariesMock.mockImplementation(async (_masterPassword: string, options?: { contentContains?: string }) => {
      if (options?.contentContains === 'needle') {
        return contentFilteredSummaries
      }

      return initialSummaries
    })
  })

  afterEach(() => {
    cleanup()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('combines the name filter with the debounced content filter', async () => {
    const { default: Explorer } = await import('../../components/Explorer.vue')

    render(Explorer, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await fireEvent.update(screen.getByPlaceholderText('Senha mestra'), 'master')
    await fireEvent.submit(screen.getByRole('button', { name: 'Entrar' }).closest('form') as HTMLFormElement)

    await screen.findByText('alpha-doc')
    await screen.findByText('beta-doc')

    await fireEvent.update(screen.getByLabelText('Nm'), 'alpha')
    expect(screen.getByText('alpha-doc')).toBeInTheDocument()
    expect(screen.queryByText('beta-doc')).not.toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Ct'), 'needle')

    await vi.advanceTimersByTimeAsync(300)

    await waitFor(() => {
      expect(listSummariesMock).toHaveBeenLastCalledWith('master', { contentContains: 'needle' })
    })

    expect(screen.getByText('alpha-doc')).toBeInTheDocument()
    expect(screen.queryByText('beta-doc')).not.toBeInTheDocument()
    expect(screen.queryByText('gamma-doc')).not.toBeInTheDocument()
  })
})