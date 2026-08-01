import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { getConfigDirectoryPath } from '../config'

export interface UpdateCache {
    version: 1
    lastCheck: string | null
    latestVersion: string | null
    latestReleaseUrl: string | null
}

export interface UpdateCacheAccessOptions {
    cacheFilePath?: string
    configDirectoryPath?: string
    env?: NodeJS.ProcessEnv
}

const UPDATE_CACHE_FILE_NAME = 'update-check.json'

const EMPTY_UPDATE_CACHE: UpdateCache = {
    version: 1,
    lastCheck: null,
    latestVersion: null,
    latestReleaseUrl: null,
}

export function getUpdateCachePath(env: NodeJS.ProcessEnv = process.env): string {
    return path.join(getConfigDirectoryPath(env), UPDATE_CACHE_FILE_NAME)
}

function resolveCacheFilePath(options: UpdateCacheAccessOptions = {}): string {
    if (options.cacheFilePath) {
        return options.cacheFilePath
    }

    if (options.configDirectoryPath) {
        return path.join(options.configDirectoryPath, UPDATE_CACHE_FILE_NAME)
    }

    return getUpdateCachePath(options.env)
}

function isValidTimestamp(value: unknown): value is string {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function parseUpdateCache(rawCache: string): UpdateCache {
    const parsed: unknown = JSON.parse(rawCache)

    if (!parsed || typeof parsed !== 'object') {
        return { ...EMPTY_UPDATE_CACHE }
    }

    const candidate = parsed as Partial<UpdateCache>
    if (candidate.version !== 1) {
        return { ...EMPTY_UPDATE_CACHE }
    }

    return {
        version: 1,
        lastCheck:
            candidate.lastCheck === null || isValidTimestamp(candidate.lastCheck)
                ? candidate.lastCheck
                : null,
        latestVersion: typeof candidate.latestVersion === 'string' ? candidate.latestVersion : null,
        latestReleaseUrl:
            typeof candidate.latestReleaseUrl === 'string' ? candidate.latestReleaseUrl : null,
    }
}

/** A damaged cache must never prevent regular CLI commands from running. */
export async function loadUpdateCache(
    options: UpdateCacheAccessOptions = {}
): Promise<UpdateCache> {
    const cacheFilePath = resolveCacheFilePath(options)

    try {
        return parseUpdateCache(await readFile(cacheFilePath, 'utf8'))
    } catch {
        return { ...EMPTY_UPDATE_CACHE }
    }
}

export async function saveUpdateCache(
    cache: UpdateCache,
    options: UpdateCacheAccessOptions = {}
): Promise<string> {
    const cacheFilePath = resolveCacheFilePath(options)
    const temporaryPath = `${cacheFilePath}.tmp-${process.pid}-${Date.now()}`
    const normalizedCache: UpdateCache = {
        version: 1,
        lastCheck:
            cache.lastCheck === null || isValidTimestamp(cache.lastCheck) ? cache.lastCheck : null,
        latestVersion: typeof cache.latestVersion === 'string' ? cache.latestVersion : null,
        latestReleaseUrl:
            typeof cache.latestReleaseUrl === 'string' ? cache.latestReleaseUrl : null,
    }

    await mkdir(path.dirname(cacheFilePath), { recursive: true })
    await writeFile(temporaryPath, `${JSON.stringify(normalizedCache, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, cacheFilePath)

    return cacheFilePath
}

export function shouldCheckUpdate(
    cache: UpdateCache,
    intervalHours: number,
    now: number = Date.now()
): boolean {
    if (!Number.isInteger(intervalHours) || intervalHours < 1 || !Number.isFinite(now)) {
        return false
    }

    if (!cache.lastCheck) {
        return true
    }

    const lastCheck = Date.parse(cache.lastCheck)
    if (Number.isNaN(lastCheck)) {
        return true
    }

    // A future timestamp is treated as fresh to avoid a clock skew causing a
    // request storm every time the command starts.
    if (lastCheck > now) {
        return false
    }

    return now - lastCheck >= intervalHours * 60 * 60 * 1_000
}
