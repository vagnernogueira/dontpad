import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
  symlinkSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  forceInstallSkill,
  forceUpdateSkill,
  getSkillStatus,
  installSkill,
  uninstallSkill,
  updateSkill,
  MAX_SKILL_ARCHIVE_BYTES,
  type SkillInstallerDeps,
} from '../utils/skill-installer'
import type { SkillReleaseCheck } from '../api/skill-release'
import { loadSkillMetadata } from '../utils/skill-metadata'

const tempDirectories: string[] = []

function createTempDirectory(): string {
  const directory = mkdtempSync(path.join(tmpdir(), 'dontpad-skill-install-'))
  tempDirectories.push(directory)

  return directory
}

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

/**
 * Builds a skills.tar.gz fixture on disk and returns it plus a dep injection
 * triple that serves it without touching the network.
 */
function buildFixture(layout: 'nested' | 'root', content = '# dontpad-cli skill\n'): {
  archive: string
  deps: SkillInstallerDeps
  release: SkillReleaseCheck
} {
  const work = createTempDirectory()
  const sourceRoot = path.join(work, 'src')

  if (layout === 'nested') {
    mkdirSync(path.join(sourceRoot, 'skills'), { recursive: true })
    writeFileSync(path.join(sourceRoot, 'skills', 'SKILL.md'), content)
    execFileSync('tar', ['-czf', path.join(work, 'skills.tar.gz'), '-C', sourceRoot, 'skills'])
  } else {
    mkdirSync(sourceRoot, { recursive: true })
    writeFileSync(path.join(sourceRoot, 'SKILL.md'), content)
    execFileSync('tar', ['-czf', path.join(work, 'skills.tar.gz'), '-C', sourceRoot, 'SKILL.md'])
  }

  const archive = path.join(work, 'skills.tar.gz')
  const release: SkillReleaseCheck = {
    latestVersion: '0.2.0',
    tag: 'cli-v0.2.0',
    releaseUrl: 'https://github.com/vagnernogueira/dontpad/releases/tag/cli-v0.2.0',
    downloadUrl:
      'https://github.com/vagnernogueira/dontpad/releases/download/cli-v0.2.0/skills.tar.gz',
    downloadApiUrl: 'https://api.github.com/repos/vagnernogueira/dontpad/releases/assets/101',
    checksumUrl:
      'https://github.com/vagnernogueira/dontpad/releases/download/cli-v0.2.0/skills.tar.gz.sha256',
    checksumApiUrl: 'https://api.github.com/repos/vagnernogueira/dontpad/releases/assets/102',
  }

  const deps: SkillInstallerDeps = {
    fetchRelease: async () => release,
    downloadFile: async (_url, dest) => copyFileSync(archive, dest),
    fetchChecksum: async () => `${sha256(archive)}  skills.tar.gz\n`,
  }

  return { archive, deps, release }
}

describe('skill installer', () => {
  it('installs the skill from a nested-layout archive and records metadata', async () => {
    const { deps, release } = buildFixture('nested')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()

    const result = await installSkill(target, deps, { metadataOptions: { configDirectoryPath: configDir } })

    expect(result.success).toBe(true)
    expect(result.releaseVersion).toBe('0.2.0')
    expect(result.releaseUrl).toBe(release.releaseUrl)
    expect(existsSync(path.join(target, 'SKILL.md'))).toBe(true)

    const metadata = loadSkillMetadata({ configDirectoryPath: configDir })
    expect(metadata.installed).toBe(true)
    expect(metadata.releaseVersion).toBe('0.2.0')
    expect(metadata.target).toBe(target)
  })

  it('installs a root-layout archive (SKILL.md at the archive root)', async () => {
    const { deps } = buildFixture('root')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()

    const result = await installSkill(target, deps, { metadataOptions: { configDirectoryPath: configDir } })

    expect(result.success).toBe(true)
    expect(existsSync(path.join(target, 'SKILL.md'))).toBe(true)
  })

  it('refuses to install over an existing target without --force', async () => {
    const { deps } = buildFixture('nested')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()
    const options = { metadataOptions: { configDirectoryPath: configDir } }

    const first = await installSkill(target, deps, options)
    expect(first.success).toBe(true)

    const second = await installSkill(target, deps, options)

    expect(second.success).toBe(false)
    expect(second.error).toMatch(/already installed/)
  })

  it('force-installs over an existing target, replacing the content', async () => {
    const firstFixture = buildFixture('nested', '# old content\n')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()
    const options = { metadataOptions: { configDirectoryPath: configDir } }

    await installSkill(target, firstFixture.deps, options)
    expect(readFileSync(path.join(target, 'SKILL.md'), 'utf-8')).toContain('old content')

    const secondFixture = buildFixture('nested', '# new content\n')
    const result = await forceInstallSkill(target, secondFixture.deps, options)

    expect(result.success).toBe(true)
    expect(readFileSync(path.join(target, 'SKILL.md'), 'utf-8')).toContain('new content')
  })

  it('refuses to update a skill that is not installed', async () => {
    const { deps } = buildFixture('nested')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()

    const result = await updateSkill(target, deps, { metadataOptions: { configDirectoryPath: configDir } })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/not installed/)
  })

  it('updates an installed skill, replacing its content', async () => {
    const firstFixture = buildFixture('nested', '# v1\n')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()
    const options = { metadataOptions: { configDirectoryPath: configDir } }

    await installSkill(target, firstFixture.deps, options)

    const secondFixture = buildFixture('nested', '# v2\n')
    const result = await updateSkill(target, secondFixture.deps, options)

    expect(result.success).toBe(true)
    expect(readFileSync(path.join(target, 'SKILL.md'), 'utf-8')).toContain('v2')
  })

  it('force-updates a skill even when the target is missing', async () => {
    const { deps } = buildFixture('nested')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()

    const result = await forceUpdateSkill(target, deps, { metadataOptions: { configDirectoryPath: configDir } })

    expect(result.success).toBe(true)
    expect(existsSync(path.join(target, 'SKILL.md'))).toBe(true)
  })

  it('fails the install when the checksum does not match', async () => {
    const { deps } = buildFixture('nested')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()

    const tamperedDeps: SkillInstallerDeps = {
      ...deps,
      fetchChecksum: async () => `${'deadbeef'.repeat(8)}  skills.tar.gz\n`,
    }

    const result = await installSkill(target, tamperedDeps, { metadataOptions: { configDirectoryPath: configDir } })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Checksum verification failed/)
    expect(existsSync(target)).toBe(false)
    // Staging dir is cleaned up even on failure.
    const parent = path.dirname(target)
    expect(parent).not.toContain('.dontpad-skill-')
  })

  it('keeps an existing installation intact when forced replacement validation fails', async () => {
    const firstFixture = buildFixture('nested', '# old content\n')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()
    const options = { metadataOptions: { configDirectoryPath: configDir } }
    await installSkill(target, firstFixture.deps, options)

    const secondFixture = buildFixture('nested', '# untrusted content\n')
    const result = await forceInstallSkill(
      target,
      {
        ...secondFixture.deps,
        fetchChecksum: async () => `${'deadbeef'.repeat(8)}  skills.tar.gz\n`,
      },
      options,
    )

    expect(result.success).toBe(false)
    expect(readFileSync(path.join(target, 'SKILL.md'), 'utf-8')).toContain('old content')
  })

  it('rejects an oversized skill archive before extraction', async () => {
    const { deps } = buildFixture('nested')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()
    const oversizedDeps: SkillInstallerDeps = {
      ...deps,
      downloadFile: async (_url, destination) => {
        writeFileSync(destination, Buffer.alloc(MAX_SKILL_ARCHIVE_BYTES + 1))
      },
    }

    const result = await installSkill(target, oversizedDeps, { metadataOptions: { configDirectoryPath: configDir } })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/between 1 and/)
    expect(existsSync(target)).toBe(false)
  })

  it('rejects archive symbolic links rather than extracting them into the skill target', async () => {
    const work = createTempDirectory()
    const sourceRoot = path.join(work, 'source')
    mkdirSync(path.join(sourceRoot, 'skills'), { recursive: true })
    writeFileSync(path.join(sourceRoot, 'skills', 'SKILL.md'), '# safe\n')
    symlinkSync('/tmp', path.join(sourceRoot, 'skills', 'outside'))
    const archive = path.join(work, 'malicious-skills.tar.gz')
    execFileSync('tar', ['-czf', archive, '-C', sourceRoot, 'skills'])

    const { deps } = buildFixture('nested')
    const maliciousDeps: SkillInstallerDeps = {
      ...deps,
      downloadFile: async (_url, destination) => copyFileSync(archive, destination),
      fetchChecksum: async () => `${sha256(archive)}  skills.tar.gz\n`,
    }
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()

    const result = await installSkill(target, maliciousDeps, { metadataOptions: { configDirectoryPath: configDir } })

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/unsupported entry type/)
    expect(existsSync(target)).toBe(false)
  })

  it('rejects a filesystem-root target before fetching a release', async () => {
    let releaseRequests = 0

    await expect(
      installSkill('/', {
        fetchRelease: async () => {
          releaseRequests += 1
          return buildFixture('nested').release
        },
      }),
    ).rejects.toThrow('below the filesystem and home roots')
    expect(releaseRequests).toBe(0)
  })

  it('reports not-installed status for an empty target', async () => {
    const { deps } = buildFixture('nested')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()

    const status = await getSkillStatus(target, deps, { metadataOptions: { configDirectoryPath: configDir } })

    expect(status.installed).toBe(false)
    expect(status.target).toBe(target)
  })

  it('reports up-to-date when the installed version matches the latest release', async () => {
    const { deps } = buildFixture('nested')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()
    const options = { metadataOptions: { configDirectoryPath: configDir } }

    await installSkill(target, deps, options)

    const status = await getSkillStatus(target, deps, options)

    expect(status.installed).toBe(true)
    expect(status.upToDate).toBe(true)
    expect(status.releaseVersion).toBe('0.2.0')
    expect(status.latestVersion).toBe('0.2.0')
  })

  it('reports outdated when the latest release version differs', async () => {
    const first = buildFixture('nested')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()
    const options = { metadataOptions: { configDirectoryPath: configDir } }

    await installSkill(target, first.deps, options)

    const newerRelease: SkillReleaseCheck = {
      latestVersion: '0.3.0',
      tag: 'cli-v0.3.0',
      releaseUrl: 'https://github.com/vagnernogueira/dontpad/releases/tag/cli-v0.3.0',
      downloadUrl:
        'https://github.com/vagnernogueira/dontpad/releases/download/cli-v0.3.0/skills.tar.gz',
      downloadApiUrl: 'https://api.github.com/repos/vagnernogueira/dontpad/releases/assets/201',
      checksumUrl:
        'https://github.com/vagnernogueira/dontpad/releases/download/cli-v0.3.0/skills.tar.gz.sha256',
      checksumApiUrl: 'https://api.github.com/repos/vagnernogueira/dontpad/releases/assets/202',
    }
    const offlineDeps: SkillInstallerDeps = {
      ...first.deps,
      fetchRelease: async () => newerRelease,
    }

    const status = await getSkillStatus(target, offlineDeps, options)

    expect(status.installed).toBe(true)
    expect(status.upToDate).toBe(false)
    expect(status.latestVersion).toBe('0.3.0')
  })

  it('reports upToDate=null when the release check fails (offline)', async () => {
    const { deps } = buildFixture('nested')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()
    const options = { metadataOptions: { configDirectoryPath: configDir } }

    await installSkill(target, deps, options)

    const offlineDeps: SkillInstallerDeps = {
      ...deps,
      fetchRelease: async () => {
        throw new Error('network down')
      },
    }

    const status = await getSkillStatus(target, offlineDeps, options)

    expect(status.installed).toBe(true)
    expect(status.upToDate).toBeNull()
  })

  it('uninstalls the skill and clears metadata', () => {
    const { deps } = buildFixture('nested')
    const target = path.join(createTempDirectory(), 'dontpad-cli')
    const configDir = createTempDirectory()

    return installSkill(target, deps, { metadataOptions: { configDirectoryPath: configDir } }).then(() => {
      expect(existsSync(target)).toBe(true)

      const result = uninstallSkill(target, deps, { metadataOptions: { configDirectoryPath: configDir } })

      expect(result.success).toBe(true)
      expect(existsSync(target)).toBe(false)
      expect(loadSkillMetadata({ configDirectoryPath: configDir }).installed).toBe(false)
    })
  })
})
