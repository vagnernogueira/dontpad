<template>
  <div class="flex flex-col h-full w-full">
    <!-- Header -->
    <header class="bg-gray-900 text-gray-100 px-3 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between shadow-md z-20">
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
        <span :class="['w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm', status === 'connected' ? 'bg-emerald-400' : 'bg-red-400']"></span>
        <span class="hidden sm:inline">{{ status === 'connected' ? 'Sincronizado' : 'Offline' }}</span>
      </div>
    </header>

    <!-- Toolbar -->
    <div class="bg-[#f8f9fa] border-b border-gray-200 px-2 sm:px-4 py-2 flex items-center gap-1 sm:gap-1.5 shadow-sm text-gray-600 z-10 text-sm overflow-x-auto overflow-y-hidden">
      <button @click="undo" class="px-1.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none touch-manipulation shrink-0" title="Desfazer">
        <Undo2 :size="16" />
      </button>
      <button @click="redo" class="px-1.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none touch-manipulation shrink-0" title="Refazer">
        <Redo2 :size="16" />
      </button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>
      <button @click="applyFormat('**', '**')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-bold transition-colors focus:outline-none touch-manipulation shrink-0" title="Negrito">B</button>
      <button @click="applyFormat('*', '*')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded italic transition-colors focus:outline-none touch-manipulation shrink-0" title="Itálico">I</button>
      <button @click="applyFormat('~~', '~~')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded line-through transition-colors focus:outline-none touch-manipulation shrink-0" title="Tachado">S</button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>
      <button @click="applyFormat('# ')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-bold transition-colors focus:outline-none touch-manipulation shrink-0" title="Título 1">H1</button>
      <button @click="applyFormat('## ')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-bold transition-colors focus:outline-none touch-manipulation shrink-0" title="Título 2">H2</button>
      <button @click="applyFormat('### ')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-bold transition-colors focus:outline-none touch-manipulation shrink-0" title="Título 3">H3</button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>
      <button @click="applyFormat('- ')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none touch-manipulation shrink-0" title="Lista Bullet">&#8226; Lista</button>
      <button @click="applyFormat('1. ')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none touch-manipulation shrink-0" title="Lista Numérica">1. Lista</button>
      <button @click="applyFormat('- [ ] ')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none touch-manipulation shrink-0" title="Checklist">&#9745; Checklist</button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>
      <button @click="applyFormat('> ')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-serif italic transition-colors focus:outline-none touch-manipulation shrink-0" title="Citação">" "</button>
      <button @click="applyFormat('`', '`')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-mono text-xs transition-colors focus:outline-none touch-manipulation shrink-0" title="Código Inline">` `</button>
      <button @click="applyFormat('```\n', '\n```')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-mono text-xs transition-colors focus:outline-none touch-manipulation shrink-0" title="Bloco de Código">{ }</button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>
      <button @click="applyFormat('\n|  |  |\n|--|--|\n|  |  |\n')" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none flex items-center gap-1 touch-manipulation shrink-0" title="Tabela">
        <Table2 :size="14" />
        <span class="hidden sm:inline">Tabela</span>
      </button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center shrink-0"></div>
      <button @click="openLinkDialog" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none touch-manipulation shrink-0" title="Link">Link</button>
      <button @click="openImageDialog" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none touch-manipulation shrink-0" title="Imagem">Img</button>
      <button @click="openLockDialog" class="px-2.5 py-2 sm:py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none touch-manipulation shrink-0" title="Travar com senha">
        <Lock :size="14" />
      </button>
      <button
        @click="toggleSpellcheck"
        :class="[
          'px-2.5 py-2 sm:py-1.5 rounded transition-colors focus:outline-none touch-manipulation shrink-0 font-mono text-xs',
          isSpellcheckEnabled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'hover:bg-gray-200 hover:text-gray-900'
        ]"
        title="Correção ortográfica"
        :aria-pressed="isSpellcheckEnabled"
      >
        ABC
      </button>
      
      <div class="flex-1 min-w-[8px]"></div> <!-- Spacer -->
      
      <div class="flex gap-1.5 sm:gap-2 shrink-0">
        <button @click="downloadMarkdown" class="px-2 sm:px-3 py-2 sm:py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none flex items-center gap-1.5 shadow-sm touch-manipulation shrink-0" title="Baixar como .md">
          <Download :size="14" />
          <span class="hidden xs:inline">.MD</span>
        </button>
        <button @click="downloadPDF" class="px-2 sm:px-3 py-2 sm:py-1.5 bg-gray-800 border border-gray-800 text-white hover:bg-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none flex items-center gap-1.5 shadow-sm touch-manipulation shrink-0" title="Baixar como .pdf">
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
    <main v-if="hasDocumentAccess" class="flex-1 overflow-hidden relative" ref="editorContainer"></main>
    <main v-else class="flex-1 flex items-center justify-center bg-gray-50 text-gray-500 text-sm px-4 text-center">
      Este documento está protegido por senha. Insira a senha para continuar.
    </main>

    <!-- Dialogs -->
    <div v-if="showLinkDialog || showImageDialog || showLockDialog || showAccessDialog" class="absolute inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      
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
      <div v-if="showLockDialog" class="bg-white rounded-lg shadow-xl p-4 sm:p-5 w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-4">
        <h3 class="font-bold text-gray-800 mb-4 text-lg">Travar Documento</h3>
        <div class="mb-3">
          <label class="block text-sm text-gray-600 mb-1">Senha do Documento</label>
          <input ref="lockPasswordInput" v-model="lockPassword" type="password" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" :placeholder="isDocumentLocked ? 'Senha atual ou senha mestre' : 'Digite a senha'" @keyup.enter="lockDocument">
        </div>
        <p v-if="lockError" class="mb-3 text-xs text-red-600">{{ lockError }}</p>
        <div class="flex justify-end gap-2 text-sm">
          <button @click="closeDialogs" class="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded focus:outline-none">Cancelar</button>
          <button v-if="isDocumentLocked" @click="removeDocumentLock" class="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded shadow-sm focus:outline-none">Remover senha</button>
          <button @click="lockDocument" class="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded shadow-sm focus:outline-none" :disabled="!lockPassword.trim()">Travar</button>
        </div>
      </div>

      <!-- Access Dialog -->
      <div v-if="showAccessDialog" class="bg-white rounded-lg shadow-xl p-4 sm:p-5 w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-4">
        <h3 class="font-bold text-gray-800 mb-4 text-lg">Documento Protegido</h3>
        <div class="mb-3">
          <label class="block text-sm text-gray-600 mb-1">Senha para abrir</label>
          <input ref="accessPasswordInput" v-model="accessPassword" type="password" class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="Digite a senha" @keyup.enter="unlockDocument">
        </div>
        <p v-if="accessError" class="mb-3 text-xs text-red-600">{{ accessError }}</p>
        <div class="flex justify-end gap-2 text-sm">
          <button @click="closeAccessDialog" class="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded focus:outline-none">Cancelar</button>
          <button @click="unlockDocument" class="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded shadow-sm focus:outline-none" :disabled="!accessPassword.trim()">Abrir</button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Download, Lock, Redo2, Table2, Undo2 } from 'lucide-vue-next'

// Yjs
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// CodeMirror
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import { drawSelection } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { Strikethrough } from '@lezer/markdown'
import { yCollab } from 'y-codemirror.next'
import { markdownPreviewPlugin } from '../cm-plugins/markdown-preview'
import { listCustomPlugin } from '../cm-plugins/list'
import { codeBlockPlugin } from '../cm-plugins/code-block'
import { horizontalRulePlugin } from '../cm-plugins/horizontal-rule-widget'
import { multiClickPlugin } from '../cm-plugins/multi-click'
import { plainUrlPlugin } from '../cm-plugins/plain-url'
import { spellcheckPlugin } from '../cm-plugins/spellcheck'
import { editorKeymaps } from '../cm-plugins/keymaps'

// Commands and Extensions
import { applyFormat as applyFormatCommand, insertLink as insertLinkCommand, insertImage as insertImageCommand } from '../cm-commands'
import { editorTheme } from '../cm-extensions'
import * as persistence from '../services/persistence'
import * as exportService from '../services/export'
import { createDocumentAPI } from '../services/document-api'
import { getApiBaseUrl, getWsBaseUrl } from '../services/config'
import { getRandomCursorColor, getRandomCursorName, getCursorAwarenessState } from '../cm-utils/cursor'

// Initialize services
const apiBaseUrl = getApiBaseUrl()
const wsBaseUrl = getWsBaseUrl()
const documentAPI = createDocumentAPI(apiBaseUrl)
const randomColor = getRandomCursorColor()
const randomName = getRandomCursorName()

const route = useRoute()
const documentId = ref(route.params.documentId as string || 'default')
const editorContainer = ref<HTMLElement | null>(null)
const pdfContainer = ref<HTMLElement | null>(null) // Ref for PDF rendering
const status = ref('disconnected')
const isSpellcheckEnabled = ref(persistence.get('spellcheck', true))

// Dialog states
const showLinkDialog = ref(false)
const showImageDialog = ref(false)
const linkData = reactive({ text: '', url: 'https://' })
const imageData = reactive({ alt: '', url: 'https://' })
const linkTextInput = ref<HTMLInputElement | null>(null)
const imageAltInput = ref<HTMLInputElement | null>(null)
const lockPasswordInput = ref<HTMLInputElement | null>(null)
const accessPasswordInput = ref<HTMLInputElement | null>(null)
const showLockDialog = ref(false)
const showAccessDialog = ref(false)
const lockPassword = ref('')
const accessPassword = ref('')
const lockError = ref('')
const accessError = ref('')
const hasDocumentAccess = ref(false)
const documentAccessPassword = ref('')
const isDocumentLocked = ref(false)



let ydoc: Y.Doc
let provider: WebsocketProvider
let view: EditorView
let undoManager: Y.UndoManager

const spellcheckCompartment = new Compartment()

const initEditor = () => {
  if (!editorContainer.value) return

  // 1. Setup Yjs
  ydoc = new Y.Doc()
  
  // 2. Connect to WebSocket
  provider = documentAccessPassword.value
    ? new WebsocketProvider(wsBaseUrl, documentId.value, ydoc, {
      params: { password: documentAccessPassword.value }
    })
    : new WebsocketProvider(wsBaseUrl, documentId.value, ydoc)

  provider.on('connection-close', (event: { code?: number }) => {
    if (event?.code === 4403) {
      hasDocumentAccess.value = false
      accessError.value = 'Senha necessária para abrir este documento.'
      showAccessDialog.value = true
      nextTick(() => {
        accessPasswordInput.value?.focus()
      })
    }
  })

  provider.on('status', (event: { status: string }) => {
    status.value = event.status
  })

  // 3. Set Awareness (Cursor Info)
  provider.awareness.setLocalStateField('user', getCursorAwarenessState(randomName, randomColor))

  // 4. Bind CodeMirror to Yjs Document
  const ytext = ydoc.getText('codemirror')
  undoManager = new Y.UndoManager(ytext)
  
  const state = EditorState.create({
    doc: ytext.toString(),
    extensions: [
      basicSetup,
      drawSelection(),
      spellcheckCompartment.of(spellcheckPlugin(isSpellcheckEnabled.value)),
      EditorView.lineWrapping,
      markdown({ extensions: [Strikethrough, { remove: ['IndentedCode', 'SetextHeading'] }] }),
      ...editorTheme,
      listCustomPlugin,
      codeBlockPlugin,
      horizontalRulePlugin,
      plainUrlPlugin,
      yCollab(ytext, provider.awareness, { undoManager }),
      ...editorKeymaps,
      markdownPreviewPlugin,
      multiClickPlugin
    ]
  })

  view = new EditorView({
    state,
    parent: editorContainer.value
  })
}



const openEditorAfterAccess = async () => {
  hasDocumentAccess.value = true
  await nextTick()
  initEditor()
}

const ensureDocumentAccess = async () => {
  hasDocumentAccess.value = false

  try {
    const lockStatus = await documentAPI.getLockStatus(documentId.value)
    isDocumentLocked.value = lockStatus.locked

    if (!lockStatus.locked) {
      documentAccessPassword.value = ''
      await openEditorAfterAccess()
      return
    }

    showAccessDialog.value = true
    await nextTick()
    accessPasswordInput.value?.focus()
  } catch {
    documentAccessPassword.value = ''
    isDocumentLocked.value = false
    await openEditorAfterAccess()
  }
}

// Undo/Redo functions
const undo = () => {
  if (undoManager) undoManager.undo()
  if (view) view.focus()
}

const redo = () => {
  if (undoManager) undoManager.redo()
  if (view) view.focus()
}

const toggleSpellcheck = () => {
  isSpellcheckEnabled.value = !isSpellcheckEnabled.value
  persistence.set('spellcheck', isSpellcheckEnabled.value)

  if (view) {
    view.dispatch({
      effects: spellcheckCompartment.reconfigure(
        spellcheckPlugin(isSpellcheckEnabled.value)
      )
    })
    view.focus()
  }
}

// Formatting wrapper (calls imported command from cm-commands)
const applyFormat = (prefix: string, suffix: string = '') => {
  if (!view) return
  applyFormatCommand(view, prefix, suffix)
}

// Dialog functions
const openLinkDialog = async () => {
  if (!view) return
  
  // Try to grab selected text for the link text
  const { state } = view
  const selection = state.selection.main
  const selectedText = state.sliceDoc(selection.from, selection.to)
  
  linkData.text = selectedText || ''
  linkData.url = 'https://'
  showLinkDialog.value = true
  
  await nextTick()
  if (linkTextInput.value) linkTextInput.value.select()
}

const insertLink = () => {
  if (!linkData.url) return
  insertLinkCommand(view, linkData.text, linkData.url)
  closeDialogs()
}

const openImageDialog = async () => {
  if (!view) return
  
  // Try to grab selected text for alt 
  const { state } = view
  const selection = state.selection.main
  const selectedText = state.sliceDoc(selection.from, selection.to)

  imageData.url = 'https://'
  imageData.alt = selectedText || ''
  showImageDialog.value = true
  
  await nextTick()
  if (imageAltInput.value) imageAltInput.value.select()
}

const openLockDialog = async () => {
  lockError.value = ''
  showLockDialog.value = true
  await nextTick()
  lockPasswordInput.value?.focus()
}

const lockDocument = async () => {
  lockError.value = ''
  const password = lockPassword.value.trim()

  if (!password) {
    lockError.value = 'Informe uma senha para travar este documento.'
    return
  }

  const success = await documentAPI.lock(documentId.value, password)
  if (!success) {
    lockError.value = 'Não foi possível travar este documento.'
    return
  }

  isDocumentLocked.value = true
  documentAccessPassword.value = password
  closeDialogs()
}

const removeDocumentLock = async () => {
  lockError.value = ''
  const password = lockPassword.value.trim() || documentAccessPassword.value

  if (!password) {
    lockError.value = 'Informe a senha atual do documento ou a senha mestre.'
    return
  }

  const success = await documentAPI.unlock(documentId.value, password)
  if (!success) {
    lockError.value = 'Senha inválida para remover a proteção.'
    return
  }

  isDocumentLocked.value = false
  documentAccessPassword.value = ''
  closeDialogs()
}

const closeAccessDialog = () => {
  showAccessDialog.value = false
  accessPassword.value = ''
  accessError.value = ''
}

const unlockDocument = async () => {
  const password = accessPassword.value.trim()
  if (!password) return

  const canAccess = await documentAPI.verifyAccess(documentId.value, password)
  if (!canAccess) {
    accessError.value = 'Senha inválida.'
    return
  }

  documentAccessPassword.value = password
  closeAccessDialog()
  await openEditorAfterAccess()
}

const insertImage = () => {
  if (!imageData.url) return
  insertImageCommand(view, imageData.alt, imageData.url)
  closeDialogs()
}

const closeDialogs = () => {
  showLinkDialog.value = false
  showImageDialog.value = false
  showLockDialog.value = false
  lockPassword.value = ''
  lockError.value = ''
  if (view) view.focus()
}

// Download methods
const downloadMarkdown = () => {
  if (!view) return
  const text = view.state.doc.toString()
  exportService.downloadMarkdown(text, documentId.value)
}

const downloadPDF = async () => {
  if (!view) return
  const text = view.state.doc.toString()
  await exportService.downloadPDF(text, documentId.value)
}

const cleanup = () => {
  if (provider) provider.destroy()
  if (ydoc) ydoc.destroy()
  if (view) view.destroy()
}

onMounted(() => {
  ensureDocumentAccess()
})

onBeforeUnmount(() => {
  cleanup()
})

watch(() => route.params.documentId, (newId) => {
  if (newId && typeof newId === 'string' && newId !== documentId.value) {
    documentId.value = newId
    cleanup()
    ensureDocumentAccess()
  }
})
</script>
