/**
 * useCollaborators composable
 *
 * Tracks connected collaborators via Yjs awareness and exposes a
 * reactive `collaborators` list plus profile-update helpers.
 */

import { ref } from 'vue'
import type { WebsocketProvider } from 'y-websocket'
import {
  getOrCreateProfile,
  updateProfile as persistProfile,
  updateProfileIp,
  fetchClientIp,
  getProfileAwarenessState,
  type CollaboratorProfile,
} from '../cm-utils/cursor'

/** Mirrors the CollaboratorInfo interface from CollaboratorAvatars.vue */
export interface CollaboratorInfo {
  clientId: number
  profileId?: string
  name: string
  emoji?: string
  color: string
  deviceType?: string
  ip?: string
  isSelf: boolean
}

export function useCollaborators(apiBaseUrl: string) {
  const myProfile = ref<CollaboratorProfile>(getOrCreateProfile())
  const collaborators = ref<CollaboratorInfo[]>([])

  let currentProvider: WebsocketProvider | null = null

  /**
   * Start tracking collaborators on a given provider.
   * Should be called after the provider is created.
   */
  function bind(provider: WebsocketProvider) {
    currentProvider = provider

    // Set initial awareness state
    provider.awareness.setLocalStateField('user', getProfileAwarenessState(myProfile.value))

    // Fetch IP and update
    fetchClientIp(apiBaseUrl).then(ip => {
      if (ip) {
        myProfile.value = updateProfileIp(ip)
        provider.awareness.setLocalStateField('user', getProfileAwarenessState(myProfile.value))
      }
    })

    // Track awareness changes
    const updateCollaborators = () => {
      const states = provider.awareness.getStates()
      const localClientId = provider.awareness.clientID
      const result: CollaboratorInfo[] = []

      states.forEach((state, clientId) => {
        if (!state.user) return
        result.push({
          clientId,
          profileId: state.user.profileId,
          name: state.user.name || 'Anônimo',
          emoji: state.user.emoji,
          color: state.user.color || '#999',
          deviceType: state.user.deviceType,
          ip: state.user.ip,
          isSelf: clientId === localClientId,
        })
      })

      // Self first, then others
      result.sort((a, b) => (a.isSelf ? -1 : b.isSelf ? 1 : 0))
      collaborators.value = result
    }

    provider.awareness.on('change', updateCollaborators)
    updateCollaborators()
  }

  /**
   * Called when the user edits their profile (name/emoji).
   */
  function saveProfile(data: { name: string; emoji: string }) {
    myProfile.value = persistProfile(data)
    if (currentProvider) {
      currentProvider.awareness.setLocalStateField('user', getProfileAwarenessState(myProfile.value))
    }
  }

  return { myProfile, collaborators, bind, saveProfile }
}
