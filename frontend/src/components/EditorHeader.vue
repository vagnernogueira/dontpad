<template>
  <header class="z-20 flex items-center justify-between bg-gray-900 px-3 py-btn text-gray-100 shadow-md sm:px-5 sm:py-header">
    <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
      <router-link
        to="/"
        class="flex shrink-0 items-center gap-1 text-base font-bold transition-colors hover:text-white sm:text-lg"
      >
        <ArrowLeft :size="18" />
        <span class="hidden xs:inline">Início</span>
      </router-link>
      <Badge variant="secondary" class="font-mono bg-gray-800 text-gray-300 border-gray-700 rounded-md text-xs sm:text-sm px-2 sm:px-3 py-1 shrink-0 truncate max-w-[120px] sm:max-w-none">
        /{{ documentId }}
      </Badge>
    </div>
    <div class="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300 shrink-0">
      <CollaboratorAvatars :collaborators="collaborators" @edit-profile="$emit('edit-profile')" />
      <Separator orientation="vertical" class="h-5 mx-1 bg-gray-700 shrink-0" />
      <!-- dark mode toggle: temporariamente desativado
      <Button variant="ghost" size="icon" class="text-gray-300 hover:text-white hover:bg-white/10 h-7 w-7" :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'" @click="toggle">
        <Sun v-if="isDark" :size="16" />
        <Moon v-else :size="16" />
      </Button>
      <Separator orientation="vertical" class="h-5 mx-1 bg-gray-700 shrink-0" />
      -->
      <span :class="['w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-xs', status === 'connected' ? 'bg-emerald-400' : 'bg-red-400']"></span>
      <span class="hidden sm:inline">{{ status === 'connected' ? 'Sincronizado' : 'Offline' }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import CollaboratorAvatars, { type CollaboratorInfo } from './CollaboratorAvatars.vue'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

defineProps<{
  documentId: string
  collaborators: CollaboratorInfo[]
  status: string
}>()

defineEmits<{
  (e: 'edit-profile'): void
}>()

</script>
