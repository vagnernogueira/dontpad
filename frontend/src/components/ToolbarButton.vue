<template>
  <button
    :class="[
      baseClasses,
      active
        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
        : 'hover:bg-gray-200 hover:text-gray-900',
      $attrs.class
    ]"
    :title="title"
    :aria-pressed="active || undefined"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  active?: boolean
  disabled?: boolean
}>()

const baseClasses =
  'px-2.5 py-[7.2px] sm:py-[5.4px] rounded transition-colors focus:outline-none touch-manipulation shrink-0'
</script>
