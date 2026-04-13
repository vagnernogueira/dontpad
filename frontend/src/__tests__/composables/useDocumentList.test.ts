import { describe, expect, it } from 'vitest'
import { filterDocumentsByName, normalizeSearchTerm } from '../../composables/useDocumentList'
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
})