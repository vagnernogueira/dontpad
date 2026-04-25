import { Readable } from 'node:stream'

import { describe, expect, it } from 'vitest'

import { resolveOptionalContentInput, resolveRequiredContentInput } from '../content-source'

describe('content source resolution', () => {
  it('prefers explicit argument content', async () => {
    await expect(resolveRequiredContentInput({ content: '# Title\n' })).resolves.toEqual({
      content: '# Title\n',
      source: 'argument',
    })
  })

  it('reads piped stdin when available', async () => {
    const stdinStream = Readable.from(['# From stdin\n']) as Readable & { isTTY?: boolean }
    stdinStream.isTTY = false

    await expect(resolveOptionalContentInput({ stdinStream })).resolves.toEqual({
      content: '# From stdin\n',
      source: 'stdin',
    })
  })

  it('rejects multiple explicit content sources', async () => {
    await expect(
      resolveRequiredContentInput({
        content: 'one',
        stdin: true,
      }),
    ).rejects.toThrow('Use only one content source: --content, --file, or --stdin.')
  })
})