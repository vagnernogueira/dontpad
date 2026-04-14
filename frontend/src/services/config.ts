/**
 * Config Service
 * 
 * Centralized configuration for API URLs and environment settings.
 * Provides a single source of truth for runtime configuration.
 */

/**
 * Get API base URL based on environment
 * @returns HTTP API base URL
 */
function getBrowserOrigin(): string | null {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return null
  }

  return window.location.origin
}

function getDefaultApiBaseUrl(): string {
  return getBrowserOrigin() || 'http://localhost:1234'
}

function getDefaultWsBaseUrl(): string {
  const origin = getBrowserOrigin()
  if (!origin) {
    return 'ws://localhost:1234'
  }

  const url = new URL(origin)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  url.pathname = '/api'
  url.search = ''
  url.hash = ''

  return url.toString().replace(/\/$/, '')
}

export function getApiBaseUrl(): string {
  if (!import.meta.env.PROD) {
    return 'http://localhost:1234'
  }

  const envUrl = (import.meta.env.VITE_BACKEND_HTTP_URL as string | undefined)?.trim()
  return envUrl || getDefaultApiBaseUrl()
}

/**
 * Get WebSocket base URL based on environment
 * @returns WebSocket base URL
 */
export function getWsBaseUrl(): string {
  if (!import.meta.env.PROD) {
    return 'ws://localhost:1234'
  }

  const explicitUrl = (import.meta.env.VITE_BACKEND_WS_URL as string | undefined)?.trim()
  if (explicitUrl) {
    return explicitUrl
  }

  return getDefaultWsBaseUrl()
}

/**
 * Configuration object
 */
export const config = {
  api: getApiBaseUrl(),
  ws: getWsBaseUrl()
}

export default {
  getApiBaseUrl,
  getWsBaseUrl,
  config
}
