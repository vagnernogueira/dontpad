<template>
  <div class="z-10 flex items-center gap-1 overflow-x-auto overflow-y-hidden border-b border-border bg-background px-2 py-btn text-sm text-muted-foreground shadow-xs sm:gap-1.5 sm:px-4">
    <Button variant="ghost" size="icon" class="h-7 w-7 shrink-0 hover:bg-gray-200 hover:text-gray-900" title="Desfazer" @click="$emit('undo')">
      <Undo2 :size="16" />
    </Button>
    <Button variant="ghost" size="icon" class="h-7 w-7 shrink-0 hover:bg-gray-200 hover:text-gray-900" title="Refazer" @click="$emit('redo')">
      <Redo2 :size="16" />
    </Button>

    <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

    <ToolbarButton title="Negrito" class="font-bold" @click="$emit('format', '**', '**')">B</ToolbarButton>
    <ToolbarButton title="Itálico" class="italic" @click="$emit('format', '*', '*')">I</ToolbarButton>
    <ToolbarButton title="Tachado" class="line-through" @click="$emit('format', '~~', '~~')">S</ToolbarButton>
    <ToolbarButton title="Transformar caixa (UPPER / lower / camelCase)" class="font-medium text-sm" @click="$emit('transform-case')">Aa</ToolbarButton>

    <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

    <ToolbarButton title="Título 1" class="font-bold" @click="$emit('format', '# ', '')">H1</ToolbarButton>
    <ToolbarButton title="Título 2" class="font-bold" @click="$emit('format', '## ', '')">H2</ToolbarButton>
    <ToolbarButton title="Título 3" class="font-bold" @click="$emit('format', '### ', '')">H3</ToolbarButton>

    <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

    <ToolbarButton title="Lista Bullet" @click="$emit('format', '- ', '')">&#8226; Lista</ToolbarButton>
    <ToolbarButton title="Lista Numérica" @click="$emit('format', '1. ', '')">1. Lista</ToolbarButton>
    <ToolbarButton title="Checklist" @click="$emit('format', '- [ ] ', '')">&#9745; Checklist</ToolbarButton>

    <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

    <ToolbarButton title="Citação" class="font-serif italic" @click="$emit('format', '> ', '')">" "</ToolbarButton>
    <ToolbarButton title="Código Inline" class="font-mono text-xs" @click="$emit('format', '`', '`')">` `</ToolbarButton>
    <ToolbarButton title="Bloco de Código" class="font-mono text-xs" @click="$emit('format', '```\n', '\n```')">{ }</ToolbarButton>

    <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

    <ToolbarButton title="Tabela" class="flex items-center gap-1" @click="$emit('format', '\n|  |  |\n|--|--|\n|  |  |\n', '')">
      <Table2 :size="14" />
      <span class="hidden sm:inline">Tabela</span>
    </ToolbarButton>

    <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

    <ToolbarButton title="Link" @click="$emit('open-link')">Link</ToolbarButton>
    <ToolbarButton title="Imagem" @click="$emit('open-image')">Img</ToolbarButton>
    <ToolbarButton title="Travar com senha" @click="$emit('open-lock')">
      <Lock :size="14" />
    </ToolbarButton>
    <ToolbarButton
      :active="spellcheckEnabled"
      title="Correção ortográfica"
      class="font-mono text-xs"
      @click="$emit('toggle-spellcheck')"
    >
      ABC
    </ToolbarButton>

    <div class="flex-1 min-w-[8px]"></div>

    <div class="flex gap-1.5 sm:gap-2 shrink-0">
      <Button variant="outline" size="sm" class="text-xs h-auto py-btn sm:py-btn-sm flex items-center gap-1.5" title="Baixar como .md" @click="$emit('download-md')">
        <Download :size="14" />
        <span class="hidden xs:inline">.MD</span>
      </Button>
      <Button size="sm" class="text-xs h-auto py-btn sm:py-btn-sm flex items-center gap-1.5" title="Baixar como .pdf" @click="$emit('download-pdf')">
        <Download :size="14" />
        <span class="hidden xs:inline">.PDF</span>
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Download, Lock, Redo2, Table2, Undo2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ToolbarButton from './ToolbarButton.vue'

defineProps<{
  spellcheckEnabled: boolean
}>()

defineEmits<{
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'format', prefix: string, suffix: string): void
  (e: 'transform-case'): void
  (e: 'open-link'): void
  (e: 'open-image'): void
  (e: 'open-lock'): void
  (e: 'toggle-spellcheck'): void
  (e: 'download-md'): void
  (e: 'download-pdf'): void
}>()
</script>
