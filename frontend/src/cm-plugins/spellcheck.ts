/**
 * Spellcheck Plugin
 *
 * Este plugin liga ou desliga o spellcheck nativo do navegador
 * no elemento contenteditable do CodeMirror.
 */

import { EditorView, ViewPlugin } from '@codemirror/view'

export const spellcheckPlugin = (enabled: boolean) =>
  ViewPlugin.fromClass(
    class {
      constructor(readonly view: EditorView) {
        this.applySpellcheck(enabled)
      }

      private applySpellcheck(value: boolean) {
        this.view.contentDOM.spellcheck = value
        this.view.contentDOM.setAttribute('spellcheck', value ? 'true' : 'false')
      }
    }
  )
