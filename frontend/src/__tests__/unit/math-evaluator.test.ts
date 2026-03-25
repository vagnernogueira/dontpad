import { describe, expect, it } from 'vitest'
import { MathParser, tokenizeMathExpression } from '../../cm-utils/math-evaluator'

describe('math evaluator', () => {
  it('parses arithmetic expressions with precedence', () => {
    const tokens = tokenizeMathExpression('2 + 3 * 4')
    expect(tokens).not.toBeNull()

    const parser = new MathParser(tokens ?? [])
    expect(parser.parseExpression()).toBe(14)
  })

  it('evaluates functions and constants', () => {
    const tokens = tokenizeMathExpression('pow(2, 3) + pi')
    expect(tokens).not.toBeNull()

    const parser = new MathParser(tokens ?? [])
    expect(parser.parseExpression()).toBeCloseTo(8 + Math.PI)
  })

  it('returns null for invalid tokenization', () => {
    expect(tokenizeMathExpression('2 + @')).toBeNull()
  })
})