<template>
  <Dialog :open="true" @update:open="(v) => !v && $emit('close')">
    <DialogContent
      class="sm:max-w-md"
      @open-auto-focus.prevent="altInput?.$el?.select()"
    >
      <DialogHeader>
        <DialogTitle>Inserir Imagem</DialogTitle>
      </DialogHeader>
      <div class="mb-3">
        <label class="input-label">Texto Alternativo (Alt)</label>
        <Input
          ref="altInput"
          v-model="alt"
          type="text"
          placeholder="Descrição da imagem"
          @keyup.enter="insert"
        />
      </div>
      <div class="mb-4">
        <label class="input-label">URL da Imagem</label>
        <Input
          v-model="url"
          type="text"
          placeholder="https://..."
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
  initialAlt?: string
}>()

const emit = defineEmits<{
  (e: 'insert', alt: string, url: string): void
  (e: 'close'): void
}>()

const alt = ref(props.initialAlt ?? '')
const url = ref('https://')
const altInput = ref<{ $el: HTMLInputElement } | null>(null)

function insert() {
  if (!url.value) return
  emit('insert', alt.value, url.value)
}
</script>
