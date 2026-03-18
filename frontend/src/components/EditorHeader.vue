<template>
  <header class="page-header">
    <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
      <router-link to="/" class="page-header-link">
        <ArrowLeft :size="18" />
        <span class="hidden xs:inline">Início</span>
      </router-link>
      <div class="page-header-badge truncate max-w-[120px] sm:max-w-none">
        /{{ documentId }}
      </div>
    </div>
    <div class="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300 shrink-0">
      <CollaboratorAvatars :collaborators="collaborators" @edit-profile="$emit('edit-profile')" />
      <div class="toolbar-divider !bg-gray-700 !mx-1"></div>
      <span :class="['w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm', status === 'connected' ? 'bg-emerald-400' : 'bg-red-400']"></span>
      <span class="hidden sm:inline">{{ status === 'connected' ? 'Sincronizado' : 'Offline' }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import CollaboratorAvatars, { type CollaboratorInfo } from './CollaboratorAvatars.vue'

defineProps<{
  documentId: string
  collaborators: CollaboratorInfo[]
  status: string
}>()

defineEmits<{
  (e: 'edit-profile'): void
}>()
</script>
