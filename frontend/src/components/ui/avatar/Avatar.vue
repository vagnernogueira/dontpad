<script setup lang="ts">
import type { AvatarRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { AvatarRoot, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

interface Props extends AvatarRootProps {
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AvatarRoot
    v-bind="forwarded"
    :class="cn('relative flex size-10 shrink-0 overflow-hidden rounded-full', props.class)"
  >
    <slot />
  </AvatarRoot>
</template>