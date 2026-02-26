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
 */

import { keymap } from "@codemirror/view"
import { EditorView } from "@codemirror/view"

/**
 * Safe mathematical expression evaluator
 * Supports: +, -, *, /, %, ^, parentheses, unary +/-
 * Functions: sqrt, sin, cos, tan, asin, acos, atan, log, ln, log10,
 * exp, abs, floor, ceil, round, min, max, pow
 * Constants: pi, e
 */
function evaluateMathExpression(expr: string): number | null {
  try {
    const cleanExpr = expr.trim()
    if (!cleanExpr) return null

    const tokens = tokenizeMathExpression(cleanExpr)
    if (!tokens) return null

    const parser = new MathParser(tokens)
    const result = parser.parseExpression()

    if (!parser.isAtEnd()) {
      return null
    }

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result
    }

    return null
  } catch (error) {
    return null
  }
}

type MathToken =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: string }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'comma'; value: ',' }
  | { type: 'identifier'; value: string }

function tokenizeMathExpression(input: string): MathToken[] | null {
  const tokens: MathToken[] = []
  let i = 0

  while (i < input.length) {
    const char = input[i]

    if (char === ' ' || char === '\t' || char === '\n') {
      i += 1
      continue
    }

    if (char === '+' || char === '-' || char === '*' || char === '/' || char === '%' || char === '^') {
      tokens.push({ type: 'operator', value: char })
      i += 1
      continue
    }

    if (char === '(' || char === ')') {
      tokens.push({ type: 'paren', value: char })
      i += 1
      continue
    }

    if (char === ',') {
      tokens.push({ type: 'comma', value: char })
      i += 1
      continue
    }

    if (isDigit(char) || (char === '.' && isDigit(input[i + 1]))) {
      const numberMatch = input.slice(i).match(/^(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?/)
      if (!numberMatch) return null
      const rawNumber = numberMatch[0]
      const parsedNumber = Number(rawNumber)
      if (!isFinite(parsedNumber)) return null
      tokens.push({ type: 'number', value: parsedNumber })
      i += rawNumber.length
      continue
    }

    if (isAlpha(char)) {
      const identMatch = input.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/)
      if (!identMatch) return null
      tokens.push({ type: 'identifier', value: identMatch[0].toLowerCase() })
      i += identMatch[0].length
      continue
    }

    return null
  }

  return tokens
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9'
}

function isAlpha(char: string): boolean {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_'
}

class MathParser {
  private index = 0

  constructor(private tokens: MathToken[]) {}

  isAtEnd(): boolean {
    return this.index >= this.tokens.length
  }

  parseExpression(): number {
    let value = this.parseTerm()

    while (true) {
      if (this.matchOperator('+')) {
        value += this.parseTerm()
        continue
      }

      if (this.matchOperator('-')) {
        value -= this.parseTerm()
        continue
      }

      break
    }

    return value
  }

  private parseTerm(): number {
    let value = this.parsePower()

    while (true) {
      if (this.matchOperator('*')) {
        value *= this.parsePower()
        continue
      }

      if (this.matchOperator('/')) {
        value /= this.parsePower()
        continue
      }

      if (this.matchOperator('%')) {
        value %= this.parsePower()
        continue
      }

      break
    }

    return value
  }

  private parsePower(): number {
    let value = this.parseUnary()

    if (this.matchOperator('^')) {
      const right = this.parsePower()
      value = Math.pow(value, right)
    }

    return value
  }

  private parseUnary(): number {
    if (this.matchOperator('+')) {
      return this.parseUnary()
    }

    if (this.matchOperator('-')) {
      return -this.parseUnary()
    }

    return this.parsePrimary()
  }

  private parsePrimary(): number {
    const numberValue = this.matchNumber()
    if (numberValue !== null) return numberValue

    const identifier = this.matchIdentifier()
    if (identifier !== null) {
      if (this.matchParen('(')) {
        const args: number[] = []
        if (!this.checkParen(')')) {
          do {
            args.push(this.parseExpression())
          } while (this.matchComma())
        }

        if (!this.matchParen(')')) {
          throw new Error('Expected closing parenthesis')
        }

        return this.evaluateFunction(identifier, args)
      }

      return this.evaluateConstant(identifier)
    }

    if (this.matchParen('(')) {
      const value = this.parseExpression()
      if (!this.matchParen(')')) {
        throw new Error('Expected closing parenthesis')
      }
      return value
    }

    throw new Error('Unexpected token')
  }

  private evaluateFunction(name: string, args: number[]): number {
    switch (name) {
      case 'sqrt':
        return this.requireArgs(name, args, 1, Math.sqrt)
      case 'sin':
        return this.requireArgs(name, args, 1, Math.sin)
      case 'cos':
        return this.requireArgs(name, args, 1, Math.cos)
      case 'tan':
        return this.requireArgs(name, args, 1, Math.tan)
      case 'asin':
        return this.requireArgs(name, args, 1, Math.asin)
      case 'acos':
        return this.requireArgs(name, args, 1, Math.acos)
      case 'atan':
        return this.requireArgs(name, args, 1, Math.atan)
      case 'log':
      case 'ln':
        return this.requireArgs(name, args, 1, Math.log)
      case 'log10':
        return this.requireArgs(name, args, 1, Math.log10)
      case 'exp':
        return this.requireArgs(name, args, 1, Math.exp)
      case 'abs':
        return this.requireArgs(name, args, 1, Math.abs)
      case 'floor':
        return this.requireArgs(name, args, 1, Math.floor)
      case 'ceil':
        return this.requireArgs(name, args, 1, Math.ceil)
      case 'round':
        return this.requireArgs(name, args, 1, Math.round)
      case 'pow':
        return this.requireArgs(name, args, 2, (a, b) => Math.pow(a, b))
      case 'min':
        return this.requireVariadicArgs(name, args, Math.min)
      case 'max':
        return this.requireVariadicArgs(name, args, Math.max)
      default:
        throw new Error('Unknown function')
    }
  }

  private evaluateConstant(name: string): number {
    switch (name) {
      case 'pi':
        return Math.PI
      case 'e':
        return Math.E
      default:
        throw new Error('Unknown identifier')
    }
  }

  private requireArgs(name: string, args: number[], count: number, fn: (...values: number[]) => number): number {
    if (args.length !== count) {
      throw new Error(`Invalid arg count for ${name}`)
    }
    return fn(...args)
  }

  private requireVariadicArgs(name: string, args: number[], fn: (...values: number[]) => number): number {
    if (args.length < 1) {
      throw new Error(`Invalid arg count for ${name}`)
    }
    return fn(...args)
  }

  private matchNumber(): number | null {
    if (this.checkType('number')) {
      const token = this.peek() as Extract<MathToken, { type: 'number' }>
      this.index += 1
      return token.value
    }
    return null
  }

  private matchIdentifier(): string | null {
    if (this.checkType('identifier')) {
      const token = this.peek() as Extract<MathToken, { type: 'identifier' }>
      this.index += 1
      return token.value
    }
    return null
  }

  private matchOperator(expected: string): boolean {
    if (this.checkType('operator') && (this.peek() as Extract<MathToken, { type: 'operator' }>).value === expected) {
      this.index += 1
      return true
    }
    return false
  }

  private matchParen(expected: '(' | ')'): boolean {
    if (this.checkType('paren') && this.peek().value === expected) {
      this.index += 1
      return true
    }
    return false
  }

  private matchComma(): boolean {
    if (this.checkType('comma')) {
      this.index += 1
      return true
    }
    return false
  }

  private checkParen(expected: '(' | ')'): boolean {
    return this.checkType('paren') && this.peek().value === expected
  }

  private checkType(type: MathToken['type']): boolean {
    if (this.isAtEnd()) return false
    return this.peek().type === type
  }

  private peek(): MathToken {
    return this.tokens[this.index]
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
