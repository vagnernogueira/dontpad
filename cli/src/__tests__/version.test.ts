import { rmSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('version', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.doUnmock('node:fs')
    vi.resetModules()
  })

  it('uses the build-time constant when present (bundled/compiled output)', async () => {
    vi.stubGlobal('__DONTPAD_CLI_VERSION__', '9.9.9')
    vi.resetModules()

    const { VERSION } = await import('../version')

    expect(VERSION).toBe('9.9.9')
  })

  it('never falls back to process.cwd()/package.json when unbundled resolution fails', async () => {
    // Simulates a standalone binary (bun --compile): no package.json exists
    // anywhere relative to the module's own embedded location, but the
    // process happens to be invoked from an unrelated npm project directory.
    // Regression guard: VERSION must not silently read the cwd's package.json
    // and report the version of whichever project the binary was run from.
    const decoyDir = mkdtempSync(join(tmpdir(), 'dontpad-cli-version-test-'))
    writeFileSync(join(decoyDir, 'package.json'), JSON.stringify({ version: '99.99.99' }))
    const originalCwd = process.cwd()

    vi.doMock('node:fs', () => ({
      existsSync: () => false,
      readFileSync: (...args: unknown[]) => {
        throw new Error(`unexpected readFileSync call: ${JSON.stringify(args)}`)
      },
    }))
    vi.resetModules()

    try {
      process.chdir(decoyDir)
      const { VERSION } = await import('../version')

      expect(VERSION).not.toBe('99.99.99')
      expect(VERSION).toBe('0.0.0')
    } finally {
      process.chdir(originalCwd)
      rmSync(decoyDir, { recursive: true, force: true })
    }
  })

  it('resolves the real package.json version relative to its own source location when unbundled', async () => {
    vi.resetModules()

    const { VERSION } = await import('../version')
    const { readFileSync } = await import('node:fs')
    const pkg = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
    ) as { version: string }

    expect(VERSION).toBe(pkg.version)
  })
})
