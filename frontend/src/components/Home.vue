<template>
  <div class="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4">
    <h1 class="mb-4 text-5xl font-bold text-foreground">Dontpad</h1>

    <Card class="w-full shadow-lg">
      <CardContent class="p-8">
      <form class="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch" @submit.prevent="goToDocument">
        <div class="flex min-w-0 flex-1 overflow-hidden rounded-md border border-input bg-background shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          <span class="flex items-center whitespace-nowrap border-r border-input bg-muted px-3 text-sm text-muted-foreground">
            {{ baseUrl }}/
          </span>
          <Input
            ref="docNameInput"
            v-model="docName"
            type="text"
            placeholder="documento"
            class="min-w-0 flex-1 rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            required
          />
        </div>
        <Button
          type="submit"
          class="w-full shrink-0 font-bold sm:w-auto"
        >
          🔗
        </Button>
      </form>
      </CardContent>
    </Card>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { trimTrailingSlashes } from '../cm-utils/document-name'

const router = useRouter()
const docName = ref('')
const docNameInput = ref<{ $el: HTMLInputElement } | null>(null)

onMounted(() => {
  docNameInput.value?.$el?.focus()
})

const baseUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.host
  }
  return 'localhost'
})

const goToDocument = () => {
  const nextDocumentName = trimTrailingSlashes(docName.value.trim())
  if (!nextDocumentName) return

  router.push(`/${nextDocumentName}`)
}
</script>
