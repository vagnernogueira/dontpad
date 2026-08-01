import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

// Standalone binary build for the Dontpad CLI.
//
// Targets the three platforms Dontpad ships binaries for: linux-x64,
// darwin-arm64 and win-x64. For each target it tries `bun build --compile`
// (fast, native cross-compile) first and falls back to `nexe` when bun is
// unavailable or fails for that target.
//
// Requires the CJS bundle at ./dist/index.cjs — run `npm run build` first.

const DIST = './dist/index.cjs'

const TARGETS = [
  { label: 'linux-x64', bun: 'bun-linux-x64', nexe: 'linux-x64', out: 'dontpad-linux-x64' },
  { label: 'darwin-arm64', bun: 'bun-darwin-arm64', nexe: 'darwin-arm64', out: 'dontpad-darwin-arm64' },
  { label: 'win-x64', bun: 'bun-windows-x64', nexe: 'windows-x64', out: 'dontpad-win-x64.exe' },
]

if (!existsSync(DIST)) {
  console.error(`ERROR: ${DIST} not found. Run \`npm run build\` first.`)
  process.exit(1)
}

let failures = 0

for (const target of TARGETS) {
  console.log(`\n=== Building ${target.label} ===`)
  let built = false

  try {
    execSync(`bun build ${DIST} --compile --target=${target.bun} --outfile ${target.out}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    console.log(`\n✓ ${target.out} (via bun build --compile)`)
    built = true
  } catch {
    console.warn(`bun failed for ${target.label}, falling back to nexe...`)
  }

  if (!built) {
    try {
      execSync(`npx nexe ${DIST} -o ${target.out} -t ${target.nexe}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      })
      console.log(`\n✓ ${target.out} (via nexe)`)
      built = true
    } catch {
      console.error(`✗ ${target.label}: both bun and nexe failed.`)
      failures += 1
    }
  }
}

if (failures > 0) {
  console.error(`\nERROR: ${failures} target(s) failed.`)
  console.error('  Install bun: curl -fsSL https://bun.sh/install | bash')
  console.error('  Or install nexe: npm install -g nexe')
  process.exit(1)
}

console.log('\n✓ All binaries built.')
