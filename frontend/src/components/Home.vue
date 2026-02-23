<template>
  <div class="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4">
    <h1 class="text-5xl font-bold mb-4 text-gray-800">Dontpad</h1>
    
    <div class="w-full bg-white p-8 rounded-xl shadow-lg">
      <form @submit.prevent="goToDocument" class="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch">
        <div class="flex min-w-0 flex-1 overflow-hidden rounded-md border border-gray-300">
          <span class="flex items-center whitespace-nowrap bg-gray-100 px-3 text-gray-400 border-r border-gray-300">
            {{ baseUrl }}/
          </span>
          <input
            v-model="docName"
            type="text"
            placeholder="documento"
            class="min-w-0 flex-1 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
            required
          />
        </div>
        <button
          type="submit"
          class="w-full shrink-0 rounded-md bg-gray-800 px-6 py-2 font-bold text-white transition-colors hover:bg-gray-900 sm:w-auto"
        >
          🔗
        </button>
      </form>
    </div>

    <div v-if="showDocumentsBox" class="mt-4 w-full bg-white p-6 rounded-xl shadow-lg">

      <p v-if="isLoadingDocuments" class="text-left text-sm text-gray-500">Carregando documentos...</p>
      <p v-else-if="documentsError" class="text-left text-sm text-red-600">{{ documentsError }}</p>
      <p v-else-if="documents.length === 0" class="text-left text-sm text-gray-500">Nenhum documento encontrado.</p>

      <ul v-else class="max-h-64 space-y-1 overflow-auto text-left">
        <li v-for="document in documents" :key="document">
          <router-link
            :to="toDocumentPath(document)"
            class="block truncate rounded px-2 py-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            {{ document }}
          </router-link>
        </li>
      </ul>
    </div>

    <div
      v-if="showAuthDialog"
      class="absolute inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      @click.self="closeAuthDialog"
    >
      <form
        @submit.prevent="unlockDocuments"
        class="w-full max-w-xs rounded-lg bg-white p-4 shadow-xl"
      >
        <input
          ref="passwordInputRef"
          v-model="passwordInput"
          type="password"
          class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
          autocomplete="off"
        />
        <p v-if="authError" class="mt-2 text-left text-xs text-red-600">{{ authError }}</p>
        <div class="mt-3 flex justify-end gap-2 text-sm">
          <button type="button" @click="closeAuthDialog" class="rounded px-3 py-1.5 text-gray-600 hover:bg-gray-100">Cancelar</button>
          <button type="submit" class="rounded bg-gray-800 px-3 py-1.5 text-white hover:bg-gray-900">Entrar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'

type ShortcutConfig = {
  altKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  key: string
}

const SHORTCUT_PARTS_SEPARATOR = '+'
const VALID_MODIFIERS = new Set(['alt', 'ctrl', 'control', 'shift'])
const VALID_KEYS = new Set([
  'enter', 'escape', 'tab', 'space', 'backspace', 'delete',
  'arrowup', 'arrowdown', 'arrowleft', 'arrowright',
  'home', 'end', 'pageup', 'pagedown'
])

const isValidShortcutKey = (key: string) => {
  if (VALID_KEYS.has(key)) return true
  if (/^[a-z0-9]$/.test(key)) return true
  if (/^f([1-9]|1[0-2])$/.test(key)) return true
  return false
}

const parseShortcut = (shortcutRaw: string | undefined): ShortcutConfig | null => {
  if (!shortcutRaw?.trim()) return null

  const value = shortcutRaw
    .split(SHORTCUT_PARTS_SEPARATOR)
    .map(part => part.trim().toLowerCase())
    .filter(Boolean)

  if (value.length === 0) return null

  const key = value[value.length - 1]

  if (!key || VALID_MODIFIERS.has(key) || !isValidShortcutKey(key)) {
    return null
  }

  const modifiers = value.slice(0, -1)
  if (modifiers.some(modifier => !VALID_MODIFIERS.has(modifier))) {
    return null
  }

  return {
    altKey: modifiers.includes('alt'),
    ctrlKey: modifiers.includes('ctrl') || modifiers.includes('control'),
    shiftKey: modifiers.includes('shift'),
    key
  }
}

const DOCUMENTS_SHORTCUT = parseShortcut(import.meta.env.VITE_HOME_DOCS_SHORTCUT)
const DOCUMENTS_ACCESS_PASSWORD = (import.meta.env.VITE_HOME_DOCS_PASSWORD ?? '').trim()

const router = useRouter()
const docName = ref('')
const documents = ref<string[]>([])
const isLoadingDocuments = ref(false)
const documentsError = ref('')
const hasDocumentsAccess = ref(false)
const documentsAccessPassword = ref('')
const showDocumentsBox = ref(false)
const showAuthDialog = ref(false)
const passwordInput = ref('')
const authError = ref('')
const passwordInputRef = ref<HTMLInputElement | null>(null)

const baseUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.host
  }
  return 'localhost'
})

const goToDocument = () => {
  if (docName.value) {
    router.push(`/${docName.value}`)
  }
}

const apiBaseUrl = computed(() => {
  if (!import.meta.env.PROD) {
    return 'http://localhost:1234'
  }

  return (import.meta.env.VITE_BACKEND_HTTP_URL as string | undefined)?.trim() || 'http://localhost:1234'
})

const toDocumentPath = (document: string) => {
  return `/${document.split('/').map(part => encodeURIComponent(part)).join('/')}`
}

const openAuthDialog = async () => {
  passwordInput.value = ''
  authError.value = DOCUMENTS_ACCESS_PASSWORD ? '' : 'Configure VITE_HOME_DOCS_PASSWORD no .env do frontend.'
  showAuthDialog.value = true
  await nextTick()
  passwordInputRef.value?.focus()
}

const closeAuthDialog = () => {
  showAuthDialog.value = false
  passwordInput.value = ''
  authError.value = ''
}

const unlockDocuments = async () => {
  if (!DOCUMENTS_ACCESS_PASSWORD) {
    authError.value = 'Configure VITE_HOME_DOCS_PASSWORD no .env do frontend.'
    return
  }

  if (passwordInput.value !== DOCUMENTS_ACCESS_PASSWORD) {
    authError.value = 'Senha inválida.'
    return
  }

  hasDocumentsAccess.value = true
  documentsAccessPassword.value = passwordInput.value
  showDocumentsBox.value = true
  closeAuthDialog()
  await fetchDocuments()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!DOCUMENTS_SHORTCUT) return

  const key = event.key.toLowerCase()

  if (
    event.altKey === DOCUMENTS_SHORTCUT.altKey &&
    event.ctrlKey === DOCUMENTS_SHORTCUT.ctrlKey &&
    event.shiftKey === DOCUMENTS_SHORTCUT.shiftKey &&
    key === DOCUMENTS_SHORTCUT.key
  ) {
    event.preventDefault()
    if (hasDocumentsAccess.value) {
      showDocumentsBox.value = !showDocumentsBox.value
      return
    }

    openAuthDialog()
  }
}

const fetchDocuments = async () => {
  isLoadingDocuments.value = true
  documentsError.value = ''

  try {
    const response = await fetch(`${apiBaseUrl.value}/api/documents`, {
      headers: {
        'x-docs-password': documentsAccessPassword.value
      }
    })
    if (!response.ok) {
      throw new Error('Erro ao listar documentos')
    }

    const data = await response.json() as { documents?: unknown }
    documents.value = Array.isArray(data.documents)
      ? data.documents.filter((document): document is string => typeof document === 'string')
      : []
  } catch (error) {
    documentsError.value = 'Não foi possível carregar os documentos.'
    documents.value = []
  } finally {
    isLoadingDocuments.value = false
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
