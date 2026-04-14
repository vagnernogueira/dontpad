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
        <Label for="link-dialog-text" class="mb-1 block text-sm font-normal text-muted-foreground">
          Texto do Link
        </Label>
        <Input
          id="link-dialog-text"
          ref="textInput"
          v-model="text"
          type="text"
          placeholder="Ex: Google"
          @keyup.enter="insert"
        />
      </div>
      <div class="mb-4">
        <Label for="link-dialog-url" class="mb-1 block text-sm font-normal text-muted-foreground">
          URL / Link
        </Label>
        <Input
          id="link-dialog-url"
          v-model="url"
          type="text"
          placeholder="https://"
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
