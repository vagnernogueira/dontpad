import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  esmInterop: true,
  // Embeds the version as a compile-time literal so standalone binaries
  // (bun build --compile) report their own true build version instead of
  // falling back to a filesystem lookup at runtime — see src/version.ts.
  define: {
    __DONTPAD_CLI_VERSION__: JSON.stringify(pkg.version),
  },
  banner: {
    js: '#!/usr/bin/env node',
  },
})
