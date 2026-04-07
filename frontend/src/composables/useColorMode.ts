import { ref } from 'vue'

const isDark = ref(false)

export function useColorMode() {
  function toggle() {
    isDark.value = !isDark.value
  }

  return { isDark, toggle }
}
