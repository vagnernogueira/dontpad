<template>
  <div class="collaborator-avatars">
    <button
      v-for="collaborator in collaborators"
      :key="collaborator.profileId || collaborator.clientId"
      class="collaborator-avatar"
      :class="[
        collaboratorColorClass(collaborator.color),
        { 'collaborator-avatar--self': collaborator.isSelf },
      ]"
      :title="collaboratorTooltip(collaborator)"
      @click="collaborator.isSelf && $emit('edit-profile')"
    >
      <span class="collaborator-avatar-emoji">{{ collaborator.emoji || '👤' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { CURSOR_COLORS } from '../cm-utils/cursor'

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

defineProps<{
  collaborators: CollaboratorInfo[]
}>()

defineEmits<{
  (e: 'edit-profile'): void
}>()

const collaboratorColorClassMap: ReadonlyMap<string, string> = new Map(
  CURSOR_COLORS.map((color, index) => [color, `collaborator-avatar--tone-${index}`]),
)

function collaboratorTooltip(c: CollaboratorInfo): string {
  const parts = [c.name]
  if (c.deviceType) parts.push(c.deviceType === 'mobile' ? '📱' : '🖥️')
  if (c.ip) parts.push(c.ip)
  return parts.join(' · ')
}

function collaboratorColorClass(color: string): string {
  return collaboratorColorClassMap.get(color) ?? 'collaborator-avatar--tone-fallback'
}
</script>