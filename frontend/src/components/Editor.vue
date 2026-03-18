<template>
  <div class="flex flex-col h-full w-full">
    <!-- Header -->
    <header class="bg-gray-900 text-gray-100 px-3 sm:px-5 py-[7.2px] sm:py-[9px] flex items-center justify-between shadow-md z-20">
      <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <router-link to="/" class="font-bold text-base sm:text-lg hover:text-white transition-colors flex items-center gap-1 shrink-0">
          <ArrowLeft :size="18" />
          <span class="hidden xs:inline">Início</span>
        </router-link>
        <div class="font-mono bg-gray-800 text-gray-300 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm shrink-0 border border-gray-700 truncate max-w-[120px] sm:max-w-none">
          /{{ documentId }}
        </div>
      </div>
      <div class="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300 shrink-0">
        <CollaboratorAvatars :collaborators="collaborators" @edit-profile="showProfileDialog = true" />
        <div class="w-px h-5 bg-gray-700 mx-1 self-center shrink-0"></div>
        <span :class="['w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm', yjsEditor.status.value === 'connected' ? 'bg-emerald-400' : 'bg-red-400']"></span>
        <span class="hidden sm:inline">{{ yjsEditor.status.value === 'connected' ? 'Sincronizado' : 'Offline' }}</span>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="bg-[#f8f9fa] border-b border-gray-200 px-2 sm:px-4 py-[7.2px] flex items-center gap-1 sm:gap-1.5 shadow-sm text-gray-600 z-10 text-sm overflow-x-auto overflow-y-hidden">
      <button @click="undo" class="px-1.5 py-[7.2px] sm:py-[5.4px] hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none touch-manipulation shrink-0" title="Desfazer">
        <Undo2 :size="16" />
      </button>
      <button @click="redo" class="px-1.5 py-[7.2px] sm:py-[5.4px] hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none touch-manipulation shrink-0" title="Refazer">
        <Redo2 :size="16" />
      </button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>
      <ToolbarButton @click="applyFormat('**', '**')" title="Negrito" class="font-bold">B</ToolbarButton>
      <ToolbarButton @click="applyFormat('*', '*')" title="Itálico" class="italic">I</ToolbarButton>
      <ToolbarButton @click="applyFormat('~~', '~~')" title="Tachado" class="line-through">S</ToolbarButton>
      <ToolbarButton @click="transformCaseClick" title="Transformar caixa (UPPER / lower / camelCase)" class="font-medium text-sm">Aa</ToolbarButton>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>
      <ToolbarButton @click="applyFormat('# ')" title="Título 1" class="font-bold">H1</ToolbarButton>
      <ToolbarButton @click="applyFormat('## ')" title="Título 2" class="font-bold">H2</ToolbarButton>
      <ToolbarButton @click="applyFormat('### ')" title="Título 3" class="font-bold">H3</ToolbarButton>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>
      <ToolbarButton @click="applyFormat('- ')" title="Lista Bullet">&#8226; Lista</ToolbarButton>
      <ToolbarButton @click="applyFormat('1. ')" title="Lista Numérica">1. Lista</ToolbarButton>
      <ToolbarButton @click="applyFormat('- [ ] ')" title="Checklist">&#9745; Checklist</ToolbarButton>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>
      <ToolbarButton @click="applyFormat('> ')" title="Citação" class="font-serif italic">" "</ToolbarButton>
      <ToolbarButton @click="applyFormat('`', '`')" title="Código Inline" class="font-mono text-xs">` `</ToolbarButton>
      <ToolbarButton @click="applyFormat('```\n', '\n```')" title="Bloco de Código" class="font-mono text-xs">{ }</ToolbarButton>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>
      <ToolbarButton @click="applyFormat('\n|  |  |\n|--|--|\n|  |  |\n')" title="Tabela" class="flex items-center gap-1">
        <Table2 :size="14" />
        <span class="hidden sm:inline">Tabela</span>
      </ToolbarButton>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>
      <ToolbarButton @click="openLinkDialog" title="Link">Link</ToolbarButton>
      <ToolbarButton @click="openImageDialog" title="Imagem">Img</ToolbarButton>
      <ToolbarButton @click="openLockDialog" title="Travar com senha">
        <Lock :size="14" />
      </ToolbarButton>
      <ToolbarButton
        @click="toggleSpellcheck"
        :active="isSpellcheckEnabled"
        title="Correção ortográfica"
        class="font-mono text-xs"
      >
        ABC
      </ToolbarButton>
      
      <div class="flex-1 min-w-[8px]"></div> <!-- Spacer -->
      
      <div class="flex gap-1.5 sm:gap-2 shrink-0">
        <button @click="downloadMarkdown" class="px-2 sm:px-3 py-[7.2px] sm:py-[5.4px] bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none flex items-center gap-1.5 shadow-sm touch-manipulation shrink-0" title="Baixar como .md">
          <Download :size="14" />
          <span class="hidden xs:inline">.MD</span>
        </button>
        <button @click="downloadPDF" class="px-2 sm:px-3 py-[7.2px] sm:py-[5.4px] bg-gray-800 border border-gray-800 text-white hover:bg-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none flex items-center gap-1.5 shadow-sm touch-manipulation shrink-0" title="Baixar como .pdf">
          <Download :size="14" />
          <span class="hidden xs:inline">.PDF</span>
        </button>
      </div>
    </div>

    <!-- Hidden element for PDF rendering -->
    <div v-show="false">
      <div ref="pdfContainer" class="pdf-export-container p-8 text-black bg-white"></div>
    </div>

    <!-- Editor Area -->
    <main v-if="access.hasDocumentAccess.value" class="flex-1 overflow-hidden relative" ref="editorContainer"></main>
    <main v-else class="flex-1 flex items-center justify-center bg-gray-50 text-gray-500 text-sm px-4 text-center">
      Este documento está protegido por senha. Insira a senha para continuar.
    </main>

    <!-- Dialogs -->
    <div v-if="showLinkDialog || showImageDialog || access.showLockDialog.value || access.showAccessDialog.value || showProfileDialog" class="absolute inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      
      <!-- Profile Dialog -->
      <ProfileDialog
        v-if="showProfileDialog"
        :profile="myProfile"
        @close="showProfileDialog = false"
        @save="onProfileSave"
      />
      
      <!-- Link Dialog -->
      <div v-if="showLinkDialog" class="bg-white rounded-lg shadow-xl p-4 sm:p-5 w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-4">
        <h3 class="font-bold text-gray-800 mb-4 text-lg">Inserir Link</h3>
        <div class="mb-3">
          <label class="block text-sm text-gray-600 mb-1">Texto do Link</label>
          <input ref="linkTextInput" v-model="linkData.text" type="text" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="Ex: Google" @keyup.enter="insertLink">
        </div>
        <div class="mb-4">
          <label class="block text-sm text-gray-600 mb-1">URL / Link</label>
          <input v-model="linkData.url" type="text" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="https://" @keyup.enter="insertLink">
        </div>
        <div class="flex justify-end gap-2 text-sm">
          <button @click="closeDialogs" class="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded focus:outline-none">Cancelar</button>
          <button @click="insertLink" class="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded shadow-sm focus:outline-none" :disabled="!linkData.url">Inserir</button>
        </div>
      </div>

      <!-- Image Dialog -->
      <div v-if="showImageDialog" class="bg-white rounded-lg shadow-xl p-4 sm:p-5 w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-4">
        <h3 class="font-bold text-gray-800 mb-4 text-lg">Inserir Imagem</h3>
        <div class="mb-3">
          <label class="block text-sm text-gray-600 mb-1">Texto Alternativo (Alt)</label>
          <input ref="imageAltInput" v-model="imageData.alt" type="text" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="Descrição da imagem" @keyup.enter="insertImage">
        </div>
        <div class="mb-4">
          <label class="block text-sm text-gray-600 mb-1">URL da Imagem</label>
          <input v-model="imageData.url" type="text" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="https://..." @keyup.enter="insertImage">
        </div>
        <div class="flex justify-end gap-2 text-sm">
          <button @click="closeDialogs" class="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded focus:outline-none">Cancelar</button>
          <button @click="insertImage" class="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded shadow-sm focus:outline-none" :disabled="!imageData.url">Inserir</button>
        </div>
      </div>

      <!-- Lock Dialog -->
      <div v-if="access.showLockDialog.value" class="bg-white rounded-lg shadow-xl p-4 sm:p-5 w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-4">
        <h3 class="font-bold text-gray-800 mb-4 text-lg">Travar Documento</h3>
        <div class="mb-3">
          <label class="block text-sm text-gray-600 mb-1">Senha do Documento</label>
          <input ref="lockPasswordInput" v-model="access.lockPassword.value" type="password" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" :placeholder="access.isDocumentLocked.value ? 'Senha atual ou senha mestre' : 'Digite a senha'" @keyup.enter="lockDocument">
        </div>
        <p v-if="access.lockError.value" class="mb-3 text-xs text-red-600">{{ access.lockError.value }}</p>
        <div class="flex justify-end gap-2 text-sm">
          <button @click="closeDialogs" class="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded focus:outline-none">Cancelar</button>
          <button v-if="access.isDocumentLocked.value" @click="removeDocumentLock" class="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded shadow-sm focus:outline-none">Remover senha</button>
          <button @click="lockDocument" class="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded shadow-sm focus:outline-none" :disabled="!access.lockPassword.value.trim()">Travar</button>
        </div>
      </div>

      <!-- Access Dialog -->
      <div v-if="access.showAccessDialog.value" class="bg-white rounded-lg shadow-xl p-4 sm:p-5 w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-4">
        <h3 class="font-bold text-gray-800 mb-4 text-lg">Documento Protegido</h3>
        <div class="mb-3">
          <label class="block text-sm text-gray-600 mb-1">Senha para abrir</label>
          <input ref="accessPasswordInput" v-model="access.accessPassword.value" type="password" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="Digite a senha" @keyup.enter="unlockDocument">
        </div>
        <p v-if="access.accessError.value" class="mb-3 text-xs text-red-600">{{ access.accessError.value }}</p>
        <div class="flex justify-end gap-2 text-sm">
          <button @click="closeAccessDialog" class="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded focus:outline-none">Cancelar</button>
          <button @click="unlockDocument" class="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded shadow-sm focus:outline-none" :disabled="!access.accessPassword.value.trim()">Abrir</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Download, Lock, Redo2, Table2, Undo2 } from 'lucide-vue-next'
import CollaboratorAvatars from './CollaboratorAvatars.vue'
import ProfileDialog from './ProfileDialog.vue'
import ToolbarButton from './ToolbarButton.vue'

// Composables
import { useYjsEditor } from '../composables/useYjsEditor'
import { useDocumentAccess } from '../composables/useDocumentAccess'
import { useCollaborators } from '../composables/useCollaborators'

// Commands
import { applyFormat as applyFormatCommand, insertLink as insertLinkCommand, insertImage as insertImageCommand, transformCase } from '../cm-commands'
import { spellcheckPlugin } from '../cm-plugins/spellcheck'

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

// ── Local state ────────────────────────────────────────────────────
const route = useRoute()
const documentId = ref(route.params.documentId as string || 'default')
const editorContainer = ref<HTMLElement | null>(null)
const pdfContainer = ref<HTMLElement | null>(null)
const isSpellcheckEnabled = ref(persistence.get('spellcheck', true))
const caseTransformIndex = ref(0)

// Dialog refs (link, image)
const showLinkDialog = ref(false)
const showImageDialog = ref(false)
const linkData = reactive({ text: '', url: 'https://' })
const imageData = reactive({ alt: '', url: 'https://' })
const linkTextInput = ref<HTMLInputElement | null>(null)
const imageAltInput = ref<HTMLInputElement | null>(null)
const lockPasswordInput = ref<HTMLInputElement | null>(null)
const accessPasswordInput = ref<HTMLInputElement | null>(null)
const showProfileDialog = ref(false)

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
    onAccessDenied: () => access.handleAccessDenied(accessPasswordInput),
  })

  bindCollaborators(inst.provider)
}

const openEditorAfterAccess = async () => {
  access.hasDocumentAccess.value = true
  await nextTick()
  initEditor()
}

const ensureDocumentAccess = () => {
  access.ensureAccess(documentId.value, openEditorAfterAccess, accessPasswordInput)
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

const openLinkDialog = async () => {
  const v = getView()
  if (!v) return
  const sel = v.state.selection.main
  linkData.text = v.state.sliceDoc(sel.from, sel.to) || ''
  linkData.url = 'https://'
  showLinkDialog.value = true
  await nextTick()
  linkTextInput.value?.select()
}

const insertLink = () => {
  const v = getView()
  if (!linkData.url || !v) return
  insertLinkCommand(v, linkData.text, linkData.url)
  closeDialogs()
}

const openImageDialog = async () => {
  const v = getView()
  if (!v) return
  const sel = v.state.selection.main
  imageData.alt = v.state.sliceDoc(sel.from, sel.to) || ''
  imageData.url = 'https://'
  showImageDialog.value = true
  await nextTick()
  imageAltInput.value?.select()
}

const insertImage = () => {
  const v = getView()
  if (!imageData.url || !v) return
  insertImageCommand(v, imageData.alt, imageData.url)
  closeDialogs()
}

// ── Lock dialog (delegates to access composable) ───────────────────

const openLockDialog = async () => {
  access.lockError.value = ''
  access.showLockDialog.value = true
  await nextTick()
  lockPasswordInput.value?.focus()
}

const lockDocument = () => access.lockDocument(documentId.value)
const removeDocumentLock = () => access.removeLock(documentId.value)
const unlockDocument = async () => {
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
</script>
