/**
 * useExplorerSession composable
 *
 * Manages the explorer authentication session — unlock with master
 * password, runtime password persistence, and clearing state.
 */

import { ref } from 'vue'
import type { DocumentSummary } from '../services/document-api'
import persistence from '../services/persistence'

export interface ExplorerSessionAPI {
  listSummaries(masterPassword: string): Promise<DocumentSummary[] | null>
}

const EXPLORER_UNLOCKED_KEY = 'explorer.unlocked'
const EXPLORER_DOCUMENTS_CACHE_KEY = 'explorer.documentsCache'

/** Module-scoped runtime session so the password survives in-app navigation. */
const explorerRuntimeSession = { masterPassword: '' }

export function useExplorerSession(documentAPI: ExplorerSessionAPI) {
  const hasAccess = ref(false)
  const isLoading = ref(false)
  const masterPassword = ref('')
  const masterPasswordInput = ref('')
  const authError = ref('')
  const documents = ref<DocumentSummary[]>([])

  // ── Helpers ──────────────────────────────────────────────────────

  function clearState() {
    hasAccess.value = false
    masterPassword.value = ''
    explorerRuntimeSession.masterPassword = ''
    documents.value = []
    persistence.set(EXPLORER_UNLOCKED_KEY, false)
    persistence.remove(EXPLORER_DOCUMENTS_CACHE_KEY)
  }

  function ensureMasterPassword(): boolean {
    if (masterPassword.value) return true
    authError.value = 'Informe a senha mestra para revalidar o acesso.'
    clearState()
    return false
  }

  // ── Actions ──────────────────────────────────────────────────────

  async function unlock() {
    authError.value = ''
    const candidate = masterPasswordInput.value.trim()
    if (!candidate) {
      authError.value = 'Informe a senha mestra.'
      return
    }

    isLoading.value = true
    const summaries = await documentAPI.listSummaries(candidate)
    isLoading.value = false

    if (summaries === null) {
      authError.value = 'Senha mestra inválida.'
      return
    }

    masterPassword.value = candidate
    explorerRuntimeSession.masterPassword = candidate
    hasAccess.value = true
    documents.value = summaries
    masterPasswordInput.value = ''
    persistence.set(EXPLORER_UNLOCKED_KEY, true)
  }

  async function refresh(): Promise<DocumentSummary[] | null> {
    if (!hasAccess.value) return null
    if (!ensureMasterPassword()) return null

    isLoading.value = true
    const summaries = await documentAPI.listSummaries(masterPassword.value)
    isLoading.value = false

    if (summaries === null) {
      clearState()
      authError.value = 'Sua sessão de acesso expirou. Informe a senha mestra novamente.'
      return null
    }

    documents.value = summaries
    return summaries
  }

  /** Restore from localStorage / runtime session on mount. */
  function restore(isDocumentSummary: (item: unknown) => item is DocumentSummary) {
    const cachedDocuments = persistence.get<unknown[]>(EXPLORER_DOCUMENTS_CACHE_KEY, [])
    documents.value = cachedDocuments.filter(isDocumentSummary)

    const isUnlocked = persistence.get(EXPLORER_UNLOCKED_KEY, false)
    const hasRuntimePassword = !!explorerRuntimeSession.masterPassword

    if (hasRuntimePassword) {
      masterPassword.value = explorerRuntimeSession.masterPassword
      hasAccess.value = true
      return true // caller should refresh
    }

    if (isUnlocked) {
      hasAccess.value = true
      return false // restored but needs re-auth for mutations
    }

    return false
  }

  return {
    hasAccess,
    isLoading,
    masterPassword,
    masterPasswordInput,
    authError,
    documents,
    clearState,
    ensureMasterPassword,
    unlock,
    refresh,
    restore,
  }
}
