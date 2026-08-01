import { buildCli } from './cli'
import { launchBackgroundUpdateCheck } from './utils/background-update-process'

export interface CliRuntimeDeps {
  buildCli?: typeof buildCli
  launchBackgroundUpdateCheck?: typeof launchBackgroundUpdateCheck
}

export function shouldRunBackgroundUpdateCheck(argv: string[]): boolean {
  const argumentsWithoutRuntime = argv.slice(2)

  return !(
    argumentsWithoutRuntime.includes('--help') ||
    argumentsWithoutRuntime.includes('-h') ||
    argumentsWithoutRuntime.includes('--version') ||
    argumentsWithoutRuntime.includes('-V') ||
    (argumentsWithoutRuntime[0] === 'cli' && argumentsWithoutRuntime[1] === 'update')
  )
}

/** Runs the foreground command without waiting for a best-effort update hint. */
export async function runCli(
  argv: string[] = process.argv,
  dependencies: CliRuntimeDeps = {},
): Promise<void> {
  const createCli = dependencies.buildCli ?? buildCli
  const startBackgroundCheck =
    dependencies.launchBackgroundUpdateCheck ?? launchBackgroundUpdateCheck

  if (shouldRunBackgroundUpdateCheck(argv)) {
    startBackgroundCheck()
  }

  await createCli().parseAsync(argv)
}
