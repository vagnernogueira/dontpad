<template>
  <div class="dialog-overlay" @click.self="$emit('close')">
    <div :class="['dialog-card', cardClass]">
      <h3 v-if="title" class="dialog-title">{{ title }}</h3>
      <slot />
      <div class="dialog-footer">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string
  cardClass?: string
}>()

defineEmits<{
  (e: 'close'): void
}>()
</script>
