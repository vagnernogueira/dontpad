<template>
  <Dialog :open="true" @update:open="(v) => !v && $emit('close')">
    <DialogContent
      motion-preset="top-right"
      class="sm:max-w-sm"
      @open-auto-focus.prevent="nameInput?.$el?.select()"
    >
      <DialogHeader>
        <DialogTitle>Meu Perfil</DialogTitle>
      </DialogHeader>

      <!-- Emoji picker -->
      <div class="mb-4">
        <Label class="mb-2 block text-sm font-normal text-muted-foreground">
          Escolha seu avatar
        </Label>
        <div class="grid max-h-40 grid-cols-8 gap-1.5 overflow-y-auto rounded-md border border-border bg-muted p-1">
          <button
            v-for="animal in ANIMAL_EMOJIS"
            :key="animal"
            class="flex h-8 w-8 items-center justify-center rounded text-lg transition-colors hover:bg-accent"
            :class="{ 'bg-primary text-primary-foreground ring-2 ring-primary': selectedEmoji === animal }"
            @click="selectedEmoji = animal"
          >
            {{ animal }}
          </button>
        </div>
      </div>

      <!-- Name input -->
      <div class="mb-4">
        <Label for="profile-dialog-name" class="mb-1 block text-sm font-normal text-muted-foreground">
          Nome exibido
        </Label>
        <Input
          id="profile-dialog-name"
          ref="nameInput"
          v-model="editName"
          type="text"
          placeholder="Seu nome"
          maxlength="30"
          @keyup.enter="save"
        />
      </div>

      <!-- Telemetry info -->
      <div v-if="profile" class="mb-4 space-y-0.5 text-xs text-muted-foreground">
        <p>ID: <span class="font-mono">{{ profile.id.slice(0, 8) }}…</span></p>
        <p>Primeira sessão: {{ formatDate(profile.joinedAt) }}</p>
        <p>Dispositivo: {{ profile.deviceType === 'mobile' ? '📱 Mobile' : '🖥️ Desktop' }}</p>
        <p v-if="profile.ip">IP: <span class="font-mono">{{ profile.ip }}</span></p>
      </div>

      <DialogFooter>
        <Button type="button" variant="ghost" size="sm" class="text-muted-foreground" @click="$emit('close')">
          Cancelar
        </Button>
        <Button type="button" size="sm" :disabled="!editName.trim()" @click="save">Salvar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ANIMAL_EMOJIS, type CollaboratorProfile } from '../cm-utils/cursor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const props = defineProps<{
  profile: CollaboratorProfile
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: { name: string; emoji: string }): void
}>()

const editName = ref(props.profile.name)
const selectedEmoji = ref(props.profile.emoji)
const nameInput = ref<{ $el: HTMLInputElement } | null>(null)

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return iso
  }
}

function save() {
  const name = editName.value.trim()
  if (!name) return
  emit('save', { name, emoji: selectedEmoji.value })
}
</script>
