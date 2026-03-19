<template>
  <div class="toolbar">
    <Button variant="ghost" size="icon" @click="$emit('undo')" class="h-7 w-7 shrink-0 hover:bg-gray-200 hover:text-gray-900" title="Desfazer">
      <Undo2 :size="16" />
    </Button>
    <Button variant="ghost" size="icon" @click="$emit('redo')" class="h-7 w-7 shrink-0 hover:bg-gray-200 hover:text-gray-900" title="Refazer">
      <Redo2 :size="16" />
    </Button>

    <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

    <ToolbarButton @click="$emit('format', '**', '**')" title="Negrito" class="font-bold">B</ToolbarButton>
    <ToolbarButton @click="$emit('format', '*', '*')" title="Itálico" class="italic">I</ToolbarButton>
    <ToolbarButton @click="$emit('format', '~~', '~~')" title="Tachado" class="line-through">S</ToolbarButton>
    <ToolbarButton @click="$emit('transform-case')" title="Transformar caixa (UPPER / lower / camelCase)" class="font-medium text-sm">Aa</ToolbarButton>

    <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

    <ToolbarButton @click="$emit('format', '# ', '')" title="Título 1" class="font-bold">H1</ToolbarButton>
    <ToolbarButton @click="$emit('format', '## ', '')" title="Título 2" class="font-bold">H2</ToolbarButton>
    <ToolbarButton @click="$emit('format', '### ', '')" title="Título 3" class="font-bold">H3</ToolbarButton>

    <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

    <ToolbarButton @click="$emit('format', '- ', '')" title="Lista Bullet">&#8226; Lista</ToolbarButton>
    <ToolbarButton @click="$emit('format', '1. ', '')" title="Lista Numérica">1. Lista</ToolbarButton>
    <ToolbarButton @click="$emit('format', '- [ ] ', '')" title="Checklist">&#9745; Checklist</ToolbarButton>

    <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

    <ToolbarButton @click="$emit('format', '> ', '')" title="Citação" class="font-serif italic">" "</ToolbarButton>
    <ToolbarButton @click="$emit('format', '`', '`')" title="Código Inline" class="font-mono text-xs">` `</ToolbarButton>
    <ToolbarButton @click="$emit('format', '```\n', '\n```')" title="Bloco de Código" class="font-mono text-xs">{ }</ToolbarButton>

    <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

    <ToolbarButton @click="$emit('format', '\n|  |  |\n|--|--|\n|  |  |\n', '')" title="Tabela" class="flex items-center gap-1">
      <Table2 :size="14" />
      <span class="hidden sm:inline">Tabela</span>
    </ToolbarButton>

    <Separator orientation="vertical" class="h-5 mx-1.5 shrink-0" />

    <ToolbarButton @click="$emit('open-link')" title="Link">Link</ToolbarButton>
    <ToolbarButton @click="$emit('open-image')" title="Imagem">Img</ToolbarButton>
    <ToolbarButton @click="$emit('open-lock')" title="Travar com senha">
      <Lock :size="14" />
    </ToolbarButton>
    <ToolbarButton
      @click="$emit('toggle-spellcheck')"
      :active="spellcheckEnabled"
      title="Correção ortográfica"
      class="font-mono text-xs"
    >
      ABC
    </ToolbarButton>

    <div class="flex-1 min-w-[8px]"></div>

    <div class="flex gap-1.5 sm:gap-2 shrink-0">
      <Button variant="outline" size="sm" @click="$emit('download-md')" class="text-xs h-auto py-btn sm:py-btn-sm flex items-center gap-1.5" title="Baixar como .md">
        <Download :size="14" />
        <span class="hidden xs:inline">.MD</span>
      </Button>
      <Button size="sm" @click="$emit('download-pdf')" class="text-xs h-auto py-btn sm:py-btn-sm flex items-center gap-1.5" title="Baixar como .pdf">
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
