<script setup lang="ts">
import type { AvatarImageProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { AvatarImage, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

interface Props extends AvatarImageProps {
  class?: HTMLAttributes["class"]
}

const props = defineProps<Props>()
const delegatedProps = reactiveOmit(props, "class")
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <AvatarImage v-bind="forwarded" :class="cn('aspect-square size-full', props.class)">
    <slot />
  </AvatarImage>
</template>