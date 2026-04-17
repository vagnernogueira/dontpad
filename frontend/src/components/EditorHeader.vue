<template>
  <header class="z-20 flex items-center justify-between border-b border-border bg-background px-3 py-btn text-foreground shadow-md sm:px-5 sm:py-header">
    <div class="flex items-center gap-0 min-w-0 flex-1 sm:gap-0">
      <router-link
        to="/"
        class="flex shrink-0 items-center gap-1 transition-colors hover:text-primary"
      >
        <ArrowLeft :size="18" />
        <span class="hidden rounded-md border border-transparent px-2 py-1 text-xs font-medium xs:inline sm:px-3 sm:text-sm">Início</span>
      </router-link>
      <Badge variant="secondary" class="mr-2 max-w-[120px] shrink-0 truncate rounded-md border-primary/20 px-2 py-1 font-mono text-xs sm:mr-4 sm:max-w-none sm:px-3 sm:text-sm">
        /{{ documentId }}
      </Badge>
    </div>
    <div class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
      <CollaboratorAvatars :collaborators="collaborators" @edit-profile="$emit('edit-profile')" />
      <Separator orientation="vertical" class="mx-1 h-5 shrink-0" />
      <Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground hover:bg-accent hover:text-accent-foreground" :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'" @click="toggle">
        <Sun v-if="isDark" :size="16" />
        <Moon v-else :size="16" />
      </Button>
      <Separator orientation="vertical" class="mx-1 h-5 shrink-0" />
      <span :class="['h-2 w-2 rounded-full shadow-xs sm:h-2.5 sm:w-2.5', status === 'connected' ? 'bg-primary' : 'bg-destructive']"></span>
      <span class="hidden sm:inline">{{ status === 'connected' ? 'Sincronizado' : 'Offline' }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ArrowLeft, Moon, Sun } from 'lucide-vue-next'
import CollaboratorAvatars, { type CollaboratorInfo } from './CollaboratorAvatars.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useColorMode } from '../composables/useColorMode'

const { isDark, toggle } = useColorMode()

defineProps<{
  documentId: string
  collaborators: CollaboratorInfo[]
  status: string
}>()

defineEmits<{
  (e: 'edit-profile'): void
}>()

</script>
