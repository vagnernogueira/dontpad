import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const indexHtml = readFileSync(resolve(__dirname, '../../../index.html'), 'utf-8')

describe('index.html raw link', () => {
  const doc = new DOMParser().parseFromString(indexHtml, 'text/html')
  const link = doc.getElementById('dontpad-raw-link') as HTMLAnchorElement | null

  it('exposes a static relative link to the raw version outside #app', () => {
    expect(link).not.toBeNull()
    expect(link!.getAttribute('href')).toBe('?raw')
    expect(doc.getElementById('app')!.contains(link)).toBe(false)
  })

  it('stays visually hidden and out of the keyboard focus order', () => {
    expect(link!.getAttribute('tabindex')).toBe('-1')
    expect(link!.getAttribute('aria-hidden')).toBe('true')
    expect(link!.style.position).toBe('absolute')
    expect(link!.style.width).toBe('1px')
    expect(link!.style.height).toBe('1px')
    expect(link!.style.overflow).toBe('hidden')
  })
})
