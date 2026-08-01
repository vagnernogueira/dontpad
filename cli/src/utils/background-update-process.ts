import { spawn as defaultSpawn } from 'node:child_process'

import { isStandaloneBinary } from './update'

export const BACKGROUND_UPDATE_ENV = 'DONTPAD_CLI_BACKGROUND_UPDATE'

interface BackgroundUpdateRuntime {
  argv: string[]
  execArgv: string[]
  execPath: string
  env: NodeJS.ProcessEnv
}

export interface BackgroundUpdateProcessDeps {
  runtime?: BackgroundUpdateRuntime
  spawn?: typeof defaultSpawn
}

function isTypeScriptRunner(entrypoint: string): boolean {
  return /(?:^|[/\\])(ts-node|tsx)(?:\.cmd)?$/i.test(entrypoint)
}

/**
 * Re-executes this entrypoint in an isolated process. A standalone binary is
 * already its own entrypoint; Node-based invocations need their script (and
 * any loader arguments) forwarded as well.
 */
export function buildBackgroundUpdateArguments(
  runtime: Pick<BackgroundUpdateRuntime, 'argv' | 'execArgv' | 'execPath'> = process,
): string[] {
  if (isStandaloneBinary(runtime.execPath)) {
    return []
  }

  const entrypoint = runtime.argv[1]
  if (!entrypoint) {
    throw new Error('Cannot determine the CLI entrypoint for the background update check.')
  }

  const argumentsForChild = [...runtime.execArgv, entrypoint]
  if (isTypeScriptRunner(entrypoint) && runtime.argv[2]) {
    argumentsForChild.push(runtime.argv[2])
  }

  return argumentsForChild
}

/**
 * The update check must never own the foreground command's event loop. It is
 * launched detached with ignored stdio, then unref'd so a short command can
 * exit even while the check is waiting on DNS, TLS, or GitHub.
 */
export function launchBackgroundUpdateCheck(
  dependencies: BackgroundUpdateProcessDeps = {},
): void {
  const runtime = dependencies.runtime ?? process
  const spawn = dependencies.spawn ?? defaultSpawn

  try {
    const child = spawn(runtime.execPath, buildBackgroundUpdateArguments(runtime), {
      detached: true,
      env: { ...runtime.env, [BACKGROUND_UPDATE_ENV]: '1' },
      stdio: 'ignore',
      windowsHide: true,
    })

    child.once('error', () => undefined)
    child.unref()
  } catch {
    // A background hint must remain best-effort, including when a restricted
    // runtime prevents creating child processes.
  }
}

