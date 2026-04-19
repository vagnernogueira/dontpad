import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useDocumentAccess, type DocumentAccessAPI } from '../../composables/useDocumentAccess'

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

function createDocumentAPI(overrides: Partial<DocumentAccessAPI> = {}): DocumentAccessAPI {
  return {
    getLockStatus: vi.fn().mockResolvedValue({ locked: false }),
    lock: vi.fn().mockResolvedValue(true),
    unlock: vi.fn().mockResolvedValue(true),
    verifyAccess: vi.fn().mockResolvedValue(true),
    ...overrides,
  }
}

describe('useDocumentAccess', () => {
  it('grants access immediately when document is unlocked', async () => {
    const onGranted = vi.fn().mockResolvedValue(undefined)
    const composable = useDocumentAccess(createDocumentAPI())

    await composable.ensureAccess('doc-1', onGranted, ref(null))

    expect(onGranted).toHaveBeenCalledTimes(1)
    expect(composable.isAccessLoading.value).toBe(false)
    expect(composable.showAccessDialog.value).toBe(false)
    expect(composable.isDocumentLocked.value).toBe(false)
  })

  it('keeps a loading state while access is still being resolved', async () => {
    const deferredLockStatus = createDeferred<{ locked: boolean }>()
    const onGranted = vi.fn().mockResolvedValue(undefined)
    const composable = useDocumentAccess(
      createDocumentAPI({
        getLockStatus: vi.fn().mockReturnValue(deferredLockStatus.promise),
      })
    )

    const ensureAccessPromise = composable.ensureAccess('doc-loading', onGranted, ref(null))

    expect(composable.isAccessLoading.value).toBe(true)

    deferredLockStatus.resolve({ locked: false })
    await ensureAccessPromise

    expect(composable.isAccessLoading.value).toBe(false)
    expect(onGranted).toHaveBeenCalledTimes(1)
  })

  it('shows error when password verification fails', async () => {
    const composable = useDocumentAccess(
      createDocumentAPI({
        getLockStatus: vi.fn().mockResolvedValue({ locked: true }),
        verifyAccess: vi.fn().mockResolvedValue(false),
      })
    )

    await composable.ensureAccess('doc-2', vi.fn().mockResolvedValue(undefined), ref(null))
    composable.accessPassword.value = 'wrong'
    await composable.unlock('doc-2', vi.fn().mockResolvedValue(undefined))

    expect(composable.isAccessLoading.value).toBe(false)
    expect(composable.showAccessDialog.value).toBe(true)
    expect(composable.accessError.value).toBe('Senha inválida.')
  })

  it('locks and unlocks document using api results', async () => {
    const composable = useDocumentAccess(createDocumentAPI())

    composable.lockPassword.value = 'secret'
    await composable.lockDocument('doc-3')
    expect(composable.isDocumentLocked.value).toBe(true)
    expect(composable.documentAccessPassword.value).toBe('secret')

    composable.showLockDialog.value = true
    composable.lockPassword.value = 'secret'
    await composable.removeLock('doc-3')
    expect(composable.isDocumentLocked.value).toBe(false)
    expect(composable.documentAccessPassword.value).toBe('')
  })
})