<template>
  <div class="flex items-center">
    <button
      v-for="collaborator in collaborators"
      :key="collaborator.profileId || collaborator.clientId"
      type="button"
      class="group -ml-2 first:ml-0 focus-visible:outline-hidden"
      :class="[
        collaboratorButtonClass(collaborator),
        { 'cursor-default': !collaborator.isSelf },
      ]"
      :title="collaboratorTooltip(collaborator)"
      :aria-label="collaboratorTooltip(collaborator)"
      @click="collaborator.isSelf && $emit('edit-profile')"
    >
      <Avatar
        :class="[
          'size-8 border-2 border-background shadow-xs transition-transform group-hover:scale-[1.03] sm:size-9',
          collaboratorToneClass(collaborator.color),
          collaborator.isSelf
            ? 'ring-2 ring-primary ring-offset-1 ring-offset-foreground'
            : 'ring-1 ring-background',
        ]"
      >
        <AvatarFallback class="bg-transparent text-sm leading-none text-current sm:text-base">
          {{ collaborator.emoji || '👤' }}
        </AvatarFallback>
      </Avatar>
    </button>
  </div>
</template>

<script setup lang="ts">
import { CURSOR_COLORS } from '../cm-utils/cursor'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

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

const collaboratorToneClasses = [
  'bg-cyan-300 text-cyan-950',
  'bg-violet-300 text-violet-950',
  'bg-emerald-300 text-emerald-950',
  'bg-amber-300 text-amber-950',
  'bg-rose-300 text-rose-950',
  'bg-sky-300 text-sky-950',
] as const

const collaboratorToneFallbackClass = 'bg-slate-300 text-slate-950'

const collaboratorToneClassMap: ReadonlyMap<string, string> = new Map(
  CURSOR_COLORS.map((color, index) => [color, collaboratorToneClasses[index] ?? collaboratorToneFallbackClass]),
)

function collaboratorTooltip(c: CollaboratorInfo): string {
  const parts = [c.name]
  if (c.deviceType) parts.push(c.deviceType === 'mobile' ? '📱' : '🖥️')
  if (c.ip) parts.push(c.ip)
  return parts.join(' · ')
}

function collaboratorToneClass(color: string): string {
  return collaboratorToneClassMap.get(color) ?? collaboratorToneFallbackClass
}

function collaboratorButtonClass(collaborator: CollaboratorInfo): string {
  return collaborator.isSelf ? 'cursor-pointer rounded-full' : 'rounded-full'
}
</script>