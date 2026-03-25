import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createDocumentAPI } from '../../services/document-api'

const mockFetch = vi.fn()
global.fetch = mockFetch

const originalConsoleError = console.error
beforeEach(() => {
  console.error = vi.fn()
})
afterEach(() => {
  console.error = originalConsoleError
})

describe('DocumentAPI', () => {
  let api: ReturnType<typeof createDocumentAPI>

  beforeEach(() => {
    api = createDocumentAPI('http://localhost:3000')
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('verifyAccess', () => {
    it('returns true when access is granted', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)

      const result = await api.verifyAccess('doc-1', 'password')

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/document-access',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ documentId: 'doc-1', password: 'password' })
        })
      )
    })

    it('returns false when access is denied', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false } as Response)

      const result = await api.verifyAccess('doc-1', 'wrong')

      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network error'))

      const result = await api.verifyAccess('doc-1', 'password')

      expect(result).toBe(false)
    })
  })

  describe('getLockStatus', () => {
    it('returns locked status when document is locked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ locked: true })
      } as Response)

      const result = await api.getLockStatus('locked-doc')

      expect(result).toEqual({ locked: true })
    })

    it('returns locked false when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false } as Response)

      const result = await api.getLockStatus('any-doc')

      expect(result).toEqual({ locked: false })
    })

    it('returns false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network error'))

      const result = await api.getLockStatus('any-doc')

      expect(result).toEqual({ locked: false })
    })
  })

  describe('lock', () => {
    it('returns true on successful lock', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)

      const result = await api.lock('doc-1', 'secret')

      expect(result).toBe(true)
    })

    it('returns false on failed lock', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false } as Response)

      const result = await api.lock('doc-1', 'secret')

      expect(result).toBe(false)
    })
  })

  describe('unlock', () => {
    it('returns true on successful unlock', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)

      const result = await api.unlock('doc-1', 'secret')

      expect(result).toBe(true)
    })

    it('returns false on failed unlock', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false } as Response)

      const result = await api.unlock('doc-1', 'wrong')

      expect(result).toBe(false)
    })
  })

  describe('listSummaries', () => {
    it('returns summaries array on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summaries: [
            { name: 'doc-a', createdAt: '2024-01-01', updatedAt: '2024-01-02', locked: false, empty: false, open: false },
            { name: 'doc-b', createdAt: '2024-01-01', updatedAt: '2024-01-02', locked: true, empty: true, open: false }
          ]
        })
      } as Response)

      const result = await api.listSummaries('master')

      expect(result).toHaveLength(2)
      expect(result?.[0]?.name).toBe('doc-a')
      expect(result?.[1]?.locked).toBe(true)
    })

    it('returns null when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false } as Response)

      const result = await api.listSummaries('wrong-pass')

      expect(result).toBeNull()
    })

    it('returns empty array when summaries is not an array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ summaries: 'not-an-array' })
      } as Response)

      const result = await api.listSummaries('master')

      expect(result).toEqual([])
    })

    it('filters invalid summary entries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          summaries: [
            { name: 'valid-doc', createdAt: '2024-01-01', updatedAt: '2024-01-02', locked: false, empty: false, open: false },
            { name: 123 },
            null
          ]
        })
      } as Response)

      const result = await api.listSummaries('master')

      expect(result).toHaveLength(1)
      expect(result?.[0]?.name).toBe('valid-doc')
    })
  })

  describe('getDocumentContent', () => {
    it('returns content on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: '# Hello World' })
      } as Response)

      const result = await api.getDocumentContent('doc-1', 'master')

      expect(result).toBe('# Hello World')
    })

    it('returns null when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false } as Response)

      const result = await api.getDocumentContent('doc-1', 'master')

      expect(result).toBeNull()
    })

    it('returns null when content is not a string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: 123 })
      } as Response)

      const result = await api.getDocumentContent('doc-1', 'master')

      expect(result).toBeNull()
    })
  })

  describe('getPublicDocumentContent', () => {
    it('returns content when document loads successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: 'public content' })
      } as Response)

      const result = await api.getPublicDocumentContent('public-doc')

      expect(result).toEqual({
        ok: true,
        content: 'public content',
        requiresPassword: false
      })
    })

    it('returns requiresPassword true when 403 with invalid_password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'invalid_password' })
      } as Response)

      const result = await api.getPublicDocumentContent('locked-doc', 'wrong')

      expect(result).toEqual({
        ok: false,
        content: '',
        requiresPassword: true,
        error: 'invalid_password'
      })
    })

    it('returns generic error when other error occurs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'server_error' })
      } as Response)

      const result = await api.getPublicDocumentContent('doc')

      expect(result).toEqual({
        ok: false,
        content: '',
        requiresPassword: false,
        error: 'server_error'
      })
    })

    it('returns generic error when response parsing fails', async () => {
      const failingResponse = {
        ok: false,
        status: 500,
        json: async () => { throw new Error('parse error') }
      }
      mockFetch.mockResolvedValueOnce(failingResponse as unknown as Response)

      const result = await api.getPublicDocumentContent('doc')

      expect(result.error).toBe('failed_to_load_document_content')
    })

    it('passes password when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ content: 'content' })
      } as Response)

      await api.getPublicDocumentContent('doc', '  secret  ')

      const [url] = mockFetch.mock.calls[0]
      expect(url).toContain('password=secret')
    })
  })

  describe('renameDocument', () => {
    it('returns true on success', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)

      const result = await api.renameDocument('old-doc', 'new-doc', 'master')

      expect(result).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/documents/rename',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-docs-password': 'master'
          }),
          body: JSON.stringify({ from: 'old-doc', to: 'new-doc' })
        })
      )
    })

    it('returns false on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false } as Response)

      const result = await api.renameDocument('old', 'new', 'master')

      expect(result).toBe(false)
    })
  })

  describe('removeDocument', () => {
    it('returns true on success', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true } as Response)

      const result = await api.removeDocument('doc-1', 'master')

      expect(result).toBe(true)
    })

    it('returns false on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false } as Response)

      const result = await api.removeDocument('doc-1', 'master')

      expect(result).toBe(false)
    })
  })
})
