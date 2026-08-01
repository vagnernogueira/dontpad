import { describe, expect, it, vi } from 'vitest'

import { runCli } from '../runtime'
import {
  BACKGROUND_UPDATE_ENV,
  launchBackgroundUpdateCheck,
} from '../utils/background-update-process'

describe('background update process isolation', () => {
  it('detaches and unrefs the check so a quick foreground command is not kept alive', async () => {
    const child = {
      once: vi.fn(),
      unref: vi.fn(),
    }
    const spawn = vi.fn(() => child)

    launchBackgroundUpdateCheck({
      runtime: {
        argv: ['/usr/bin/node', '/tmp/dontpad-cli.js'],
        execArgv: [],
        execPath: '/usr/bin/node',
        env: { KEEP: 'value' },
      },
      spawn: spawn as never,
    })

    expect(spawn).toHaveBeenCalledWith(
      '/usr/bin/node',
      ['/tmp/dontpad-cli.js'],
      expect.objectContaining({
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
        env: { KEEP: 'value', [BACKGROUND_UPDATE_ENV]: '1' },
      }),
    )
    expect(child.unref).toHaveBeenCalledOnce()

    const parseAsync = vi.fn(async () => undefined)
    const launch = vi.fn()

    await runCli(['/usr/bin/node', '/tmp/dontpad-cli.js', 'get', 'me/todo'], {
      buildCli: () => ({ parseAsync }) as never,
      launchBackgroundUpdateCheck: launch,
    })

    expect(launch).toHaveBeenCalledOnce()
    expect(parseAsync).toHaveBeenCalledOnce()
  })

  it('does not launch a background process for the explicit self-update command', async () => {
    const parseAsync = vi.fn(async () => undefined)
    const launch = vi.fn()

    await runCli(['/usr/bin/node', '/tmp/dontpad-cli.js', 'cli', 'update', '--yes'], {
      buildCli: () => ({ parseAsync }) as never,
      launchBackgroundUpdateCheck: launch,
    })

    expect(launch).not.toHaveBeenCalled()
    expect(parseAsync).toHaveBeenCalledOnce()
  })
})
