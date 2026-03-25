import { describe, expect, it } from 'vitest'
import { trimTrailingSlashes } from '../../cm-utils/document-name'

describe('trimTrailingSlashes', () => {
  it('removes trailing slashes only', () => {
    expect(trimTrailingSlashes('docs/guide///')).toBe('docs/guide')
  })

  it('keeps values without trailing slash intact', () => {
    expect(trimTrailingSlashes('docs/guide')).toBe('docs/guide')
  })
})