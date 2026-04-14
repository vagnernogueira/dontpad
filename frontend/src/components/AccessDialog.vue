<template>
  <Dialog :open="true" @update:open="(v) => !v && $emit('close')">
    <DialogContent
      class="sm:max-w-md"
      @open-auto-focus.prevent="passwordInput?.$el?.focus()"
    >
      <DialogHeader>
        <DialogTitle>Documento Protegido</DialogTitle>
      </DialogHeader>
      <div class="mb-3">
        <Label for="access-dialog-password" class="mb-1 block text-sm font-normal text-muted-foreground">
          Senha para abrir
        </Label>
        <Input
          id="access-dialog-password"
          ref="passwordInput"
          v-model="password"
          type="password"
          placeholder="Digite a senha"
          @keyup.enter="unlock"
        />
      </div>
      <p v-if="error" class="mb-3 text-xs text-red-600">{{ error }}</p>
      <DialogFooter>
        <Button type="button" variant="ghost" size="sm" class="text-muted-foreground" @click="$emit('close')">
          Cancelar
        </Button>
        <Button type="button" size="sm" :disabled="!password.trim()" @click="unlock">Abrir</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

defineProps<{
  error?: string
}>()

const emit = defineEmits<{
  (e: 'unlock', password: string): void
  (e: 'close'): void
}>()

const password = ref('')
const passwordInput = ref<{ $el: HTMLInputElement } | null>(null)

function unlock() {
  if (!password.value.trim()) return
  emit('unlock', password.value.trim())
}
</script>
