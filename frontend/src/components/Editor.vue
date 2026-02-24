<template>
  <div class="flex flex-col h-full w-full">
    <!-- Header -->
    <header class="bg-gray-900 text-gray-100 px-5 py-2.5 flex items-center justify-between shadow-md z-20">
      <div class="flex items-center gap-4">
        <router-link to="/" class="font-bold text-lg hover:text-white transition-colors flex items-center gap-1">
          <ArrowLeft :size="18" />
          Início
        </router-link>
        <div class="font-mono bg-gray-800 text-gray-300 px-3 py-1 rounded-md text-sm shrink-0 border border-gray-700">
          /{{ documentId }}
        </div>
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-300 truncate max-w-[200px]">
        <span :class="['w-2.5 h-2.5 rounded-full shadow-sm', status === 'connected' ? 'bg-emerald-400' : 'bg-red-400']"></span>
        {{ status === 'connected' ? 'Sincronizado' : 'Offline' }}
      </div>
    </header>

    <!-- Toolbar -->
    <div class="bg-[#f8f9fa] border-b border-gray-200 px-4 py-2 flex items-center flex-wrap gap-1.5 shadow-sm text-gray-600 z-10 text-sm overflow-x-auto whitespace-nowrap">
      <button @click="undo" class="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Desfazer">
        <Undo2 :size="16" />
      </button>
      <button @click="redo" class="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Refazer">
        <Redo2 :size="16" />
      </button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center"></div>
      <button @click="applyFormat('**', '**')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-bold transition-colors focus:outline-none" title="Negrito">B</button>
      <button @click="applyFormat('*', '*')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded italic transition-colors focus:outline-none" title="Itálico">I</button>
      <button @click="applyFormat('~~', '~~')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded line-through transition-colors focus:outline-none" title="Tachado">S</button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center"></div>
      <button @click="applyFormat('# ')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-bold transition-colors focus:outline-none" title="Título 1">H1</button>
      <button @click="applyFormat('## ')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-bold transition-colors focus:outline-none" title="Título 2">H2</button>
      <button @click="applyFormat('### ')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-bold transition-colors focus:outline-none" title="Título 3">H3</button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center"></div>
      <button @click="applyFormat('- ')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Lista Bullet">&#8226; Lista</button>
      <button @click="applyFormat('1. ')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Lista Numérica">1. Lista</button>
      <button @click="applyFormat('- [ ] ')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Checklist">&#9745; Checklist</button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center"></div>
      <button @click="applyFormat('> ')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-serif italic transition-colors focus:outline-none" title="Citação">“ ”</button>
      <button @click="applyFormat('`', '`')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-mono text-xs transition-colors focus:outline-none" title="Código Inline">` `</button>
      <button @click="applyFormat('```\n', '\n```')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-mono text-xs transition-colors focus:outline-none" title="Bloco de Código">{ }</button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center"></div>
      <button @click="applyFormat('\n|  |  |\n|--|--|\n|  |  |\n')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none flex items-center gap-1" title="Tabela">
        <Table2 :size="14" />
        Tabela
      </button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center"></div>
      <button @click="openLinkDialog" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Link">Link</button>
      <button @click="openImageDialog" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Imagem">Img</button>
      <button @click="openLockDialog" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Travar com senha">
        <Lock :size="14" />
      </button>
      
      <div class="flex-1"></div> <!-- Spacer -->
      
      <div class="flex gap-2">
        <button @click="downloadMarkdown" class="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none flex items-center gap-1.5 shadow-sm" title="Baixar como .md">
          <Download :size="14" />
          .MD
        </button>
        <button @click="downloadPDF" class="px-3 py-1.5 bg-gray-800 border border-gray-800 text-white hover:bg-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none flex items-center gap-1.5 shadow-sm" title="Baixar como .pdf">
          <Download :size="14" />
          .PDF
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
      <div v-if="showLinkDialog" class="bg-white rounded-lg shadow-xl p-5 w-80 max-w-full m-4">
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
      <div v-if="showImageDialog" class="bg-white rounded-lg shadow-xl p-5 w-80 max-w-full m-4">
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
      <div v-if="showLockDialog" class="bg-white rounded-lg shadow-xl p-5 w-80 max-w-full m-4">
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
      <div v-if="showAccessDialog" class="bg-white rounded-lg shadow-xl p-5 w-80 max-w-full m-4">
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
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Download, Lock, Redo2, Table2, Undo2 } from 'lucide-vue-next'

// Yjs
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// CodeMirror
import { EditorState } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import { drawSelection } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { HighlightStyle, defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { Strikethrough } from '@lezer/markdown'
import { yCollab } from 'y-codemirror.next'
import { 
  markdownPreviewPlugin, 
  listCustomPlugin,
  customTabKeymap, 
  enterKeymap,
  codeBlockPlugin
} from '../cm-preview-plugin'

// PDF & Markdown Exports
import { markdownStyles } from '../pdf-styles'

// Random color/name for cursor
const userColors = [
  '#30bced', '#6eeb83', '#ffbc42', '#ecd444', '#ee6352',
  '#9ac2c9', '#8acb88', '#1be7ff'
]
const randomColor = userColors[Math.floor(Math.random() * userColors.length)]
const randomName = `Anon ${Math.floor(Math.random() * 1000)}`

const route = useRoute()
const documentId = ref(route.params.documentId as string || 'default')
const editorContainer = ref<HTMLElement | null>(null)
const pdfContainer = ref<HTMLElement | null>(null) // Ref for PDF rendering
const status = ref('disconnected')

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

const apiBaseUrl = computed(() => {
  if (!import.meta.env.PROD) {
    return 'http://localhost:1234'
  }

  return (import.meta.env.VITE_BACKEND_HTTP_URL as string | undefined)?.trim() || 'http://localhost:1234'
})

const wsBaseUrl = computed(() => {
  if (!import.meta.env.PROD) {
    return 'ws://localhost:1234'
  }

  const explicitWsUrl = (import.meta.env.VITE_BACKEND_WS_URL as string | undefined)?.trim()
  if (explicitWsUrl) {
    return explicitWsUrl
  }

  return 'ws://localhost:1234'
})

let ydoc: Y.Doc
let provider: WebsocketProvider
let view: EditorView
let undoManager: Y.UndoManager

const markdownHighlightStyle = HighlightStyle.define([
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.heading1, fontSize: '1.9em', fontWeight: '800' },
  { tag: tags.heading2, fontSize: '1.55em', fontWeight: '750' },
  { tag: tags.heading3, fontSize: '1.3em', fontWeight: '700' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  // Código inline (entre acentos graves simples)
  {
    tag: tags.monospace,
    fontFamily: '"Fira Code", "Consolas", monospace',
    backgroundColor: '#e8eef2',
    fontSize: '0.88em'
  },
  { tag: tags.quote, fontStyle: 'italic', color: '#6a737d' },
  // Blocos de código delimitados por ``` (code fences)
  {
    tag: tags.processingInstruction,
    fontFamily: '"Fira Code", "JetBrains Mono", "Consolas", monospace',
    color: '#5a6872',
    fontSize: '0.88em'
  }
])

const initEditor = () => {
  if (!editorContainer.value) return

  // 1. Setup Yjs
  ydoc = new Y.Doc()
  
  // 2. Connect to WebSocket
  const wsUrl = wsBaseUrl.value
    
  provider = documentAccessPassword.value
    ? new WebsocketProvider(wsUrl, documentId.value, ydoc, {
      params: { password: documentAccessPassword.value }
    })
    : new WebsocketProvider(wsUrl, documentId.value, ydoc)

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
  provider.awareness.setLocalStateField('user', {
    name: randomName,
    color: randomColor,
    colorLight: randomColor + '33' // add opacity
  })

  // 4. Bind CodeMirror to Yjs Document
  const ytext = ydoc.getText('codemirror')
  undoManager = new Y.UndoManager(ytext)
  
  const state = EditorState.create({
    doc: ytext.toString(),
    extensions: [
      basicSetup,
      drawSelection(),
      markdown({ extensions: [Strikethrough, { remove: ['IndentedCode'] }] }),
      syntaxHighlighting(defaultHighlightStyle),
      syntaxHighlighting(markdownHighlightStyle),
      listCustomPlugin,
      codeBlockPlugin,
      yCollab(ytext, provider.awareness, { undoManager }),
      customTabKeymap,
      enterKeymap,
      markdownPreviewPlugin,
      EditorView.theme({
        "&": { height: "100%" },
        ".cm-scroller": { overflow: "auto" },
        // Desabilita estilo de código para blocos indentados (4 espaços)
        // Mantém apenas blocos delimitados por ``` (code fences)
        ".cm-line.cm-codeBlock": {
          background: "transparent !important",
          fontFamily: "inherit !important",
          fontSize: "inherit !important",
          color: "inherit !important"
        }
      })
    ]
  })

  view = new EditorView({
    state,
    parent: editorContainer.value
  })
}

const verifyDocumentAccess = async (password: string): Promise<boolean> => {
  const response = await fetch(`${apiBaseUrl.value}/api/document-access`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      documentId: documentId.value,
      password
    })
  })

  return response.ok
}

const openEditorAfterAccess = async () => {
  hasDocumentAccess.value = true
  await nextTick()
  initEditor()
}

const ensureDocumentAccess = async () => {
  hasDocumentAccess.value = false

  try {
    const response = await fetch(`${apiBaseUrl.value}/api/document-lock?documentId=${encodeURIComponent(documentId.value)}`)
    if (!response.ok) {
      documentAccessPassword.value = ''
      await openEditorAfterAccess()
      return
    }

    const payload = await response.json() as { locked?: boolean }
    const isLocked = !!payload.locked
    isDocumentLocked.value = isLocked

    if (!isLocked) {
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

// Markdown formatting helper
const applyFormat = (prefix: string, suffix: string = '') => {
  if (!view) return
  
  const { state } = view
  const selection = state.selection.main
  const selectedText = state.sliceDoc(selection.from, selection.to)
  
  // Checking if it's a line-level format like headers or lists
  const isLineFormat = !suffix && prefix.endsWith(' ')

  if (isLineFormat) {
    // Apply prefix to the start of the current line
    const line = state.doc.lineAt(selection.from)
    view.dispatch({
      changes: { from: line.from, insert: prefix },
      selection: { anchor: selection.from + prefix.length, head: selection.to + prefix.length }
    })
  } else {
    // Wrap the selected text (or insert at cursor if no selection)
    view.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: `${prefix}${selectedText}${suffix}`
      },
      selection: {
        anchor: selection.from + prefix.length,
        head: selection.to + prefix.length
      }
    })
  }

  // Return focus back to CodeMirror
  view.focus()
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
  const text = linkData.text || 'link'
  applyFormat(`[${text}](${linkData.url})`, '')
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
  if (!view) return
  lockPassword.value = ''
  lockError.value = ''
  showLockDialog.value = true
  await nextTick()
  lockPasswordInput.value?.focus()
}

const lockDocument = async () => {
  lockError.value = ''
  const password = lockPassword.value.trim()
  if (!password) return

  const response = await fetch(`${apiBaseUrl.value}/api/document-lock`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      documentId: documentId.value,
      password
    })
  })

  if (!response.ok) {
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

  const response = await fetch(`${apiBaseUrl.value}/api/document-lock`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      documentId: documentId.value,
      password
    })
  })

  if (!response.ok) {
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

  const canAccess = await verifyDocumentAccess(password)
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
  const alt = imageData.alt || 'imagem'
  applyFormat(`![${alt}](${imageData.url})`, '')
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
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${documentId.value}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadPDF = async () => {
  if (!view || !pdfContainer.value) return

  const [{ marked }, { default: html2pdf }] = await Promise.all([
    import('marked'),
    import('html2pdf.js')
  ])

  const text = view.state.doc.toString()
  
  // Parse Markdown to HTML
  const htmlContent = await marked.parse(text, { breaks: true, gfm: true })
  
  // Insert styled HTML into the hidden container
  pdfContainer.value.innerHTML = `
    ${markdownStyles}
    <div class="markdown-body">
      ${htmlContent}
    </div>
  `
  
  // Make sure image tags have max-width to avoid breaking PDF layout
  const images = pdfContainer.value.querySelectorAll('img')
  images.forEach(img => {
    img.style.maxWidth = '100%'
    img.style.height = 'auto'
  })

  // html2pdf options (using any to bypass missing type defs)
  const opt = {
    margin:       15,
    filename:     `${documentId.value}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }

  // Trigger generation
  // @ts-ignore
  html2pdf().set(opt).from(pdfContainer.value).save()
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
