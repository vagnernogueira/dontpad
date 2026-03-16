<template>
  <div class="flex h-full w-full flex-col text-gray-900">
    <header class="bg-gray-900 text-gray-100 px-3 sm:px-5 py-[7.2px] sm:py-[9px] flex items-center justify-between shadow-md z-20">
      <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <router-link to="/" class="font-bold text-base sm:text-lg hover:text-white transition-colors flex items-center gap-1 shrink-0">
          <ArrowLeft :size="18" />
          <span class="hidden xs:inline">Início</span>
        </router-link>
        <div class="font-mono bg-gray-800 text-gray-300 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm shrink-0 border border-gray-700">
          /explorer
        </div>
      </div>
      <button
        v-if="hasAccess"
        @click="refreshDocuments"
        class="px-2 sm:px-3 py-[7.2px] sm:py-[5.4px] bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 rounded-md font-medium text-xs transition-colors focus:outline-none flex items-center gap-1.5 shadow-sm touch-manipulation shrink-0"
      >
        <RefreshCw :size="14" />
        Atualizar
      </button>
    </header>

    <div class="bg-[#f8f9fa] border-b border-gray-200 px-2 sm:px-4 py-[7.2px] flex items-center gap-1 sm:gap-1.5 shadow-sm text-gray-600 z-10 text-sm overflow-x-auto overflow-y-hidden">
      <template v-if="hasAccess">
        <input
          v-model="search"
          type="text"
          class="w-full rounded border border-gray-300 px-3 py-[7.2px] sm:py-[5.4px] text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 sm:max-w-sm bg-white shrink-0"
          placeholder="Buscar por nome"
        />

        <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>

        <button
          @click="renameSelected"
          :disabled="!selectedDocumentName"
          class="px-2.5 py-[7.2px] sm:py-[5.4px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none touch-manipulation shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >Renomear</button>
        <button
          @click="removeSelected"
          :disabled="!selectedDocumentName"
          class="px-2.5 py-[7.2px] sm:py-[5.4px] bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-md font-medium text-xs transition-colors focus:outline-none touch-manipulation shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >Remover</button>
        <button
          @click="downloadSelectedMarkdown"
          :disabled="!selectedDocumentName"
          class="px-2.5 py-[7.2px] sm:py-[5.4px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none touch-manipulation shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >Download markdown</button>
        <button
          @click="downloadSelectedPDF"
          :disabled="!selectedDocumentName"
          class="px-2.5 py-[7.2px] sm:py-[5.4px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none touch-manipulation shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >Download PDF</button>
        <button
          @click="lockSelected"
          :disabled="!selectedDocumentName"
          class="px-2.5 py-[7.2px] sm:py-[5.4px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none touch-manipulation shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >Travar</button>
      </template>
      <p v-else class="text-sm text-gray-500 px-1">Informe a senha mestra para habilitar ações do Explorer.</p>
    </div>

    <main class="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
      <section v-if="!hasAccess" class="mx-auto mt-10 w-full max-w-sm rounded-lg bg-white p-5 shadow">
        <h2 class="mb-3 text-base font-medium text-gray-800">Acesso protegido</h2>
        <p class="mb-3 text-sm text-gray-600">Informe a senha mestra para entrar no Explorer.</p>
        <form @submit.prevent="unlockExplorer" class="space-y-3">
          <input
            v-model="masterPasswordInput"
            type="password"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
            placeholder="Senha mestra"
            autocomplete="off"
          />
          <p v-if="authError" class="text-xs text-red-600">{{ authError }}</p>
          <button type="submit" class="w-full rounded bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-900">
            Entrar
          </button>
        </form>
      </section>

      <section v-else class="space-y-4">
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <p v-else-if="isLoading" class="text-sm text-gray-500">Carregando documentos...</p>

        <div class="overflow-auto rounded-lg bg-white shadow">
          <table class="min-w-full border-collapse text-sm">
            <thead class="bg-gray-100 text-left text-gray-700">
              <tr>
                <th class="px-3 py-2 font-medium">
                  <button @click="toggleSort('selected')" class="hover:text-gray-900">Seleção</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button @click="toggleSort('name')" class="hover:text-gray-900">Nome</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button @click="toggleSort('createdAt')" class="hover:text-gray-900">dt criação</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button @click="toggleSort('updatedAt')" class="hover:text-gray-900">dt alteração</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button @click="toggleSort('locked')" class="hover:text-gray-900">travado (S/N)</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button @click="toggleSort('empty')" class="hover:text-gray-900">vazio (S/N)</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button @click="toggleSort('open')" class="hover:text-gray-900">aberto (S/N)</button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!isLoading && sortedDocuments.length === 0">
                <td colspan="7" class="px-3 py-4 text-center text-gray-500">Nenhum documento encontrado.</td>
              </tr>

              <tr
                v-for="document in sortedDocuments"
                :key="document.name"
                class="border-t border-gray-100"
              >
                <td class="px-3 py-2">
                  <input
                    type="checkbox"
                    :checked="selectedDocumentName === document.name"
                    @change="toggleSelection(document.name)"
                  />
                </td>
                <td class="px-3 py-2">
                  <a
                    :href="toDocumentPath(document.name)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-gray-800 hover:underline"
                  >
                    {{ document.name }}
                  </a>
                </td>
                <td class="px-3 py-2 text-gray-700">{{ formatDate(document.createdAt) }}</td>
                <td class="px-3 py-2 text-gray-700">{{ formatDate(document.updatedAt) }}</td>
                <td class="px-3 py-2 text-gray-700">{{ document.locked ? 'S' : 'N' }}</td>
                <td class="px-3 py-2 text-gray-700">{{ document.empty ? 'S' : 'N' }}</td>
                <td class="px-3 py-2 text-gray-700">{{ document.open ? 'S' : 'N' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeft, RefreshCw } from 'lucide-vue-next'
import { createDocumentAPI, type DocumentSummary } from '../services/document-api'
import { getApiBaseUrl } from '../services/config'
import { downloadMarkdown, downloadPDF } from '../services/export'
import { trimTrailingSlashes } from '../cm-utils/document-name'

const documentAPI = createDocumentAPI(getApiBaseUrl())

const hasAccess = ref(false)
const isLoading = ref(false)
const masterPassword = ref('')
const masterPasswordInput = ref('')
const authError = ref('')
const errorMessage = ref('')
const search = ref('')
const selectedDocumentName = ref<string | null>(null)
const documents = ref<DocumentSummary[]>([])

type SortKey = 'selected' | 'name' | 'createdAt' | 'updatedAt' | 'locked' | 'empty' | 'open'

const sortKey = ref<SortKey>('updatedAt')
const sortDirection = ref<'asc' | 'desc'>('desc')

const unlockExplorer = async () => {
  authError.value = ''
  errorMessage.value = ''

  const candidate = masterPasswordInput.value.trim()
  if (!candidate) {
    authError.value = 'Informe a senha mestra.'
    return
  }

  isLoading.value = true
  const summaries = await documentAPI.listSummaries(candidate)
  isLoading.value = false

  if (summaries === null) {
    authError.value = 'Senha mestra inválida.'
    return
  }

  masterPassword.value = candidate
  hasAccess.value = true
  documents.value = summaries
  selectedDocumentName.value = null
  masterPasswordInput.value = ''
}

const refreshDocuments = async () => {
  if (!hasAccess.value) return

  isLoading.value = true
  errorMessage.value = ''
  const summaries = await documentAPI.listSummaries(masterPassword.value)
  isLoading.value = false

  if (summaries === null) {
    hasAccess.value = false
    documents.value = []
    selectedDocumentName.value = null
    authError.value = 'Sua sessão de acesso expirou. Informe a senha mestra novamente.'
    return
  }

  documents.value = summaries
  if (selectedDocumentName.value && !summaries.some(doc => doc.name === selectedDocumentName.value)) {
    selectedDocumentName.value = null
  }
}

const filteredDocuments = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return documents.value
  return documents.value.filter(document => document.name.toLowerCase().includes(term))
})

const sortedDocuments = computed(() => {
  const items = [...filteredDocuments.value]

  items.sort((left, right) => {
    const selectionLeft = selectedDocumentName.value === left.name
    const selectionRight = selectedDocumentName.value === right.name

    const direction = sortDirection.value === 'asc' ? 1 : -1

    if (sortKey.value === 'selected') {
      if (selectionLeft === selectionRight) return 0
      return selectionLeft ? 1 * direction : -1 * direction
    }

    if (sortKey.value === 'name') {
      return left.name.localeCompare(right.name) * direction
    }

    if (sortKey.value === 'createdAt' || sortKey.value === 'updatedAt') {
      const leftDate = new Date(left[sortKey.value]).getTime()
      const rightDate = new Date(right[sortKey.value]).getTime()
      return (leftDate - rightDate) * direction
    }

    const leftBool = left[sortKey.value] ? 1 : 0
    const rightBool = right[sortKey.value] ? 1 : 0
    return (leftBool - rightBool) * direction
  })

  return items
})

const toggleSort = (key: SortKey) => {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = key
  sortDirection.value = key === 'updatedAt' ? 'desc' : 'asc'
}

const toggleSelection = (documentName: string) => {
  selectedDocumentName.value = selectedDocumentName.value === documentName ? null : documentName
}

const toDocumentPath = (documentName: string) => {
  const encoded = documentName.split('/').map(part => encodeURIComponent(part)).join('/')
  return `/${encoded}`
}

const getSelectedDocumentName = () => {
  if (!selectedDocumentName.value) {
    errorMessage.value = 'Selecione um documento.'
    return null
  }
  return selectedDocumentName.value
}

const renameSelected = async () => {
  errorMessage.value = ''
  const selectedName = getSelectedDocumentName()
  if (!selectedName) return

  const nextNameRaw = window.prompt('Novo nome do documento:', selectedName)
  if (!nextNameRaw) return

  const nextName = trimTrailingSlashes(nextNameRaw.trim())
  if (!nextName) {
    errorMessage.value = 'Nome inválido. Remova a barra no final do nome e tente novamente.'
    return
  }

  if (nextName === selectedName) return

  const ok = await documentAPI.renameDocument(selectedName, nextName, masterPassword.value)
  if (!ok) {
    errorMessage.value = 'Não foi possível renomear o documento.'
    return
  }

  selectedDocumentName.value = nextName
  await refreshDocuments()
}

const removeSelected = async () => {
  errorMessage.value = ''
  const selectedName = getSelectedDocumentName()
  if (!selectedName) return

  const confirmed = window.confirm(`Remover o documento "${selectedName}" permanentemente?`)
  if (!confirmed) return

  const ok = await documentAPI.removeDocument(selectedName, masterPassword.value)
  if (!ok) {
    errorMessage.value = 'Não foi possível remover o documento.'
    return
  }

  selectedDocumentName.value = null
  await refreshDocuments()
}

const downloadSelectedMarkdown = async () => {
  errorMessage.value = ''
  const selectedName = getSelectedDocumentName()
  if (!selectedName) return

  const content = await documentAPI.getDocumentContent(selectedName, masterPassword.value)
  if (content === null) {
    errorMessage.value = 'Não foi possível carregar o conteúdo para download markdown.'
    return
  }

  downloadMarkdown(content, selectedName)
}

const downloadSelectedPDF = async () => {
  errorMessage.value = ''
  const selectedName = getSelectedDocumentName()
  if (!selectedName) return

  const content = await documentAPI.getDocumentContent(selectedName, masterPassword.value)
  if (content === null) {
    errorMessage.value = 'Não foi possível carregar o conteúdo para download PDF.'
    return
  }

  await downloadPDF(content, selectedName)
}

const lockSelected = async () => {
  errorMessage.value = ''
  const selectedName = getSelectedDocumentName()
  if (!selectedName) return

  const password = window.prompt('Senha para travar o documento:')
  if (!password || !password.trim()) {
    errorMessage.value = 'Informe uma senha válida para travar.'
    return
  }

  const ok = await documentAPI.lock(selectedName, password.trim())
  if (!ok) {
    errorMessage.value = 'Não foi possível travar o documento.'
    return
  }

  await refreshDocuments()
}

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-BR')
}
</script>
