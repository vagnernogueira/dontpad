/**
 * useDocumentAccess composable
 *
 * Manages lock status, password verification, and access control for
 * a document. Decouples access/lock logic from the Editor component.
 */

import { ref, nextTick, type Ref } from 'vue'

export interface DocumentAccessAPI {
  getLockStatus(documentId: string): Promise<{ locked: boolean }>
  lock(documentId: string, password: string): Promise<boolean>
  unlock(documentId: string, password: string): Promise<boolean>
  verifyAccess(documentId: string, password: string): Promise<boolean>
}

export function useDocumentAccess(documentAPI: DocumentAccessAPI) {
  const hasDocumentAccess = ref(false)
  const documentAccessPassword = ref('')
  const isDocumentLocked = ref(false)

  // Lock dialog state
  const showLockDialog = ref(false)
  const lockPassword = ref('')
  const lockError = ref('')

  // Access dialog state
  const showAccessDialog = ref(false)
  const accessPassword = ref('')
  const accessError = ref('')

  async function ensureAccess(
    documentId: string,
    onGranted: () => Promise<void>,
    accessPasswordInput: Ref<HTMLInputElement | null>
  ) {
    hasDocumentAccess.value = false

    try {
      const lockStatus = await documentAPI.getLockStatus(documentId)
      isDocumentLocked.value = lockStatus.locked

      if (!lockStatus.locked) {
        documentAccessPassword.value = ''
        await onGranted()
        return
      }

      showAccessDialog.value = true
      await nextTick()
      accessPasswordInput.value?.focus()
    } catch {
      documentAccessPassword.value = ''
      isDocumentLocked.value = false
      await onGranted()
    }
  }

  async function unlock(documentId: string, onGranted: () => Promise<void>) {
    const password = accessPassword.value.trim()
    if (!password) return

    const canAccess = await documentAPI.verifyAccess(documentId, password)
    if (!canAccess) {
      accessError.value = 'Senha inválida.'
      return
    }

    documentAccessPassword.value = password
    closeAccessDialog()
    await onGranted()
  }

  function closeAccessDialog() {
    showAccessDialog.value = false
    accessPassword.value = ''
    accessError.value = ''
  }

  async function lockDocument(documentId: string) {
    lockError.value = ''
    const password = lockPassword.value.trim()

    if (!password) {
      lockError.value = 'Informe uma senha para travar este documento.'
      return
    }

    const success = await documentAPI.lock(documentId, password)
    if (!success) {
      lockError.value = 'Não foi possível travar este documento.'
      return
    }

    isDocumentLocked.value = true
    documentAccessPassword.value = password
    closeLockDialog()
  }

  async function removeLock(documentId: string) {
    lockError.value = ''
    const password = lockPassword.value.trim() || documentAccessPassword.value

    if (!password) {
      lockError.value = 'Informe a senha atual do documento ou a senha mestre.'
      return
    }

    const success = await documentAPI.unlock(documentId, password)
    if (!success) {
      lockError.value = 'Senha inválida para remover a proteção.'
      return
    }

    isDocumentLocked.value = false
    documentAccessPassword.value = ''
    closeLockDialog()
  }

  function closeLockDialog() {
    showLockDialog.value = false
    lockPassword.value = ''
    lockError.value = ''
  }

  function handleAccessDenied(accessPasswordInput: Ref<HTMLInputElement | null>) {
    hasDocumentAccess.value = false
    accessError.value = 'Senha necessária para abrir este documento.'
    showAccessDialog.value = true
    nextTick(() => {
      accessPasswordInput.value?.focus()
    })
  }

  return {
    // State
    hasDocumentAccess,
    documentAccessPassword,
    isDocumentLocked,
    showLockDialog,
    lockPassword,
    lockError,
    showAccessDialog,
    accessPassword,
    accessError,

    // Methods
    ensureAccess,
    unlock,
    closeAccessDialog,
    lockDocument,
    removeLock,
    closeLockDialog,
    handleAccessDenied,
  }
}
