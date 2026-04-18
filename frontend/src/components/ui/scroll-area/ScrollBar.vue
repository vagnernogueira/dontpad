<script setup lang="ts">
import type { ScrollAreaScrollbarProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ScrollAreaScrollbar, ScrollAreaThumb } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<ScrollAreaScrollbarProps & {
  class?: HTMLAttributes['class']
}>(), {
  orientation: 'vertical',
  class: '',
})

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <ScrollAreaScrollbar
    v-bind="delegatedProps"
    :class="cn('flex touch-none select-none p-px transition-colors', props.orientation === 'vertical' ? 'h-full w-2.5 border-l border-l-transparent' : 'h-2.5 flex-col border-t border-t-transparent', props.class)"
  >
    <ScrollAreaThumb class="relative flex-1 rounded-full bg-border" />
  </ScrollAreaScrollbar>
</template>