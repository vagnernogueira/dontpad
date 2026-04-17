import { readonly, ref } from 'vue'
import persistence from '../services/persistence'

const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)'
const COLOR_MODE_PREFERENCE_KEY = 'colorMode'

type ColorModePreference = 'light' | 'dark'

const isDark = ref(false)
const preference = ref<ColorModePreference | null>(null)

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

function normalizePreference(value: string): ColorModePreference | null {
  if (value === 'dark' || value === 'light') {
    return value
  }

  return null
}

function readStoredPreference(): ColorModePreference | null {
  return normalizePreference(persistence.get(COLOR_MODE_PREFERENCE_KEY, ''))
}

function getSystemPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia(DARK_MODE_MEDIA_QUERY).matches
}

function resolveIsDark(nextPreference: ColorModePreference | null = preference.value): boolean {
  if (nextPreference) {
    return nextPreference === 'dark'
  }

  return getSystemPreference()
}

function persistPreference(nextPreference: ColorModePreference) {
  preference.value = nextPreference
  persistence.set(COLOR_MODE_PREFERENCE_KEY, nextPreference)
  applyColorMode(nextPreference === 'dark')
}

function handleSystemPreferenceChange(event: MediaQueryListEvent) {
  if (preference.value !== null) {
    return
  }

  applyColorMode(event.matches)
}

export function initializeColorMode() {
  preference.value = readStoredPreference()

  applyColorMode(resolveIsDark())

  if (typeof window === 'undefined') {
    return () => undefined
  }

  stopSync?.()

  if (typeof window.matchMedia !== 'function') {
    return () => undefined
  }

  const mediaQuery = window.matchMedia(DARK_MODE_MEDIA_QUERY)

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleSystemPreferenceChange)
    stopSync = () => {
      mediaQuery.removeEventListener('change', handleSystemPreferenceChange)
      stopSync = null
    }
    return stopSync
  }

  mediaQuery.addListener(handleSystemPreferenceChange)
  stopSync = () => {
    mediaQuery.removeListener(handleSystemPreferenceChange)
    stopSync = null
  }

  return stopSync
}

export function setColorMode(nextPreference: ColorModePreference) {
  persistPreference(nextPreference)
}

export function toggleColorMode() {
  persistPreference(isDark.value ? 'light' : 'dark')
}

export function useColorMode() {
  return {
    isDark: readonly(isDark),
    toggle: toggleColorMode,
    setColorMode,
  }
}
