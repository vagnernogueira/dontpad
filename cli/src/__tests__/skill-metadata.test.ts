import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  EMPTY_SKILL_METADATA,
  clearSkillMetadata,
  getSkillMetadataFilePath,
  loadSkillMetadata,
  saveSkillMetadata,
  type SkillMetadata,
} from '../utils/skill-metadata'

const tempDirectories: string[] = []

function createTempDirectory(): string {
  const directory = mkdtempSync(path.join(tmpdir(), 'dontpad-skill-meta-'))
  tempDirectories.push(directory)

  return directory
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('skill metadata', () => {
  it('resolves the metadata path inside the dontpad config directory', () => {
    const path_ = getSkillMetadataFilePath({ configDirectoryPath: '/tmp/dontpad-meta-x' })

    expect(path_).toBe(path.join('/tmp/dontpad-meta-x', 'skill.json'))
  })

  it('returns the empty metadata when no file exists', () => {
    const directory = createTempDirectory()

    expect(loadSkillMetadata({ configDirectoryPath: directory })).toEqual(EMPTY_SKILL_METADATA)
  })

  it('persists and reloads metadata, creating the config directory on demand', () => {
    const directory = path.join(createTempDirectory(), 'nested', 'dontpad')
    const metadata: SkillMetadata = {
      version: 1,
      installed: true,
      checksum: 'abc123',
      installedAt: '2025-01-01T00:00:00.000Z',
      releaseVersion: '0.2.0',
      target: '/somewhere/dontpad-cli',
      releaseUrl: 'https://github.com/vagnernogueira/dontpad/releases/cli-v0.2.0',
    }

    saveSkillMetadata(metadata, { configDirectoryPath: directory })

    expect(existsSync(path.join(directory, 'skill.json'))).toBe(true)
    expect(loadSkillMetadata({ configDirectoryPath: directory })).toEqual(metadata)
  })

  it('ignores malformed metadata files and returns the empty shape', () => {
    const directory = createTempDirectory()
    const file = path.join(directory, 'skill.json')

    writeFileSync(file, '{not valid json', 'utf-8')

    expect(loadSkillMetadata({ configDirectoryPath: directory })).toEqual(EMPTY_SKILL_METADATA)
  })

  it('clears metadata back to the empty shape', () => {
    const directory = createTempDirectory()

    saveSkillMetadata(
      {
        version: 1,
        installed: true,
        checksum: 'abc',
        installedAt: '2025-01-01T00:00:00.000Z',
        releaseVersion: '0.2.0',
        target: '/somewhere',
        releaseUrl: 'https://example.com',
      },
      { configDirectoryPath: directory },
    )

    clearSkillMetadata({ configDirectoryPath: directory })

    const reloaded = loadSkillMetadata({ configDirectoryPath: directory })

    expect(reloaded.installed).toBe(false)
    expect(reloaded.target).toBeNull()
    expect(reloaded.releaseVersion).toBeNull()
  })

  it('normalizes a legacy metadata file missing newer fields', () => {
    const directory = createTempDirectory()
    const file = path.join(directory, 'skill.json')

    // Simulates a v1 file written before releaseUrl existed: missing fields
    // must be coerced to null rather than leaking `undefined` into the JSON.
    writeFileSync(
      file,
      JSON.stringify({
        version: 1,
        installed: true,
        checksum: 'abc',
        installedAt: '2025-01-01T00:00:00.000Z',
        releaseVersion: '0.2.0',
        target: '/somewhere',
      }),
      'utf-8',
    )

    const reloaded = loadSkillMetadata({ configDirectoryPath: directory })

    expect(reloaded.releaseUrl).toBeNull()
    expect(reloaded.installed).toBe(true)
  })
})

// Read the persisted file to ensure it ends with a newline (consistent with
// the config file format used elsewhere in the CLI).
describe('skill metadata file format', () => {
  it('writes pretty-printed JSON with a trailing newline', () => {
    const directory = createTempDirectory()

    saveSkillMetadata(EMPTY_SKILL_METADATA, { configDirectoryPath: directory })

    const raw = readFileSync(path.join(directory, 'skill.json'), 'utf-8')

    expect(raw.endsWith('\n')).toBe(true)
    expect(JSON.parse(raw)).toEqual(EMPTY_SKILL_METADATA)
  })
})
