import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const listSummariesMock = vi.fn()
const verifyAccessMock = vi.fn()
const getLockStatusMock = vi.fn()
const lockMock = vi.fn()
const unlockMock = vi.fn()
const getDocumentContentMock = vi.fn()
const downloadBackupArchiveMock = vi.fn()
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
    downloadBackupArchive: downloadBackupArchiveMock,
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
  downloadZip: vi.fn(),
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

const unlockExplorerIfNeeded = async () => {
  const passwordInput = screen.queryByPlaceholderText('Senha mestra')
  const submitButton = screen.queryByRole('button', { name: 'Entrar' })
  if (!passwordInput || !submitButton) return

  await fireEvent.update(passwordInput, 'master')
  await fireEvent.submit(submitButton.closest('form') as HTMLFormElement)
}

const selectDocument = async (documentName: string) => {
  const documentRow = screen.getByText(documentName).closest('tr') as HTMLTableRowElement | null
  if (!documentRow) {
    throw new Error(`Row not found for document: ${documentName}`)
  }

  await fireEvent.click(within(documentRow).getByRole('checkbox'))
}

const flushContentSearchDebounce = async () => {
  await nextTick()
  await vi.advanceTimersByTimeAsync(300)
  await nextTick()
}

describe('Explorer content filter flow', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    window.localStorage.clear()
    listSummariesMock.mockReset()
    verifyAccessMock.mockReset()
    getLockStatusMock.mockReset()
    lockMock.mockReset()
    unlockMock.mockReset()
    getDocumentContentMock.mockReset()
    downloadBackupArchiveMock.mockReset()
    getPublicDocumentContentMock.mockReset()
    renameDocumentMock.mockReset()
    removeDocumentMock.mockReset()

    listSummariesMock.mockImplementation(async (_masterPassword: string, options?: { contentContains?: string; contentMatchesRegex?: string }) => {
      if (options?.contentContains === 'needle') {
        return contentFilteredSummaries
      }

      if (options?.contentMatchesRegex === '^another\\s+needle') {
        return [contentFilteredSummaries[1]]
      }

      return initialSummaries
    })
  })

  afterEach(() => {
    cleanup()
    try {
      vi.runOnlyPendingTimers()
    } catch {
      // Ignore when a test switched back to real timers.
    }
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

    await unlockExplorerIfNeeded()

    await screen.findByText('alpha-doc')
    await screen.findByText('beta-doc')

    await fireEvent.update(screen.getByLabelText('Nm'), 'alpha')
    expect(screen.getByText('alpha-doc')).toBeInTheDocument()
    expect(screen.queryByText('beta-doc')).not.toBeInTheDocument()

    await fireEvent.update(screen.getByLabelText('Ct'), 'needle')
    await flushContentSearchDebounce()

    await waitFor(() => {
      expect(listSummariesMock).toHaveBeenLastCalledWith('master', { contentContains: 'needle' })
    })

    expect(screen.getByText('alpha-doc')).toBeInTheDocument()
    expect(screen.queryByText('beta-doc')).not.toBeInTheDocument()
    expect(screen.queryByText('gamma-doc')).not.toBeInTheDocument()
  }, 10000)

  it('does not show the backup action before explorer unlock', async () => {
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

    expect(screen.queryByRole('button', { name: 'Backup geral' })).not.toBeInTheDocument()
    expect(screen.getByText('Informe a senha mestra para entrar no Explorer.')).toBeInTheDocument()
  })

  it('uses regex content query when regex mode is enabled and restores it from storage', async () => {
    const { default: Explorer } = await import('../../components/Explorer.vue')

    const firstRender = render(Explorer, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await unlockExplorerIfNeeded()

    const regexSwitch = screen.getByRole('switch', { name: 'Rgx' })
    await fireEvent.click(regexSwitch)
    await fireEvent.update(screen.getByLabelText('Ct'), '^another\\s+needle')
    await flushContentSearchDebounce()

    await waitFor(() => {
      expect(listSummariesMock).toHaveBeenLastCalledWith('master', { contentMatchesRegex: '^another\\s+needle' })
    })

    expect(window.localStorage.getItem('dontpad:explorer.regexEnabled')).toBe('true')

    firstRender.unmount()

    render(Explorer, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>'
          }
        }
      }
    })

    await unlockExplorerIfNeeded()

    expect(screen.getByRole('switch', { name: 'Rgx' })).toHaveAttribute('aria-checked', 'true')
  })

  it('shows a safe error for invalid regex without triggering a new content request', async () => {
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

    await unlockExplorerIfNeeded()

    listSummariesMock.mockClear()

    await fireEvent.click(screen.getByRole('switch', { name: 'Rgx' }))
    await fireEvent.update(screen.getByLabelText('Ct'), '(')
    await flushContentSearchDebounce()

    expect(screen.getByText('Expressão regular inválida no filtro de conteúdo.')).toBeInTheDocument()
    expect(listSummariesMock).not.toHaveBeenCalled()
    expect(screen.getByText('alpha-doc')).toBeInTheDocument()
  })

  it('renames the selected document through the dialog flow', async () => {
    vi.useRealTimers()
    renameDocumentMock.mockResolvedValue(true)

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

    await unlockExplorerIfNeeded()
    await screen.findByText('alpha-doc')

    await selectDocument('alpha-doc')
    await fireEvent.click(screen.getByRole('button', { name: 'Renomear' }))

    await fireEvent.update(await screen.findByLabelText('Novo nome'), 'renamed-doc')
    await fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => {
      expect(renameDocumentMock).toHaveBeenCalledWith('alpha-doc', 'renamed-doc', 'master')
    })
  })

  it('downloads the general backup through the toolbar action', async () => {
    vi.useRealTimers()
    const backupBlob = new Blob(['zip-data'], { type: 'application/zip' })
    downloadBackupArchiveMock.mockResolvedValue(backupBlob)

    const { downloadZip } = await import('../../services/export')
    const downloadZipMock = vi.mocked(downloadZip)

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

    await unlockExplorerIfNeeded()
    await screen.findByText('alpha-doc')

    await fireEvent.click(screen.getByRole('button', { name: 'Backup geral' }))

    await waitFor(() => {
      expect(downloadBackupArchiveMock).toHaveBeenCalledWith('master')
      expect(downloadZipMock).toHaveBeenCalledWith(backupBlob, 'dontpad-backup')
    })
  })

  it('keeps only the latest selected checkbox checked', async () => {
    vi.useRealTimers()

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

    await unlockExplorerIfNeeded()
    await screen.findByText('alpha-doc')

    await selectDocument('alpha-doc')
    const alphaRow = screen.getByText('alpha-doc').closest('tr') as HTMLTableRowElement
    const betaRow = screen.getByText('beta-doc').closest('tr') as HTMLTableRowElement

    expect(within(alphaRow).getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
    expect(within(betaRow).getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')

    await selectDocument('beta-doc')

    await waitFor(() => {
      expect(within(alphaRow).getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
      expect(within(betaRow).getByRole('checkbox')).toHaveAttribute('aria-checked', 'true')
    })
  })

  it('locks the selected document through the dialog flow', async () => {
    vi.useRealTimers()
    lockMock.mockResolvedValue(true)

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

    await unlockExplorerIfNeeded()
    await screen.findByText('alpha-doc')

    await selectDocument('alpha-doc')
    await fireEvent.click(screen.getByRole('button', { name: 'Travar' }))

    await fireEvent.update(await screen.findByLabelText('Senha do documento'), 'doc-pass')
    await fireEvent.click(screen.getByRole('button', { name: 'Travar' }))
    await waitFor(() => {
      expect(lockMock).toHaveBeenCalledWith('alpha-doc', 'doc-pass')
    })
  })

  it('removes the selected document through the confirmation dialog', async () => {
    vi.useRealTimers()
    removeDocumentMock.mockResolvedValue(true)

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

    await unlockExplorerIfNeeded()
    await screen.findByText('alpha-doc')

    await selectDocument('alpha-doc')
    await fireEvent.click(screen.getByRole('button', { name: 'Remover' }))

    const confirmationDialog = await screen.findByRole('alertdialog')
    await fireEvent.click(within(confirmationDialog).getByRole('button', { name: 'Remover' }))
    await waitFor(() => {
      expect(removeDocumentMock).toHaveBeenCalledWith('alpha-doc', 'master')
    })
  })
})