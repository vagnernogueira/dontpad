export const trimTrailingSlashes = (value: string): string => {
  return value.replace(/\/+$/g, '')
}

export const buildDocumentTitle = (documentId: string, productName: string = 'Dontpad'): string => {
  const normalizedDocumentId = trimTrailingSlashes(documentId.trim())

  return normalizedDocumentId ? `${productName} - ${normalizedDocumentId}` : productName
}
