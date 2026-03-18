<template>
  <Dialog :open="true" @update:open="(v) => !v && $emit('close')">
    <DialogContent :class="cn('sm:max-w-md', cardClass)">
      <DialogHeader v-if="title">
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>
      <slot />
      <DialogFooter>
        <slot name="actions" />
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

defineProps<{
  title?: string
  cardClass?: string
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>
