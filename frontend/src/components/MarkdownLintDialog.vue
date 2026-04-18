<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="gap-0 overflow-hidden p-0 sm:max-w-5xl">
      <DialogHeader class="border-b border-border px-4 py-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <DialogTitle>Lint de Markdown</DialogTitle>
            <DialogDescription>
              Revise as inconformidades do documento atual e aplique hotfix individual quando houver suporte nativo.
            </DialogDescription>
          </div>

          <Badge variant="secondary" class="shrink-0 rounded-md px-2 py-1 font-mono text-xs">
            {{ summaryLabel }}
          </Badge>
        </div>
      </DialogHeader>

      <div v-if="errorMessage" class="border-b border-border bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {{ errorMessage }}
      </div>

      <div v-else-if="message" class="border-b border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        {{ message }}
      </div>

      <div v-if="issues.length === 0" class="px-6 py-10 text-center text-sm text-muted-foreground">
        Nenhuma inconformidade encontrada para o conteudo atual.
      </div>

      <ScrollArea v-else class="max-h-[28rem]">
        <Table>
          <TableHeader class="bg-muted/60 text-left text-muted-foreground">
            <TableRow class="border-border hover:bg-transparent">
              <TableHead class="w-20 px-4 py-3">Linha</TableHead>
              <TableHead class="w-44 px-4 py-3">Regra</TableHead>
              <TableHead class="px-4 py-3">Descricao</TableHead>
              <TableHead class="w-32 px-4 py-3">Acao</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            <TableRow v-for="issue in issues" :key="issue.key" class="align-top">
              <TableCell class="px-4 py-3 align-top font-mono text-xs text-foreground">
                {{ issue.line }}
              </TableCell>

              <TableCell class="px-4 py-3 align-top">
                <div class="flex flex-col gap-1">
                  <Badge variant="outline" class="w-fit rounded-md font-mono text-[11px] uppercase tracking-wide">
                    {{ issue.ruleId }}
                  </Badge>
                  <span v-if="issue.ruleAlias" class="text-xs text-muted-foreground">{{ issue.ruleAlias }}</span>
                </div>
              </TableCell>

              <TableCell class="px-4 py-3 align-top">
                <p class="font-medium text-foreground">{{ issue.description }}</p>
                <p v-if="issue.detail" class="mt-1 text-sm text-muted-foreground">{{ issue.detail }}</p>
                <p
                  v-if="issue.context"
                  class="mt-2 overflow-hidden rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground"
                >
                  {{ issue.context }}
                </p>
              </TableCell>

              <TableCell class="px-4 py-3 align-top">
                <Button
                  v-if="issue.fixInfo"
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="emit('apply-hotfix', issue)"
                >
                  Hotfix
                </Button>

                <span v-else class="text-xs text-muted-foreground">Sem hotfix</span>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ScrollArea>

      <div class="flex items-center justify-between border-t border-border px-4 py-3">
        <span class="text-xs text-muted-foreground">Atalho dedicado no editor: Ctrl+Alt+L</span>
        <Button type="button" variant="ghost" size="sm" @click="emit('close')">Fechar</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { MarkdownLintIssue } from '../services/markdown-lint'

const props = defineProps<{
  open: boolean
  issues: MarkdownLintIssue[]
  message?: string
  errorMessage?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'apply-hotfix', issue: MarkdownLintIssue): void
}>()

const summaryLabel = computed(() => {
  if (props.issues.length === 1) {
    return '1 ocorrencia'
  }

  return `${props.issues.length} ocorrencias`
})

const onOpenChange = (value: boolean) => {
  if (!value) {
    emit('close')
  }
}
</script>