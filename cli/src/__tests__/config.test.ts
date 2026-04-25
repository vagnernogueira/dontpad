import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { deriveWsBaseUrl, getConfigFilePath, readConfig, upsertConfig } from '../config'

const tempDirectories: string[] = []

async function createTempDirectory(): Promise<string> {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'dontpad-cli-'))
  tempDirectories.push(tempDirectory)

  return tempDirectory
}

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((tempDirectory) => rm(tempDirectory, { recursive: true, force: true })),
  )
})

describe('config persistence', () => {
  it('resolves the config path from XDG_CONFIG_HOME when available', () => {
    const configPath = getConfigFilePath({ XDG_CONFIG_HOME: '/tmp/dontpad-config' })

    expect(configPath).toBe('/tmp/dontpad-config/dontpad/cli.json')
  })

  it('creates and reads the persisted configuration', async () => {
    const tempDirectory = await createTempDirectory()
    const configFilePath = path.join(tempDirectory, 'cli.json')

    const persisted = await upsertConfig(
      {
        baseUrl: 'https://dontpad.example.local/',
        wsBaseUrl: 'wss://sync.example.local/api',
        masterPassword: 'top-secret',
      },
      { configFilePath },
    )

    expect(persisted.config.baseUrl).toBe('https://dontpad.example.local')
    expect(persisted.config.wsBaseUrl).toBe('wss://sync.example.local/api')
    expect(persisted.config.masterPassword).toBe('top-secret')

    await expect(readConfig({ configFilePath })).resolves.toEqual({
      version: 1,
      baseUrl: 'https://dontpad.example.local',
      wsBaseUrl: 'wss://sync.example.local/api',
      masterPassword: 'top-secret',
    })
  })

  it('preserves the base URL while clearing the master password', async () => {
    const tempDirectory = await createTempDirectory()
    const configFilePath = path.join(tempDirectory, 'cli.json')

    await upsertConfig(
      {
        baseUrl: 'https://dontpad.example.local/app/',
        masterPassword: 'temporary',
      },
      { configFilePath },
    )

    const updated = await upsertConfig({ clearMasterPassword: true }, { configFilePath })

    expect(updated.config).toEqual({
      version: 1,
      baseUrl: 'https://dontpad.example.local/app',
    })
  })

  it('derives the WebSocket base URL from the HTTP base URL when not configured', () => {
    expect(deriveWsBaseUrl('https://dontpad.example.local/app')).toBe(
      'wss://dontpad.example.local/app',
    )
    expect(deriveWsBaseUrl('http://localhost:1234')).toBe('ws://localhost:1234')
  })

  it('requires a base URL on first configuration', async () => {
    const tempDirectory = await createTempDirectory()
    const configFilePath = path.join(tempDirectory, 'cli.json')

    await expect(upsertConfig({}, { configFilePath })).rejects.toThrow(
      'Base URL is required the first time you configure the CLI.',
    )
  })
})