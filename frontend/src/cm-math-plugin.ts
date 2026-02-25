import { keymap } from "@codemirror/view"
import { EditorView } from "@codemirror/view"

/**
 * Safe mathematical expression evaluator
 * Supports basic operations: +, -, *, /, %, ^, parentheses
 * Also supports common math functions: sqrt, sin, cos, tan, log, etc.
 */
function evaluateMathExpression(expr: string): number | null {
  try {
    // Remove whitespace
    const cleanExpr = expr.trim()
    
    if (!cleanExpr) return null

    // Replace common mathematical functions and constants
    let processedExpr = cleanExpr
      .replace(/\bpi\b/gi, Math.PI.toString())
      .replace(/\be\b/gi, Math.E.toString())
      .replace(/sqrt\(/gi, 'Math.sqrt(')
      .replace(/sin\(/gi, 'Math.sin(')
      .replace(/cos\(/gi, 'Math.cos(')
      .replace(/tan\(/gi, 'Math.tan(')
      .replace(/asin\(/gi, 'Math.asin(')
      .replace(/acos\(/gi, 'Math.acos(')
      .replace(/atan\(/gi, 'Math.atan(')
      .replace(/log\(/gi, 'Math.log(')
      .replace(/ln\(/gi, 'Math.log(')
      .replace(/log10\(/gi, 'Math.log10(')
      .replace(/exp\(/gi, 'Math.exp(')
      .replace(/abs\(/gi, 'Math.abs(')
      .replace(/floor\(/gi, 'Math.floor(')
      .replace(/ceil\(/gi, 'Math.ceil(')
      .replace(/round\(/gi, 'Math.round(')
      .replace(/pow\(/gi, 'Math.pow(')
      .replace(/min\(/gi, 'Math.min(')
      .replace(/max\(/gi, 'Math.max(')
      .replace(/\^/g, '**') // Convert ^ to ** for exponentiation

    // Security check: only allow safe characters
    // Allow: numbers, operators, parentheses, dots, Math object, whitespace
    const safePattern = /^[\d+\-*/(). \s,Math.a-z]+$/i
    if (!safePattern.test(processedExpr)) {
      console.warn('[math-plugin] Expression contains unsafe characters:', expr)
      return null
    }

    // Security check: prevent dangerous patterns
    const dangerousPatterns = [
      /import\s/i,
      /require\s*\(/i,
      /eval\s*\(/i,
      /function\s*\(/i,
      /=>/,
      /;\s*$/,
      /\bwindow\b/i,
      /\bdocument\b/i,
      /\bglobal\b/i,
      /\bprocess\b/i,
      /\b__/,
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(processedExpr)) {
        console.warn('[math-plugin] Expression contains dangerous pattern:', expr)
        return null
      }
    }

    // Evaluate using Function constructor (safer than eval)
    // We only allow Math operations
    const result = new Function('Math', `'use strict'; return (${processedExpr})`)(Math)

    // Check if result is a valid number
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result
    }

    return null
  } catch (error) {
    console.error('[math-plugin] Error evaluating expression:', expr, error)
    return null
  }
}

/**
 * Format a number for display
 * - Remove unnecessary decimals for whole numbers
 * - Limit decimal places for floating point numbers
 */
function formatResult(num: number): string {
  // If it's a whole number, return without decimals
  if (Number.isInteger(num)) {
    return num.toString()
  }

  // For floating point, limit to 10 significant decimal places
  // and remove trailing zeros
  const formatted = num.toFixed(10).replace(/\.?0+$/, '')
  return formatted
}

/**
 * Math Calculation Plugin
 * 
 * Trigger: Type "= " (equals sign followed by space)
 * Action: Evaluates the mathematical expression from the start of the line
 *         to the "=" sign and inserts the result after it.
 * 
 * Example:
 *   Before: "1 + 1" (user types "= ")
 *   After:  "1 + 1 = 2"
 */
export const mathCalculationPlugin = keymap.of([
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
