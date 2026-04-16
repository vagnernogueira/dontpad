<template>
  <Dialog :open="true" @update:open="(v) => !v && $emit('close')">
    <DialogContent
      class="sm:max-w-md"
      @open-auto-focus.prevent="passwordInput?.$el?.focus()"
      @close-auto-focus.prevent
    >
      <DialogHeader>
        <DialogTitle>Travar Documento</DialogTitle>
      </DialogHeader>
      <div class="mb-3">
        <Label for="lock-dialog-password" class="mb-1 block text-sm font-normal text-muted-foreground">
          Senha do Documento
        </Label>
        <Input
          id="lock-dialog-password"
          ref="passwordInput"
          v-model="password"
          type="password"
          :placeholder="isLocked ? 'Senha atual ou senha mestre' : 'Digite a senha'"
          @keyup.enter="lock"
        />
      </div>
      <p v-if="error" class="mb-3 text-xs text-red-600">{{ error }}</p>
      <DialogFooter>
        <Button type="button" variant="ghost" size="sm" class="text-muted-foreground" @click="$emit('close')">
          Cancelar
        </Button>
        <Button v-if="isLocked" type="button" variant="destructive" size="sm" @click="removeLock">
          Remover senha
        </Button>
        <Button type="button" size="sm" :disabled="!password.trim()" @click="lock">Travar</Button>
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
