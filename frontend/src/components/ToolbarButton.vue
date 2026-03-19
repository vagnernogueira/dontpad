<template>
  <Button
    variant="ghost"
    :class="[
      'px-2.5 py-btn sm:py-btn-sm h-auto touch-manipulation shrink-0',
      active
        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
        : 'hover:bg-gray-200 hover:text-gray-900',
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
