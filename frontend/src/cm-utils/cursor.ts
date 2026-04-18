/**
 * Cursor Utilities
 * 
 * Utilities for collaborative cursor representation (colors, names, profiles).
 */

import * as persistence from '../services/persistence'

/**
 * Predefined colors for user cursors in collaborative editing
 */
export const CURSOR_COLORS = [
  '#30bced', '#6eeb83', '#ffbc42', '#ecd444', '#ee6352',
  '#9ac2c9', '#8acb88', '#1be7ff'
] as const

/**
 * Animal emojis for collaborator profiles
 */
export const ANIMAL_EMOJIS = [
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
  '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
  '🐧', '🐦', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
  '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐢',
  '🐍', '🦎', '🐙', '🦑', '🦐', '🦀', '🐡', '🐠',
  '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐘', '🦏'
] as const

/**
 * Curated funny-face emojis for the toolbar shortcut.
 */
export const FUNNY_FACE_EMOJIS = [
  '😀', '😄', '😆', '😎', '😛', '😜', '🤪', '😹',
  '🥳', '🤠', '🥸', '😵‍💫', '🤓', '😇', '🙃', '😏'
] as const

/** Profile data stored in localStorage and shared via awareness */
export interface CollaboratorProfile {
  id: string
  name: string
  emoji: string
  color: string
  joinedAt: string
  deviceType: 'mobile' | 'desktop'
  ip: string
}

const PROFILE_KEY = 'collaborator.profile'

/**
 * Generate a short random UUID-like id
 */
function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Get a random cursor color
 * @returns Random color from predefined palette
 */
export function getRandomCursorColor(): string {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]
}

/**
 * Get a random animal emoji
 * @returns Random emoji from predefined palette
 */
export function getRandomAnimalEmoji(): string {
  return ANIMAL_EMOJIS[Math.floor(Math.random() * ANIMAL_EMOJIS.length)]
}

/**
 * Get a random funny face emoji.
 */
export function getRandomFunnyFaceEmoji(): string {
  return FUNNY_FACE_EMOJIS[Math.floor(Math.random() * FUNNY_FACE_EMOJIS.length)]
}

/**
 * Generate a random anonymous user name
 * @returns Random name like "Anon 123"
 */
export function getRandomCursorName(): string {
  return `Anon ${Math.floor(Math.random() * 1000)}`
}

/**
 * Detect device type based on user agent
 */
export function detectDeviceType(): 'mobile' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop'
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    ? 'mobile'
    : 'desktop'
}

/**
 * Fetch the client's IP from the backend
 */
export async function fetchClientIp(apiBaseUrl: string): Promise<string> {
  try {
    const res = await fetch(`${apiBaseUrl}/api/client-info`)
    if (!res.ok) return ''
    const data = await res.json()
    return data.ip || ''
  } catch {
    return ''
  }
}

/**
 * Load or create a collaborator profile.
 * Persists to localStorage so identity survives reloads.
 */
export function getOrCreateProfile(): CollaboratorProfile {
  const stored = persistence.get<CollaboratorProfile | null>(PROFILE_KEY, null)
  if (stored && stored.id && stored.emoji && stored.name && stored.color) {
    // Always refresh device type on load
    const deviceType = detectDeviceType()
    if (stored.deviceType !== deviceType) {
      stored.deviceType = deviceType
      persistence.set(PROFILE_KEY, stored)
    }
    return stored
  }

  const profile: CollaboratorProfile = {
    id: generateId(),
    name: getRandomCursorName(),
    emoji: getRandomAnimalEmoji(),
    color: getRandomCursorColor(),
    joinedAt: new Date().toISOString(),
    deviceType: detectDeviceType(),
    ip: ''
  }
  persistence.set(PROFILE_KEY, profile)
  return profile
}

/**
 * Update the collaborator profile and persist it.
 */
export function updateProfile(patch: Partial<Pick<CollaboratorProfile, 'name' | 'emoji'>>): CollaboratorProfile {
  const current = getOrCreateProfile()
  const updated: CollaboratorProfile = {
    ...current,
    ...patch
  }
  persistence.set(PROFILE_KEY, updated)
  return updated
}

/**
 * Update the IP in the profile and persist.
 */
export function updateProfileIp(ip: string): CollaboratorProfile {
  const current = getOrCreateProfile()
  if (current.ip !== ip) {
    current.ip = ip
    persistence.set(PROFILE_KEY, current)
  }
  return current
}

/**
 * Get cursor awareness state
 * @returns Awareness state object for Yjs
 */
export function getCursorAwarenessState(name: string, color: string, emoji?: string, profileId?: string, deviceType?: string, ip?: string) {
  return {
    name,
    color,
    colorLight: `${color}33`,
    ...(emoji ? { emoji } : {}),
    ...(profileId ? { profileId } : {}),
    ...(deviceType ? { deviceType } : {}),
    ...(ip ? { ip } : {})
  }
}

/**
 * Build awareness state from a full profile
 */
export function getProfileAwarenessState(profile: CollaboratorProfile) {
  return getCursorAwarenessState(profile.name, profile.color, profile.emoji, profile.id, profile.deviceType, profile.ip)
}

export default {
  CURSOR_COLORS,
  ANIMAL_EMOJIS,
  FUNNY_FACE_EMOJIS,
  getRandomCursorColor,
  getRandomAnimalEmoji,
  getRandomFunnyFaceEmoji,
  getRandomCursorName,
  getOrCreateProfile,
  updateProfile,
  updateProfileIp,
  detectDeviceType,
  fetchClientIp,
  getCursorAwarenessState,
  getProfileAwarenessState
}
