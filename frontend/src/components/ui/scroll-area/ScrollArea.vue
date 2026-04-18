<script setup lang="ts">
import type { ScrollAreaRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from 'reka-ui'
import { cn } from '@/lib/utils'
import ScrollBar from './ScrollBar.vue'

const props = defineProps<ScrollAreaRootProps & {
  class?: HTMLAttributes['class']
  viewportClass?: HTMLAttributes['class']
}>()

const delegatedProps = reactiveOmit(props, 'class', 'viewportClass')
</script>

<template>
  <ScrollAreaRoot v-bind="delegatedProps" :class="cn('relative overflow-hidden', props.class)">
    <ScrollAreaViewport :class="cn('h-full w-full rounded-[inherit]', props.viewportClass)">
      <slot />
    </ScrollAreaViewport>
    <ScrollBar />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>