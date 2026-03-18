<template>
  <div class="collaborator-avatars">
    <button
      v-for="collaborator in collaborators"
      :key="collaborator.profileId || collaborator.clientId"
      class="collaborator-avatar"
      :class="{ 'collaborator-avatar--self': collaborator.isSelf }"
      :title="collaborator.name"
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
  isSelf: boolean
}

defineProps<{
  collaborators: CollaboratorInfo[]
}>()

defineEmits<{
  (e: 'edit-profile'): void
}>()
</script>
