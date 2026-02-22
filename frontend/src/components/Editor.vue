<template>
  <div class="flex flex-col h-full w-full">
    <!-- Header -->
    <header class="bg-gray-900 text-gray-100 px-5 py-2.5 flex items-center justify-between shadow-md z-20">
      <div class="flex items-center gap-4">
        <router-link to="/" class="font-bold text-lg hover:text-white transition-colors flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
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
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
      </button>
      <button @click="redo" class="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Refazer">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
      </button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center"></div>
      <button @click="applyFormat('bold')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-bold transition-colors focus:outline-none" title="Negrito">B</button>
      <button @click="applyFormat('italic')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded italic transition-colors focus:outline-none" title="Itálico">I</button>
      <button @click="applyFormat('strike')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded line-through transition-colors focus:outline-none" title="Tachado">S</button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center"></div>
      <button @click="applyFormat('h1')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-bold transition-colors focus:outline-none" title="Título 1">H1</button>
      <button @click="applyFormat('h2')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-bold transition-colors focus:outline-none" title="Título 2">H2</button>
      <button @click="applyFormat('h3')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-bold transition-colors focus:outline-none" title="Título 3">H3</button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center"></div>
      <button @click="applyFormat('bullet')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Lista Bullet">&#8226; Lista</button>
      <button @click="applyFormat('ordered')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Lista Numérica">1. Lista</button>
      <button @click="applyFormat('task')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Checklist">&#9745; Checklist</button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center"></div>
      <button @click="applyFormat('quote')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-serif italic transition-colors focus:outline-none" title="Citação">“ ”</button>
      <button @click="applyFormat('code')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-mono text-xs transition-colors focus:outline-none" title="Código Inline">` `</button>
      <button @click="applyFormat('codeblock')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded font-mono text-xs transition-colors focus:outline-none" title="Bloco de Código">{ }</button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center"></div>
      <button @click="applyFormat('table')" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none flex items-center gap-1" title="Tabela">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>
        Tabela
      </button>
      <div class="w-px h-5 bg-gray-300 mx-1.5 self-center"></div>
      <button @click="openLinkDialog" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Link">Link</button>
      <button @click="openImageDialog" class="px-2.5 py-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition-colors focus:outline-none" title="Imagem">Img</button>
      
      <div class="flex-1"></div> <!-- Spacer -->
      
      <div class="flex gap-2">
        <button @click="downloadMarkdown" class="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none flex items-center gap-1.5 shadow-sm" title="Baixar como .md">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          .MD
        </button>
        <button @click="downloadPDF" class="px-3 py-1.5 bg-gray-800 border border-gray-800 text-white hover:bg-gray-900 rounded-md font-medium text-xs transition-colors focus:outline-none flex items-center gap-1.5 shadow-sm" title="Baixar como .pdf">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          .PDF
        </button>
      </div>
    </div>

    <!-- Hidden element for PDF rendering -->
    <div v-show="false">
      <div ref="pdfContainer" class="pdf-export-container p-8 text-black bg-white"></div>
    </div>

    <!-- Editor Area -->
    <main class="flex-1 overflow-hidden relative tiptap-wrapper" @click="focusEditor">
      <editor-content :editor="editor || undefined" class="h-full" />
    </main>

    <!-- Dialogs -->
    <div v-if="showLinkDialog || showImageDialog" class="absolute inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
      
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

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, watch, shallowRef, nextTick } from 'vue'
import { useRoute } from 'vue-router'

// Yjs
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// TipTap
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

// PDF Exports
import html2pdf from 'html2pdf.js'
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
const pdfContainer = ref<HTMLElement | null>(null) // Ref for PDF rendering
const status = ref('disconnected')

// Dialog states
const showLinkDialog = ref(false)
const showImageDialog = ref(false)
const linkData = reactive({ text: '', url: 'https://' })
const imageData = reactive({ alt: '', url: 'https://' })
const linkTextInput = ref<HTMLInputElement | null>(null)
const imageAltInput = ref<HTMLInputElement | null>(null)

let ydoc: Y.Doc | null = null
let provider: WebsocketProvider | null = null
const editor = shallowRef<Editor | null>(null)

const initEditor = () => {
  // 1. Setup Yjs
  ydoc = new Y.Doc()
  
  // 2. Connect to WebSocket
  const wsUrl = import.meta.env.PROD 
    ? `wss://dontpadsrv.vagnernogueira.com` 
    : `ws://localhost:1234`
    
  provider = new WebsocketProvider(wsUrl, documentId.value, ydoc)
  provider.on('status', (event: { status: string }) => {
    status.value = event.status
  })

  // 3. Bind TipTap to Yjs Document
  editor.value = new Editor({
    extensions: [
      StarterKit.configure({
        history: false // turn off standard history for Yjs Collaboration
      } as any),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: randomName,
          color: randomColor,
        },
      }),
      Link.configure({ openOnClick: false }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    editorProps: {
      attributes: {
        class: 'focus:outline-none h-full',
      },
    },
  })
}

const focusEditor = () => {
  if (editor.value) {
    editor.value.commands.focus()
  }
}

// Undo/Redo functions
const undo = () => editor.value?.commands.undo()
const redo = () => editor.value?.commands.redo()

// Markdown equivalent button mapping
const applyFormat = (formatType: string) => {
  if (!editor.value) return
  editor.value.chain().focus()

  switch (formatType) {
    case 'bold': editor.value.commands.toggleBold(); break
    case 'italic': editor.value.commands.toggleItalic(); break
    case 'strike': editor.value.commands.toggleStrike(); break
    case 'h1': editor.value.commands.toggleHeading({ level: 1 }); break
    case 'h2': editor.value.commands.toggleHeading({ level: 2 }); break
    case 'h3': editor.value.commands.toggleHeading({ level: 3 }); break
    case 'bullet': editor.value.commands.toggleBulletList(); break
    case 'ordered': editor.value.commands.toggleOrderedList(); break
    case 'task': editor.value.commands.toggleTaskList(); break
    case 'quote': editor.value.commands.toggleBlockquote(); break
    case 'code': editor.value.commands.toggleCode(); break
    case 'codeblock': editor.value.commands.toggleCodeBlock(); break
    case 'table': /* Using raw HTML wrapper as TipTap Table requires complex table extensions, let's inject a basic preset if needed or skip since it's hard to port table directly without the extension */ 
      alert("Tabelas requerem uma extensão Pro ou configuração adicional no TipTap. Opcionalmente podemos injetar HTML.")
      break
  }
}

// Dialog functions
const openLinkDialog = async () => {
  if (!editor.value) return
  
  linkData.url = editor.value.getAttributes('link').href || 'https://'
  linkData.text = 'link' // We skip direct text injection for TipTap simplicity unless strictly needed
  showLinkDialog.value = true
  
  await nextTick()
  if (linkTextInput.value) linkTextInput.value.select()
}

const insertLink = () => {
  if (!linkData.url) return
  editor.value?.chain().focus().setLink({ href: linkData.url }).run()
  closeDialogs()
}

const openImageDialog = async () => {
  if (!editor.value) return
  imageData.url = 'https://'
  imageData.alt = ''
  showImageDialog.value = true
  
  await nextTick()
  if (imageAltInput.value) imageAltInput.value.select()
}

const insertImage = () => {
  if (!imageData.url) return
  editor.value?.chain().focus().setImage({ src: imageData.url, alt: imageData.alt }).run()
  closeDialogs()
}

const closeDialogs = () => {
  showLinkDialog.value = false
  showImageDialog.value = false
  if (editor.value) editor.value.commands.focus()
}

// Download methods
const downloadMarkdown = () => {
  // To keep it simple without turndown, we'll download HTML or plain text.
  // Full Markdown export in TipTap requires 'prosemirror-markdown'.
  if (!editor.value) return
  const text = editor.value.getText()
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${documentId.value}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const downloadPDF = async () => {
  if (!editor.value || !pdfContainer.value) return
  const htmlContent = editor.value.getHTML()
  
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
  if (editor.value) editor.value.destroy()
}

onMounted(() => {
  initEditor()
})

onBeforeUnmount(() => {
  cleanup()
})

watch(() => route.params.documentId, (newId) => {
  if (newId && typeof newId === 'string' && newId !== documentId.value) {
    documentId.value = newId
    cleanup()
    initEditor()
  }
})
</script>
