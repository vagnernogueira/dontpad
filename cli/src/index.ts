import { runCli } from './runtime'
import { BACKGROUND_UPDATE_ENV } from './utils/background-update-process'
import { runBackgroundUpdateCheck } from './utils/auto-update'

async function main(): Promise<void> {
  if (process.env[BACKGROUND_UPDATE_ENV] === '1') {
    await runBackgroundUpdateCheck()
    return
  }

  await runCli()
}

main().catch((error: unknown) => {
  const errorMessage = error instanceof Error ? error.message : 'Unexpected CLI failure.'

  process.stderr.write(`Error: ${errorMessage}\n`)
  process.exitCode = 1
})
