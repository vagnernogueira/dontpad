<template>
  <Dialog :open="true" @update:open="(v) => !v && $emit('close')">
    <DialogContent
      class="sm:max-w-md"
      @open-auto-focus.prevent="textInput?.$el?.select()"
    >
      <DialogHeader>
        <DialogTitle>Inserir Link</DialogTitle>
      </DialogHeader>
      <div class="mb-3">
        <label class="input-label">Texto do Link</label>
        <Input
          ref="textInput"
          v-model="text"
          type="text"
          placeholder="Ex: Google"
          @keyup.enter="insert"
        />
      </div>
      <div class="mb-4">
        <label class="input-label">URL / Link</label>
        <Input
          v-model="url"
          type="text"
          placeholder="https://"
          @keyup.enter="insert"
        />
      </div>
      <DialogFooter>
        <button class="btn-dialog-cancel" @click="$emit('close')">Cancelar</button>
        <button class="btn-dialog-confirm" :disabled="!url" @click="insert">Inserir</button>
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

const props = defineProps<{
  initialText?: string
}>()

const emit = defineEmits<{
  (e: 'insert', text: string, url: string): void
  (e: 'close'): void
}>()

const text = ref(props.initialText ?? '')
const url = ref('https://')
const textInput = ref<{ $el: HTMLInputElement } | null>(null)

function insert() {
  if (!url.value) return
  emit('insert', text.value, url.value)
}
</script>
