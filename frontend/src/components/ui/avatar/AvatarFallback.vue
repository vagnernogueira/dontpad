<script setup lang="ts">
import type { AvatarFallbackProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { AvatarFallback, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

interface Props extends AvatarFallbackProps {
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AvatarFallback
    v-bind="forwarded"
    :class="cn('flex size-full items-center justify-center rounded-full', props.class)"
  >
    <slot />
  </AvatarFallback>
</template>