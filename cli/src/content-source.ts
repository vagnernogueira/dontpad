import { readFile } from 'node:fs/promises'
import type { Readable } from 'node:stream'

export interface ResolveContentOptions {
  content?: string
  file?: string
  stdin?: boolean
  stdinStream?: Pick<Readable, 'on'> & { isTTY?: boolean }
}

export interface ResolvedContentInput {
  content: string
  source: 'argument' | 'file' | 'stdin'
}

async function readStream(stream: Pick<Readable, 'on'>): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []

    stream.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    stream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    stream.on('error', reject)
  })
}

function isReadableStdinAvailable(stream: ResolveContentOptions['stdinStream']): boolean {
  return !!stream && stream.isTTY !== true
}

export async function resolveRequiredContentInput(
  options: ResolveContentOptions,
): Promise<ResolvedContentInput> {
  const resolved = await resolveOptionalContentInput(options)

  if (!resolved) {
    throw new Error('Provide Markdown with --content, --file, --stdin, or pipe content through stdin.')
  }

  return resolved
}

export async function resolveOptionalContentInput(
  options: ResolveContentOptions,
): Promise<ResolvedContentInput | null> {
  const stdinStream = options.stdinStream ?? process.stdin
  const explicitSourceCount = [
    options.content !== undefined,
    options.file !== undefined,
    !!options.stdin,
  ].filter(Boolean).length

  if (explicitSourceCount > 1) {
    throw new Error('Use only one content source: --content, --file, or --stdin.')
  }

  if (options.content !== undefined) {
    return { content: options.content, source: 'argument' }
  }

  if (options.file !== undefined) {
    return {
      content: await readFile(options.file, 'utf8'),
      source: 'file',
    }
  }

  if (options.stdin || isReadableStdinAvailable(stdinStream)) {
    return {
      content: await readStream(stdinStream),
      source: 'stdin',
    }
  }

  return null
}