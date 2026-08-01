import { createReadStream } from 'node:fs'
import {
  chmod,
  copyFile,
  lstat,
  mkdtemp,
  rename,
  rm,
} from 'node:fs/promises'
import { createHash, timingSafeEqual } from 'node:crypto'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

import type { CliReleaseCheck } from '../api/update'
import {
  assertCanonicalReleaseArtifacts,
  downloadGitHubReleaseAsset as defaultDownloadBinary,
  downloadGitHubReleaseText as defaultDownloadText,
  MAX_BINARY_DOWNLOAD_BYTES,
  MAX_CHECKSUM_DOWNLOAD_BYTES,
} from './download'
import { getBinaryAssetName } from './update'

export interface BinaryInstallerDeps {
  downloadBinary?: typeof defaultDownloadBinary
  downloadText?: typeof defaultDownloadText
  verifyChecksum?: (filePath: string, expectedChecksum: string) => Promise<void>
}

export interface BinaryInstallOptions {
  binaryPath: string
  release: CliReleaseCheck
}

export interface BinaryInstallResult {
  binaryPath: string
  backupPath: string
  version: string
}

const STABLE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

function resolveDeps(deps: BinaryInstallerDeps = {}): Required<BinaryInstallerDeps> {
  return {
    downloadBinary: deps.downloadBinary ?? defaultDownloadBinary,
    downloadText: deps.downloadText ?? defaultDownloadText,
    verifyChecksum: deps.verifyChecksum ?? assertChecksum,
  }
}

function assertValidRelease(release: CliReleaseCheck): void {
  if (!STABLE_VERSION.test(release.latestVersion) || release.tag !== `cli-v${release.latestVersion}`) {
    throw new Error('Refusing a release with an invalid stable CLI version or tag.')
  }

  const expectedBinaryAsset = getBinaryAssetName()
  if (
    release.binaryAssetName !== expectedBinaryAsset ||
    release.checksumAssetName !== `${expectedBinaryAsset}.sha256`
  ) {
    throw new Error(`Release artifacts do not match this platform's ${expectedBinaryAsset} binary.`)
  }

  const expectedReleaseUrl = `https://github.com/vagnernogueira/dontpad/releases/tag/${release.tag}`
  if (release.releaseUrl !== expectedReleaseUrl) {
    throw new Error('Release page URL is not the canonical official Dontpad release URL.')
  }

  assertCanonicalReleaseArtifacts(
    release.tag,
    release.binaryAssetName,
    release.binaryUrl,
    release.checksumUrl,
  )
}

function parseSha256(checksumFile: string, expectedAssetName: string): string {
  if (Buffer.byteLength(checksumFile, 'utf8') > MAX_CHECKSUM_DOWNLOAD_BYTES) {
    throw new Error('Release checksum exceeds the safety limit.')
  }

  const lines = checksumFile
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const match = lines.length === 1 ? /^([a-fA-F0-9]{64})\s+\*?([^\s]+)$/.exec(lines[0]) : null

  if (!match || match[2] !== expectedAssetName) {
    throw new Error(
      `Release checksum must contain exactly one SHA-256 for ${expectedAssetName}; received a malformed checksum file.`,
    )
  }

  return match[1].toLowerCase()
}

async function inspectRegularFile(filePath: string, label: string, maxBytes: number): Promise<number> {
  let details
  try {
    details = await lstat(filePath)
  } catch {
    throw new Error(`${label} does not exist at ${filePath}.`)
  }

  if (details.isSymbolicLink() || !details.isFile()) {
    throw new Error(`${label} must be a regular file, not a symbolic link or special file.`)
  }

  if (details.size < 1 || details.size > maxBytes) {
    throw new Error(`${label} must be between 1 and ${maxBytes} bytes.`)
  }

  return details.mode & 0o777
}

async function hashFile(filePath: string): Promise<Buffer> {
  await inspectRegularFile(filePath, 'Checksum verification input', MAX_BINARY_DOWNLOAD_BYTES)
  const hash = createHash('sha256')

  await pipeline(createReadStream(filePath), hash)
  return hash.digest()
}

async function assertChecksum(filePath: string, expectedChecksum: string): Promise<void> {
  if (!/^[a-f0-9]{64}$/i.test(expectedChecksum)) {
    throw new Error('Expected SHA-256 checksum is malformed.')
  }

  const actual = await hashFile(filePath)
  const expected = Buffer.from(expectedChecksum, 'hex')

  if (expected.byteLength !== actual.byteLength || !timingSafeEqual(actual, expected)) {
    throw new Error('SHA-256 verification failed. The downloaded binary was not installed.')
  }
}

function assertAbsoluteNormalizedPath(filePath: string, label: string): void {
  if (!path.isAbsolute(filePath) || path.resolve(filePath) !== filePath) {
    throw new Error(`${label} must be an absolute normalized path.`)
  }
}

async function inspectTarget(binaryPath: string): Promise<number> {
  assertAbsoluteNormalizedPath(binaryPath, 'Binary update target')
  const binaryDirectory = path.dirname(binaryPath)

  let directoryDetails
  try {
    directoryDetails = await lstat(binaryDirectory)
  } catch {
    throw new Error(`Cannot update because the binary directory does not exist: ${binaryDirectory}.`)
  }

  if (directoryDetails.isSymbolicLink() || !directoryDetails.isDirectory()) {
    throw new Error('Refusing to update through a symbolic-link or non-directory binary parent.')
  }

  let details
  try {
    details = await lstat(binaryPath)
  } catch {
    throw new Error(`Cannot update because the current binary does not exist at ${binaryPath}.`)
  }

  if (details.isSymbolicLink()) {
    throw new Error(
      `Refusing to replace symbolic-link target ${binaryPath}. Run the resolved standalone binary directly.`,
    )
  }

  if (!details.isFile()) {
    throw new Error(`Refusing to replace non-file update target ${binaryPath}.`)
  }

  const mode = details.mode & 0o777
  if ((mode & 0o111) === 0) {
    throw new Error(`Refusing to replace non-executable update target ${binaryPath}.`)
  }

  return mode
}

async function inspectBackupPath(backupPath: string): Promise<void> {
  try {
    const details = await lstat(backupPath)
    if (details.isSymbolicLink() || !details.isFile()) {
      throw new Error(`Refusing unsafe existing backup destination ${backupPath}.`)
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return
    }
    throw error
  }
}

async function restoreBackup(
  backupPath: string,
  binaryPath: string,
  mode: number,
  stagingDirectory: string,
): Promise<void> {
  await inspectRegularFile(backupPath, 'Backup binary', MAX_BINARY_DOWNLOAD_BYTES)
  const rollbackPath = path.join(stagingDirectory, 'rollback-binary')
  await copyFile(backupPath, rollbackPath)
  await chmod(rollbackPath, mode)
  await rename(rollbackPath, binaryPath)
}

/**
 * Verifies a bounded, canonical release artifact before and after replacement.
 * Staging and rollback remain below the binary directory, so every rename is
 * same-filesystem and no unverified data reaches the executable destination.
 */
export async function installVerifiedBinary(
  options: BinaryInstallOptions,
  dependencies: BinaryInstallerDeps = {},
): Promise<BinaryInstallResult> {
  const { binaryPath, release } = options
  assertValidRelease(release)

  const mode = await inspectTarget(binaryPath)
  const binaryDirectory = path.dirname(binaryPath)
  const backupPath = `${binaryPath}.bak`
  await inspectBackupPath(backupPath)

  const stagingDirectory = await mkdtemp(path.join(binaryDirectory, '.dontpad-update-'))
  const stagedBinaryPath = path.join(stagingDirectory, release.binaryAssetName)
  const backupTemporaryPath = path.join(stagingDirectory, 'previous-binary')
  const deps = resolveDeps(dependencies)

  try {
    const downloads = await Promise.allSettled([
      deps.downloadText(release.checksumUrl),
      deps.downloadBinary(release.binaryUrl, stagedBinaryPath),
    ])
    const [checksumDownload, binaryDownload] = downloads
    if (checksumDownload.status === 'rejected') {
      throw checksumDownload.reason
    }
    if (binaryDownload.status === 'rejected') {
      throw binaryDownload.reason
    }

    const expectedChecksum = parseSha256(checksumDownload.value, release.binaryAssetName)

    await inspectRegularFile(stagedBinaryPath, 'Downloaded binary', MAX_BINARY_DOWNLOAD_BYTES)
    await deps.verifyChecksum(stagedBinaryPath, expectedChecksum)
    await chmod(stagedBinaryPath, mode)

    // Re-check mutable destinations immediately before publishing any rename.
    await inspectTarget(binaryPath)
    await inspectBackupPath(backupPath)
    await copyFile(binaryPath, backupTemporaryPath)
    await inspectRegularFile(backupTemporaryPath, 'Temporary backup binary', MAX_BINARY_DOWNLOAD_BYTES)
    await chmod(backupTemporaryPath, mode)
    await rename(backupTemporaryPath, backupPath)

    try {
      await rename(stagedBinaryPath, binaryPath)
      await deps.verifyChecksum(binaryPath, expectedChecksum)
    } catch (error) {
      try {
        await restoreBackup(backupPath, binaryPath, mode, stagingDirectory)
      } catch (rollbackError) {
        const reason = rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
        throw new Error(
          `Update failed and rollback also failed: ${reason}. Previous binary remains at ${backupPath}.`,
        )
      }

      const reason = error instanceof Error ? error.message : String(error)
      throw new Error(
        `Update failed; the previous binary was restored from ${backupPath}: ${reason}`,
      )
    }

    return {
      binaryPath,
      backupPath,
      version: release.latestVersion,
    }
  } finally {
    await rm(stagingDirectory, { recursive: true, force: true })
  }
}
