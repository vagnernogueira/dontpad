import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { dirname, join, parse, relative, resolve, sep } from 'node:path'
import { homedir } from 'node:os'

import type { SkillReleaseCheck } from '../api/skill-release'
import { fetchLatestSkillRelease } from '../api/skill-release'
import {
  assertCanonicalReleaseArtifacts,
  downloadGitHubReleaseAsset,
  downloadGitHubReleaseText,
  MAX_CHECKSUM_DOWNLOAD_BYTES,
} from './download'
import {
  clearSkillMetadata,
  loadSkillMetadata,
  saveSkillMetadata,
  type SkillMetadata,
  type SkillMetadataAccessOptions,
} from './skill-metadata'

export const DEFAULT_SKILL_TARGET = join(homedir(), '.agents', 'skills', 'dontpad-cli')
export const SKILL_FILE_NAME = 'SKILL.md'
export const MAX_SKILL_ARCHIVE_BYTES = 5 * 1024 * 1024
export const MAX_SKILL_EXTRACTED_BYTES = 16 * 1024 * 1024
export const MAX_SKILL_ARCHIVE_ENTRIES = 128

const STABLE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/
const SKILL_ARCHIVE_NAME = 'skills.tar.gz'

type SkillArchiveDownloader = (url: string, destination: string) => Promise<void>
type SkillChecksumDownloader = (url: string) => Promise<string>

export interface SkillInstallerDeps {
  fetchRelease?: () => Promise<SkillReleaseCheck>
  downloadFile?: SkillArchiveDownloader
  fetchChecksum?: SkillChecksumDownloader
}

export interface SkillMetadataOptions {
  metadataOptions?: SkillMetadataAccessOptions
}

export interface SkillInstallResult {
  success: boolean
  target: string
  releaseVersion: string | null
  releaseUrl: string | null
  error?: string
}

export interface SkillStatusResult {
  installed: boolean
  /** `null` when the latest release couldn't be reached (offline status). */
  upToDate: boolean | null
  target: string
  releaseVersion: string | null
  latestVersion: string | null
  checksum: string | null
}

export interface SkillUninstallResult {
  success: boolean
  target: string
  error?: string
}

function downloadSkillArchive(url: string, destination: string): Promise<void> {
  return downloadGitHubReleaseAsset(url, destination, { maxBytes: MAX_SKILL_ARCHIVE_BYTES })
}

function downloadSkillChecksum(url: string): Promise<string> {
  return downloadGitHubReleaseText(url, { maxBytes: MAX_CHECKSUM_DOWNLOAD_BYTES })
}

function resolveDeps(deps?: SkillInstallerDeps): Required<SkillInstallerDeps> {
  return {
    fetchRelease: deps?.fetchRelease ?? fetchLatestSkillRelease,
    downloadFile: deps?.downloadFile ?? downloadSkillArchive,
    fetchChecksum: deps?.fetchChecksum ?? downloadSkillChecksum,
  }
}

function assertSafeTargetPath(target: string): void {
  const home = homedir()
  if (
    !target ||
    target === parse(target).root ||
    target === home ||
    home.startsWith(`${target}${sep}`)
  ) {
    throw new Error('Skill target must name a directory below the filesystem and home roots.')
  }
}

function assertSafeDirectoryChain(directory: string): void {
  const root = parse(directory).root
  const segments = relative(root, directory).split(sep).filter(Boolean)
  let current = root

  for (const segment of segments) {
    current = join(current, segment)
    const details = lstatSync(current)
    if (details.isSymbolicLink() || !details.isDirectory()) {
      throw new Error(`Skill target parent contains an unsafe symbolic-link or non-directory: ${current}.`)
    }
  }
}

function inspectExistingTarget(target: string): boolean {
  try {
    const details = lstatSync(target)
    if (details.isSymbolicLink() || !details.isDirectory()) {
      throw new Error(`Skill target must be a real directory, not a symbolic link or file: ${target}.`)
    }
    return true
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return false
    }
    throw error
  }
}

function prepareTargetParent(target: string): void {
  const parent = dirname(target)
  mkdirSync(parent, { recursive: true, mode: 0o700 })
  assertSafeDirectoryChain(parent)
}

export function resolveSkillTarget(
  target?: string,
  metadataOptions: SkillMetadataAccessOptions = {},
): string {
  const requestedTarget = target ?? loadSkillMetadata(metadataOptions).target ?? DEFAULT_SKILL_TARGET
  let expandedTarget: string

  if (requestedTarget === '~' || requestedTarget.startsWith('~/')) {
    expandedTarget = join(homedir(), requestedTarget.slice(2))
  } else if (requestedTarget.startsWith('~')) {
    throw new Error(`Target path must be absolute or start with ~/. Got: ${requestedTarget}`)
  } else if (requestedTarget.startsWith('/')) {
    expandedTarget = requestedTarget
  } else {
    throw new Error(`Target path must be absolute. Got: ${requestedTarget}`)
  }

  const resolvedTarget = resolve(expandedTarget)
  assertSafeTargetPath(resolvedTarget)
  return resolvedTarget
}

function fileChecksum(filePath: string): string {
  const details = lstatSync(filePath)
  if (details.isSymbolicLink() || !details.isFile() || details.size > MAX_SKILL_EXTRACTED_BYTES) {
    throw new Error(`Installed ${SKILL_FILE_NAME} must be a bounded regular file.`)
  }

  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function assertValidSkillRelease(release: SkillReleaseCheck): void {
  if (!STABLE_VERSION.test(release.latestVersion) || release.tag !== `cli-v${release.latestVersion}`) {
    throw new Error('Refusing a skill release with an invalid stable CLI version or tag.')
  }

  const expectedReleaseUrl = `https://github.com/vagnernogueira/dontpad/releases/tag/${release.tag}`
  if (release.releaseUrl !== expectedReleaseUrl) {
    throw new Error('Skill release page URL is not the canonical official Dontpad release URL.')
  }

  assertCanonicalReleaseArtifacts(
    release.tag,
    SKILL_ARCHIVE_NAME,
    release.downloadUrl,
    release.checksumUrl,
  )
}

function parseSkillChecksum(rawChecksum: string): string {
  if (Buffer.byteLength(rawChecksum, 'utf8') > MAX_CHECKSUM_DOWNLOAD_BYTES) {
    throw new Error('Skill checksum exceeds the safety limit.')
  }

  const lines = rawChecksum
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const match = lines.length === 1 ? /^([a-fA-F0-9]{64})\s+\*?skills\.tar\.gz$/.exec(lines[0]) : null
  if (!match) {
    throw new Error('Skill checksum must contain exactly one SHA-256 for skills.tar.gz.')
  }

  return match[1].toLowerCase()
}

function assertArchiveChecksum(archive: string, expectedChecksum: string): void {
  const details = lstatSync(archive)
  if (details.isSymbolicLink() || !details.isFile() || details.size < 1 || details.size > MAX_SKILL_ARCHIVE_BYTES) {
    throw new Error(`Skill archive must be a regular file between 1 and ${MAX_SKILL_ARCHIVE_BYTES} bytes.`)
  }

  const actualChecksum = createHash('sha256').update(readFileSync(archive)).digest('hex')
  if (actualChecksum !== expectedChecksum) {
    throw new Error('Checksum verification failed. The downloaded skill archive may be corrupted.')
  }
}

function isZeroBlock(block: Buffer): boolean {
  return block.every((byte) => byte === 0)
}

function readTarString(header: Buffer, offset: number, length: number, label: string): string {
  const field = header.subarray(offset, offset + length)
  const zero = field.indexOf(0)
  const value = field.subarray(0, zero === -1 ? field.length : zero).toString('utf8').trimEnd()
  if (value.includes('\uFFFD')) {
    throw new Error(`Skill archive has an invalid UTF-8 ${label}.`)
  }

  return value
}

function readTarSize(header: Buffer): number {
  const raw = readTarString(header, 124, 12, 'size').trim()
  if (raw === '') {
    return 0
  }

  if (!/^[0-7]+$/.test(raw)) {
    throw new Error('Skill archive has a non-octal entry size.')
  }

  const size = Number.parseInt(raw, 8)
  if (!Number.isSafeInteger(size) || size < 0 || size > MAX_SKILL_EXTRACTED_BYTES) {
    throw new Error('Skill archive entry exceeds the extraction safety limit.')
  }

  return size
}

function validateArchiveEntryPath(entryPath: string): void {
  if (
    !entryPath ||
    entryPath.startsWith('/') ||
    entryPath.includes('\\') ||
    entryPath.includes('\0') ||
    entryPath.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')
  ) {
    throw new Error(`Skill archive contains an unsafe entry path: ${entryPath || '(empty)'}.`)
  }
}

interface TarEntry {
  path: string
  type: 'file' | 'directory'
  data: Buffer
}

function parseTarArchive(tar: Buffer): TarEntry[] {
  const entries: TarEntry[] = []
  const seenPaths = new Set<string>()
  let totalSize = 0
  let offset = 0
  let foundEnd = false

  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512)
    if (isZeroBlock(header)) {
      if (!tar.subarray(offset).every((byte) => byte === 0)) {
        throw new Error('Skill archive has non-zero data after its end marker.')
      }
      foundEnd = true
      break
    }

    if (entries.length >= MAX_SKILL_ARCHIVE_ENTRIES) {
      throw new Error(`Skill archive exceeds the ${MAX_SKILL_ARCHIVE_ENTRIES} entry safety limit.`)
    }

    const name = readTarString(header, 0, 100, 'entry name')
    const prefix = readTarString(header, 345, 155, 'entry prefix')
    const rawEntryPath = prefix ? `${prefix}/${name}` : name
    const size = readTarSize(header)
    const typeFlag = header[156]
    const type = typeFlag === 0 || typeFlag === '0'.charCodeAt(0) ? 'file' : typeFlag === '5'.charCodeAt(0) ? 'directory' : null
    if (!type) {
      throw new Error(`Skill archive contains an unsupported entry type: ${rawEntryPath}.`)
    }
    if (rawEntryPath.endsWith('/') && type !== 'directory') {
      throw new Error(`Skill archive file entry has a trailing slash: ${rawEntryPath}.`)
    }
    const entryPath = rawEntryPath.endsWith('/') ? rawEntryPath.slice(0, -1) : rawEntryPath
    validateArchiveEntryPath(entryPath)
    if (seenPaths.has(entryPath)) {
      throw new Error(`Skill archive has duplicate entry path: ${entryPath}.`)
    }
    seenPaths.add(entryPath)

    if (type === 'directory' && size !== 0) {
      throw new Error(`Skill archive directory ${entryPath} has unexpected content.`)
    }

    const dataStart = offset + 512
    const dataEnd = dataStart + size
    const paddedEnd = dataStart + Math.ceil(size / 512) * 512
    if (dataEnd > tar.length || paddedEnd > tar.length) {
      throw new Error(`Skill archive entry ${entryPath} is truncated.`)
    }

    totalSize += size
    if (totalSize > MAX_SKILL_EXTRACTED_BYTES) {
      throw new Error(`Skill archive exceeds the ${MAX_SKILL_EXTRACTED_BYTES} byte extraction safety limit.`)
    }

    entries.push({ path: entryPath, type, data: tar.subarray(dataStart, dataEnd) })
    offset = paddedEnd
  }

  if (!foundEnd) {
    throw new Error('Skill archive is missing a valid tar end marker.')
  }

  return entries
}

function resolveArchiveLayout(entries: TarEntry[]): 'root' | 'nested' {
  const rootSkill = entries.some((entry) => entry.type === 'file' && entry.path === SKILL_FILE_NAME)
  const nestedSkill = entries.some((entry) => entry.type === 'file' && entry.path === `skills/${SKILL_FILE_NAME}`)

  if (rootSkill === nestedSkill) {
    throw new Error(`Skill archive must contain exactly one ${SKILL_FILE_NAME} at the root or under skills/.`)
  }

  for (const entry of entries) {
    const allowed = rootSkill
      ? entry.path === SKILL_FILE_NAME
      : entry.path === 'skills' || entry.path.startsWith('skills/')
    if (!allowed) {
      throw new Error(`Skill archive entry is outside its permitted layout: ${entry.path}.`)
    }
  }

  return rootSkill ? 'root' : 'nested'
}

function extractTarGz(archive: string, destination: string): string {
  const compressed = readFileSync(archive)
  let tar: Buffer
  try {
    tar = gunzipSync(compressed, { maxOutputLength: MAX_SKILL_EXTRACTED_BYTES + 1024 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to safely decompress skill archive: ${message}`)
  }

  const entries = parseTarArchive(tar)
  const layout = resolveArchiveLayout(entries)
  mkdirSync(destination, { recursive: false, mode: 0o700 })

  for (const entry of entries) {
    const outputPath = resolve(destination, entry.path)
    if (!outputPath.startsWith(`${destination}${sep}`)) {
      throw new Error(`Skill archive entry escapes the extraction directory: ${entry.path}.`)
    }

    if (entry.type === 'directory') {
      mkdirSync(outputPath, { recursive: true, mode: 0o700 })
      continue
    }

    mkdirSync(dirname(outputPath), { recursive: true, mode: 0o700 })
    writeFileSync(outputPath, entry.data, { encoding: 'utf8', flag: 'wx', mode: 0o600 })
  }

  return layout === 'root' ? destination : join(destination, 'skills')
}

interface StagedSkill {
  stagingDir: string
  skillRoot: string
  release: SkillReleaseCheck
}

async function fetchAndStage(target: string, deps: Required<SkillInstallerDeps>): Promise<StagedSkill> {
  const release = await deps.fetchRelease()
  assertValidSkillRelease(release)
  prepareTargetParent(target)

  const stagingRoot = mkdtempSync(join(dirname(target), '.dontpad-skill-'))
  const archivePath = join(stagingRoot, SKILL_ARCHIVE_NAME)
  const extractDir = join(stagingRoot, 'extracted')

  try {
    await deps.downloadFile(release.downloadUrl, archivePath)
    const expectedChecksum = parseSkillChecksum(await deps.fetchChecksum(release.checksumUrl))
    assertArchiveChecksum(archivePath, expectedChecksum)

    return {
      stagingDir: stagingRoot,
      skillRoot: extractTarGz(archivePath, extractDir),
      release,
    }
  } catch (error) {
    rmSync(stagingRoot, { recursive: true, force: true })
    throw error
  }
}

interface CommittedSkill {
  finalize: () => void
  rollback: () => void
}

function commitStaged(staged: StagedSkill, target: string): CommittedSkill {
  const targetExisted = inspectExistingTarget(target)
  const backupPath = join(staged.stagingDir, 'previous-install')

  if (targetExisted) {
    renameSync(target, backupPath)
  }

  try {
    renameSync(staged.skillRoot, target)
  } catch (error) {
    if (targetExisted) {
      renameSync(backupPath, target)
    }
    throw error
  }

  return {
    finalize: () => {
      if (targetExisted) {
        rmSync(backupPath, { recursive: true, force: true })
      }
    },
    rollback: () => {
      const installed = inspectExistingTarget(target)
      if (installed) {
        rmSync(target, { recursive: true, force: true })
      }
      if (targetExisted) {
        renameSync(backupPath, target)
      }
    },
  }
}

function recordMetadata(
  target: string,
  release: SkillReleaseCheck,
  metadataOptions: SkillMetadataAccessOptions = {},
): SkillMetadata {
  const skillFile = join(target, SKILL_FILE_NAME)
  const metadata: SkillMetadata = {
    version: 1,
    installed: true,
    checksum: fileChecksum(skillFile),
    installedAt: new Date().toISOString(),
    releaseVersion: release.latestVersion,
    target,
    releaseUrl: release.releaseUrl,
  }

  saveSkillMetadata(metadata, metadataOptions)
  return metadata
}

const EMPTY_RELEASE: SkillReleaseCheck = {
  latestVersion: '',
  tag: '',
  releaseUrl: '',
  downloadUrl: '',
  downloadApiUrl: '',
  checksumUrl: '',
  checksumApiUrl: '',
}

function buildInstallResult(
  target: string,
  release: SkillReleaseCheck,
  error?: string,
): SkillInstallResult {
  return {
    success: !error,
    target,
    releaseVersion: release.latestVersion,
    releaseUrl: release.releaseUrl,
    ...(error ? { error } : {}),
  }
}

async function installOrReplaceSkill(
  target: string,
  deps: Required<SkillInstallerDeps>,
  options: SkillMetadataOptions | undefined,
): Promise<SkillInstallResult> {
  try {
    // Validate an existing destination before any network or staging write.
    inspectExistingTarget(target)
    const staged = await fetchAndStage(target, deps)
    try {
      const committed = commitStaged(staged, target)
      try {
        recordMetadata(target, staged.release, options?.metadataOptions)
      } catch (error) {
        try {
          committed.rollback()
        } catch (rollbackError) {
          const reason = rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
          throw new Error(`Skill metadata write failed and rollback also failed: ${reason}`)
        }
        throw error
      }
      committed.finalize()
      return buildInstallResult(target, staged.release)
    } finally {
      rmSync(staged.stagingDir, { recursive: true, force: true })
    }
  } catch (error) {
    return buildInstallResult(
      target,
      EMPTY_RELEASE,
      `Install failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export async function installSkill(
  target?: string,
  deps?: SkillInstallerDeps,
  options?: SkillMetadataOptions,
): Promise<SkillInstallResult> {
  const resolvedTarget = resolveSkillTarget(target, options?.metadataOptions)
  if (inspectExistingTarget(resolvedTarget)) {
    return buildInstallResult(
      resolvedTarget,
      EMPTY_RELEASE,
      'Skill already installed. Use `dontpad skill update` to upgrade, or `--force` to reinstall.',
    )
  }

  return installOrReplaceSkill(resolvedTarget, resolveDeps(deps), options)
}

export async function updateSkill(
  target?: string,
  deps?: SkillInstallerDeps,
  options?: SkillMetadataOptions,
): Promise<SkillInstallResult> {
  const resolvedTarget = resolveSkillTarget(target, options?.metadataOptions)
  if (!inspectExistingTarget(resolvedTarget)) {
    return buildInstallResult(
      resolvedTarget,
      EMPTY_RELEASE,
      'Skill is not installed. Run `dontpad skill install` first, or use `--force`.',
    )
  }

  return installOrReplaceSkill(resolvedTarget, resolveDeps(deps), options)
}

export async function forceInstallSkill(
  target?: string,
  deps?: SkillInstallerDeps,
  options?: SkillMetadataOptions,
): Promise<SkillInstallResult> {
  const resolvedTarget = resolveSkillTarget(target, options?.metadataOptions)
  return installOrReplaceSkill(resolvedTarget, resolveDeps(deps), options)
}

export async function forceUpdateSkill(
  target?: string,
  deps?: SkillInstallerDeps,
  options?: SkillMetadataOptions,
): Promise<SkillInstallResult> {
  const resolvedTarget = resolveSkillTarget(target, options?.metadataOptions)
  return installOrReplaceSkill(resolvedTarget, resolveDeps(deps), options)
}

export async function getSkillStatus(
  target?: string,
  deps?: SkillInstallerDeps,
  options?: SkillMetadataOptions,
): Promise<SkillStatusResult> {
  const resolvedTarget = resolveSkillTarget(target, options?.metadataOptions)
  const metadata = loadSkillMetadata(options?.metadataOptions)
  const skillFile = join(resolvedTarget, SKILL_FILE_NAME)

  if (!inspectExistingTarget(resolvedTarget) || !existsSync(skillFile)) {
    return {
      installed: false,
      upToDate: false,
      target: resolvedTarget,
      releaseVersion: null,
      latestVersion: null,
      checksum: null,
    }
  }

  let installedChecksum: string
  try {
    installedChecksum = fileChecksum(skillFile)
  } catch {
    return {
      installed: false,
      upToDate: false,
      target: resolvedTarget,
      releaseVersion: null,
      latestVersion: null,
      checksum: null,
    }
  }

  let latestVersion: string | null = null
  let upToDate: boolean | null = null

  try {
    const release = await resolveDeps(deps).fetchRelease()
    assertValidSkillRelease(release)
    latestVersion = release.latestVersion
    upToDate = release.latestVersion === metadata.releaseVersion
  } catch {
    upToDate = null
  }

  return {
    installed: true,
    upToDate,
    target: resolvedTarget,
    releaseVersion: metadata.releaseVersion,
    latestVersion,
    checksum: installedChecksum,
  }
}

export function uninstallSkill(
  target?: string,
  _deps?: SkillInstallerDeps,
  options?: SkillMetadataOptions,
): SkillUninstallResult {
  const resolvedTarget = resolveSkillTarget(target, options?.metadataOptions)

  try {
    if (inspectExistingTarget(resolvedTarget)) {
      rmSync(resolvedTarget, { recursive: true, force: true })
    }
    clearSkillMetadata(options?.metadataOptions)
    return { success: true, target: resolvedTarget }
  } catch (error) {
    return {
      success: false,
      target: resolvedTarget,
      error: `Uninstall failed: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export function forceUninstallSkill(
  target?: string,
  deps?: SkillInstallerDeps,
  options?: SkillMetadataOptions,
): SkillUninstallResult {
  return uninstallSkill(target, deps, options)
}
