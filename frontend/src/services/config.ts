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
export function getApiBaseUrl(): string {
  if (!import.meta.env.PROD) {
    return 'http://localhost:1234'
  }

  const envUrl = (import.meta.env.VITE_BACKEND_HTTP_URL as string | undefined)?.trim()
  return envUrl || 'http://localhost:1234'
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

  return 'ws://localhost:1234'
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
