<template>
  <div class="flex flex-col h-full w-full">
    <!-- Header -->
    <header class="bg-emerald-600 text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
      <div class="flex items-center gap-4">
        <router-link to="/" class="font-bold text-xl hover:text-emerald-100 transition-colors">
          &#8592; Início
        </router-link>
        <div class="font-mono bg-emerald-700 px-3 py-1 rounded text-sm md:text-base">
          /{{ documentId }}
        </div>
      </div>
      <div class="flex items-center gap-2 text-sm max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
        <span :class="['w-2 h-2 rounded-full', status === 'connected' ? 'bg-green-400' : 'bg-red-400']"></span>
        {{ status === 'connected' ? 'Sincronizado' : 'Desconectado' }}
      </div>
    </header>

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
    ? `ws://${window.location.host}` 
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
