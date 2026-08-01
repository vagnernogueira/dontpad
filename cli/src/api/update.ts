import { getBinaryAssetName, getPlatformAssetName, type RuntimePlatform } from '../utils/update'
import { VERSION } from '../version'

const GITHUB_API = 'https://api.github.com'
const GITHUB_WEB = 'https://github.com'
const REPOSITORY = 'vagnernogueira/dontpad'
const CLI_TAG_PREFIX = 'cli-v'
const REQUEST_TIMEOUT_MS = 5_000

interface GitHubRelease {
    tag_name?: unknown
    draft?: unknown
    prerelease?: unknown
    assets?: unknown
}

interface GitHubAsset {
    name?: unknown
}

export interface CliReleaseCheck {
    /** Stable release version without the cli-v tag prefix. */
    latestVersion: string
    /** Exact selected tag, e.g. cli-v0.2.0. */
    tag: string
    releaseUrl: string
    binaryAssetName: string
    binaryUrl: string
    checksumAssetName: string
    checksumUrl: string
}

export interface ReleaseApiOptions {
    fetch?: typeof globalThis.fetch
    token?: string
}

export class UpdateReleaseError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UpdateReleaseError'
    }
}

export class UpdateRateLimitedError extends UpdateReleaseError {
    constructor() {
        super('GitHub Releases API rate limited the update check. Try again later.')
        this.name = 'UpdateRateLimitedError'
    }
}

interface StableTag {
    tag: string
    version: string
    parts: [number, number, number]
}

const STABLE_CLI_TAG = /^cli-v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

function parseStableCliTag(tag: string): StableTag | null {
    const match = STABLE_CLI_TAG.exec(tag)

    if (!match) {
        return null
    }

    return {
        tag,
        version: `${match[1]}.${match[2]}.${match[3]}`,
        parts: [Number(match[1]), Number(match[2]), Number(match[3])],
    }
}

function compareStableTags(a: StableTag, b: StableTag): number {
    for (let index = 0; index < a.parts.length; index += 1) {
        if (a.parts[index] !== b.parts[index]) {
            return a.parts[index] - b.parts[index]
        }
    }

    return 0
}

function getRequestHeaders(token?: string): Record<string, string> {
    return {
        Accept: 'application/vnd.github+json',
        'User-Agent': `dontpad-cli-updater/${VERSION}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

function canonicalReleaseUrl(tag: string): string {
    return `${GITHUB_WEB}/${REPOSITORY}/releases/tag/${encodeURIComponent(tag)}`
}

function canonicalAssetUrl(tag: string, assetName: string): string {
    return `${GITHUB_WEB}/${REPOSITORY}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`
}

async function fetchReleases(options: ReleaseApiOptions): Promise<GitHubRelease[]> {
    const fetchImpl = options.fetch ?? globalThis.fetch
    const token = options.token ?? process.env.GITHUB_TOKEN
    let response: Response

    try {
        response = await fetchImpl(`${GITHUB_API}/repos/${REPOSITORY}/releases?per_page=100`, {
            headers: getRequestHeaders(token),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new UpdateReleaseError(`Unable to query GitHub Releases API: ${message}`)
    }

    if (response.status === 403 || response.status === 429) {
        throw new UpdateRateLimitedError()
    }

    if (!response.ok) {
        throw new UpdateReleaseError(
            `GitHub Releases API returned HTTP ${response.status}: ${response.statusText || 'unknown error'}.`
        )
    }

    let payload: unknown
    try {
        payload = await response.json()
    } catch {
        throw new UpdateReleaseError('GitHub Releases API returned invalid JSON.')
    }

    if (!Array.isArray(payload)) {
        throw new UpdateReleaseError('GitHub Releases API returned an unexpected response shape.')
    }

    return payload.filter(
        (release): release is GitHubRelease => typeof release === 'object' && release !== null
    )
}

/**
 * Selects the newest published stable `cli-vX.Y.Z` release. We intentionally
 * list releases instead of using /releases/latest: Dontpad also reserves v*
 * tags for app-wide releases, which must never be treated as CLI binaries.
 */
export async function fetchLatestCliRelease(
    runtime: RuntimePlatform = process,
    options: ReleaseApiOptions = {}
): Promise<CliReleaseCheck> {
    const platformAssetName = getPlatformAssetName(runtime)
    const binaryAssetName = getBinaryAssetName(runtime)
    const checksumAssetName = `${binaryAssetName}.sha256`
    const releases = await fetchReleases(options)

    let latest: { release: GitHubRelease; tag: StableTag } | null = null

    for (const release of releases) {
        if (
            release.draft === true ||
            release.prerelease === true ||
            typeof release.tag_name !== 'string'
        ) {
            continue
        }

        const parsedTag = parseStableCliTag(release.tag_name)
        if (!parsedTag) {
            continue
        }

        if (!latest || compareStableTags(parsedTag, latest.tag) > 0) {
            latest = { release, tag: parsedTag }
        }
    }

    if (!latest) {
        throw new UpdateReleaseError(
            `No published stable Dontpad CLI release tagged ${CLI_TAG_PREFIX}x.y.z was found.`
        )
    }

    if (!Array.isArray(latest.release.assets)) {
        throw new UpdateReleaseError(`Release ${latest.tag.tag} has an invalid assets list.`)
    }

    const assetNames = latest.release.assets
        .filter((asset): asset is GitHubAsset => typeof asset === 'object' && asset !== null)
        .map((asset) => asset.name)

    if (!assetNames.includes(binaryAssetName)) {
        throw new UpdateReleaseError(
            `Release ${latest.tag.tag} has no ${binaryAssetName} binary for ${platformAssetName}.`
        )
    }

    if (!assetNames.includes(checksumAssetName)) {
        throw new UpdateReleaseError(
            `Release ${latest.tag.tag} has no mandatory SHA-256 asset ${checksumAssetName}.`
        )
    }

    return {
        latestVersion: latest.tag.version,
        tag: latest.tag.tag,
        releaseUrl: canonicalReleaseUrl(latest.tag.tag),
        binaryAssetName,
        binaryUrl: canonicalAssetUrl(latest.tag.tag, binaryAssetName),
        checksumAssetName,
        checksumUrl: canonicalAssetUrl(latest.tag.tag, checksumAssetName),
    }
}

/** Compatibility-oriented names used by the sibling CLI projects. */
export const fetchLatestRelease = fetchLatestCliRelease
export const checkLatestVersion = fetchLatestCliRelease
