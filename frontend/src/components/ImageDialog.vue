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
        <Label for="image-dialog-alt" class="mb-1 block text-sm font-normal text-muted-foreground">
          Texto Alternativo (Alt)
        </Label>
        <Input
          id="image-dialog-alt"
          ref="altInput"
          v-model="alt"
          type="text"
          placeholder="Descrição da imagem"
          @keyup.enter="insert"
        />
      </div>
      <div class="mb-4">
        <Label for="image-dialog-url" class="mb-1 block text-sm font-normal text-muted-foreground">
          URL da Imagem
        </Label>
        <Input
          id="image-dialog-url"
          v-model="url"
          type="text"
          placeholder="https://..."
          @keyup.enter="insert"
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" size="sm" class="text-muted-foreground" @click="$emit('close')">
          Cancelar
        </Button>
        <Button type="button" size="sm" :disabled="!url" @click="insert">Inserir</Button>
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
