/**
 * Document API Service
 * 
 * Handles all document-related API calls: access verification, locking, etc.
 * Centralizes API logic away from UI components.
 */

export interface DocumentLockStatus {
  locked: boolean
}

export interface DocumentAccessPayload {
  documentId: string
  password: string
}

export interface DocumentSummary {
  name: string
  createdAt: string
  updatedAt: string
  locked: boolean
  empty: boolean
  open: boolean
}

/**
 * API client for document operations
 */
class DocumentAPI {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  /**
   * Verify document access with a password
   * @param documentId - Document identifier
   * @param password - Access password
   * @returns true if access is granted
   */
  async verifyAccess(documentId: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/document-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          password
        })
      })
      return response.ok
    } catch (error) {
      console.error('Failed to verify document access:', error)
      return false
    }
  }

  /**
   * Check if a document is locked
   * @param documentId - Document identifier
   * @returns Lock status
   */
  async getLockStatus(documentId: string): Promise<DocumentLockStatus> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/document-lock?documentId=${encodeURIComponent(documentId)}`
      )
      
      if (!response.ok) {
        return { locked: false }
      }

      const payload = await response.json() as { locked?: boolean }
      return { locked: !!payload.locked }
    } catch (error) {
      console.error('Failed to check document lock status:', error)
      return { locked: false }
    }
  }

  /**
   * Lock a document with a password
   * @param documentId - Document identifier
   * @param password - Password to lock the document
   * @returns true if successful
   */
  async lock(documentId: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/document-lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          password
        })
      })
      return response.ok
    } catch (error) {
      console.error('Failed to lock document:', error)
      return false
    }
  }

  /**
   * Remove lock from a document
   * @param documentId - Document identifier
   * @param password - Current password or master password
   * @returns true if successful
   */
  async unlock(documentId: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/document-lock`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          password
        })
      })
      return response.ok
    } catch (error) {
      console.error('Failed to unlock document:', error)
      return false
    }
  }

  /**
   * List document summaries (requires master password)
   */
  async listSummaries(masterPassword: string): Promise<DocumentSummary[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/documents`, {
        headers: {
          'x-docs-password': masterPassword
        }
      })

      if (!response.ok) {
        return null
      }

      const payload = await response.json() as { summaries?: unknown }
      if (!Array.isArray(payload.summaries)) {
        return []
      }

      return payload.summaries.filter((item): item is DocumentSummary => {
        if (!item || typeof item !== 'object') return false
        const candidate = item as Partial<DocumentSummary>
        return typeof candidate.name === 'string'
          && typeof candidate.createdAt === 'string'
          && typeof candidate.updatedAt === 'string'
          && typeof candidate.locked === 'boolean'
          && typeof candidate.empty === 'boolean'
          && typeof candidate.open === 'boolean'
      })
    } catch (error) {
      console.error('Failed to list document summaries:', error)
      return null
    }
  }

  /**
   * Load raw markdown content for a document (requires master password)
   */
  async getDocumentContent(documentId: string, masterPassword: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/document-content?documentId=${encodeURIComponent(documentId)}`,
        {
          headers: {
            'x-docs-password': masterPassword
          }
        }
      )

      if (!response.ok) {
        return null
      }

      const payload = await response.json() as { content?: unknown }
      return typeof payload.content === 'string' ? payload.content : null
    } catch (error) {
      console.error('Failed to load document content:', error)
      return null
    }
  }

  /**
   * Rename a document (requires master password)
   */
  async renameDocument(from: string, to: string, masterPassword: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/documents/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-docs-password': masterPassword
        },
        body: JSON.stringify({ from, to })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to rename document:', error)
      return false
    }
  }

  /**
   * Remove a document (requires master password)
   */
  async removeDocument(documentId: string, masterPassword: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/documents`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-docs-password': masterPassword
        },
        body: JSON.stringify({ documentId })
      })

      return response.ok
    } catch (error) {
      console.error('Failed to remove document:', error)
      return false
    }
  }
}

/**
 * Create and export document API instance
 * @param baseUrl - Base API URL
 * @returns DocumentAPI instance
 */
export function createDocumentAPI(baseUrl: string): DocumentAPI {
  return new DocumentAPI(baseUrl)
}

// Default export
export default DocumentAPI
