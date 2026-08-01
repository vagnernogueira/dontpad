import { lstat, open, unlink } from 'node:fs/promises'
import path from 'node:path'

export const MAX_BINARY_DOWNLOAD_BYTES = 256 * 1024 * 1024
export const MAX_CHECKSUM_DOWNLOAD_BYTES = 8 * 1024

const OFFICIAL_RELEASE_HOST = 'github.com'
const TRUSTED_REDIRECT_HOSTS = new Set([
  'github.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
])
const RELEASE_PATH = /^\/vagnernogueira\/dontpad\/releases\/download\/(cli-v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*))\/([A-Za-z0-9][A-Za-z0-9._-]{0,127})$/

export interface GitHubReleaseDownloadOptions {
  fetch?: typeof globalThis.fetch
  /** Can only lower the built-in safety limit for the selected asset kind. */
  maxBytes?: number
}

export interface CanonicalReleaseAsset {
  assetName: string
  tag: string
  url: URL
}

function resolveMaxBytes(requested: number | undefined, ceiling: number): number {
  if (requested === undefined) {
    return ceiling
  }

  if (!Number.isSafeInteger(requested) || requested < 1) {
    throw new Error('Release download byte limit must be a positive safe integer.')
  }

  return Math.min(requested, ceiling)
}

/**
 * Only accepts a fully canonical public asset URL. Query strings, fragments,
 * credentials, alternate ports, encoded path tricks, and arbitrary release
 * repositories are all rejected before a request is sent.
 */
export function parseCanonicalReleaseAssetUrl(rawUrl: string): CanonicalReleaseAsset {
  let url: URL

  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('Release asset URL is invalid.')
  }

  const match = RELEASE_PATH.exec(url.pathname)
  if (
    url.protocol !== 'https:' ||
    url.hostname !== OFFICIAL_RELEASE_HOST ||
    url.port !== '' ||
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== '' ||
    !match
  ) {
    throw new Error('Refusing a release asset URL outside the official Dontpad GitHub release path.')
  }

  const [, tag, , , , assetName] = match
  const canonical = `https://${OFFICIAL_RELEASE_HOST}/vagnernogueira/dontpad/releases/download/${tag}/${assetName}`
  if (url.toString() !== canonical) {
    throw new Error('Release asset URL must use the canonical official Dontpad release spelling.')
  }

  return { assetName, tag, url }
}

function assertExpectedReleaseAsset(
  rawUrl: string,
  expectedTag: string,
  expectedAssetName: string,
): void {
  const asset = parseCanonicalReleaseAssetUrl(rawUrl)
  if (asset.tag !== expectedTag || asset.assetName !== expectedAssetName) {
    throw new Error(`Release asset URL does not match the expected ${expectedAssetName} artifact.`)
  }
}

function assertFinalDownloadUrl(rawUrl: string): void {
  let url: URL

  try {
    url = new URL(rawUrl)
  } catch {
    throw new Error('Release download redirected to an invalid URL.')
  }

  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    !TRUSTED_REDIRECT_HOSTS.has(url.hostname)
  ) {
    throw new Error('Release download redirected outside HTTPS GitHub release infrastructure.')
  }
}

function parseContentLength(response: Response, maxBytes: number): void {
  const header = response.headers.get('content-length')
  if (!header) {
    return
  }

  if (!/^\d+$/.test(header)) {
    throw new Error('Release asset returned an invalid Content-Length header.')
  }

  const length = Number(header)
  if (!Number.isSafeInteger(length) || length > maxBytes) {
    throw new Error(`Release asset exceeds the ${maxBytes} byte safety limit.`)
  }
}

async function assertFreshDestination(destination: string): Promise<void> {
  if (!path.isAbsolute(destination) || path.resolve(destination) !== destination) {
    throw new Error('Release download destination must be an absolute normalized path.')
  }

  const parent = path.dirname(destination)
  let parentDetails
  try {
    parentDetails = await lstat(parent)
  } catch {
    throw new Error(`Release download destination parent does not exist: ${parent}.`)
  }

  if (parentDetails.isSymbolicLink() || !parentDetails.isDirectory()) {
    throw new Error('Release download destination parent must be a real directory, not a symbolic link.')
  }

  try {
    await lstat(destination)
    throw new Error(`Refusing to overwrite existing release download destination: ${destination}.`)
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return
    }

    throw error
  }
}

async function fetchReleaseAsset(
  rawUrl: string,
  options: GitHubReleaseDownloadOptions,
): Promise<Response> {
  const asset = parseCanonicalReleaseAssetUrl(rawUrl)
  const fetchImpl = options.fetch ?? globalThis.fetch
  let response: Response

  try {
    response = await fetchImpl(asset.url, {
      headers: { Accept: 'application/octet-stream' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to download release asset: ${message}`)
  }

  if (!response.ok) {
    throw new Error(`Release asset download failed with HTTP ${response.status}: ${response.statusText}.`)
  }

  assertFinalDownloadUrl(response.url || asset.url.toString())
  return response
}

async function cancelReader(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<void> {
  await reader.cancel().catch(() => undefined)
}

/**
 * Downloads one canonical release asset into a fresh private staging path.
 * The token-bearing GitHub API is deliberately not used here, so redirect
 * targets can never receive credentials.
 */
export async function downloadGitHubReleaseAsset(
  url: string,
  destination: string,
  options: GitHubReleaseDownloadOptions = {},
): Promise<void> {
  await assertFreshDestination(destination)
  const maxBytes = resolveMaxBytes(options.maxBytes, MAX_BINARY_DOWNLOAD_BYTES)
  const response = await fetchReleaseAsset(url, options)
  parseContentLength(response, maxBytes)

  if (!response.body) {
    throw new Error('Release asset response has no body.')
  }

  const reader = response.body.getReader()
  let handle: Awaited<ReturnType<typeof open>> | undefined
  let openedDestination = false
  let written = 0

  try {
    handle = await open(destination, 'wx', 0o700)
    openedDestination = true

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      written += value.byteLength
      if (written > maxBytes) {
        throw new Error(`Release asset exceeds the ${maxBytes} byte safety limit.`)
      }

      const chunk = Buffer.from(value)
      let offset = 0
      while (offset < chunk.byteLength) {
        const { bytesWritten } = await handle.write(chunk, offset)
        offset += bytesWritten
      }
    }
  } catch (error) {
    await cancelReader(reader)
    await handle?.close().catch(() => undefined)
    if (openedDestination) {
      await unlink(destination).catch(() => undefined)
    }
    throw error
  }

  await handle.close()
}

export async function downloadGitHubReleaseText(
  url: string,
  options: GitHubReleaseDownloadOptions = {},
): Promise<string> {
  const maxBytes = resolveMaxBytes(options.maxBytes, MAX_CHECKSUM_DOWNLOAD_BYTES)
  const response = await fetchReleaseAsset(url, options)
  parseContentLength(response, maxBytes)

  if (!response.body) {
    throw new Error('Release asset response has no body.')
  }

  const reader = response.body.getReader()
  const chunks: Buffer[] = []
  let received = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      received += value.byteLength
      if (received > maxBytes) {
        throw new Error(`Release asset exceeds the ${maxBytes} byte safety limit.`)
      }
      chunks.push(Buffer.from(value))
    }
  } catch (error) {
    await cancelReader(reader)
    throw error
  }

  return Buffer.concat(chunks).toString('utf8')
}

/** Validates a caller-provided release record without performing I/O. */
export function assertCanonicalReleaseArtifacts(
  tag: string,
  binaryAssetName: string,
  binaryUrl: string,
  checksumUrl: string,
): void {
  assertExpectedReleaseAsset(binaryUrl, tag, binaryAssetName)
  assertExpectedReleaseAsset(checksumUrl, tag, `${binaryAssetName}.sha256`)
}
