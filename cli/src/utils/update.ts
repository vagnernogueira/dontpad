import path from 'node:path'

export interface RuntimePlatform {
    platform: NodeJS.Platform
    arch: string
}

const SUPPORTED_PLATFORM_ASSETS: Record<string, Record<string, string>> = {
    linux: { x64: 'linux-x64' },
    darwin: { arm64: 'darwin-arm64' },
    win32: { x64: 'win-x64' },
}

export class UnsupportedUpdatePlatformError extends Error {
    constructor(platform: string, arch: string) {
        super(
            `Automatic updates are unavailable for ${platform}-${arch}. ` +
                'Supported standalone binaries are linux-x64, darwin-arm64, and win-x64.'
        )
        this.name = 'UnsupportedUpdatePlatformError'
    }
}

export class UnsafeSelfUpdateError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UnsafeSelfUpdateError'
    }
}

/** Resolves the suffix used by release assets, e.g. `linux-x64`. */
export function getPlatformAssetName(runtime: RuntimePlatform = process): string {
    const platformAssets = SUPPORTED_PLATFORM_ASSETS[runtime.platform]
    const assetName = platformAssets?.[runtime.arch]

    if (!assetName) {
        throw new UnsupportedUpdatePlatformError(runtime.platform, runtime.arch)
    }

    return assetName
}

export function getBinaryAssetName(runtime: RuntimePlatform = process): string {
    return `dontpad-${getPlatformAssetName(runtime)}`
}

interface ParsedVersion {
    major: number
    minor: number
    patch: number
}

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

function parseVersion(version: string): ParsedVersion {
    const normalizedVersion = version.replace(/^v/, '')
    const match = SEMVER_PATTERN.exec(normalizedVersion)

    if (!match) {
        throw new Error(`Expected a stable semantic version (x.y.z), received: ${version}`)
    }

    return {
        major: Number(match[1]),
        minor: Number(match[2]),
        patch: Number(match[3]),
    }
}

/** Compares stable x.y.z versions, returning 1 when a is newer than b. */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
    const parsedA = parseVersion(a)
    const parsedB = parseVersion(b)

    for (const key of ['major', 'minor', 'patch'] as const) {
        if (parsedA[key] > parsedB[key]) {
            return 1
        }
        if (parsedA[key] < parsedB[key]) {
            return -1
        }
    }

    return 0
}

/** Legacy-compatible spelling used by the sibling CLI projects. */
export const cmpSemver = compareVersions

/**
 * A process launched through npm runs a Node executable and must never replace
 * that executable. Compiled bun/nexe binaries use their own executable path.
 */
export function isStandaloneBinary(executablePath: string = process.execPath): boolean {
    const executableName = path.basename(executablePath).toLowerCase()

    return !['node', 'node.exe', 'nodejs', 'nodejs.exe', 'iojs', 'iojs.exe'].includes(
        executableName
    )
}

/**
 * Windows keeps the executing .exe locked, so replacing it in-process cannot
 * provide the promised atomic replacement and rollback guarantees.
 */
export function assertSafeSelfUpdateRuntime(
    runtime: RuntimePlatform = process,
    executablePath: string = process.execPath
): void {
    getPlatformAssetName(runtime)

    if (!isStandaloneBinary(executablePath)) {
        throw new UnsafeSelfUpdateError(
            'Automatic self-update requires the standalone Dontpad binary. ' +
                'For an npm installation, run `npm update -g dontpad-cli` instead.'
        )
    }

    if (runtime.platform === 'win32') {
        throw new UnsafeSelfUpdateError(
            'Automatic self-update is disabled on Windows because a running .exe cannot be atomically replaced. ' +
                'Download the verified win-x64 release asset manually after exiting Dontpad.'
        )
    }
}
