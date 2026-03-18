import { ref, watch } from 'vue'

const STORAGE_KEY = 'dontpad-color-mode'

function getInitialDark(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyDark(value: boolean): void {
  document.documentElement.classList.toggle('dark', value)
}

// Singleton state — shared across all component imports
const isDark = ref(getInitialDark())
applyDark(isDark.value)

watch(isDark, (value) => {
  applyDark(value)
  localStorage.setItem(STORAGE_KEY, value ? 'dark' : 'light')
})

export function useColorMode() {
  function toggle() {
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
}
