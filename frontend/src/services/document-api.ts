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
