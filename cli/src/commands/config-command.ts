import { Command } from 'commander'

import {
  formatConfigForDisplay,
  getConfigFilePath,
  readConfig,
  upsertConfig,
} from '../config'
import { withStructuredHelp } from '../help'

interface ConfigWriteOptions {
  baseUrl?: string
  wsBaseUrl?: string
  masterPassword?: string
  clearWsBaseUrl?: boolean
  clearMasterPassword?: boolean
  autoUpdateEnabled?: boolean
  autoUpdateInterval?: number
}

function parseAutoUpdateEnabled(value: string): boolean {
  if (value === 'true') {
    return true
  }
  if (value === 'false') {
    return false
  }

  throw new Error('auto-update-enabled must be true or false.')
}

function parseAutoUpdateInterval(value: string): number {
  const interval = Number(value)

  if (!Number.isInteger(interval)) {
    throw new Error('auto-update-interval must be a whole number of hours.')
  }

  return interval
}

interface ConfigShowOptions {
  revealMasterPassword?: boolean
}

async function handleConfigWrite(options: ConfigWriteOptions): Promise<void> {
  const { config, configFilePath } = await upsertConfig({
    baseUrl: options.baseUrl,
    wsBaseUrl: options.wsBaseUrl,
    masterPassword: options.masterPassword,
    clearWsBaseUrl: options.clearWsBaseUrl,
    clearMasterPassword: options.clearMasterPassword,
    autoUpdateEnabled: options.autoUpdateEnabled,
    autoUpdateInterval: options.autoUpdateInterval,
  })

  process.stdout.write(`Config saved to ${configFilePath}\n`)
  process.stdout.write(`${formatConfigForDisplay(config)}\n`)
}

export function buildConfigCommand(): Command {
  const configCommand = new Command('config').description(
    'Create, inspect or update the persisted CLI configuration used by read and write commands.',
  )

  for (const subcommandName of ['set', 'init']) {
    withStructuredHelp(
      configCommand
      .command(subcommandName)
      .description('Create or update the local CLI configuration file.')
      .option('--base-url <url>', 'Base URL of the Dontpad instance.')
      .option(
        '--ws-base-url <url>',
        'Optional explicit WebSocket base URL. Use this only when it cannot be derived from baseUrl.',
      )
      .option(
        '--master-password <password>',
        'Master password for administrative or protected document operations.',
      )
      .option('--clear-ws-base-url', 'Remove the persisted explicit WebSocket base URL override.')
      .option('--clear-master-password', 'Remove the stored master password.')
      .option(
        '--auto-update-enabled <true|false>',
        'Enable or disable the best-effort background CLI update check.',
        parseAutoUpdateEnabled,
      )
      .option(
        '--auto-update-interval <hours>',
        'Hours between background update checks (1 to 8760).',
        parseAutoUpdateInterval,
      )
      .action(handleConfigWrite),
      `
Examples:
  dontpad config set --base-url http://localhost:1234
  dontpad config set --base-url https://docs.example.com --master-password master
  dontpad config set --ws-base-url wss://ws.example.com/app
  dontpad config set --auto-update-enabled false
  dontpad config set --auto-update-interval 72
`,
    )
  }

  configCommand
    .command('show')
    .description('Print the current configuration. Sensitive values are redacted by default.')
    .option('--reveal-master-password', 'Show the raw master password value in the output.')
    .action(async (options: ConfigShowOptions) => {
      const config = await readConfig()

      if (!config) {
        throw new Error(
          `CLI is not configured yet. Run "dontpad config set --base-url <url>" first. Expected file: ${getConfigFilePath()}`,
        )
      }

      process.stdout.write(
        `${formatConfigForDisplay(config, {
          revealMasterPassword: options.revealMasterPassword,
        })}\n`,
      )
    })

  configCommand
    .command('path')
    .description('Print the path used for the CLI configuration file.')
    .action(() => {
      process.stdout.write(`${getConfigFilePath()}\n`)
    })

  return withStructuredHelp(
    configCommand,
    `
Examples:
  dontpad config set --base-url http://localhost:1234
  dontpad config set --base-url https://docs.example.com/app --ws-base-url wss://ws.example.com/app
  dontpad config show

Notes:
  baseUrl is required the first time.
  wsBaseUrl is optional. When omitted, the CLI derives ws:// or wss:// from baseUrl.
  Background update checks are enabled every 24 hours by default; set auto-update-enabled false to disable them.
`,
  )
}