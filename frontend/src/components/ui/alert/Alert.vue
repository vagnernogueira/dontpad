<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import type { AlertVariants } from "."
import { cn } from "@/lib/utils"
import { alertVariants } from "."

const props = withDefaults(defineProps<{
  class?: HTMLAttributes["class"]
  variant?: AlertVariants["variant"]
}>(), {
  class: "",
  variant: "default",
})
</script>

<template>
  <div :class="cn(alertVariants({ variant }), props.class)" role="alert">
    <slot />
  </div>
</template>