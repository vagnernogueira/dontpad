/**
 * useDocumentList composable
 *
 * Handles search, sorting, selection, and bulk actions over the
 * document list in the Explorer view.
 */

import { computed, ref, watch } from 'vue'
import type { DocumentSummary } from '../services/document-api'
import persistence from '../services/persistence'

export type SortKey = 'selected' | 'name' | 'createdAt' | 'updatedAt' | 'locked' | 'empty' | 'open'
const SORT_KEYS: SortKey[] = ['selected', 'name', 'createdAt', 'updatedAt', 'locked', 'empty', 'open']

const EXPLORER_SEARCH_KEY = 'explorer.search'
const EXPLORER_SORT_KEY = 'explorer.sortKey'
const EXPLORER_SORT_DIRECTION_KEY = 'explorer.sortDirection'

function isSortKey(value: string): value is SortKey {
  return SORT_KEYS.includes(value as SortKey)
}

function isSortDirection(value: string): value is 'asc' | 'desc' {
  return value === 'asc' || value === 'desc'
}

export function useDocumentList(documents: () => DocumentSummary[]) {
  const search = ref('')
  const selectedDocumentName = ref<string | null>(null)
  const sortKey = ref<SortKey>('updatedAt')
  const sortDirection = ref<'asc' | 'desc'>('desc')

  // ── Computed ─────────────────────────────────────────────────────

  const filteredDocuments = computed(() => {
    const term = search.value.trim().toLowerCase()
    if (!term) return documents()
    return documents().filter(d => d.name.toLowerCase().includes(term))
  })

  const sortedDocuments = computed(() => {
    const items = [...filteredDocuments.value]

    items.sort((left, right) => {
      const selL = selectedDocumentName.value === left.name
      const selR = selectedDocumentName.value === right.name
      const dir = sortDirection.value === 'asc' ? 1 : -1

      if (sortKey.value === 'selected') {
        if (selL === selR) return 0
        return selL ? 1 * dir : -1 * dir
      }

      if (sortKey.value === 'name') {
        return left.name.localeCompare(right.name) * dir
      }

      if (sortKey.value === 'createdAt' || sortKey.value === 'updatedAt') {
        return (new Date(left[sortKey.value]).getTime() - new Date(right[sortKey.value]).getTime()) * dir
      }

      const lBool = left[sortKey.value] ? 1 : 0
      const rBool = right[sortKey.value] ? 1 : 0
      return (lBool - rBool) * dir
    })

    return items
  })

  // ── Actions ──────────────────────────────────────────────────────

  function toggleSort(key: SortKey) {
    if (sortKey.value === key) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      return
    }
    sortKey.value = key
    sortDirection.value = key === 'updatedAt' ? 'desc' : 'asc'
  }

  function toggleSelection(name: string) {
    selectedDocumentName.value = selectedDocumentName.value === name ? null : name
  }

  function clearSelectionIfMissing(available: DocumentSummary[]) {
    if (selectedDocumentName.value && !available.some(d => d.name === selectedDocumentName.value)) {
      selectedDocumentName.value = null
    }
  }

  // ── Persistence ──────────────────────────────────────────────────

  function restoreFromStorage() {
    search.value = persistence.get(EXPLORER_SEARCH_KEY, '')
    const sk = persistence.get(EXPLORER_SORT_KEY, 'updatedAt')
    if (isSortKey(sk)) sortKey.value = sk
    const sd = persistence.get(EXPLORER_SORT_DIRECTION_KEY, 'desc')
    if (isSortDirection(sd)) sortDirection.value = sd
  }

  // Auto-persist on change
  watch(search, v => persistence.set(EXPLORER_SEARCH_KEY, v))
  watch(sortKey, v => persistence.set(EXPLORER_SORT_KEY, v))
  watch(sortDirection, v => persistence.set(EXPLORER_SORT_DIRECTION_KEY, v))

  return {
    search,
    selectedDocumentName,
    sortKey,
    sortDirection,
    filteredDocuments,
    sortedDocuments,
    toggleSort,
    toggleSelection,
    clearSelectionIfMissing,
    restoreFromStorage,
  }
}
