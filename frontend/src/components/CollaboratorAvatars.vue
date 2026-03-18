<template>
  <div class="collaborator-avatars">
    <button
      v-for="collaborator in collaborators"
      :key="collaborator.profileId || collaborator.clientId"
      class="collaborator-avatar"
      :class="{ 'collaborator-avatar--self': collaborator.isSelf }"
      :title="collaboratorTooltip(collaborator)"
      :style="{ borderColor: collaborator.color }"
      @click="collaborator.isSelf && $emit('edit-profile')"
    >
      <span class="collaborator-avatar-emoji">{{ collaborator.emoji || '👤' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
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

function collaboratorTooltip(c: CollaboratorInfo): string {
  const parts = [c.name]
  if (c.deviceType) parts.push(c.deviceType === 'mobile' ? '📱' : '🖥️')
  if (c.ip) parts.push(c.ip)
  return parts.join(' · ')
}
</script>