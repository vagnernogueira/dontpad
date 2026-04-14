<template>
  <Editor v-if="!activeMode" />

  <div v-else class="flex flex-col h-full w-full">
    <main class="flex-1 overflow-auto bg-gray-50">
      <div v-if="loading" class="h-full flex items-center justify-center text-sm text-gray-500 px-4 text-center">
        Carregando documento...
      </div>

      <div v-else-if="requiresPassword" class="h-full flex items-center justify-center px-4">
        <Card class="w-full max-w-md shadow-xl">
          <CardHeader class="pb-4">
            <CardTitle class="text-lg text-gray-800">Documento Protegido</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
          <div class="mb-3">
            <Label for="document-route-password" class="mb-1 block text-sm font-normal text-muted-foreground">
              Senha para continuar
            </Label>
            <Input
              id="document-route-password"
              ref="accessPasswordInput"
              v-model="accessPassword"
              type="password"
              placeholder="Digite a senha"
              @keyup.enter="retryWithPassword"
            />
          </div>
          <p v-if="errorMessage" class="mb-3 text-xs text-red-600">{{ errorMessage }}</p>
          <div class="flex justify-end">
            <Button type="button" size="sm" :disabled="!accessPassword.trim()" @click="retryWithPassword">
              Validar
            </Button>
          </div>
          </CardContent>
        </Card>
      </div>

      <div v-else-if="errorMessage" class="h-full flex items-center justify-center text-sm text-red-600 px-4 text-center">
        {{ errorMessage }}
      </div>

      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-else-if="activeMode === 'view'" class="max-w-4xl mx-auto py-3 px-4" v-html="viewHtml"></div>

      <div v-else-if="activeMode === 'raw'" class="max-w-4xl mx-auto py-3 px-4">
        <pre class="whitespace-pre-wrap break-words text-sm text-gray-800 font-mono">{{ rawContent }}</pre>
      </div>

      <div v-else-if="activeMode === 'pdf'" class="h-full flex items-center justify-center text-sm text-gray-500 px-4 text-center">
        Download do PDF iniciado.
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Editor from './Editor.vue'
import * as exportService from '../services/export'
import { markdownStyles } from '../services/pdf-styles'
import { createDocumentAPI } from '../services/document-api'
import { getApiBaseUrl } from '../services/config'

type SpecialMode = 'pdf' | 'view' | 'raw'

const route = useRoute()
const documentAPI = createDocumentAPI(getApiBaseUrl())

const loading = ref(false)
const requiresPassword = ref(false)
const errorMessage = ref('')
const viewHtml = ref('')
const rawContent = ref('')
const accessPassword = ref('')
const accessPasswordInput = ref<{ $el: HTMLInputElement } | null>(null)

const documentId = computed(() => {
  const value = route.params.documentId
  return typeof value === 'string' && value.trim() ? value : 'default'
})

const activeMode = computed<SpecialMode | null>(() => {
  if (Object.prototype.hasOwnProperty.call(route.query, 'pdf')) return 'pdf'
  if (Object.prototype.hasOwnProperty.call(route.query, 'view')) return 'view'
  if (Object.prototype.hasOwnProperty.call(route.query, 'raw')) return 'raw'
  return null
})

const clearState = () => {
  loading.value = false
  requiresPassword.value = false
  errorMessage.value = ''
  viewHtml.value = ''
  rawContent.value = ''
}

const loadSpecialMode = async () => {
  const mode = activeMode.value
  if (!mode) {
    clearState()
    return
  }

  loading.value = true
  requiresPassword.value = false
  errorMessage.value = ''
  viewHtml.value = ''
  rawContent.value = ''

  const result = await documentAPI.getPublicDocumentContent(documentId.value, accessPassword.value)
  if (!result.ok) {
    loading.value = false

    if (result.requiresPassword) {
      requiresPassword.value = true
      errorMessage.value = 'Senha necessária para acessar este documento.'
      await nextTick()
      accessPasswordInput.value?.$el?.focus()
      return
    }

    errorMessage.value = 'Não foi possível carregar o documento.'
    return
  }

  if (mode === 'raw') {
    rawContent.value = result.content
    loading.value = false
    return
  }

  if (mode === 'view') {
    const html = await exportService.markdownToHtml(result.content)
    viewHtml.value = `${markdownStyles}<div class="markdown-body">${html}</div>`
    loading.value = false
    return
  }

  await exportService.downloadPDF(result.content, documentId.value)
  loading.value = false
}

const retryWithPassword = async () => {
  if (!accessPassword.value.trim()) return
  await loadSpecialMode()
}

watch(
  () => route.fullPath,
  () => {
    void loadSpecialMode()
  },
  { immediate: true }
)
</script>
