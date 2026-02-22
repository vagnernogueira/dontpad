<template>
  <div class="flex flex-col h-full w-full">
    <!-- Header -->
    <header class="bg-emerald-600 text-white px-4 py-1.5 flex items-center justify-between shadow-sm z-20">
      <div class="flex items-center gap-3">
        <router-link to="/" class="font-bold text-lg hover:text-emerald-100 transition-colors">
          &#8592; Início
        </router-link>
        <div class="font-mono bg-emerald-700 px-2 py-0.5 rounded text-sm shrink-0">
          /{{ documentId }}
        </div>
      </div>
      <div class="flex items-center gap-2 text-xs opacity-90 truncate max-w-[150px]">
        <span :class="['w-2 h-2 rounded-full', status === 'connected' ? 'bg-green-400' : 'bg-red-400']"></span>
        {{ status === 'connected' ? 'Sincronizado' : 'Offline' }}
      </div>
    </header>

    <!-- Toolbar -->
    <div class="bg-white border-b border-gray-200 px-3 py-1 flex items-center flex-wrap gap-1 shadow-[0_2px_4px_rgba(0,0,0,0.02)] text-gray-700 z-10 text-sm overflow-x-auto whitespace-nowrap">
      <button @click="applyFormat('**', '**')" class="px-2 py-1 hover:bg-gray-100 rounded font-bold focus:outline-none" title="Negrito">B</button>
      <button @click="applyFormat('*', '*')" class="px-2 py-1 hover:bg-gray-100 rounded italic focus:outline-none" title="Itálico">I</button>
      <button @click="applyFormat('~~', '~~')" class="px-2 py-1 hover:bg-gray-100 rounded line-through focus:outline-none" title="Tachado">S</button>
      <div class="w-px h-5 bg-gray-300 mx-1 self-center"></div>
      <button @click="applyFormat('# ')" class="px-2 py-1 hover:bg-gray-100 rounded font-bold focus:outline-none" title="Título 1">H1</button>
      <button @click="applyFormat('## ')" class="px-2 py-1 hover:bg-gray-100 rounded font-bold focus:outline-none" title="Título 2">H2</button>
      <button @click="applyFormat('### ')" class="px-2 py-1 hover:bg-gray-100 rounded font-bold focus:outline-none" title="Título 3">H3</button>
      <div class="w-px h-5 bg-gray-300 mx-1 self-center"></div>
      <button @click="applyFormat('- ')" class="px-2 py-1 hover:bg-gray-100 rounded focus:outline-none" title="Lista Bullet">&#8226; Lista</button>
      <button @click="applyFormat('1. ')" class="px-2 py-1 hover:bg-gray-100 rounded focus:outline-none" title="Lista Numérica">1. Lista</button>
      <div class="w-px h-5 bg-gray-300 mx-1 self-center"></div>
      <button @click="applyFormat('> ')" class="px-2 py-1 hover:bg-gray-100 rounded font-serif italic focus:outline-none" title="Citação">“ ”</button>
      <button @click="applyFormat('`', '`')" class="px-2 py-1 hover:bg-gray-100 rounded font-mono text-xs focus:outline-none" title="Código Inline">` `</button>
      <button @click="applyFormat('```\n', '\n```')" class="px-2 py-1 hover:bg-gray-100 rounded font-mono text-xs focus:outline-none" title="Bloco de Código">{ }</button>
      <div class="w-px h-5 bg-gray-300 mx-1 self-center"></div>
      <button @click="applyFormat('[', '](url)')" class="px-2 py-1 hover:bg-gray-100 rounded focus:outline-none" title="Link">Link</button>
      <button @click="applyFormat('![alt]', '(url)')" class="px-2 py-1 hover:bg-gray-100 rounded focus:outline-none" title="Imagem">Img</button>
      
      <div class="flex-1"></div> <!-- Spacer -->
      <div class="w-px h-5 bg-gray-300 mx-1 self-center"></div>
      <button @click="downloadMarkdown" class="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-semibold focus:outline-none flex items-center gap-1" title="Baixar como .md">
        &#8595; .MD
      </button>
      <button @click="downloadPDF" class="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded font-semibold focus:outline-none flex items-center gap-1" title="Baixar como .pdf">
        &#8595; .PDF
      </button>
    </div>

    <!-- Hidden element for PDF rendering -->
    <div v-show="false">
      <div ref="pdfContainer" class="pdf-export-container p-8 text-black bg-white"></div>
    </div>


    <!-- Editor Area -->
    <main class="flex-1 overflow-hidden relative" ref="editorContainer"></main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'

// Yjs
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// CodeMirror
import { EditorState } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { yCollab } from 'y-codemirror.next'
import { markdownPreviewPlugin } from '../cm-preview-plugin'

// PDF & Markdown Exports
import { marked } from 'marked'
import html2pdf from 'html2pdf.js'

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

let ydoc: Y.Doc
let provider: WebsocketProvider
let view: EditorView

const initEditor = () => {
  if (!editorContainer.value) return

  // 1. Setup Yjs
  ydoc = new Y.Doc()
  
  // 2. Connect to WebSocket
  // Assuming backend runs on 1234 port or same host in prod
  const wsUrl = import.meta.env.PROD 
    ? `wss://dontpadsrv.vagnernogueira.com` 
    : `ws://localhost:1234`
    
  provider = new WebsocketProvider(wsUrl, documentId.value, ydoc)
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
  
  const state = EditorState.create({
    doc: ytext.toString(),
    extensions: [
      basicSetup,
      markdown(),
      yCollab(ytext, provider.awareness),
      markdownPreviewPlugin,
      EditorView.theme({
        "&": { height: "100%" },
        ".cm-scroller": { overflow: "auto" }
      })
    ]
  })

  view = new EditorView({
    state,
    parent: editorContainer.value
  })
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
  const text = view.state.doc.toString()
  
  // Parse Markdown to HTML
  const htmlContent = await marked.parse(text, { breaks: true, gfm: true })
  
  // Insert styled HTML into the hidden container
  pdfContainer.value.innerHTML = `
    <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
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
