<template>
  <div class="flex flex-col h-full w-full">
    <!-- Header -->
    <EditorHeader
      :document-id="documentId"
      :collaborators="collaborators"
      :status="yjsEditor.status.value"
      @edit-profile="openProfileDialog"
    />

    <!-- Toolbar -->
    <EditorToolbar
      :spellcheck-enabled="isSpellcheckEnabled"
      :editor-zoom="editorZoom"
      @undo="undo"
      @redo="redo"
      @format="applyFormat"
      @transform-case="transformCaseClick"
      @open-link="openLinkDialog"
      @open-image="openImageDialog"
      @open-emoji="openEmojiDialog"
      @open-lock="openLockDialog"
      @toggle-spellcheck="toggleSpellcheck"
      @set-editor-zoom="setEditorZoom"
      @download-md="downloadMarkdown"
      @download-pdf="downloadPDF"
    />

    <p v-if="actionError" class="px-4 py-2 text-sm text-red-600">{{ actionError }}</p>

    <EditorCommandPalette
      :open="showCommandPalette"
      :items="commandMenuItems"
      @close="closeCommandPalette"
      @select="onCommandPaletteSelect"
    />

    <MarkdownLintDialog
      :open="isMarkdownLintDialogOpen"
      :issues="markdownLintIssues"
      :message="markdownLintStatusMessage"
      :error-message="markdownLintErrorMessage"
      @close="closeMarkdownLintDialog"
      @apply-hotfix="onMarkdownLintHotfix"
    />

    <!-- Hidden element for PDF rendering -->
    <div v-show="false">
      <div ref="pdfContainer" class="pdf-export-container p-8 text-black bg-white"></div>
    </div>

    <!-- Editor Area -->
    <main v-if="access.isAccessLoading.value" class="flex-1 flex items-center justify-center bg-background text-muted-foreground text-sm px-4 text-center">
      CARREGANDO...
    </main>
    <main v-else-if="access.hasDocumentAccess.value" ref="editorContainer" class="flex-1 overflow-hidden relative bg-background"></main>
    <main v-else class="flex-1 flex items-center justify-center bg-background text-muted-foreground text-sm px-4 text-center">
      Este documento está protegido por senha. Insira a senha para continuar.
    </main>

    <!-- Dialogs -->
    <ProfileDialog
      v-if="showProfileDialog"
      :profile="myProfile"
      @close="closeProfileDialog"
      @save="onProfileSave"
    />

    <LinkDialog
      v-if="showLinkDialog"
      :initial-text="dialogInitialText"
      @insert="onLinkInsert"
      @close="closeDialogs"
    />

    <ImageDialog
      v-if="showImageDialog"
      :initial-alt="dialogInitialText"
      @insert="onImageInsert"
      @close="closeDialogs"
    />

    <EmojiPickerDialog
      v-if="showEmojiDialog"
      @select="onEmojiInsert"
      @close="closeDialogs"
    />

    <LockDialog
      v-if="access.showLockDialog.value"
      :is-locked="access.isDocumentLocked.value"
      :error="access.lockError.value"
      @lock="onLockDocument"
      @remove-lock="onRemoveLock"
      @close="closeLockDialog"
    />

    <AccessDialog
      v-if="access.showAccessDialog.value"
      :error="access.accessError.value"
      @unlock="onUnlockDocument"
      @close="closeAccessDialog"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import type { EditorSelectionSnapshot } from '../cm-utils/initial-editor-focus'
import { useRoute, useRouter } from 'vue-router'
import EditorHeader from './EditorHeader.vue'
import ProfileDialog from './ProfileDialog.vue'
import EditorToolbar from './EditorToolbar.vue'
import EditorCommandPalette from './EditorCommandPalette.vue'
import MarkdownLintDialog from './MarkdownLintDialog.vue'
import LinkDialog from './LinkDialog.vue'
import ImageDialog from './ImageDialog.vue'
import EmojiPickerDialog from './EmojiPickerDialog.vue'
import LockDialog from './LockDialog.vue'
import AccessDialog from './AccessDialog.vue'

// Composables
import { useYjsEditor } from '../composables/useYjsEditor'
import { useDocumentAccess } from '../composables/useDocumentAccess'
import { useCollaborators } from '../composables/useCollaborators'
import { useMarkdownLint } from '../composables/useMarkdownLint'
import { useEditorZoom } from '../composables/useEditorZoom'
import { captureEditorSelection, focusEditorSelection } from '../cm-utils/initial-editor-focus'
import { buildEditorCommandMenu } from './editor-command-menu'

// Commands
import { applyFormat as applyFormatCommand, commands as registeredCommands, insertEmoji as insertEmojiCommand, insertImage as insertImageCommand, insertLink as insertLinkCommand, transformCase } from '../cm-commands'
import { spellcheckPlugin } from '../cm-plugins/spellcheck'
import { findSnippet } from '../cm-utils/snippet-registry'
import { insertSnippet as insertSnippetCommand } from '../cm-utils/snippet-expansion'

import * as persistence from '../services/persistence'
import * as exportService from '../services/export'
import { createDocumentAPI } from '../services/document-api'
import { getApiBaseUrl, getWsBaseUrl } from '../services/config'
import type { MarkdownLintIssue } from '../services/markdown-lint'

// ── Services ───────────────────────────────────────────────────────
const apiBaseUrl = getApiBaseUrl()
const wsBaseUrl = getWsBaseUrl()
const documentAPI = createDocumentAPI(apiBaseUrl)

// ── Composables ────────────────────────────────────────────────────
const yjsEditor = useYjsEditor()
const access = useDocumentAccess(documentAPI)
const { myProfile, collaborators, bind: bindCollaborators, saveProfile } = useCollaborators(apiBaseUrl)
const {
  isDialogOpen: isMarkdownLintDialogOpen,
  issues: markdownLintIssues,
  statusMessage: markdownLintStatusMessage,
  errorMessage: markdownLintErrorMessage,
  openForView: openMarkdownLintForView,
  closeDialog: closeMarkdownLint,
  applyHotfix: applyMarkdownLintHotfix,
} = useMarkdownLint()
const { zoom: editorZoom, setZoom: setEditorZoom } = useEditorZoom()

// ── Local state ────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const documentId = ref(route.params.documentId as string || 'default')
const editorContainer = ref<HTMLElement | null>(null)
const pdfContainer = ref<HTMLElement | null>(null)
const isSpellcheckEnabled = ref(persistence.get('spellcheck', true))
const caseTransformIndex = ref(0)
const actionError = ref('')
const requestedTemplateId = computed(() => {
  const value = route.query.template
  return typeof value === 'string' && value.trim() ? value.trim() : ''
})

// Dialog state
const showLinkDialog = ref(false)
const showImageDialog = ref(false)
const showEmojiDialog = ref(false)
const showProfileDialog = ref(false)
const showCommandPalette = ref(false)
const dialogInitialText = ref('')
const savedEditorSelection = ref<EditorSelectionSnapshot | null>(null)
const AI_RAW_URL_META_NAME = 'dontpad-ai-raw-url'

const buildRawDocumentUrl = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  const rawUrl = new URL(route.path, window.location.origin)
  rawUrl.hash = ''
  rawUrl.search = '?raw'
  return rawUrl.toString()
}

const syncAiRawUrlHeadNotice = () => {
  if (typeof document === 'undefined') {
    return
  }

  let meta = document.head.querySelector(`meta[name="${AI_RAW_URL_META_NAME}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', AI_RAW_URL_META_NAME)
    document.head.appendChild(meta)
  }

  meta.setAttribute(
    'content',
    `Agentes de IA devem usar ${buildRawDocumentUrl()} para ler o conteudo do documento em HTML estatico, em vez da interface interativa do editor.`
  )
}

const removeAiRawUrlHeadNotice = () => {
  if (typeof document === 'undefined') {
    return
  }

  document.head.querySelector(`meta[name="${AI_RAW_URL_META_NAME}"]`)?.remove()
}

// ── Editor lifecycle ───────────────────────────────────────────────

const applyEditorZoom = () => {
  if (!editorContainer.value) return

  editorContainer.value.style.setProperty('--editor-content-zoom', `${editorZoom.value / 100}`)
}

const openRawDocumentInNewTab = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.open(buildRawDocumentUrl(), '_blank', 'noopener')
}

const initEditor = () => {
  if (!editorContainer.value) return

  const inst = yjsEditor.init(editorContainer.value, {
    wsBaseUrl,
    documentId: documentId.value,
    password: access.documentAccessPassword.value,
    templateId: requestedTemplateId.value || undefined,
    profile: myProfile.value,
    spellcheckEnabled: isSpellcheckEnabled.value,
    onOpenCommandPalette: openCommandPalette,
    onOpenMarkdownLint: openMarkdownLintDialog,
    onOpenRawDocument: openRawDocumentInNewTab,
  }, {
    onAccessDenied: () => access.handleAccessDenied(ref(null)),
  })

  bindCollaborators(inst.provider)
  void consumeTemplateQuery()
}

const consumeTemplateQuery = async () => {
  if (!requestedTemplateId.value) return

  const nextQuery = { ...route.query }
  delete nextQuery.template

  await router.replace({
    path: route.path,
    query: nextQuery,
    hash: route.hash,
  })
}

const openEditorAfterAccess = async () => {
  access.hasDocumentAccess.value = true
  await nextTick()
  applyEditorZoom()
  initEditor()
}

const ensureDocumentAccess = () => {
  access.ensureAccess(documentId.value, openEditorAfterAccess, ref(null))
}

// ── Helpers that need the view ─────────────────────────────────────

const getView = () => yjsEditor.getInstance()?.view ?? null
const getUndoManager = () => yjsEditor.getInstance()?.undoManager ?? null

const rememberEditorSelection = () => {
  const view = getView()
  savedEditorSelection.value = view ? captureEditorSelection(view) : null
}

const restoreEditorSelection = async () => {
  await nextTick()

  const view = getView()
  if (!view) return

  focusEditorSelection(view, savedEditorSelection.value ?? captureEditorSelection(view))
}

const focusEditorAtCurrentSelection = async () => {
  await nextTick()

  const view = getView()
  if (!view) return

  focusEditorSelection(view, captureEditorSelection(view))
}

const openCommandPalette = () => {
  if (!getView() || showCommandPalette.value) return
  rememberEditorSelection()
  showCommandPalette.value = true
}

const closeCommandPalette = async (restoreSelection: boolean = true) => {
  showCommandPalette.value = false

  if (restoreSelection) {
    await restoreEditorSelection()
  }
}

const openMarkdownLintDialog = () => {
  const view = getView()
  if (!view) return

  if (!isMarkdownLintDialogOpen.value) {
    rememberEditorSelection()
  }

  openMarkdownLintForView(view)
}

const closeMarkdownLintDialog = async () => {
  closeMarkdownLint()
  await restoreEditorSelection()
}

const onMarkdownLintHotfix = (issue: MarkdownLintIssue) => {
  const view = getView()
  if (!view) return

  applyMarkdownLintHotfix(view, issue)
  savedEditorSelection.value = captureEditorSelection(view)
}

// Undo/Redo
const undo = () => { getUndoManager()?.undo(); getView()?.focus() }
const redo = () => { getUndoManager()?.redo(); getView()?.focus() }

const runRegisteredCommand = (commandName: string) => {
  if (commandName === 'undo') {
    undo()
    return
  }

  if (commandName === 'redo') {
    redo()
    return
  }

  const view = getView()
  const command = registeredCommands[commandName as keyof typeof registeredCommands]

  if (view && command) {
    command(view)
  }
}

const insertSnippetFromPalette = (prefix: string) => {
  const view = getView()
  const snippet = findSnippet(prefix)

  if (view && snippet) {
    insertSnippetCommand(view, snippet)
  }
}

const commandMenuItems = computed(() => buildEditorCommandMenu({
  spellcheckEnabled: isSpellcheckEnabled.value,
  runCommand: runRegisteredCommand,
  applyFormat,
  cycleCaseTransform: transformCaseClick,
  openMarkdownLintDialog,
  openLinkDialog,
  openImageDialog,
  openEmojiDialog,
  openLockDialog,
  toggleSpellcheck,
  setEditorZoom,
  downloadMarkdown,
  downloadPDF,
  insertSnippet: insertSnippetFromPalette,
}))

const onCommandPaletteSelect = (itemId: string) => {
  const item = commandMenuItems.value.find((candidate) => candidate.id === itemId)

  if (!item) {
    return
  }

  void closeCommandPalette(false)
  item.execute()
}

const toggleSpellcheck = () => {
  isSpellcheckEnabled.value = !isSpellcheckEnabled.value
  persistence.set('spellcheck', isSpellcheckEnabled.value)

  const inst = yjsEditor.getInstance()
  if (inst) {
    inst.view.dispatch({
      effects: inst.spellcheckCompartment.reconfigure(
        spellcheckPlugin(isSpellcheckEnabled.value)
      ),
    })
    inst.view.focus()
  }
}

// Formatting
const applyFormat = (prefix: string, suffix: string = '') => {
  const v = getView()
  if (v) applyFormatCommand(v, prefix, suffix)
}

const transformCaseClick = () => {
  const v = getView()
  if (!v) return
  const caseTypes: ('upper' | 'lower' | 'camel')[] = ['upper', 'lower', 'camel']
  transformCase(v, caseTypes[caseTransformIndex.value])
  caseTransformIndex.value = (caseTransformIndex.value + 1) % caseTypes.length
  v.focus()
}

// ── Link / Image dialogs ───────────────────────────────────────────

const getSelectionText = (): string => {
  const v = getView()
  if (!v) return ''
  const sel = v.state.selection.main
  return v.state.sliceDoc(sel.from, sel.to) || ''
}

const openLinkDialog = () => {
  if (!getView()) return
  rememberEditorSelection()
  dialogInitialText.value = getSelectionText()
  showLinkDialog.value = true
}

const onLinkInsert = (text: string, url: string) => {
  const v = getView()
  if (v) insertLinkCommand(v, text, url)
  void closeDialogs(true)
}

const openImageDialog = () => {
  if (!getView()) return
  rememberEditorSelection()
  dialogInitialText.value = getSelectionText()
  showImageDialog.value = true
}

const onImageInsert = (alt: string, url: string) => {
  const v = getView()
  if (v) insertImageCommand(v, alt, url)
  void closeDialogs(true)
}

const openEmojiDialog = () => {
  if (!getView()) return
  rememberEditorSelection()
  showEmojiDialog.value = true
}

const onEmojiInsert = (emoji: string) => {
  const v = getView()
  if (v) insertEmojiCommand(v, emoji)
  void closeDialogs(true)
}

const openProfileDialog = () => {
  rememberEditorSelection()
  showProfileDialog.value = true
}

// ── Lock dialog ────────────────────────────────────────────────────

const openLockDialog = () => {
  rememberEditorSelection()
  access.lockError.value = ''
  access.showLockDialog.value = true
}

const onLockDocument = async (password: string) => {
  access.lockPassword.value = password
  await access.lockDocument(documentId.value)

  if (!access.showLockDialog.value) {
    await restoreEditorSelection()
  }
}

const onRemoveLock = async (password: string) => {
  access.lockPassword.value = password
  await access.removeLock(documentId.value)

  if (!access.showLockDialog.value) {
    await restoreEditorSelection()
  }
}

const closeLockDialog = async () => {
  access.closeLockDialog()
  await restoreEditorSelection()
}

// ── Access dialog ──────────────────────────────────────────────────

const onUnlockDocument = async (password: string) => {
  access.accessPassword.value = password
  await access.unlock(documentId.value, openEditorAfterAccess)
}

const closeAccessDialog = () => access.closeAccessDialog()

const closeDialogs = async (preserveCurrentSelection: boolean = false) => {
  showLinkDialog.value = false
  showImageDialog.value = false
  showEmojiDialog.value = false
  access.closeLockDialog()

  if (preserveCurrentSelection) {
    await focusEditorAtCurrentSelection()
    return
  }

  await restoreEditorSelection()
}

// ── Profile ────────────────────────────────────────────────────────

const onProfileSave = async (data: { name: string; emoji: string }) => {
  saveProfile(data)
  showProfileDialog.value = false
  await restoreEditorSelection()
}

const closeProfileDialog = async () => {
  showProfileDialog.value = false
  await restoreEditorSelection()
}

// ── Downloads ──────────────────────────────────────────────────────

const downloadMarkdown = () => {
  actionError.value = ''
  const v = getView()
  if (!v) return
  exportService.downloadMarkdown(v.state.doc.toString(), documentId.value)
}

const downloadPDF = async () => {
  actionError.value = ''
  const v = getView()
  if (!v) return
  try {
    await exportService.downloadPDF(v.state.doc.toString(), documentId.value)
  } catch {
    actionError.value = 'Nao foi possivel gerar o PDF.'
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────

onMounted(() => ensureDocumentAccess())

onBeforeUnmount(() => {
  closeMarkdownLint()
  removeAiRawUrlHeadNotice()
  yjsEditor.destroy()
})

watch(() => route.fullPath, () => {
  syncAiRawUrlHeadNotice()
}, { immediate: true })

watch(editorZoom, () => {
  applyEditorZoom()
})

watch(editorContainer, () => {
  applyEditorZoom()
})

watch(() => route.params.documentId, (newId) => {
  if (newId && typeof newId === 'string' && newId !== documentId.value) {
    documentId.value = newId
    closeMarkdownLint()
    yjsEditor.destroy()
    ensureDocumentAccess()
  }
})
</script>
