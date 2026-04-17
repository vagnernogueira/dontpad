import { readonly, ref } from 'vue'

const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)'

const isDark = ref(false)

let stopSync: (() => void) | null = null

function applyColorMode(enabled: boolean) {
  isDark.value = enabled

  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.classList.toggle('dark', enabled)
  root.style.colorScheme = enabled ? 'dark' : 'light'
}

export function initializeColorMode() {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  stopSync?.()

  const mediaQuery = window.matchMedia(DARK_MODE_MEDIA_QUERY)
  const handleChange = (event: MediaQueryListEvent) => {
    applyColorMode(event.matches)
  }

  applyColorMode(mediaQuery.matches)

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleChange)
    stopSync = () => {
      mediaQuery.removeEventListener('change', handleChange)
      stopSync = null
    }
    return stopSync
  }

  mediaQuery.addListener(handleChange)
  stopSync = () => {
    mediaQuery.removeListener(handleChange)
    stopSync = null
  }

  return stopSync
}

export function useColorMode() {
  return { isDark: readonly(isDark) }
}
