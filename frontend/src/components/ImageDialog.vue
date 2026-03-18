<template>
  <BaseDialog title="Inserir Imagem" @close="$emit('close')">
    <div class="mb-3">
      <label class="input-label">Texto Alternativo (Alt)</label>
      <input
        ref="altInput"
        v-model="alt"
        type="text"
        class="input-field"
        placeholder="Descrição da imagem"
        @keyup.enter="insert"
      />
    </div>
    <div class="mb-4">
      <label class="input-label">URL da Imagem</label>
      <input
        v-model="url"
        type="text"
        class="input-field"
        placeholder="https://..."
        @keyup.enter="insert"
      />
    </div>
    <template #actions>
      <button @click="$emit('close')" class="btn-dialog-cancel">Cancelar</button>
      <button @click="insert" class="btn-dialog-confirm" :disabled="!url">Inserir</button>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import BaseDialog from './BaseDialog.vue'

const props = defineProps<{
  initialAlt?: string
}>()

const emit = defineEmits<{
  (e: 'insert', alt: string, url: string): void
  (e: 'close'): void
}>()

const alt = ref(props.initialAlt ?? '')
const url = ref('https://')
const altInput = ref<HTMLInputElement | null>(null)

function insert() {
  if (!url.value) return
  emit('insert', alt.value, url.value)
}

onMounted(async () => {
  await nextTick()
  altInput.value?.select()
})
</script>
