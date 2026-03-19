<template>
  <Button
    variant="ghost"
    :class="[
      'px-2.5 py-btn sm:py-btn-sm h-auto touch-manipulation shrink-0',
      active
        ? 'bg-primary/15 text-primary hover:bg-primary/25'
        : 'hover:bg-accent hover:text-accent-foreground',
    ]"
    :title="title"
    :aria-pressed="active || undefined"
    :disabled="disabled"
    v-bind="$attrs"
  >
    <slot />
  </Button>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'

defineOptions({ inheritAttrs: false })

defineProps<{
  title?: string
  active?: boolean
  disabled?: boolean
}>()
</script>
