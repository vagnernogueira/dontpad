<template>
  <div class="flex h-full w-full flex-col text-gray-900">
    <header class="page-header">
      <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <router-link to="/" class="page-header-link">
          <ArrowLeft :size="18" />
          <span class="hidden xs:inline">Início</span>
        </router-link>
        <Badge variant="secondary" class="font-mono bg-gray-800 text-gray-300 border-gray-700 rounded-md text-xs sm:text-sm px-2 sm:px-3 py-1 shrink-0">
          /explorer
        </Badge>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <Button
          v-if="session.hasAccess.value"
          size="sm"
          class="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-xs h-auto py-btn sm:py-btn-sm flex items-center gap-1.5"
          @click="refreshDocuments"
        >
          <RefreshCw :size="14" />
          Atualizar
        </Button>
        <!-- dark mode toggle: temporariamente desativado
        <Button variant="ghost" size="icon" class="text-gray-300 hover:text-white hover:bg-white/10 h-7 w-7" :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'" @click="toggle">
          <Sun v-if="isDark" :size="16" />
          <Moon v-else :size="16" />
        </Button>
        -->
      </div>
    </header>

    <div class="toolbar">
      <template v-if="session.hasAccess.value">
        <div class="flex items-center gap-2 shrink-0">
          <label for="explorer-search" class="text-xs font-medium text-gray-600 shrink-0">Nm</label>
          <Input
            id="explorer-search"
            v-model="list.search.value"
            type="text"
            class="w-36 sm:w-40 md:w-44 py-btn sm:py-btn-sm focus:ring-gray-800 focus:border-gray-800 bg-white shrink-0"
            placeholder="Buscar por nome"
          />
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <label for="explorer-content-search" class="text-xs font-medium text-gray-600 shrink-0">Ct</label>
          <Input
            id="explorer-content-search"
            v-model="list.contentSearch.value"
            type="text"
            class="w-36 sm:w-40 md:w-44 py-btn sm:py-btn-sm focus:ring-gray-800 focus:border-gray-800 bg-white shrink-0"
            placeholder="Busca por Conteúdo"
          />
        </div>

        <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

        <Button
          variant="outline"
          size="sm"
          :disabled="!list.selectedDocumentName.value"
          class="text-xs h-auto py-btn sm:py-btn-sm shrink-0"
          @click="renameSelected"
        >Renomear</Button>
        <Button
          variant="destructive"
          size="sm"
          :disabled="!list.selectedDocumentName.value"
          class="text-xs h-auto py-btn sm:py-btn-sm shrink-0"
          @click="removeSelected"
        >Remover</Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="!list.selectedDocumentName.value"
          class="text-xs h-auto py-btn sm:py-btn-sm shrink-0"
          @click="downloadSelectedMarkdown"
        >Download markdown</Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="!list.selectedDocumentName.value"
          class="text-xs h-auto py-btn sm:py-btn-sm shrink-0"
          @click="downloadSelectedPDF"
        >Download PDF</Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="!list.selectedDocumentName.value"
          class="text-xs h-auto py-btn sm:py-btn-sm shrink-0"
          @click="lockSelected"
        >Travar</Button>
      </template>
      <p v-else class="text-sm text-gray-500 px-1">Informe a senha mestra para habilitar ações do Explorer.</p>
    </div>

    <main class="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6">
      <section v-if="!session.hasAccess.value" class="mx-auto mt-10 w-full max-w-sm rounded-lg bg-white p-5 shadow">
        <h2 class="mb-3 text-base font-medium text-gray-800">Acesso protegido</h2>
        <p class="mb-3 text-sm text-gray-600">Informe a senha mestra para entrar no Explorer.</p>
        <form class="space-y-3" @submit.prevent="session.unlock">
          <Input
            ref="masterPasswordInputEl"
            v-model="session.masterPasswordInput.value"
            type="password"
            class="py-2 focus:ring-gray-800 focus:border-gray-800"
            placeholder="Senha mestra"
            autocomplete="off"
          />
          <p v-if="session.authError.value" class="text-xs text-red-600">{{ session.authError.value }}</p>
          <Button type="submit" class="w-full">
            Entrar
          </Button>
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
                  <button class="hover:text-gray-900" @click="list.toggleSort('selected')">Seleção</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button class="hover:text-gray-900" @click="list.toggleSort('name')">Nome</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button class="hover:text-gray-900" @click="list.toggleSort('createdAt')">dt criação</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button class="hover:text-gray-900" @click="list.toggleSort('updatedAt')">dt alteração</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button class="hover:text-gray-900" @click="list.toggleSort('locked')">travado (S/N)</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button class="hover:text-gray-900" @click="list.toggleSort('empty')">vazio (S/N)</button>
                </th>
                <th class="px-3 py-2 font-medium">
                  <button class="hover:text-gray-900" @click="list.toggleSort('open')">aberto (S/N)</button>
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
                  <Checkbox
                    :checked="list.selectedDocumentName.value === document.name"
                    @click="() => list.toggleSelection(document.name)"
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
import { nextTick, onMounted, ref, watch } from 'vue'
import { ArrowLeft, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { createDocumentAPI, type DocumentSummary, type ListSummariesOptions } from '../services/document-api'
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
const masterPasswordInputEl = ref<{ $el: HTMLInputElement } | null>(null)

const focusMasterPassword = () => {
  nextTick(() => masterPasswordInputEl.value?.$el?.focus())
}

onMounted(() => {
  if (!session.hasAccess.value) focusMasterPassword()
})

watch(session.hasAccess, (hasAccess) => {
  if (!hasAccess) {
    focusMasterPassword()
    return
  }

  if (list.debouncedContentSearch.value.trim()) {
    void refreshDocuments(getListSummariesOptions())
  }
})

// ── Actions that need both session & list ──────────────────────────

const getListSummariesOptions = (): ListSummariesOptions => {
  const contentContains = list.debouncedContentSearch.value.trim()
  return contentContains ? { contentContains } : {}
}

const refreshDocuments = async (options: ListSummariesOptions = getListSummariesOptions()) => {
  errorMessage.value = ''
  const summaries = await session.refresh(options)
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

watch(list.debouncedContentSearch, () => {
  if (!session.hasAccess.value) return
  void refreshDocuments(getListSummariesOptions())
})

// Persist unlocked flag
watch(session.hasAccess, value => {
  persistence.set('explorer.unlocked', value)
})
</script>
