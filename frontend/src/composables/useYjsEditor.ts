/**
 * useYjsEditor composable
 *
 * Encapsulates Yjs document, WebSocket provider, and CodeMirror EditorView
 * setup/teardown. Exposes the reactive `status` and the `view` + `undoManager`
 * needed by the rest of the Editor component.
 */

import { ref, watch } from 'vue'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import { drawSelection } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { Strikethrough } from '@lezer/markdown'
import { yCollab } from 'y-codemirror.next'
import { markdownPreviewPlugin } from '../cm-plugins/markdown-preview'
import { listCustomPlugin } from '../cm-plugins/list'
import { codeBlockPlugin } from '../cm-plugins/code-block'
import { checkboxClickPlugin } from '../cm-plugins/checkbox-widget'
import { horizontalRulePlugin } from '../cm-plugins/horizontal-rule-widget'
import { multiClickPlugin } from '../cm-plugins/multi-click'
import { plainUrlPlugin } from '../cm-plugins/plain-url'
import { spellcheckPlugin } from '../cm-plugins/spellcheck'
import { editorKeymaps } from '../cm-plugins/keymaps'
import { createCommandPaletteKeymap } from '../cm-plugins/command-palette-keymap'
import { getEditorTheme } from '../cm-extensions'
import { useColorMode } from './useColorMode'
import type { CollaboratorProfile } from '../cm-utils/cursor'
import { focusEditorAtStart } from '../cm-utils/initial-editor-focus'
import { getProfileAwarenessState } from '../cm-utils/cursor'

export interface YjsEditorOptions {
  wsBaseUrl: string
  documentId: string
  password: string
  templateId?: string
  profile: CollaboratorProfile
  spellcheckEnabled: boolean
  onOpenCommandPalette?: () => void
}

export interface YjsEditorInstance {
  ydoc: Y.Doc
  provider: WebsocketProvider
  view: EditorView
  undoManager: Y.UndoManager
  spellcheckCompartment: Compartment
  themeCompartment: Compartment
}

export function useYjsEditor() {
  const status = ref<string>('disconnected')
  const { isDark } = useColorMode()
  let instance: YjsEditorInstance | null = null

  watch(isDark, (darkModeEnabled) => {
    if (!instance) {
      return
    }

    instance.view.dispatch({
      effects: instance.themeCompartment.reconfigure(getEditorTheme(darkModeEnabled)),
    })
  })

  function init(
    container: HTMLElement,
    options: YjsEditorOptions,
    callbacks: {
      onAccessDenied: () => void
    }
  ): YjsEditorInstance {
    // Cleanup any previous instance
    destroy()

    const ydoc = new Y.Doc()

    const providerParams: Record<string, string> = {}
    if (options.password) {
      providerParams.password = options.password
    }
    if (options.templateId?.trim()) {
      providerParams.template = options.templateId.trim()
    }

    const provider = Object.keys(providerParams).length > 0
      ? new WebsocketProvider(options.wsBaseUrl, options.documentId, ydoc, {
          params: providerParams,
        })
      : new WebsocketProvider(options.wsBaseUrl, options.documentId, ydoc)

    provider.on('connection-close', (event: { code?: number }) => {
      if (event?.code === 4403) {
        callbacks.onAccessDenied()
      }
    })

    provider.on('status', (event: { status: string }) => {
      status.value = event.status
    })

    // Set awareness
    provider.awareness.setLocalStateField('user', getProfileAwarenessState(options.profile))

    // Bind CodeMirror to Yjs
    const ytext = ydoc.getText('codemirror')
    const undoManager = new Y.UndoManager(ytext)
    const spellcheckCompartment = new Compartment()
    const themeCompartment = new Compartment()

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        drawSelection(),
        spellcheckCompartment.of(spellcheckPlugin(options.spellcheckEnabled)),
        EditorView.lineWrapping,
        markdown({ extensions: [Strikethrough, { remove: ['IndentedCode', 'SetextHeading'] }] }),
        themeCompartment.of(getEditorTheme(isDark.value)),
        listCustomPlugin,
        checkboxClickPlugin,
        codeBlockPlugin,
        horizontalRulePlugin,
        plainUrlPlugin,
        yCollab(ytext, provider.awareness, { undoManager }),
        ...(options.onOpenCommandPalette ? [createCommandPaletteKeymap(options.onOpenCommandPalette)] : []),
        ...editorKeymaps,
        markdownPreviewPlugin,
        multiClickPlugin,
      ],
    })

    const view = new EditorView({ state, parent: container })
    focusEditorAtStart(view)

    instance = { ydoc, provider, view, undoManager, spellcheckCompartment, themeCompartment }
    return instance
  }

  function getInstance(): YjsEditorInstance | null {
    return instance
  }

  function destroy() {
    if (!instance) return
    instance.provider.destroy()
    instance.ydoc.destroy()
    instance.view.destroy()
    instance = null
  }

  return { status, init, getInstance, destroy }
}
