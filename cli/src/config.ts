import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

export interface DontpadCliConfig {
  version: 1
  baseUrl: string
  wsBaseUrl?: string
  masterPassword?: string
}

export interface ConfigAccessOptions {
  configFilePath?: string
  env?: NodeJS.ProcessEnv
}

export interface ConfigUpdateInput {
  baseUrl?: string
  wsBaseUrl?: string
  masterPassword?: string
  clearWsBaseUrl?: boolean
  clearMasterPassword?: boolean
}

const CONFIG_FILE_NAME = 'cli.json'
const CONFIG_DIRECTORY_NAME = 'dontpad'

export function getConfigFilePath(env: NodeJS.ProcessEnv = process.env): string {
  const explicitConfigHome = env.XDG_CONFIG_HOME?.trim()
  const configHome = explicitConfigHome || path.join(os.homedir(), '.config')

  return path.join(configHome, CONFIG_DIRECTORY_NAME, CONFIG_FILE_NAME)
}

export function normalizeBaseUrl(rawBaseUrl: string): string {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(rawBaseUrl)
  } catch {
    throw new Error('Base URL must be a valid absolute URL.')
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Base URL must use the http or https scheme.')
  }

  parsedUrl.hash = ''
  parsedUrl.search = ''
  parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/'

  if (parsedUrl.pathname === '/') {
    return parsedUrl.origin
  }

  return `${parsedUrl.origin}${parsedUrl.pathname}`
}

export function normalizeWsBaseUrl(rawWsBaseUrl: string): string {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(rawWsBaseUrl)
  } catch {
    throw new Error('WebSocket base URL must be a valid absolute URL.')
  }

  if (!['ws:', 'wss:'].includes(parsedUrl.protocol)) {
    throw new Error('WebSocket base URL must use the ws or wss scheme.')
  }

  parsedUrl.hash = ''
  parsedUrl.search = ''
  parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/'

  if (parsedUrl.pathname === '/') {
    return parsedUrl.origin.replace(/^http/, 'ws')
  }

  return `${parsedUrl.origin.replace(/^http/, 'ws')}${parsedUrl.pathname}`
}

export function deriveWsBaseUrl(baseUrl: string): string {
  const parsedUrl = new URL(normalizeBaseUrl(baseUrl))
  parsedUrl.protocol = parsedUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  parsedUrl.hash = ''
  parsedUrl.search = ''

  return normalizeWsBaseUrl(parsedUrl.toString())
}

export function resolveWsBaseUrl(config: Pick<DontpadCliConfig, 'baseUrl' | 'wsBaseUrl'>): string {
  if (config.wsBaseUrl) {
    return normalizeWsBaseUrl(config.wsBaseUrl)
  }

  return deriveWsBaseUrl(config.baseUrl)
}

function resolveConfigFilePath(options: ConfigAccessOptions = {}): string {
  return options.configFilePath ?? getConfigFilePath(options.env)
}

function validateStoredPassword(masterPassword: unknown): string | undefined {
  if (masterPassword === undefined) {
    return undefined
  }

  if (typeof masterPassword !== 'string') {
    throw new Error('Configured master password must be a string when present.')
  }

  if (masterPassword.trim() === '') {
    throw new Error('Configured master password cannot be empty.')
  }

  return masterPassword
}

function parseConfig(rawConfig: string, configFilePath: string): DontpadCliConfig {
  let parsedConfig: unknown

  try {
    parsedConfig = JSON.parse(rawConfig)
  } catch {
    throw new Error(`Failed to parse config file at ${configFilePath}.`)
  }

  if (!parsedConfig || typeof parsedConfig !== 'object') {
    throw new Error(`Config file at ${configFilePath} must contain a JSON object.`)
  }

  const candidateConfig = parsedConfig as {
    version?: unknown
    baseUrl?: unknown
    wsBaseUrl?: unknown
    masterPassword?: unknown
  }

  if (candidateConfig.version !== 1) {
    throw new Error(`Unsupported config version in ${configFilePath}.`)
  }

  if (typeof candidateConfig.baseUrl !== 'string') {
    throw new Error(`Config file at ${configFilePath} is missing a valid baseUrl.`)
  }

  const masterPassword = validateStoredPassword(candidateConfig.masterPassword)
  const wsBaseUrl =
    candidateConfig.wsBaseUrl === undefined
      ? undefined
      : typeof candidateConfig.wsBaseUrl === 'string'
        ? normalizeWsBaseUrl(candidateConfig.wsBaseUrl)
        : (() => {
            throw new Error(`Config file at ${configFilePath} has an invalid wsBaseUrl.`)
          })()

  return {
    version: 1,
    baseUrl: normalizeBaseUrl(candidateConfig.baseUrl),
    ...(wsBaseUrl ? { wsBaseUrl } : {}),
    ...(masterPassword ? { masterPassword } : {}),
  }
}

export async function readConfig(options: ConfigAccessOptions = {}): Promise<DontpadCliConfig | null> {
  const configFilePath = resolveConfigFilePath(options)

  try {
    const rawConfig = await readFile(configFilePath, 'utf8')

    return parseConfig(rawConfig, configFilePath)
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return null
    }

    throw error
  }
}

export async function writeConfig(
  config: DontpadCliConfig,
  options: ConfigAccessOptions = {},
): Promise<string> {
  const configFilePath = resolveConfigFilePath(options)
  const temporaryConfigFilePath = `${configFilePath}.tmp`
  const normalizedConfig: DontpadCliConfig = {
    version: 1,
    baseUrl: normalizeBaseUrl(config.baseUrl),
    ...(config.wsBaseUrl ? { wsBaseUrl: normalizeWsBaseUrl(config.wsBaseUrl) } : {}),
    ...(config.masterPassword ? { masterPassword: config.masterPassword } : {}),
  }

  await mkdir(path.dirname(configFilePath), { recursive: true })
  await writeFile(temporaryConfigFilePath, `${JSON.stringify(normalizedConfig, null, 2)}\n`, 'utf8')
  await rename(temporaryConfigFilePath, configFilePath)

  return configFilePath
}

export async function upsertConfig(
  update: ConfigUpdateInput,
  options: ConfigAccessOptions = {},
): Promise<{ config: DontpadCliConfig; configFilePath: string }> {
  if (update.masterPassword && update.clearMasterPassword) {
    throw new Error('Use either master-password or clear-master-password, not both.')
  }

  if (update.wsBaseUrl && update.clearWsBaseUrl) {
    throw new Error('Use either ws-base-url or clear-ws-base-url, not both.')
  }

  if (update.masterPassword !== undefined && update.masterPassword.trim() === '') {
    throw new Error('Master password cannot be empty when provided.')
  }

  if (update.wsBaseUrl !== undefined && update.wsBaseUrl.trim() === '') {
    throw new Error('WebSocket base URL cannot be empty when provided.')
  }

  const existingConfig = await readConfig(options)
  const baseUrl = update.baseUrl ?? existingConfig?.baseUrl

  if (!baseUrl) {
    throw new Error('Base URL is required the first time you configure the CLI.')
  }

  const masterPassword = update.clearMasterPassword
    ? undefined
    : update.masterPassword ?? existingConfig?.masterPassword
  const wsBaseUrl = update.clearWsBaseUrl
    ? undefined
    : update.wsBaseUrl ?? existingConfig?.wsBaseUrl

  const config: DontpadCliConfig = {
    version: 1,
    baseUrl: normalizeBaseUrl(baseUrl),
    ...(wsBaseUrl ? { wsBaseUrl: normalizeWsBaseUrl(wsBaseUrl) } : {}),
    ...(masterPassword ? { masterPassword } : {}),
  }
  const configFilePath = await writeConfig(config, options)

  return { config, configFilePath }
}

export function formatConfigForDisplay(
  config: DontpadCliConfig,
  options: { revealMasterPassword?: boolean } = {},
): string {
  const { revealMasterPassword = false } = options

  return JSON.stringify(
    {
      version: config.version,
      baseUrl: config.baseUrl,
      wsBaseUrl: config.wsBaseUrl ?? deriveWsBaseUrl(config.baseUrl),
      masterPassword: revealMasterPassword
        ? config.masterPassword ?? null
        : config.masterPassword
          ? '<configured>'
          : null,
    },
    null,
    2,
  )
}