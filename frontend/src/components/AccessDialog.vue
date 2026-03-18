<template>
  <Dialog :open="true" @update:open="(v) => !v && $emit('close')">
    <DialogContent
      class="sm:max-w-md"
      @open-auto-focus.prevent="passwordInput?.focus()"
    >
      <DialogHeader>
        <DialogTitle>Documento Protegido</DialogTitle>
      </DialogHeader>
      <div class="mb-3">
        <label class="input-label">Senha para abrir</label>
        <input
          ref="passwordInput"
          v-model="password"
          type="password"
          class="input-field"
          placeholder="Digite a senha"
          @keyup.enter="unlock"
        />
      </div>
      <p v-if="error" class="mb-3 text-xs text-red-600">{{ error }}</p>
      <DialogFooter>
        <button @click="$emit('close')" class="btn-dialog-cancel">Cancelar</button>
        <button @click="unlock" class="btn-dialog-confirm" :disabled="!password.trim()">Abrir</button>
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
  error?: string
}>()

const emit = defineEmits<{
  (e: 'unlock', password: string): void
  (e: 'close'): void
}>()

const password = ref('')
const passwordInput = ref<HTMLInputElement | null>(null)

function unlock() {
  if (!password.value.trim()) return
  emit('unlock', password.value.trim())
}
</script>
