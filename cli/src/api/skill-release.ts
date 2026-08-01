import { VERSION } from '../version'

const GITHUB_API = 'https://api.github.com'
const GITHUB_WEB = 'https://github.com'
const REPO = 'vagnernogueira/dontpad'
const SKILL_ASSET_NAME = 'skills.tar.gz'
const SKILL_CHECKSUM_ASSET_NAME = 'skills.tar.gz.sha256'
const REQUEST_TIMEOUT_MS = 5_000
const STABLE_CLI_TAG = /^cli-v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

const USER_AGENT = `dontpad-cli-skill/${VERSION}`

interface GitHubAsset {
  name?: unknown
  url?: unknown
}

interface GitHubRelease {
  tag_name?: unknown
  assets?: unknown
  draft?: unknown
  prerelease?: unknown
}

export class SkillReleaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SkillReleaseError'
  }
}

export class SkillRateLimitedError extends SkillReleaseError {
  constructor() {
    super('GitHub API rate limited. Try again later or set GITHUB_TOKEN.')
    this.name = 'SkillRateLimitedError'
  }
}

export interface SkillReleaseCheck {
  /** Release tag with the `cli-v` prefix stripped, e.g. `0.2.0`. */
  latestVersion: string
  /** Original release tag, e.g. `cli-v0.2.0`. */
  tag: string
  releaseUrl: string
  downloadUrl: string
  /** Retained for compatibility; release downloads deliberately do not use it. */
  downloadApiUrl: string
  checksumUrl: string
  /** Retained for compatibility; release downloads deliberately do not use it. */
  checksumApiUrl: string
}

interface StableTag {
  tag: string
  version: string
  parts: [number, number, number]
}

function getAuthHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

function parseStableTag(tag: string): StableTag | null {
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

function canonicalReleaseUrl(tag: string): string {
  return `${GITHUB_WEB}/${REPO}/releases/tag/${encodeURIComponent(tag)}`
}

function canonicalAssetUrl(tag: string, assetName: string): string {
  return `${GITHUB_WEB}/${REPO}/releases/download/${encodeURIComponent(tag)}/${encodeURIComponent(assetName)}`
}

async function fetchJson(url: string): Promise<unknown> {
  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': USER_AGENT,
        ...getAuthHeaders(),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new SkillReleaseError(`Unable to query GitHub releases API: ${message}`)
  }

  if (response.status === 403 || response.status === 429) {
    throw new SkillRateLimitedError()
  }

  if (!response.ok) {
    throw new SkillReleaseError(
      `GitHub API returned HTTP ${response.status}: ${response.statusText}`,
    )
  }

  try {
    return await response.json()
  } catch {
    throw new SkillReleaseError('GitHub API returned invalid JSON.')
  }
}

/**
 * Selects the newest published stable CLI release and builds artifact URLs
 * locally. Browser-download URLs supplied by API payloads are never trusted.
 */
export async function fetchLatestSkillRelease(): Promise<SkillReleaseCheck> {
  const payload = await fetchJson(`${GITHUB_API}/repos/${REPO}/releases?per_page=100`)
  if (!Array.isArray(payload)) {
    throw new SkillReleaseError('Unexpected response shape from GitHub releases API.')
  }

  let latest: { release: GitHubRelease; tag: StableTag } | null = null
  for (const candidate of payload) {
    if (!candidate || typeof candidate !== 'object') {
      continue
    }

    const release = candidate as GitHubRelease
    if (release.draft === true || release.prerelease === true || typeof release.tag_name !== 'string') {
      continue
    }

    const tag = parseStableTag(release.tag_name)
    if (tag && (!latest || compareStableTags(tag, latest.tag) > 0)) {
      latest = { release, tag }
    }
  }

  if (!latest) {
    throw new SkillReleaseError(
      'No published stable Dontpad CLI release tagged cli-vX.Y.Z was found on vagnernogueira/dontpad.',
    )
  }

  if (!Array.isArray(latest.release.assets)) {
    throw new SkillReleaseError(`Release ${latest.tag.tag} has an invalid assets list.`)
  }

  const assets = latest.release.assets.filter(
    (asset): asset is GitHubAsset => typeof asset === 'object' && asset !== null,
  )
  const skillAsset = assets.find((asset) => asset.name === SKILL_ASSET_NAME)
  const checksumAsset = assets.find((asset) => asset.name === SKILL_CHECKSUM_ASSET_NAME)

  if (!skillAsset || !checksumAsset) {
    throw new SkillReleaseError(
      `Release ${latest.tag.tag} must contain both ${SKILL_ASSET_NAME} and ${SKILL_CHECKSUM_ASSET_NAME}.`,
    )
  }

  return {
    latestVersion: latest.tag.version,
    tag: latest.tag.tag,
    releaseUrl: canonicalReleaseUrl(latest.tag.tag),
    downloadUrl: canonicalAssetUrl(latest.tag.tag, SKILL_ASSET_NAME),
    downloadApiUrl: typeof skillAsset.url === 'string' ? skillAsset.url : '',
    checksumUrl: canonicalAssetUrl(latest.tag.tag, SKILL_CHECKSUM_ASSET_NAME),
    checksumApiUrl: typeof checksumAsset.url === 'string' ? checksumAsset.url : '',
  }
}
