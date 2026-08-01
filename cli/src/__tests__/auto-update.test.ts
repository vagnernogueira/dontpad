import { describe, expect, it, vi } from 'vitest'

import type { CliReleaseCheck } from '../api/update'
import type { DontpadCliConfig } from '../config'
import { runBackgroundUpdateCheck } from '../utils/auto-update'
import type { UpdateCache } from '../utils/update-cache'

const config: DontpadCliConfig = {
    version: 1,
    baseUrl: 'https://dontpad.example.test',
    autoUpdateEnabled: true,
    autoUpdateInterval: 24,
}

const emptyCache: UpdateCache = {
    version: 1,
    lastCheck: null,
    latestVersion: null,
    latestReleaseUrl: null,
}

const release: CliReleaseCheck = {
    latestVersion: '0.2.0',
    tag: 'cli-v0.2.0',
    releaseUrl: 'https://github.com/vagnernogueira/dontpad/releases/tag/cli-v0.2.0',
    binaryAssetName: 'dontpad-linux-x64',
    binaryUrl:
        'https://github.com/vagnernogueira/dontpad/releases/download/cli-v0.2.0/dontpad-linux-x64',
    checksumAssetName: 'dontpad-linux-x64.sha256',
    checksumUrl:
        'https://github.com/vagnernogueira/dontpad/releases/download/cli-v0.2.0/dontpad-linux-x64.sha256',
}

describe('background update check', () => {
    it('honors disabled config without reading cache or networking', async () => {
        const loadCache = vi.fn()
        const fetchRelease = vi.fn()

        await runBackgroundUpdateCheck({
            readConfig: async () => ({ ...config, autoUpdateEnabled: false }),
            loadCache,
            fetchRelease,
        })

        expect(loadCache).not.toHaveBeenCalled()
        expect(fetchRelease).not.toHaveBeenCalled()
    })

    it('uses the cache interval, then persists and reports a newer stable release', async () => {
        const fetchRelease = vi.fn(async () => release)
        const saveCache = vi.fn(async () => '/tmp/update-check.json')
        const writeInfo = vi.fn()
        const now = Date.parse('2026-08-01T12:00:00.000Z')

        await runBackgroundUpdateCheck({
            readConfig: async () => config,
            loadCache: async () => emptyCache,
            saveCache,
            fetchRelease,
            currentVersion: '0.1.0',
            now: () => now,
            writeInfo,
        })

        expect(fetchRelease).toHaveBeenCalledOnce()
        expect(saveCache).toHaveBeenCalledWith({
            version: 1,
            lastCheck: '2026-08-01T12:00:00.000Z',
            latestVersion: '0.2.0',
            latestReleaseUrl: release.releaseUrl,
        })
        expect(writeInfo).toHaveBeenCalledWith(expect.stringContaining('dontpad cli update'))
    })

    it('does not make a request when a recent cache entry is still fresh', async () => {
        const fetchRelease = vi.fn()
        const now = Date.parse('2026-08-01T12:00:00.000Z')

        await runBackgroundUpdateCheck({
            readConfig: async () => config,
            loadCache: async () => ({
                ...emptyCache,
                lastCheck: new Date(now - 60 * 60 * 1_000).toISOString(),
            }),
            fetchRelease,
            now: () => now,
        })

        expect(fetchRelease).not.toHaveBeenCalled()
    })

    it('silently absorbs release, cache, and network failures', async () => {
        const writeInfo = vi.fn()

        await expect(
            runBackgroundUpdateCheck({
                readConfig: async () => config,
                loadCache: async () => emptyCache,
                fetchRelease: async () => {
                    throw new Error('offline')
                },
                writeInfo,
            })
        ).resolves.toBeUndefined()
        expect(writeInfo).not.toHaveBeenCalled()
    })
})
