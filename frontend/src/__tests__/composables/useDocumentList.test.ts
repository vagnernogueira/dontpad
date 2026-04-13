import { effectScope, nextTick } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import {
  filterDocumentsByName,
  isValidRegexPattern,
  normalizeSearchTerm,
  useDocumentList,
} from '../../composables/useDocumentList'
import type { DocumentSummary } from '../../services/document-api'

const documents: DocumentSummary[] = [
  {
    name: 'alpha-note',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
    locked: false,
    empty: false,
    open: false,
  },
  {
    name: 'beta-plan',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
    locked: false,
    empty: false,
    open: true,
  },
]

describe('useDocumentList helpers', () => {
  it('normalizes the search term before filtering', () => {
    expect(normalizeSearchTerm('  Alpha  ')).toBe('alpha')
  })

  it('filters documents by name case-insensitively', () => {
    expect(filterDocumentsByName(documents, 'ALPHA')).toEqual([documents[0]])
  })

  it('returns all documents when the search term is empty', () => {
    expect(filterDocumentsByName(documents, '   ')).toEqual(documents)
  })

  it('filters documents by name using regex when enabled', () => {
    expect(filterDocumentsByName(documents, '^beta', true)).toEqual([documents[1]])
  })

  it('returns all documents for invalid name regex patterns', () => {
    expect(filterDocumentsByName(documents, '(', true)).toEqual(documents)
  })

  it('validates regex patterns safely', () => {
    expect(isValidRegexPattern('alpha|beta')).toBe(true)
    expect(isValidRegexPattern('(')).toBe(false)
  })
})

describe('useDocumentList persistence', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('persists and restores regex mode', async () => {
    const scope = effectScope()
    const list = scope.run(() => useDocumentList(() => documents))

    if (!list) {
      throw new Error('failed_to_create_useDocumentList_scope')
    }

    list.regexEnabled.value = true
    await nextTick()

    expect(window.localStorage.getItem('dontpad:explorer.regexEnabled')).toBe('true')

    scope.stop()

    const restoreScope = effectScope()
    const restoredList = restoreScope.run(() => useDocumentList(() => documents))

    if (!restoredList) {
      throw new Error('failed_to_restore_useDocumentList_scope')
    }

    restoredList.restoreFromStorage()

    expect(restoredList.regexEnabled.value).toBe(true)

    restoreScope.stop()
  })
})