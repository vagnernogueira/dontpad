import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  SkillReleaseError,
  SkillRateLimitedError,
  fetchLatestSkillRelease,
} from '../api/skill-release'

interface ReleaseFixture {
  tag_name: string
  html_url: string
  draft?: boolean
  prerelease?: boolean
  assets: { name: string; browser_download_url: string; url: string }[]
}

function release(fixture: ReleaseFixture): unknown {
  return fixture
}

function asset(name: string): { name: string; browser_download_url: string; url: string } {
  return {
    name,
    browser_download_url: `https://github.com/vagnernogueira/dontpad/releases/download/cli-v0.2.0/${name}`,
    url: `https://api.github.com/repos/vagnernogueira/dontpad/releases/assets/${name}`,
  }
}

const originalFetch = globalThis.fetch

beforeEach(() => {
  delete process.env.GITHUB_TOKEN
})

afterEach(() => {
  vi.unstubAllGlobals()
  globalThis.fetch = originalFetch
})

function stubReleases(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(
    async () =>
      new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
}

describe('fetchLatestSkillRelease', () => {
  it('picks the newest cli-v* release and resolves the skill + checksum assets', async () => {
    stubReleases([
      release({
        tag_name: 'v1.0.0',
        html_url: 'https://github.com/vagnernogueira/dontpad/releases/v1.0.0',
        assets: [asset('app-linux-x64')],
      }),
      release({
        tag_name: 'cli-v0.2.0',
        html_url: 'https://github.com/vagnernogueira/dontpad/releases/cli-v0.2.0',
        assets: [asset('skills.tar.gz'), asset('skills.tar.gz.sha256'), asset('dontpad-linux-x64')],
      }),
    ])

    const result = await fetchLatestSkillRelease()

    expect(result.tag).toBe('cli-v0.2.0')
    expect(result.latestVersion).toBe('0.2.0')
    expect(result.downloadUrl).toContain('skills.tar.gz')
    expect(result.checksumUrl).toContain('skills.tar.gz.sha256')
    expect(result.releaseUrl).toBe('https://github.com/vagnernogueira/dontpad/releases/tag/cli-v0.2.0')
  })

  it('ignores draft and prerelease cli-v* tags', async () => {
    stubReleases([
      release({
        tag_name: 'cli-v0.3.0-rc1',
        html_url: 'https://example.com/rc',
        prerelease: true,
        assets: [asset('skills.tar.gz')],
      }),
      release({
        tag_name: 'cli-v0.2.0',
        html_url: 'https://example.com/stable',
        assets: [asset('skills.tar.gz'), asset('skills.tar.gz.sha256')],
      }),
    ])

    const result = await fetchLatestSkillRelease()

    expect(result.tag).toBe('cli-v0.2.0')
  })

  it('throws when no cli-v* release exists (avoids the app v* collision)', async () => {
    stubReleases([
      release({
        tag_name: 'v1.0.0',
        html_url: 'https://example.com/app',
        assets: [asset('app-linux-x64')],
      }),
    ])

    await expect(fetchLatestSkillRelease()).rejects.toBeInstanceOf(SkillReleaseError)
  })

  it('throws when the cli-v* release has no skills.tar.gz asset', async () => {
    stubReleases([
      release({
        tag_name: 'cli-v0.2.0',
        html_url: 'https://example.com/cli',
        assets: [asset('dontpad-linux-x64')],
      }),
    ])

    await expect(fetchLatestSkillRelease()).rejects.toBeInstanceOf(SkillReleaseError)
  })

  it('maps a 403 to a rate-limit error', async () => {
    stubReleases({ message: 'rate limited' }, 403)

    await expect(fetchLatestSkillRelease()).rejects.toBeInstanceOf(SkillRateLimitedError)
  })

  it('requires the skill checksum asset before accepting a release', async () => {
    stubReleases([
      release({
        tag_name: 'cli-v0.2.0',
        html_url: 'https://example.com/cli',
        assets: [asset('skills.tar.gz')],
      }),
    ])

    await expect(fetchLatestSkillRelease()).rejects.toThrow('must contain both skills.tar.gz and skills.tar.gz.sha256')
  })
})
