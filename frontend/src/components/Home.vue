<template>
  <div class="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4">
    <h1 class="mb-4 text-5xl font-bold text-foreground">Dontpad</h1>

    <Card class="w-full shadow-lg">
      <CardContent class="space-y-6 p-8">
        <form class="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch" @submit.prevent="goToDocument">
          <div class="flex min-w-0 flex-1 overflow-hidden rounded-md border border-input bg-background shadow-xs transition-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
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

        <section class="space-y-3 text-left">
          <Alert v-if="templateLoadError" variant="destructive">
            <AlertDescription>{{ templateLoadError }}</AlertDescription>
          </Alert>

          <div class="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <Table>
              <TableHeader class="bg-muted text-left text-muted-foreground">
                <TableRow class="border-border hover:bg-transparent">
                  <TableHead class="px-3 py-2 font-medium">Seleção</TableHead>
                  <TableHead class="px-3 py-2 font-medium">Template</TableHead>
                  <TableHead class="px-3 py-2 font-medium">Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="template in templateRows"
                  :key="template.id"
                  :data-state="selectedTemplateId === template.id ? 'selected' : undefined"
                  class="cursor-pointer border-border"
                  @click="selectTemplate(template.id, true)"
                >
                  <TableCell class="px-3 py-2" @click.stop>
                    <Checkbox
                      :model-value="selectedTemplateId === template.id"
                      @update:model-value="selectTemplate(template.id, $event === true)"
                    />
                  </TableCell>
                  <TableCell class="px-3 py-2 text-foreground">{{ template.label }}</TableCell>
                  <TableCell class="px-3 py-2 text-muted-foreground">{{ template.source }}</TableCell>
                </TableRow>
                <TableRow v-if="isLoadingTemplates" class="hover:bg-transparent">
                  <TableCell colspan="3" class="px-3 py-3 text-sm text-muted-foreground">
                    Carregando templates...
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      </CardContent>
    </Card>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { trimTrailingSlashes } from '../cm-utils/document-name'
import { createDocumentAPI } from '../services/document-api'
import { getApiBaseUrl } from '../services/config'

const router = useRouter()
const documentAPI = createDocumentAPI(getApiBaseUrl())
const BLANK_TEMPLATE_ID = 'blank'

type TemplateRow = {
  id: string
  label: string
  source: string
}

const docName = ref('')
const docNameInput = ref<{ $el: HTMLInputElement } | null>(null)
const selectedTemplateId = ref(BLANK_TEMPLATE_ID)
const templateDocumentNames = ref<string[]>([])
const isLoadingTemplates = ref(false)
const templateLoadError = ref('')

onMounted(() => {
  docNameInput.value?.$el?.focus()
  void loadTemplates()
})

const baseUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.host
  }
  return 'localhost'
})

const templateRows = computed<TemplateRow[]>(() => {
  const realTemplates = templateDocumentNames.value.map((templateName) => {
    const label = templateName.startsWith('_tmpl/')
      ? templateName.slice('_tmpl/'.length) || templateName
      : templateName

    return {
      id: templateName,
      label,
      source: `/${templateName}`,
    }
  })

  return [
    {
      id: BLANK_TEMPLATE_ID,
      label: BLANK_TEMPLATE_ID,
      source: 'Documento vazio',
    },
    ...realTemplates,
  ]
})

const loadTemplates = async () => {
  isLoadingTemplates.value = true
  templateLoadError.value = ''

  const templates = await documentAPI.listTemplates()
  if (templates === null) {
    templateLoadError.value = 'Não foi possível carregar a lista de templates. O fluxo com blank continua disponível.'
    templateDocumentNames.value = []
    isLoadingTemplates.value = false
    return
  }

  templateDocumentNames.value = [...new Set(templates)]
  if (!templateRows.value.some(template => template.id === selectedTemplateId.value)) {
    selectedTemplateId.value = BLANK_TEMPLATE_ID
  }

  isLoadingTemplates.value = false
}

const selectTemplate = (templateId: string, isSelected: boolean) => {
  if (isSelected) {
    selectedTemplateId.value = templateId
    return
  }

  if (selectedTemplateId.value === templateId) {
    selectedTemplateId.value = BLANK_TEMPLATE_ID
  }
}

const goToDocument = () => {
  const nextDocumentName = trimTrailingSlashes(docName.value.trim())
  if (!nextDocumentName) return

  const nextQuery = selectedTemplateId.value === BLANK_TEMPLATE_ID
    ? {}
    : { template: selectedTemplateId.value }

  router.push({
    path: `/${nextDocumentName}`,
    query: nextQuery,
  })
}
</script>
