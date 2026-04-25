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
      .action(handleConfigWrite),
      `
Examples:
  dontpad config set --base-url http://localhost:1234
  dontpad config set --base-url https://docs.example.com --master-password master
  dontpad config set --ws-base-url wss://ws.example.com/app
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
`,
  )
}