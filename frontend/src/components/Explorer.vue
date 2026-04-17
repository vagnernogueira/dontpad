<template>
  <div class="flex h-full w-full flex-col text-foreground">
    <header class="z-20 flex items-center justify-between border-b border-border bg-background px-3 py-btn text-foreground shadow-md sm:px-5 sm:py-header">
      <div class="flex items-center gap-0 min-w-0 flex-1 sm:gap-0">
        <router-link
          to="/"
          class="flex shrink-0 items-center gap-1 transition-colors hover:text-primary"
        >
          <ArrowLeft :size="18" />
          <span class="hidden rounded-md border border-transparent px-2 py-1 text-xs font-medium xs:inline sm:px-3 sm:text-sm">Início</span>
        </router-link>
        <Badge variant="secondary" class="mr-2 shrink-0 rounded-md border-primary/20 px-2 py-1 font-mono text-xs sm:mr-4 sm:px-3 sm:text-sm">
          /explorer
        </Badge>
      </div>
      <div class="flex items-center gap-1 shrink-0 text-muted-foreground">
        <template v-if="session.hasAccess.value">
          <Button
            size="sm"
            variant="secondary"
            class="h-auto gap-1.5 py-btn text-xs sm:py-btn-sm"
            @click="refreshDocuments"
          >
            <RefreshCw :size="14" />
            Atualizar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            class="h-auto gap-1.5 py-btn text-xs sm:py-btn-sm"
            @click="downloadGeneralBackup"
          >
            <Archive :size="14" />
            Backup geral
          </Button>
        </template>
        <Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground hover:bg-accent hover:text-accent-foreground" :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'" @click="toggle">
          <Sun v-if="isDark" :size="16" />
          <Moon v-else :size="16" />
        </Button>
      </div>
    </header>

    <div class="z-10 flex items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-border bg-background px-2 py-btn text-sm text-muted-foreground shadow-xs sm:gap-1.5 sm:px-4">
      <template v-if="session.hasAccess.value">
        <div class="flex items-center gap-2 shrink-0">
          <Label for="explorer-search" class="shrink-0 text-xs font-medium text-muted-foreground">Nm</Label>
          <Input
            id="explorer-search"
            v-model="list.search.value"
            type="text"
            class="w-36 shrink-0 bg-background py-btn sm:w-40 sm:py-btn-sm md:w-44"
            placeholder="Buscar por nome"
          />
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <Label for="explorer-content-search" class="shrink-0 text-xs font-medium text-muted-foreground">Ct</Label>
          <Input
            id="explorer-content-search"
            v-model="list.contentSearch.value"
            type="text"
            class="w-36 shrink-0 bg-background py-btn sm:w-40 sm:py-btn-sm md:w-44"
            placeholder="Busca por conteúdo"
          />
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <Label for="explorer-regex-mode" class="text-xs font-medium text-muted-foreground">Rgx</Label>
          <Switch
            id="explorer-regex-mode"
            v-model="list.regexEnabled.value"
            aria-label="Rgx"
            class="data-[state=checked]:bg-primary"
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
      <Alert v-else class="border-border bg-card px-3 py-2 text-muted-foreground shadow-none">
        <AlertDescription class="text-xs sm:text-sm">
          Informe a senha mestra para habilitar ações do Explorer.
        </AlertDescription>
      </Alert>
    </div>

    <main class="flex-1 overflow-auto bg-muted p-4 sm:p-6">
      <section v-if="!session.hasAccess.value" class="mx-auto mt-10 w-full max-w-sm">
        <Card class="shadow-sm">
          <CardHeader class="space-y-2">
            <CardTitle class="text-base text-card-foreground">Acesso protegido</CardTitle>
            <CardDescription class="text-sm text-muted-foreground">
              Informe a senha mestra para entrar no Explorer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form class="space-y-3" @submit.prevent="session.unlock">
              <div class="space-y-2">
                <Label for="explorer-master-password">Senha mestra</Label>
                <Input
                  id="explorer-master-password"
                  ref="masterPasswordInputEl"
                  v-model="session.masterPasswordInput.value"
                  type="password"
                  class="py-2"
                  placeholder="Senha mestra"
                  autocomplete="off"
                />
              </div>
              <Alert v-if="session.authError.value" variant="destructive">
                <AlertDescription>{{ session.authError.value }}</AlertDescription>
              </Alert>
              <Button type="submit" class="w-full">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section v-else class="space-y-4">
        <Alert v-if="displayedErrorMessage" variant="destructive">
          <AlertDescription>{{ displayedErrorMessage }}</AlertDescription>
        </Alert>
        <Alert v-else-if="session.isLoading.value" class="border-border bg-card text-muted-foreground">
          <AlertDescription>Carregando documentos...</AlertDescription>
        </Alert>

        <div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <Table>
            <TableHeader class="bg-muted text-left text-muted-foreground">
              <TableRow class="border-border hover:bg-transparent">
                <TableHead class="px-3 py-2 font-medium">
                  <Button :class="sortButtonClass" variant="ghost" size="sm" @click="list.toggleSort('selected')">Seleção</Button>
                </TableHead>
                <TableHead class="px-3 py-2 font-medium">
                  <Button :class="sortButtonClass" variant="ghost" size="sm" @click="list.toggleSort('name')">Nome</Button>
                </TableHead>
                <TableHead class="px-3 py-2 font-medium">
                  <Button :class="sortButtonClass" variant="ghost" size="sm" @click="list.toggleSort('createdAt')">dt criação</Button>
                </TableHead>
                <TableHead class="px-3 py-2 font-medium">
                  <Button :class="sortButtonClass" variant="ghost" size="sm" @click="list.toggleSort('updatedAt')">dt alteração</Button>
                </TableHead>
                <TableHead class="px-3 py-2 font-medium">
                  <Button :class="sortButtonClass" variant="ghost" size="sm" @click="list.toggleSort('locked')">travado (S/N)</Button>
                </TableHead>
                <TableHead class="px-3 py-2 font-medium">
                  <Button :class="sortButtonClass" variant="ghost" size="sm" @click="list.toggleSort('empty')">vazio (S/N)</Button>
                </TableHead>
                <TableHead class="px-3 py-2 font-medium">
                  <Button :class="sortButtonClass" variant="ghost" size="sm" @click="list.toggleSort('open')">aberto (S/N)</Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="!session.isLoading.value && list.sortedDocuments.value.length === 0" class="hover:bg-transparent">
                <TableCell colspan="7" class="px-3 py-4 text-center text-muted-foreground">Nenhum documento encontrado.</TableCell>
              </TableRow>

              <TableRow
                v-for="document in list.sortedDocuments.value"
                :key="document.name"
                :data-state="list.selectedDocumentName.value === document.name ? 'selected' : undefined"
                class="border-border"
              >
                <TableCell class="px-3 py-2">
                  <Checkbox
                    :model-value="list.selectedDocumentName.value === document.name"
                    @update:model-value="list.setSelection(document.name, $event === true)"
                  />
                </TableCell>
                <TableCell class="px-3 py-2">
                  <Button
                    as="a"
                    variant="link"
                    :href="toDocumentPath(document.name)"
                    target="_blank"
                    rel="noopener noreferrer"
                    :class="documentLinkClass"
                  >
                    {{ document.name }}
                  </Button>
                </TableCell>
                <TableCell class="px-3 py-2 text-foreground">{{ formatDate(document.createdAt) }}</TableCell>
                <TableCell class="px-3 py-2 text-foreground">{{ formatDate(document.updatedAt) }}</TableCell>
                <TableCell class="px-3 py-2 text-foreground">{{ document.locked ? 'S' : 'N' }}</TableCell>
                <TableCell class="px-3 py-2 text-foreground">{{ document.empty ? 'S' : 'N' }}</TableCell>
                <TableCell class="px-3 py-2 text-foreground">{{ document.open ? 'S' : 'N' }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>
    </main>

    <Dialog :open="renameDialogOpen" @update:open="handleRenameDialogOpenChange">
      <DialogContent class="sm:max-w-md" @open-auto-focus.prevent="focusRenameDialogInput">
        <DialogHeader>
          <DialogTitle>Renomear documento</DialogTitle>
          <DialogDescription>
            Defina o novo nome para &quot;{{ renameDialogTargetName }}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-2">
          <Label for="explorer-rename-document">Novo nome</Label>
          <Input
            id="explorer-rename-document"
            ref="renameDialogInputEl"
            v-model="renameDialogValue"
            type="text"
            autocomplete="off"
            @keyup.enter="submitRenameDialog"
          />
        </div>
        <Alert v-if="renameDialogError" variant="destructive">
          <AlertDescription>{{ renameDialogError }}</AlertDescription>
        </Alert>
        <DialogFooter class="gap-2">
          <Button type="button" variant="outline" @click="closeRenameDialog">Cancelar</Button>
          <Button type="button" @click="submitRenameDialog">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog :open="lockDialogOpen" @update:open="handleLockDialogOpenChange">
      <DialogContent class="sm:max-w-md" @open-auto-focus.prevent="focusLockDialogInput">
        <DialogHeader>
          <DialogTitle>Travar documento</DialogTitle>
          <DialogDescription>
            Informe a senha para travar &quot;{{ lockDialogTargetName }}&quot;.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-2">
          <Label for="explorer-lock-password">Senha do documento</Label>
          <Input
            id="explorer-lock-password"
            ref="lockDialogInputEl"
            v-model="lockDialogPassword"
            type="password"
            autocomplete="off"
            @keyup.enter="submitLockDialog"
          />
        </div>
        <Alert v-if="lockDialogError" variant="destructive">
          <AlertDescription>{{ lockDialogError }}</AlertDescription>
        </Alert>
        <DialogFooter class="gap-2">
          <Button type="button" variant="outline" @click="closeLockDialog">Cancelar</Button>
          <Button type="button" @click="submitLockDialog">Travar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog :open="removeDialogOpen" @update:open="handleRemoveDialogOpenChange">
      <AlertDialogContent class="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Remover documento</AlertDialogTitle>
          <AlertDialogDescription>
            Remover o documento &quot;{{ removeDialogTargetName }}&quot; permanentemente?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter class="gap-2">
          <Button type="button" variant="outline" @click="closeRemoveDialog">Cancelar</Button>
          <Button type="button" variant="destructive" @click="confirmRemoveDialog">Remover</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { Archive, ArrowLeft, Moon, RefreshCw, Sun } from 'lucide-vue-next'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createDocumentAPI, type DocumentSummary, type ListSummariesOptions } from '../services/document-api'
import { getApiBaseUrl } from '../services/config'
import { downloadMarkdown, downloadPDF, downloadZip } from '../services/export'
import { trimTrailingSlashes } from '../cm-utils/document-name'
import persistence from '../services/persistence'
import { useColorMode } from '../composables/useColorMode'
import { useExplorerSession } from '../composables/useExplorerSession'
import { useDocumentList } from '../composables/useDocumentList'

const { isDark, toggle } = useColorMode()

const documentAPI = createDocumentAPI(getApiBaseUrl())
const EXPLORER_DOCUMENTS_CACHE_KEY = 'explorer.documentsCache'
const sortButtonClass = 'h-auto p-0 text-sm font-medium text-muted-foreground hover:bg-transparent hover:text-foreground'
const documentLinkClass = 'h-auto justify-start whitespace-normal p-0 text-left font-normal text-foreground hover:text-primary'

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
const renameDialogOpen = ref(false)
const renameDialogTargetName = ref('')
const renameDialogValue = ref('')
const renameDialogError = ref('')
const renameDialogInputEl = ref<{ $el: HTMLInputElement } | null>(null)
const lockDialogOpen = ref(false)
const lockDialogTargetName = ref('')
const lockDialogPassword = ref('')
const lockDialogError = ref('')
const lockDialogInputEl = ref<{ $el: HTMLInputElement } | null>(null)
const removeDialogOpen = ref(false)
const removeDialogTargetName = ref('')

const displayedErrorMessage = computed(() => {
  if (list.invalidNameSearchRegex.value) {
    return 'Expressão regular inválida no filtro de nome.'
  }

  if (list.invalidContentSearchRegex.value) {
    return 'Expressão regular inválida no filtro de conteúdo.'
  }

  return errorMessage.value
})

const focusMasterPassword = () => {
  nextTick(() => masterPasswordInputEl.value?.$el?.focus())
}

const focusRenameDialogInput = () => {
  nextTick(() => renameDialogInputEl.value?.$el?.focus())
}

const focusLockDialogInput = () => {
  nextTick(() => lockDialogInputEl.value?.$el?.focus())
}

const resetRenameDialog = () => {
  renameDialogTargetName.value = ''
  renameDialogValue.value = ''
  renameDialogError.value = ''
}

const closeRenameDialog = () => {
  renameDialogOpen.value = false
  resetRenameDialog()
}

const handleRenameDialogOpenChange = (open: boolean) => {
  renameDialogOpen.value = open
  if (open) {
    focusRenameDialogInput()
    return
  }

  resetRenameDialog()
}

const resetLockDialog = () => {
  lockDialogTargetName.value = ''
  lockDialogPassword.value = ''
  lockDialogError.value = ''
}

const closeLockDialog = () => {
  lockDialogOpen.value = false
  resetLockDialog()
}

const handleLockDialogOpenChange = (open: boolean) => {
  lockDialogOpen.value = open
  if (open) {
    focusLockDialogInput()
    return
  }

  resetLockDialog()
}

const resetRemoveDialog = () => {
  removeDialogTargetName.value = ''
}

const closeRemoveDialog = () => {
  removeDialogOpen.value = false
  resetRemoveDialog()
}

const handleRemoveDialogOpenChange = (open: boolean) => {
  removeDialogOpen.value = open
  if (open) return
  resetRemoveDialog()
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
  const contentQuery = list.debouncedContentSearch.value.trim()
  if (!contentQuery) return {}

  if (list.regexEnabled.value) {
    return { contentMatchesRegex: contentQuery }
  }

  return { contentContains: contentQuery }
}

const refreshDocuments = async (options: ListSummariesOptions = getListSummariesOptions()) => {
  if (list.invalidContentSearchRegex.value) {
    return
  }

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

  renameDialogTargetName.value = selectedName
  renameDialogValue.value = selectedName
  renameDialogError.value = ''
  renameDialogOpen.value = true
  focusRenameDialogInput()
}

const submitRenameDialog = async () => {
  if (!renameDialogTargetName.value) return

  const nextNameRaw = renameDialogValue.value
  if (!nextNameRaw) {
    closeRenameDialog()
    return
  }

  const nextName = trimTrailingSlashes(nextNameRaw.trim())
  if (!nextName) {
    renameDialogError.value = 'Nome inválido. Remova a barra no final do nome e tente novamente.'
    return
  }
  if (nextName === renameDialogTargetName.value) {
    closeRenameDialog()
    return
  }

  const ok = await documentAPI.renameDocument(
    renameDialogTargetName.value,
    nextName,
    session.masterPassword.value,
  )
  if (!ok) {
    renameDialogError.value = 'Não foi possível renomear o documento.'
    return
  }

  list.selectedDocumentName.value = nextName
  closeRenameDialog()
  await refreshDocuments()
}

const removeSelected = async () => {
  errorMessage.value = ''
  if (!session.ensureMasterPassword()) return
  const selectedName = getSelectedDocumentName()
  if (!selectedName) return

  removeDialogTargetName.value = selectedName
  removeDialogOpen.value = true
}

const confirmRemoveDialog = async () => {
  errorMessage.value = ''
  if (!session.ensureMasterPassword()) {
    closeRemoveDialog()
    return
  }
  if (!removeDialogTargetName.value) return

  const ok = await documentAPI.removeDocument(removeDialogTargetName.value, session.masterPassword.value)
  closeRemoveDialog()
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
  try {
    await downloadPDF(content, selectedName)
  } catch {
    errorMessage.value = 'Não foi possível gerar o PDF.'
  }
}

const downloadGeneralBackup = async () => {
  errorMessage.value = ''
  if (!session.ensureMasterPassword()) return

  const archive = await documentAPI.downloadBackupArchive(session.masterPassword.value)
  if (archive === null) {
    errorMessage.value = 'Não foi possível gerar o backup geral.'
    return
  }

  downloadZip(archive, 'dontpad-backup')
}

const lockSelected = async () => {
  errorMessage.value = ''
  if (!session.ensureMasterPassword()) return
  const selectedName = getSelectedDocumentName()
  if (!selectedName) return

  lockDialogTargetName.value = selectedName
  lockDialogPassword.value = ''
  lockDialogError.value = ''
  lockDialogOpen.value = true
  focusLockDialogInput()
}

const submitLockDialog = async () => {
  errorMessage.value = ''
  if (!session.ensureMasterPassword()) {
    closeLockDialog()
    return
  }
  if (!lockDialogTargetName.value) return

  if (!lockDialogPassword.value || !lockDialogPassword.value.trim()) {
    lockDialogError.value = 'Informe uma senha válida para travar.'
    return
  }

  const ok = await documentAPI.lock(lockDialogTargetName.value, lockDialogPassword.value.trim())
  if (!ok) {
    lockDialogError.value = 'Não foi possível travar o documento.'
    return
  }

  closeLockDialog()
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

watch([list.debouncedContentSearch, list.regexEnabled], ([contentSearch], [previousContentSearch]) => {
  if (!session.hasAccess.value) return
  if (!contentSearch.trim() && !previousContentSearch?.trim()) return
  if (list.invalidContentSearchRegex.value) return
  void refreshDocuments(getListSummariesOptions())
})

// Persist unlocked flag
watch(session.hasAccess, value => {
  persistence.set('explorer.unlocked', value)
})
</script>
