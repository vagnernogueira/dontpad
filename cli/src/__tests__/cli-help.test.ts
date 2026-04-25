import { describe, expect, it } from 'vitest'

import { buildCli } from '../cli'

describe('CLI help', () => {
  it('documents the business commands and examples in root help', () => {
    const help = buildCli().helpInformation()

    expect(help).toContain('get')
    expect(help).toContain('update')
    expect(help).toContain('create')
    expect(help).toContain('dontpad get me/todo')
    expect(help).toContain('Yjs WebSocket')
  })
})