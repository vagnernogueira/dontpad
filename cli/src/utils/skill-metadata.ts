import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { getConfigDirectoryPath } from '../config'

export interface SkillMetadata {
  /** Metadata schema version, for forward compatibility. */
  version: 1
  installed: boolean
  /** SHA-256 of the installed SKILL.md, for up-to-date checks. */
  checksum: string | null
  installedAt: string | null
  /** Release version (tag without the `cli-v` prefix) the skill was installed from. */
  releaseVersion: string | null
  /** Absolute path the skill was installed to. */
  target: string | null
  /** GitHub release URL the skill was installed from. */
  releaseUrl: string | null
}

export const SKILL_METADATA_VERSION = 1

export const EMPTY_SKILL_METADATA: SkillMetadata = {
  version: SKILL_METADATA_VERSION,
  installed: false,
  checksum: null,
  installedAt: null,
  releaseVersion: null,
  target: null,
  releaseUrl: null,
}

export interface SkillMetadataAccessOptions {
  configDirectoryPath?: string
  env?: NodeJS.ProcessEnv
}

export function getSkillMetadataFilePath(options: SkillMetadataAccessOptions = {}): string {
  const directory = options.configDirectoryPath ?? getConfigDirectoryPath(options.env)

  return path.join(directory, 'skill.json')
}

export function loadSkillMetadata(options: SkillMetadataAccessOptions = {}): SkillMetadata {
  const metadataPath = getSkillMetadataFilePath(options)

  if (!existsSync(metadataPath)) {
    return { ...EMPTY_SKILL_METADATA }
  }

  try {
    const raw = readFileSync(metadataPath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<SkillMetadata>

    return {
      version: SKILL_METADATA_VERSION,
      installed: parsed.installed === true,
      checksum: typeof parsed.checksum === 'string' ? parsed.checksum : null,
      installedAt: typeof parsed.installedAt === 'string' ? parsed.installedAt : null,
      releaseVersion: typeof parsed.releaseVersion === 'string' ? parsed.releaseVersion : null,
      target: typeof parsed.target === 'string' ? parsed.target : null,
      releaseUrl: typeof parsed.releaseUrl === 'string' ? parsed.releaseUrl : null,
    }
  } catch {
    return { ...EMPTY_SKILL_METADATA }
  }
}

export function saveSkillMetadata(
  metadata: SkillMetadata,
  options: SkillMetadataAccessOptions = {},
): void {
  const metadataPath = getSkillMetadataFilePath(options)
  const directory = path.dirname(metadataPath)

  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true })
  }

  const normalized: SkillMetadata = {
    version: SKILL_METADATA_VERSION,
    installed: metadata.installed,
    checksum: metadata.checksum,
    installedAt: metadata.installedAt,
    releaseVersion: metadata.releaseVersion,
    target: metadata.target,
    releaseUrl: metadata.releaseUrl,
  }

  writeFileSync(metadataPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf-8')
}

export function clearSkillMetadata(options: SkillMetadataAccessOptions = {}): void {
  saveSkillMetadata({ ...EMPTY_SKILL_METADATA }, options)
}
