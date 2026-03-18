<template>
  <BaseDialog title="Documento Protegido" @close="$emit('close')">
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
    <template #actions>
      <button @click="$emit('close')" class="btn-dialog-cancel">Cancelar</button>
      <button @click="unlock" class="btn-dialog-confirm" :disabled="!password.trim()">Abrir</button>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import BaseDialog from './BaseDialog.vue'

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

onMounted(async () => {
  await nextTick()
  passwordInput.value?.focus()
})
</script>
