<template>
  <Dialog :open="true" @update:open="(v) => !v && $emit('close')">
    <DialogContent
      class="sm:max-w-md"
      @open-auto-focus.prevent="passwordInput?.focus()"
    >
      <DialogHeader>
        <DialogTitle>Travar Documento</DialogTitle>
      </DialogHeader>
      <div class="mb-3">
        <label class="input-label">Senha do Documento</label>
        <input
          ref="passwordInput"
          v-model="password"
          type="password"
          class="input-field"
          :placeholder="isLocked ? 'Senha atual ou senha mestre' : 'Digite a senha'"
          @keyup.enter="lock"
        />
      </div>
      <p v-if="error" class="mb-3 text-xs text-red-600">{{ error }}</p>
      <DialogFooter>
        <button @click="$emit('close')" class="btn-dialog-cancel">Cancelar</button>
        <button v-if="isLocked" @click="removeLock" class="btn-dialog-danger">Remover senha</button>
        <button @click="lock" class="btn-dialog-confirm" :disabled="!password.trim()">Travar</button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
const passwordInput = ref<HTMLInputElement | null>(null)

function lock() {
  if (!password.value.trim()) return
  emit('lock', password.value.trim())
}

function removeLock() {
  emit('remove-lock', password.value.trim())
}
</script>
