/**
 * Cursor Utilities
 * 
 * Utilities for collaborative cursor representation (colors and names).
 */

/**
 * Predefined colors for user cursors in collaborative editing
 */
export const CURSOR_COLORS = [
  '#30bced', '#6eeb83', '#ffbc42', '#ecd444', '#ee6352',
  '#9ac2c9', '#8acb88', '#1be7ff'
] as const

/**
 * Get a random cursor color
 * @returns Random color from predefined palette
 */
export function getRandomCursorColor(): string {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]
}

/**
 * Generate a random anonymous user name
 * @returns Random name like "Anon 123"
 */
export function getRandomCursorName(): string {
  return `Anon ${Math.floor(Math.random() * 1000)}`
}

/**
 * Get cursor awareness state
 * @param name - User name
 * @param color - Hex color code
 * @returns Awareness state object for Yjs
 */
export function getCursorAwarenessState(name: string, color: string) {
  return {
    name,
    color,
    colorLight: `${color}33` // Add opacity
  }
}

export default {
  CURSOR_COLORS,
  getRandomCursorColor,
  getRandomCursorName,
  getCursorAwarenessState
}
