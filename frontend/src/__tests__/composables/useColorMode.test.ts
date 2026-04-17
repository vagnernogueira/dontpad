import { afterEach, describe, expect, it, vi } from 'vitest'

type MatchMediaChangeListener = (event: MediaQueryListEvent) => void

function installMatchMediaMock(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<MatchMediaChangeListener>()

  const mediaQuery = {
    media: '(prefers-color-scheme: dark)',
    get matches() {
      return matches
    },
    onchange: null,
    addEventListener: vi.fn((_event: string, listener: MatchMediaChangeListener) => {
      listeners.add(listener)
    }),
    removeEventListener: vi.fn((_event: string, listener: MatchMediaChangeListener) => {
      listeners.delete(listener)
    }),
    addListener: vi.fn((listener: MatchMediaChangeListener) => {
      listeners.add(listener)
    }),
    removeListener: vi.fn((listener: MatchMediaChangeListener) => {
      listeners.delete(listener)
    }),
    dispatch(nextMatches: boolean) {
      matches = nextMatches
      const event = { matches: nextMatches } as MediaQueryListEvent
      listeners.forEach((listener) => listener(event))
    },
  }

  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery))

  return mediaQuery
}

async function loadComposableModule() {
  return import('../../composables/useColorMode')
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
  document.documentElement.className = ''
  document.documentElement.style.colorScheme = ''
})

describe('useColorMode', () => {
  it('applies the system preference to the root element on initialization', async () => {
    installMatchMediaMock(true)
    const { initializeColorMode, useColorMode } = await loadComposableModule()

    initializeColorMode()

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(useColorMode().isDark.value).toBe(true)
  })

  it('updates the root element when the system preference changes', async () => {
    const mediaQuery = installMatchMediaMock(false)
    const { initializeColorMode, useColorMode } = await loadComposableModule()

    initializeColorMode()
    mediaQuery.dispatch(true)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(useColorMode().isDark.value).toBe(true)

    mediaQuery.dispatch(false)

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(useColorMode().isDark.value).toBe(false)
  })
})