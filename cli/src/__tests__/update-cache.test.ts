import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
    getUpdateCachePath,
    loadUpdateCache,
    saveUpdateCache,
    shouldCheckUpdate,
} from '../utils/update-cache'

const temporaryDirectories: string[] = []

async function temporaryDirectory(): Promise<string> {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'dontpad-update-cache-'))
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

describe('update check cache', () => {
    it('uses the shared Dontpad XDG config directory', () => {
        expect(getUpdateCachePath({ XDG_CONFIG_HOME: '/tmp/config-home' })).toBe(
            '/tmp/config-home/dontpad/update-check.json'
        )
    })

    it('atomically persists and reloads a successful check', async () => {
        const directory = await temporaryDirectory()
        const cacheFilePath = path.join(directory, 'update-check.json')

        await saveUpdateCache(
            {
                version: 1,
                lastCheck: '2026-08-01T12:00:00.000Z',
                latestVersion: '0.2.0',
                latestReleaseUrl:
                    'https://github.com/vagnernogueira/dontpad/releases/tag/cli-v0.2.0',
            },
            { cacheFilePath }
        )

        await expect(loadUpdateCache({ cacheFilePath })).resolves.toEqual({
            version: 1,
            lastCheck: '2026-08-01T12:00:00.000Z',
            latestVersion: '0.2.0',
            latestReleaseUrl: 'https://github.com/vagnernogueira/dontpad/releases/tag/cli-v0.2.0',
        })
        await expect(readFile(cacheFilePath, 'utf8')).resolves.toContain('"latestVersion": "0.2.0"')
    })

    it('fails open to an empty cache when cache JSON is malformed', async () => {
        const directory = await temporaryDirectory()
        const cacheFilePath = path.join(directory, 'update-check.json')
        await writeFile(cacheFilePath, '{not-json', 'utf8')

        await expect(loadUpdateCache({ cacheFilePath })).resolves.toEqual({
            version: 1,
            lastCheck: null,
            latestVersion: null,
            latestReleaseUrl: null,
        })
    })

    it('observes the configured interval and avoids a clock-skew request storm', () => {
        const now = Date.parse('2026-08-01T12:00:00.000Z')
        const cache = {
            version: 1 as const,
            lastCheck: new Date(now - 24 * 60 * 60 * 1_000).toISOString(),
            latestVersion: '0.2.0',
            latestReleaseUrl: null,
        }

        expect(shouldCheckUpdate(cache, 24, now)).toBe(true)
        expect(
            shouldCheckUpdate({ ...cache, lastCheck: new Date(now - 1).toISOString() }, 24, now)
        ).toBe(false)
        expect(
            shouldCheckUpdate({ ...cache, lastCheck: new Date(now + 1).toISOString() }, 24, now)
        ).toBe(false)
        expect(shouldCheckUpdate(cache, 0, now)).toBe(false)
    })
})
