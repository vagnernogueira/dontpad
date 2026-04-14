import { afterEach, describe, expect, it, vi } from 'vitest'

function setWindowLocation(origin: string) {
  Object.defineProperty(window, 'location', {
    value: new URL(origin),
    configurable: true,
  })
}

describe('config service', () => {
  const originalEnv = { ...import.meta.env }
  const originalLocation = window.location

  afterEach(() => {
    Object.assign(import.meta.env, originalEnv)
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
    })
    vi.resetModules()
  })

  it('uses same-origin HTTP and WS defaults in production when env vars are absent', async () => {
    Object.assign(import.meta.env, {
      PROD: true,
      VITE_BACKEND_HTTP_URL: '',
      VITE_BACKEND_WS_URL: '',
    })
    setWindowLocation('https://dontpad.vagnernogueira.com/explorer')

    const { getApiBaseUrl, getWsBaseUrl } = await import('../../services/config')

    expect(getApiBaseUrl()).toBe('https://dontpad.vagnernogueira.com')
    expect(getWsBaseUrl()).toBe('wss://dontpad.vagnernogueira.com/api')
  })

  it('preserves explicit production backend URLs when provided', async () => {
    Object.assign(import.meta.env, {
      PROD: true,
      VITE_BACKEND_HTTP_URL: 'https://api.example.com',
      VITE_BACKEND_WS_URL: 'wss://ws.example.com/api',
    })
    setWindowLocation('https://dontpad.vagnernogueira.com/teste')

    const { getApiBaseUrl, getWsBaseUrl } = await import('../../services/config')

    expect(getApiBaseUrl()).toBe('https://api.example.com')
    expect(getWsBaseUrl()).toBe('wss://ws.example.com/api')
  })
})