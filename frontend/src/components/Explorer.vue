<template>
  <div class="flex h-full w-full flex-col text-gray-900">
    <header class="bg-gray-900 text-gray-100 px-3 sm:px-5 py-btn sm:py-header flex items-center justify-between shadow-md z-20">
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
        v-if="session.hasAccess.value"
        @click="refreshDocuments"
        class="px-2 sm:px-3 py-btn sm:py-btn-sm bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 rounded-md font-medium text-xs transition-colors focus:outline-none flex items-center gap-1.5 shadow-sm touch-manipulation shrink-0"
      >
        <RefreshCw :size="14" />
        Atualizar
      </button>
    </header>

    <div class="bg-[#f8f9fa] border-b border-gray-200 px-2 sm:px-4 py-btn flex items-center gap-1 sm:gap-1.5 shadow-sm text-gray-600 z-10 text-sm overflow-x-auto overflow-y-hidden">
      <template v-if="session.hasAccess.value">
        <input
          v-model="list.search.value"
          type="text"
          class="w-full rounded border border-gray-300 px-3 py-btn sm:py-btn-sm text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 sm:max-w-sm bg-white shrink-0"
          placeholder="Buscar por nome"
        />

        <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>

        <button
          @click="renameSelected"
          :disabled="!list.selectedDocumentName.value"
          class="px-2.5 py-btn sm:py-btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none touch-manipulation shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >Renomear</button>
        <button
          @click="removeSelected"
          :disabled="!list.selectedDocumentName.value"
          class="px-2.5 py-btn sm:py-btn-sm bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-md font-medium text-xs transition-colors focus:outline-none touch-manipulation shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >Remover</button>
        <button
          @click="downloadSelectedMarkdown"
          :disabled="!list.selectedDocumentName.value"
          class="px-2.5 py-btn sm:py-btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none touch-manipulation shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >Download markdown</button>
        <button
          @click="downloadSelectedPDF"
          :disabled="!list.selectedDocumentName.value"
          class="px-2.5 py-btn sm:py-btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none touch-manipulation shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >Download PDF</button>
        <button
          @click="lockSelected"
          :disabled="!list.selectedDocumentName.value"
          class="px-2.5 py-btn sm:py-btn-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none touch-manipulation shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
        >Travar</button>
      </template>
      <p v-else class="text-sm text-gray-500 px-1">Informe a senha mestra para habilitar ações do Explorer.</p>
    </div>

    <main class="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
      <section v-if="!session.hasAccess.value" class="mx-auto mt-10 w-full max-w-sm rounded-lg bg-white p-5 shadow">
        <h2 class="mb-3 text-base font-medium text-gray-800">Acesso protegido</h2>
        <p class="mb-3 text-sm text-gray-600">Informe a senha mestra para entrar no Explorer.</p>
        <form @submit.prevent="session.unlock" class="space-y-3">
          <input
            v-model="session.masterPasswordInput.value"
            type="password"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
            placeholder="Senha mestra"
            autocomplete="off"
          />
          <p v-if="session.authError.value" class="text-xs text-red-600">{{ session.authError.value }}</p>
          <button type="submit" class="w-full rounded bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-900">
            Entrar
          </button>
        </form>
      </section>

      <section v-else class="space-y-4">
        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
        <p v-else-if="session.isLoading.value" class="text-sm text-gray-500">Carregando documentos...</p>

        <div class="overflow-auto rounded-lg bg-white shadow">
          <table class="min-w-full border-collapse text-sm">
            <thead class="bg-gray-100 text-left text-gray-700">
              <tr>
                <th class="px-3 py-2 font-medium">
                  <button @click="list.toggleSort('selected')" class="hover:text-gray-900">Seleção</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button @click="list.toggleSort('name')" class="hover:text-gray-900">Nome</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button @click="list.toggleSort('createdAt')" class="hover:text-gray-900">dt criação</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button @click="list.toggleSort('updatedAt')" class="hover:text-gray-900">dt alteração</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button @click="list.toggleSort('locked')" class="hover:text-gray-900">travado (S/N)</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button @click="list.toggleSort('empty')" class="hover:text-gray-900">vazio (S/N)</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button @click="list.toggleSort('open')" class="hover:text-gray-900">aberto (S/N)</button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!session.isLoading.value && list.sortedDocuments.value.length === 0">
                <td colspan="7" class="px-3 py-4 text-center text-gray-500">Nenhum documento encontrado.</td>
              </tr>

              <tr
                v-for="document in list.sortedDocuments.value"
                :key="document.name"
                class="border-t border-gray-100"
              >
                <td class="px-3 py-2">
                  <input
                    type="checkbox"
                    :checked="list.selectedDocumentName.value === document.name"
                    @change="list.toggleSelection(document.name)"
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
import { onMounted, ref, watch } from 'vue'
import { ArrowLeft, RefreshCw } from 'lucide-vue-next'
import { createDocumentAPI, type DocumentSummary } from '../services/document-api'
import { getApiBaseUrl } from '../services/config'
import { downloadMarkdown, downloadPDF } from '../services/export'
import { trimTrailingSlashes } from '../cm-utils/document-name'
import persistence from '../services/persistence'
import { useExplorerSession } from '../composables/useExplorerSession'
import { useDocumentList } from '../composables/useDocumentList'

const documentAPI = createDocumentAPI(getApiBaseUrl())
const EXPLORER_DOCUMENTS_CACHE_KEY = 'explorer.documentsCache'

// ── Composables ────────────────────────────────────────────────────

const session = useExplorerSession(documentAPI)
const list = useDocumentList(() => session.documents.value)

// ── Type guard (kept here since it validates API shape) ────────────

const isDocumentSummary = (item: unknown): item is DocumentSummary => {
  if (!item || typeof item !== 'object') return false
  const c = item as Partial<DocumentSummary>
  return typeof c.name === 'string'
    && typeof c.createdAt === 'string'
    && typeof c.updatedAt === 'string'
    && typeof c.locked === 'boolean'
    && typeof c.empty === 'boolean'
    && typeof c.open === 'boolean'
}

// ── Local state ────────────────────────────────────────────────────

const errorMessage = ref('')

// ── Actions that need both session & list ──────────────────────────

const refreshDocuments = async () => {
  errorMessage.value = ''
  const summaries = await session.refresh()
  if (summaries) list.clearSelectionIfMissing(summaries)
}

const getSelectedDocumentName = () => {
  if (!list.selectedDocumentName.value) {
    errorMessage.value = 'Selecione um documento.'
    return null
  }
  return list.selectedDocumentName.value
}

const renameSelected = async () => {
  errorMessage.value = ''
  if (!session.ensureMasterPassword()) return
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

  const ok = await documentAPI.renameDocument(selectedName, nextName, session.masterPassword.value)
  if (!ok) {
    errorMessage.value = 'Não foi possível renomear o documento.'
    return
  }

  list.selectedDocumentName.value = nextName
  await refreshDocuments()
}

const removeSelected = async () => {
  errorMessage.value = ''
  if (!session.ensureMasterPassword()) return
  const selectedName = getSelectedDocumentName()
  if (!selectedName) return

  if (!window.confirm(`Remover o documento "${selectedName}" permanentemente?`)) return

  const ok = await documentAPI.removeDocument(selectedName, session.masterPassword.value)
  if (!ok) {
    errorMessage.value = 'Não foi possível remover o documento.'
    return
  }

  list.selectedDocumentName.value = null
  await refreshDocuments()
}

const downloadSelectedMarkdown = async () => {
  errorMessage.value = ''
  if (!session.ensureMasterPassword()) return
  const selectedName = getSelectedDocumentName()
  if (!selectedName) return

  const content = await documentAPI.getDocumentContent(selectedName, session.masterPassword.value)
  if (content === null) {
    errorMessage.value = 'Não foi possível carregar o conteúdo para download markdown.'
    return
  }
  downloadMarkdown(content, selectedName)
}

const downloadSelectedPDF = async () => {
  errorMessage.value = ''
  if (!session.ensureMasterPassword()) return
  const selectedName = getSelectedDocumentName()
  if (!selectedName) return

  const content = await documentAPI.getDocumentContent(selectedName, session.masterPassword.value)
  if (content === null) {
    errorMessage.value = 'Não foi possível carregar o conteúdo para download PDF.'
    return
  }
  await downloadPDF(content, selectedName)
}

const lockSelected = async () => {
  errorMessage.value = ''
  if (!session.ensureMasterPassword()) return
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

const toDocumentPath = (documentName: string) => {
  return '/' + documentName.split('/').map(part => encodeURIComponent(part)).join('/')
}

const formatDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('pt-BR')
}

// ── Lifecycle ──────────────────────────────────────────────────────

onMounted(() => {
  list.restoreFromStorage()

  const shouldRefresh = session.restore(isDocumentSummary)
  if (shouldRefresh) {
    void refreshDocuments()
    return
  }

  if (session.hasAccess.value) {
    errorMessage.value = 'Estado do Explorer restaurado. Refaça a autenticação ao atualizar ou executar ações de gestão.'
  }
})

// Persist documents cache
watch(session.documents, value => {
  persistence.set(EXPLORER_DOCUMENTS_CACHE_KEY, value)
}, { deep: true })

// Persist unlocked flag
watch(session.hasAccess, value => {
  persistence.set('explorer.unlocked', value)
})
</script>
