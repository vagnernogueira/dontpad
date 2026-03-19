<template>
  <div class="flex flex-col h-full w-full">
    <!-- Header -->
    <EditorHeader
      :document-id="documentId"
      :collaborators="collaborators"
      :status="yjsEditor.status.value"
      @edit-profile="showProfileDialog = true"
    />

    <!-- Toolbar -->
    <EditorToolbar
      :spellcheck-enabled="isSpellcheckEnabled"
      @undo="undo"
      @redo="redo"
      @format="applyFormat"
      @transform-case="transformCaseClick"
      @open-link="openLinkDialog"
      @open-image="openImageDialog"
      @open-lock="openLockDialog"
      @toggle-spellcheck="toggleSpellcheck"
      @download-md="downloadMarkdown"
      @download-pdf="downloadPDF"
    />

    <!-- Hidden element for PDF rendering -->
    <div v-show="false">
      <div ref="pdfContainer" class="pdf-export-container p-8 text-black bg-white"></div>
    </div>

    <!-- Editor Area -->
    <main v-if="access.hasDocumentAccess.value" class="flex-1 overflow-hidden relative bg-background" ref="editorContainer"></main>
    <main v-else class="flex-1 flex items-center justify-center bg-background text-muted-foreground text-sm px-4 text-center">
      Este documento está protegido por senha. Insira a senha para continuar.
    </main>

    <!-- Dialogs -->
    <ProfileDialog
      v-if="showProfileDialog"
      :profile="myProfile"
      @close="showProfileDialog = false"
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
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import EditorHeader from './EditorHeader.vue'
import ProfileDialog from './ProfileDialog.vue'
import EditorToolbar from './EditorToolbar.vue'
import LinkDialog from './LinkDialog.vue'
import ImageDialog from './ImageDialog.vue'
import LockDialog from './LockDialog.vue'
import AccessDialog from './AccessDialog.vue'

// Composables
import { useYjsEditor } from '../composables/useYjsEditor'
import { useDocumentAccess } from '../composables/useDocumentAccess'
import { useCollaborators } from '../composables/useCollaborators'

// Commands
import { applyFormat as applyFormatCommand, insertLink as insertLinkCommand, insertImage as insertImageCommand, transformCase } from '../cm-commands'
import { spellcheckPlugin } from '../cm-plugins/spellcheck'
import { editorTheme, darkEditorTheme } from '../cm-extensions'
import { useColorMode } from '../composables/useColorMode'

import * as persistence from '../services/persistence'
import * as exportService from '../services/export'
import { createDocumentAPI } from '../services/document-api'
import { getApiBaseUrl, getWsBaseUrl } from '../services/config'

// ── Services ───────────────────────────────────────────────────────
const apiBaseUrl = getApiBaseUrl()
const wsBaseUrl = getWsBaseUrl()
const documentAPI = createDocumentAPI(apiBaseUrl)

// ── Composables ────────────────────────────────────────────────────
const yjsEditor = useYjsEditor()
const access = useDocumentAccess(documentAPI)
const { myProfile, collaborators, bind: bindCollaborators, saveProfile } = useCollaborators(apiBaseUrl)
const { isDark } = useColorMode()

// ── Local state ────────────────────────────────────────────────────
const route = useRoute()
const documentId = ref(route.params.documentId as string || 'default')
const editorContainer = ref<HTMLElement | null>(null)
const pdfContainer = ref<HTMLElement | null>(null)
const isSpellcheckEnabled = ref(persistence.get('spellcheck', true))
const caseTransformIndex = ref(0)

// Dialog state
const showLinkDialog = ref(false)
const showImageDialog = ref(false)
const showProfileDialog = ref(false)
const dialogInitialText = ref('')

// ── Editor lifecycle ───────────────────────────────────────────────

const initEditor = () => {
  if (!editorContainer.value) return

  const inst = yjsEditor.init(editorContainer.value, {
    wsBaseUrl,
    documentId: documentId.value,
    password: access.documentAccessPassword.value,
    profile: myProfile.value,
    spellcheckEnabled: isSpellcheckEnabled.value,
  }, {
    onAccessDenied: () => access.handleAccessDenied(ref(null)),
  })

  // Apply current color mode immediately on editor init
  if (isDark.value) {
    inst.view.dispatch({
      effects: inst.themeCompartment.reconfigure(darkEditorTheme),
    })
  }

  bindCollaborators(inst.provider)
}

const openEditorAfterAccess = async () => {
  access.hasDocumentAccess.value = true
  await nextTick()
  initEditor()
}

const ensureDocumentAccess = () => {
  access.ensureAccess(documentId.value, openEditorAfterAccess, ref(null))
}

// ── Helpers that need the view ─────────────────────────────────────

const getView = () => yjsEditor.getInstance()?.view ?? null
const getUndoManager = () => yjsEditor.getInstance()?.undoManager ?? null

// Undo/Redo
const undo = () => { getUndoManager()?.undo(); getView()?.focus() }
const redo = () => { getUndoManager()?.redo(); getView()?.focus() }

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
  dialogInitialText.value = getSelectionText()
  showLinkDialog.value = true
}

const onLinkInsert = (text: string, url: string) => {
  const v = getView()
  if (v) insertLinkCommand(v, text, url)
  closeDialogs()
}

const openImageDialog = () => {
  if (!getView()) return
  dialogInitialText.value = getSelectionText()
  showImageDialog.value = true
}

const onImageInsert = (alt: string, url: string) => {
  const v = getView()
  if (v) insertImageCommand(v, alt, url)
  closeDialogs()
}

// ── Lock dialog ────────────────────────────────────────────────────

const openLockDialog = () => {
  access.lockError.value = ''
  access.showLockDialog.value = true
}

const onLockDocument = (password: string) => {
  access.lockPassword.value = password
  access.lockDocument(documentId.value)
}

const onRemoveLock = (password: string) => {
  access.lockPassword.value = password
  access.removeLock(documentId.value)
}

const closeLockDialog = () => {
  access.closeLockDialog()
  getView()?.focus()
}

// ── Access dialog ──────────────────────────────────────────────────

const onUnlockDocument = async (password: string) => {
  access.accessPassword.value = password
  await access.unlock(documentId.value, openEditorAfterAccess)
}

const closeAccessDialog = () => access.closeAccessDialog()

const closeDialogs = () => {
  showLinkDialog.value = false
  showImageDialog.value = false
  access.closeLockDialog()
  getView()?.focus()
}

// ── Profile ────────────────────────────────────────────────────────

const onProfileSave = (data: { name: string; emoji: string }) => {
  saveProfile(data)
  showProfileDialog.value = false
  getView()?.focus()
}

// ── Downloads ──────────────────────────────────────────────────────

const downloadMarkdown = () => {
  const v = getView()
  if (!v) return
  exportService.downloadMarkdown(v.state.doc.toString(), documentId.value)
}

const downloadPDF = async () => {
  const v = getView()
  if (!v) return
  await exportService.downloadPDF(v.state.doc.toString(), documentId.value)
}

// ── Lifecycle ──────────────────────────────────────────────────────

onMounted(() => ensureDocumentAccess())

onBeforeUnmount(() => yjsEditor.destroy())

watch(() => route.params.documentId, (newId) => {
  if (newId && typeof newId === 'string' && newId !== documentId.value) {
    documentId.value = newId
    yjsEditor.destroy()
    ensureDocumentAccess()
  }
})

watch(isDark, (dark) => {
  const inst = yjsEditor.getInstance()
  if (!inst) return
  inst.view.dispatch({
    effects: inst.themeCompartment.reconfigure(dark ? darkEditorTheme : editorTheme),
  })
})
</script>
