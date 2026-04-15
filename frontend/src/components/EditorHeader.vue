<template>
  <header class="z-20 flex items-center justify-between border-b border-border bg-foreground px-3 py-btn text-background shadow-md sm:px-5 sm:py-header">
    <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
      <router-link
        to="/"
        class="flex shrink-0 items-center gap-1 text-base font-bold transition-colors hover:text-primary sm:text-lg"
      >
        <ArrowLeft :size="18" />
        <span class="hidden xs:inline">Início</span>
      </router-link>
      <Badge variant="secondary" class="max-w-[120px] shrink-0 truncate rounded-md px-2 py-1 font-mono text-xs sm:max-w-none sm:px-3 sm:text-sm">
        /{{ documentId }}
      </Badge>
    </div>
    <div class="flex shrink-0 items-center gap-1 text-xs sm:gap-2 sm:text-sm text-background">
      <CollaboratorAvatars :collaborators="collaborators" @edit-profile="$emit('edit-profile')" />
      <Separator orientation="vertical" class="mx-1 h-5 shrink-0 bg-white/15" />
      <!-- dark mode toggle: temporariamente desativado
      <Button variant="ghost" size="icon" class="text-gray-300 hover:text-white hover:bg-white/10 h-7 w-7" :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'" @click="toggle">
        <Sun v-if="isDark" :size="16" />
        <Moon v-else :size="16" />
      </Button>
      <Separator orientation="vertical" class="h-5 mx-1 bg-gray-700 shrink-0" />
      -->
      <span :class="['h-2 w-2 rounded-full shadow-xs sm:h-2.5 sm:w-2.5', status === 'connected' ? 'bg-primary' : 'bg-destructive']"></span>
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
