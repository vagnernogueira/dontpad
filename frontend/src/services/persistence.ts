/**
 * Persistence Service
 * 
 * Abstraction over localStorage for editor preferences.
 * Provides type-safe storage with default values and namespacing.
 */

const NAMESPACE = 'dontpad'

/**
 * Get a preference value from localStorage
 * @param key - Preference key (will be namespaced automatically)
 * @param defaultValue - Default value if key doesn't exist
 * @returns The stored value or default value
 */
export function get<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue

  try {
    const fullKey = `${NAMESPACE}:${key}`
    const stored = window.localStorage.getItem(fullKey)
    
    if (stored === null) return defaultValue
    
    // Handle boolean values
    if (typeof defaultValue === 'boolean') {
      return (stored === 'true') as T
    }
    
    // Handle number values
    if (typeof defaultValue === 'number') {
      const parsed = Number(stored)
      return (isNaN(parsed) ? defaultValue : parsed) as T
    }
    
    // Handle JSON objects/arrays
    if (typeof defaultValue === 'object') {
      try {
        return JSON.parse(stored) as T
      } catch {
        return defaultValue
      }
    }
    
    // Default: return as string
    return stored as T
  } catch {
    return defaultValue
  }
}

/**
 * Set a preference value in localStorage
 * @param key - Preference key (will be namespaced automatically)
 * @param value - Value to store
 */
export function set<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return

  try {
    const fullKey = `${NAMESPACE}:${key}`
    
    if (typeof value === 'object') {
      window.localStorage.setItem(fullKey, JSON.stringify(value))
    } else {
      window.localStorage.setItem(fullKey, String(value))
    }
  } catch (error) {
    console.error('Failed to persist preference:', key, error)
  }
}

/**
 * Remove a preference from localStorage
 * @param key - Preference key (will be namespaced automatically)
 */
export function remove(key: string): void {
  if (typeof window === 'undefined') return

  try {
    const fullKey = `${NAMESPACE}:${key}`
    window.localStorage.removeItem(fullKey)
  } catch (error) {
    console.error('Failed to remove preference:', key, error)
  }
}

/**
 * Default export with all methods
 */
export default {
  get,
  set,
  remove
}
