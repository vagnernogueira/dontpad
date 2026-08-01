import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { downloadGitHubReleaseAsset, downloadGitHubReleaseText } from '../utils/download'

const temporaryDirectories: string[] = []
const RELEASE_URL =
    'https://github.com/vagnernogueira/dontpad/releases/download/cli-v0.2.0/dontpad-linux-x64'

async function temporaryDirectory(): Promise<string> {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'dontpad-download-'))
    temporaryDirectories.push(directory)
    return directory
}

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map((directory) => rm(directory, { recursive: true, force: true }))
    )
})

describe('secure release asset download', () => {
    it('writes a canonical GitHub release asset without forwarding credentials', async () => {
        const directory = await temporaryDirectory()
        const destination = path.join(directory, 'dontpad')
        const fetch = vi.fn(async () => new Response('binary content', { status: 200 }))

        await downloadGitHubReleaseAsset(RELEASE_URL, destination, {
            fetch: fetch as unknown as typeof globalThis.fetch,
        })

        await expect(readFile(destination, 'utf8')).resolves.toBe('binary content')
        const [, init] = fetch.mock.calls[0]
        expect(init.headers).toEqual({ Accept: 'application/octet-stream' })
        expect(init.redirect).toBe('follow')
        expect(init.headers).not.toHaveProperty('Authorization')
    })

    it('refuses URLs outside the official HTTPS Dontpad release path before any request', async () => {
        const fetch = vi.fn()

        await expect(
            downloadGitHubReleaseAsset('https://example.test/dontpad', '/tmp/never-created', {
                fetch: fetch as unknown as typeof globalThis.fetch,
            })
        ).rejects.toThrow('outside the official Dontpad GitHub release path')
        expect(fetch).not.toHaveBeenCalled()
    })

    it('enforces a byte limit for both binary and checksum downloads', async () => {
        const directory = await temporaryDirectory()
        const binaryDestination = path.join(directory, 'dontpad')
        const fetch = vi.fn(async () => new Response('12345', { status: 200 }))

        await expect(
            downloadGitHubReleaseAsset(RELEASE_URL, binaryDestination, {
                fetch: fetch as unknown as typeof globalThis.fetch,
                maxBytes: 4,
            })
        ).rejects.toThrow('safety limit')
        await expect(
            downloadGitHubReleaseText(`${RELEASE_URL}.sha256`, {
                fetch: fetch as unknown as typeof globalThis.fetch,
                maxBytes: 4,
            })
        ).rejects.toThrow('safety limit')
    })

    it('refuses an existing destination before sending a request', async () => {
        const directory = await temporaryDirectory()
        const destination = path.join(directory, 'dontpad')
        await writeFile(destination, 'do not overwrite', 'utf8')
        const fetch = vi.fn()

        await expect(
            downloadGitHubReleaseAsset(RELEASE_URL, destination, {
                fetch: fetch as unknown as typeof globalThis.fetch,
            })
        ).rejects.toThrow('Refusing to overwrite existing release download destination')
        expect(fetch).not.toHaveBeenCalled()
        await expect(readFile(destination, 'utf8')).resolves.toBe('do not overwrite')
    })

    it('rejects a redirect outside the narrow GitHub release host allowlist', async () => {
        const directory = await temporaryDirectory()
        const destination = path.join(directory, 'dontpad')
        const response = new Response('binary content', { status: 200 })
        Object.defineProperty(response, 'url', { value: 'https://example.test/redirected-binary' })
        const fetch = vi.fn(async () => response)

        await expect(
            downloadGitHubReleaseAsset(RELEASE_URL, destination, {
                fetch: fetch as unknown as typeof globalThis.fetch,
            })
        ).rejects.toThrow('redirected outside HTTPS GitHub release infrastructure')
        await expect(readFile(destination, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
    })
})
