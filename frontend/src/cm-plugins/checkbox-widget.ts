/**
 * Checkbox Click Plugin
 *
 * Torna checklists markdown clicáveis mantendo o texto puro no documento:
 * - [ ] -> clique -> [x]
 * - [x] ou [X] -> clique -> [ ]
 *
 * Regras aplicadas conforme plano:
 * - Clique processado apenas dentro dos colchetes
 * - Sem ícones substitutos (preserva copy/paste e compatibilidade markdown)
 * - Suporta '-' e listas ordenadas (1. / 1))
 */

import { ViewPlugin, Decoration, EditorView, DecorationSet, ViewUpdate } from "@codemirror/view"
import { RangeSetBuilder } from "@codemirror/state"
import { findCheckboxes } from "../cm-utils/markdown-parsing"

function buildCheckboxDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()

  for (const { from, to } of view.visibleRanges) {
    let line = view.state.doc.lineAt(from)

    while (line.from <= to) {
      const checkboxes = findCheckboxes(line.text, line.from)

      for (const checkbox of checkboxes) {
        builder.add(
          checkbox.checkboxFrom,
          checkbox.checkboxTo,
          Decoration.mark({ class: "cm-checkbox-widget" })
        )
      }

      if (line.to >= to) break
      line = view.state.doc.line(line.number + 1)
    }
  }

  return builder.finish()
}

export const checkboxClickPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(readonly view: EditorView) {
      this.decorations = buildCheckboxDecorations(view)
      this.view.dom.addEventListener("mousedown", this.handleMouseDown, true)
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildCheckboxDecorations(update.view)
      }
    }

    destroy() {
      this.view.dom.removeEventListener("mousedown", this.handleMouseDown, true)
    }

    handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return
      if (event.ctrlKey || event.metaKey) return

      const target = event.target as HTMLElement | null
      if (!target?.closest(".cm-checkbox-widget")) return

      const pos = this.view.posAtCoords({ x: event.clientX, y: event.clientY })
      if (pos === null) return

      const line = this.view.state.doc.lineAt(pos)
      const checkboxes = findCheckboxes(line.text, line.from)

      for (const checkbox of checkboxes) {
        if (pos >= checkbox.checkboxFrom && pos < checkbox.checkboxTo) {
          const newValue = checkbox.status === "checked" ? "[ ]" : "[x]"

          this.view.dispatch({
            changes: {
              from: checkbox.checkboxFrom,
              to: checkbox.checkboxTo,
              insert: newValue
            }
          })

          event.preventDefault()
          event.stopPropagation()
          return
        }
      }
    }
  },
  {
    decorations: (plugin) => plugin.decorations
  }
)
