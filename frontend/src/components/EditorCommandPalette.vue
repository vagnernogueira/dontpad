<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="gap-0 overflow-hidden p-0 sm:max-w-2xl">
      <DialogHeader class="border-b border-border px-4 py-4">
        <DialogTitle>Comandos do editor</DialogTitle>
        <DialogDescription>
          Busque comandos, snippets e atalhos ja disponiveis no editor.
        </DialogDescription>
      </DialogHeader>

      <div class="border-b border-border px-4 py-3">
        <Input
          id="editor-command-palette-search"
          v-model="query"
          placeholder="Buscar comando, snippet ou atalho"
          aria-label="Buscar comandos do editor"
          @keydown="onKeydown"
        />
      </div>

      <ScrollArea class="max-h-[28rem]">
        <div v-if="visibleGroups.length > 0" class="py-2">
          <section v-for="group in visibleGroups" :key="group.name" class="pb-2">
            <div class="px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {{ group.name }}
            </div>

            <button
              v-for="item in group.items"
              :key="item.id"
              :ref="(element) => setItemRef(item.flatIndex, element)"
              type="button"
              class="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
              :class="item.flatIndex === activeIndex ? 'bg-accent text-accent-foreground' : ''"
              @click="emit('select', item.id)"
              @mousemove="activeIndex = item.flatIndex"
            >
              <Badge variant="outline" class="mt-0.5 min-w-20 justify-center uppercase tracking-wide text-[10px]">
                {{ kindLabel(item.kind) }}
              </Badge>

              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-3">
                  <span class="font-medium text-foreground">{{ item.label }}</span>
                  <span v-if="item.shortcut" class="shrink-0 text-xs text-muted-foreground">{{ item.shortcut }}</span>
                </div>
                <p v-if="item.description" class="mt-1 text-sm text-muted-foreground">
                  {{ item.description }}
                </p>
              </div>
            </button>
          </section>
        </div>

        <div v-else class="px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhum comando encontrado para a busca atual.
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { EditorCommandMenuItem } from './editor-command-menu'

const props = defineProps<{
  open: boolean
  items: EditorCommandMenuItem[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', itemId: string): void
}>()

interface VisibleItem extends EditorCommandMenuItem {
  flatIndex: number
}

const query = ref('')
const activeIndex = ref(0)
const itemRefs = ref<(HTMLElement | null)[]>([])

const filteredItems = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()

  if (!normalizedQuery) {
    return props.items
  }

  return props.items.filter((item) => {
    const haystack = [
      item.group,
      item.label,
      item.description,
      item.shortcut,
      ...(item.keywords ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(normalizedQuery)
  })
})

const flatItems = computed<VisibleItem[]>(() => filteredItems.value.map((item, index) => ({ ...item, flatIndex: index })))

const visibleGroups = computed(() => {
  const groups = new Map<string, VisibleItem[]>()

  for (const item of flatItems.value) {
    if (!groups.has(item.group)) {
      groups.set(item.group, [])
    }

    groups.get(item.group)?.push(item)
  }

  return Array.from(groups.entries()).map(([name, items]) => ({ name, items }))
})

const focusSearchInput = async () => {
  await nextTick()
  document.getElementById('editor-command-palette-search')?.focus()
}

const scrollActiveItemIntoView = async () => {
  await nextTick()
  const activeItem = itemRefs.value[activeIndex.value]

  if (activeItem && typeof activeItem.scrollIntoView === 'function') {
    activeItem.scrollIntoView({ block: 'nearest' })
  }
}

const resetState = async () => {
  query.value = ''
  activeIndex.value = 0
  itemRefs.value = []
  await focusSearchInput()
}

const onOpenChange = (value: boolean) => {
  if (!value) {
    emit('close')
  }
}

const setItemRef = (index: number, element: unknown) => {
  itemRefs.value[index] = element instanceof HTMLElement ? element : null
}

const selectActiveItem = () => {
  const item = flatItems.value[activeIndex.value]

  if (item) {
    emit('select', item.id)
  }
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (flatItems.value.length === 0) {
      return
    }

    activeIndex.value = (activeIndex.value + 1) % flatItems.value.length
    void scrollActiveItemIntoView()
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    if (flatItems.value.length === 0) {
      return
    }

    activeIndex.value = (activeIndex.value - 1 + flatItems.value.length) % flatItems.value.length
    void scrollActiveItemIntoView()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    selectActiveItem()
  }
}

const kindLabel = (kind: EditorCommandMenuItem['kind']) => {
  if (kind === 'dialog') {
    return 'Dialogo'
  }

  if (kind === 'snippet') {
    return 'Snippet'
  }

  if (kind === 'setting') {
    return 'Ajuste'
  }

  if (kind === 'download') {
    return 'Exportar'
  }

  return 'Acao'
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    void resetState()
  }
})

watch(filteredItems, (items) => {
  if (items.length === 0) {
    activeIndex.value = 0
    return
  }

  if (activeIndex.value >= items.length) {
    activeIndex.value = items.length - 1
  }

  void scrollActiveItemIntoView()
})
</script>