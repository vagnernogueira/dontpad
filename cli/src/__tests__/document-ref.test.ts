import { describe, expect, it } from 'vitest'

import { normalizeDocumentId, resolveDocumentReference } from '../document-ref'

describe('document reference resolution', () => {
  it('normalizes raw path identifiers', () => {
    expect(normalizeDocumentId('/me/todo/')).toBe('me/todo')
    expect(normalizeDocumentId('')).toBe('default')
  })

  it('resolves relative paths against the configured base URL', () => {
    expect(
      resolveDocumentReference('me/todo', {
        configuredBaseUrl: 'https://docs.example.com/app',
      }),
    ).toEqual({
      documentId: 'me/todo',
      baseUrl: 'https://docs.example.com/app',
      inputKind: 'path',
    })
  })

  it('resolves full URLs and trims the configured base path when it matches', () => {
    expect(
      resolveDocumentReference('https://docs.example.com/app/me/todo?password=1234', {
        configuredBaseUrl: 'https://docs.example.com/app',
      }),
    ).toEqual({
      documentId: 'me/todo',
      baseUrl: 'https://docs.example.com/app',
      inputKind: 'url',
      embeddedPassword: '1234',
    })
  })

  it('falls back to the URL origin when no configured base URL matches', () => {
    expect(resolveDocumentReference('https://docs.example.com/me/todo')).toEqual({
      documentId: 'me/todo',
      baseUrl: 'https://docs.example.com',
      inputKind: 'url',
    })
  })
})