<template>
  <Dialog :open="true" @update:open="(v) => !v && $emit('close')">
    <DialogContent
      class="sm:max-w-md"
      @open-auto-focus.prevent="textInput?.select()"
    >
      <DialogHeader>
        <DialogTitle>Inserir Link</DialogTitle>
      </DialogHeader>
      <div class="mb-3">
        <label class="input-label">Texto do Link</label>
        <input
          ref="textInput"
          v-model="text"
          type="text"
          class="input-field"
          placeholder="Ex: Google"
          @keyup.enter="insert"
        />
      </div>
      <div class="mb-4">
        <label class="input-label">URL / Link</label>
        <input
          v-model="url"
          type="text"
          class="input-field"
          placeholder="https://"
          @keyup.enter="insert"
        />
      </div>
      <DialogFooter>
        <button @click="$emit('close')" class="btn-dialog-cancel">Cancelar</button>
        <button @click="insert" class="btn-dialog-confirm" :disabled="!url">Inserir</button>
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

const props = defineProps<{
  initialText?: string
}>()

const emit = defineEmits<{
  (e: 'insert', text: string, url: string): void
  (e: 'close'): void
}>()

const text = ref(props.initialText ?? '')
const url = ref('https://')
const textInput = ref<HTMLInputElement | null>(null)

function insert() {
  if (!url.value) return
  emit('insert', text.value, url.value)
}
</script>
