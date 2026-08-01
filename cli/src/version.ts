import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Injected by tsup's `define` (see tsup.config.ts) from package.json at build
// time. Always set in any bundled output (npm build, dev watch, standalone
// binary) — only ever undefined when this module runs unbundled (e.g. under
// vitest or ts-node), in which case the safe fallback below resolves the
// version from the package.json adjacent to this source file.
declare const __DONTPAD_CLI_VERSION__: string | undefined

// Safe fallback used only when the build-time constant isn't available
// (unbundled execution: vitest, ts-node). Resolves package.json relative to
// this module's own location on disk (`__dirname`, available in every CJS
// runtime this package targets: node, ts-node and bun --compile) — never the
// process's cwd. A standalone binary has no adjacent package.json on disk, so
// falling back to `process.cwd()` would silently report the version of
// whatever npm project the binary happens to be invoked from, instead of the
// binary's own version. When `__dirname` itself is unavailable (an unexpected
// non-CJS host), returns '0.0.0' rather than guessing.
function readPackageJsonVersion(): string {
  if (typeof __dirname === 'undefined') {
    return '0.0.0'
  }

  const candidates = [resolve(__dirname, '../package.json'), resolve(__dirname, '../../package.json')]

  for (const candidate of candidates) {
    try {
      if (existsSync(candidate)) {
        const pkg = JSON.parse(readFileSync(candidate, 'utf-8')) as { version?: string }

        return pkg.version ?? '0.0.0'
      }
    } catch {
      continue
    }
  }

  return '0.0.0'
}

export const VERSION =
  typeof __DONTPAD_CLI_VERSION__ !== 'undefined'
    ? __DONTPAD_CLI_VERSION__
    : readPackageJsonVersion()
