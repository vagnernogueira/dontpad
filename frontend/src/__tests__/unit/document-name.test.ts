import { describe, expect, it } from 'vitest'
import { buildDocumentTitle, trimTrailingSlashes } from '../../cm-utils/document-name'

describe('trimTrailingSlashes', () => {
  it('removes trailing slashes only', () => {
    expect(trimTrailingSlashes('docs/guide///')).toBe('docs/guide')
  })

  it('keeps values without trailing slash intact', () => {
    expect(trimTrailingSlashes('docs/guide')).toBe('docs/guide')
  })
})

describe('buildDocumentTitle', () => {
  it('formats the title with the document breadcrumb', () => {
    expect(buildDocumentTitle('me/todo')).toBe('Dontpad - me/todo')
  })

  it('normalizes trailing slashes before formatting the title', () => {
    expect(buildDocumentTitle('me/todo///')).toBe('Dontpad - me/todo')
  })
})