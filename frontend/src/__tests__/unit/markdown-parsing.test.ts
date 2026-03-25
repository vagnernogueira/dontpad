import { describe, expect, it } from 'vitest'
import { findCheckboxes, findMarkdownLinks, findPlainUrls, normalizeUrl, parseCheckboxStatus } from '../../cm-utils/markdown-parsing'

describe('markdown parsing', () => {
  it('finds markdown links and excludes their urls from plain url matches', () => {
    const text = 'See [site](https://example.com) and visit www.test.dev now'

    const markdownLinks = findMarkdownLinks(text)
    const plainUrls = findPlainUrls(text)

    expect(markdownLinks).toHaveLength(1)
    expect(markdownLinks[0]?.url).toBe('https://example.com')
    expect(plainUrls).toHaveLength(1)
    expect(plainUrls[0]?.url).toBe('www.test.dev')
  })

  it('parses checkbox states in supported list formats', () => {
    const text = '- [x] done\n1. [ ] todo'
    const checkboxes = findCheckboxes(text)

    expect(checkboxes).toHaveLength(2)
    expect(checkboxes[0]?.status).toBe('checked')
    expect(checkboxes[1]?.status).toBe('unchecked')
    expect(parseCheckboxStatus('- [x] done')).toBe('checked')
  })

  it('normalizes urls without protocol', () => {
    expect(normalizeUrl('www.example.com')).toBe('https://www.example.com')
    expect(normalizeUrl('example.com')).toBe('https://example.com')
    expect(normalizeUrl('https://example.com')).toBe('https://example.com')
  })
})