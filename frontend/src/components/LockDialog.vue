<template>
  <Dialog :open="true" @update:open="(v) => !v && $emit('close')">
    <DialogContent
      class="sm:max-w-md"
      @open-auto-focus.prevent="passwordInput?.$el?.focus()"
    >
      <DialogHeader>
        <DialogTitle>Travar Documento</DialogTitle>
      </DialogHeader>
      <div class="mb-3">
        <label class="input-label">Senha do Documento</label>
        <Input
          ref="passwordInput"
          v-model="password"
          type="password"
          :placeholder="isLocked ? 'Senha atual ou senha mestre' : 'Digite a senha'"
          @keyup.enter="lock"
        />
      </div>
      <p v-if="error" class="mb-3 text-xs text-red-600">{{ error }}</p>
      <DialogFooter>
        <button class="btn-dialog-cancel" @click="$emit('close')">Cancelar</button>
        <button v-if="isLocked" class="btn-dialog-danger" @click="removeLock">Remover senha</button>
        <button class="btn-dialog-confirm" :disabled="!password.trim()" @click="lock">Travar</button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

defineProps<{
  isLocked: boolean
  error?: string
}>()

const emit = defineEmits<{
  (e: 'lock', password: string): void
  (e: 'remove-lock', password: string): void
  (e: 'close'): void
}>()

const password = ref('')
const passwordInput = ref<{ $el: HTMLInputElement } | null>(null)

function lock() {
  if (!password.value.trim()) return
  emit('lock', password.value.trim())
}

function removeLock() {
  emit('remove-lock', password.value.trim())
}
</script>
