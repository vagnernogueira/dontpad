/**
 * Math Calculation Plugin
 *
 * Este plugin avalia expressões matemáticas automaticamente quando o usuário
 * digita "= " (sinal de igual seguido de espaço).
 *
 * Funcionalidades:
 * - Trigger: Digite "= " após uma expressão matemática
 * - Avalia a expressão e insere o resultado automaticamente
 * - Suporta operações básicas: +, -, *, /, %, ^ (potência)
 * - Suporta funções matemáticas: sqrt, sin, cos, tan, log, ln, abs, etc.
 * - Suporta constantes: pi, e
 * - Validação de segurança para prevenir código malicioso
 *
 * Exemplo:
 *   Antes: "2 + 2" (usuário digita "= ")
 *   Depois: "2 + 2 = 4"
 *
 * A lógica do parser/avaliador matemático vive em cm-utils/math-evaluator.ts.
 */

import { keymap } from "@codemirror/view"
import { EditorView } from "@codemirror/view"
import { evaluateMathExpression, formatResult } from "../cm-utils/math-evaluator"

/**
 * Plugin do CodeMirror para cálculos matemáticos automáticos
 */
export const mathCalculationKeymap = keymap.of([
  {
    key: ' ', // Space key
    run: (editorView: EditorView) => {
      const { state } = editorView
      const selection = state.selection.main
      const pos = selection.from

      // Check if cursor is at selection (not selecting text)
      if (!selection.empty) {
        return false // Let default behavior handle it
      }

      // Get the current line
      const line = state.doc.lineAt(pos)
      const lineText = line.text
      const posInLine = pos - line.from

      // Check if the character before cursor is "="
      const charBefore = lineText[posInLine - 1]
      if (charBefore !== '=') {
        return false // Not our trigger, use default behavior
      }

      // Find where the "=" is in the line
      // We need to extract everything before the "=" as the expression
      const equalsPos = posInLine - 1
      const expression = lineText.substring(0, equalsPos).trim()

      // If there's no expression, just insert space normally
      if (!expression) {
        return false
      }

      // Check if there's already a result after the "=" sign
      const afterEquals = lineText.substring(posInLine).trim()
      if (afterEquals) {
        // There's already content after "=", don't calculate
        return false
      }

      // Evaluate the expression
      const result = evaluateMathExpression(expression)

      if (result === null) {
        // Expression couldn't be evaluated, use default space behavior
        return false
      }

      // Format the result
      const resultText = formatResult(result)

      // Insert space and result
      const textToInsert = ` ${resultText}`

      editorView.dispatch({
        changes: { from: pos, insert: textToInsert },
        selection: { anchor: pos + textToInsert.length }
      })

      return true // We handled the space key
    }
  }
])
