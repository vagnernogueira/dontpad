<template>
  <Dialog :open="true" @update:open="(value) => !value && emit('close')">
    <DialogScrollContent
      class="w-[min(100vw-1.5rem,32rem)] gap-0 overflow-hidden p-0"
      @close-auto-focus.prevent
    >
      <DialogHeader class="border-b border-border px-4 py-4">
        <DialogTitle>Inserir emoji</DialogTitle>
        <DialogDescription>
          Escolha um emoji para inserir no ponto atual do cursor.
        </DialogDescription>
      </DialogHeader>

      <div class="px-4 pb-4 pt-3">
        <p v-if="pickerError" class="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {{ pickerError }}
        </p>

        <div v-else class="space-y-3">
          <p v-if="!pickerMounted" class="text-sm text-muted-foreground">
            Carregando seletor de emoji...
          </p>

          <div
            ref="pickerHost"
            class="emoji-picker-host min-h-[20rem] overflow-hidden rounded-md border border-border bg-muted/30"
            :class="{ 'opacity-0': !pickerMounted }"
          />
        </div>
      </div>
    </DialogScrollContent>
  </Dialog>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import pickerDataSource from 'emoji-picker-element-data/pt/cldr/data.json?url'
import { useColorMode } from '../composables/useColorMode'
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from '@/components/ui/dialog'

interface EmojiClickDetail {
  unicode?: string
  emoji?: {
    unicode?: string
  }
}

type EmojiPickerCtor = new (options?: {
  dataSource?: string
  locale?: string
  i18n?: unknown
}) => HTMLElement

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', emoji: string): void
}>()

const pickerHost = ref<HTMLElement | null>(null)
const pickerMounted = ref(false)
const pickerError = ref('')
const { isDark } = useColorMode()

let pickerElement: HTMLElement | null = null
let detachPickerListener: (() => void) | null = null
let isMountingPicker = false
let isUnmounted = false

const syncPickerTheme = () => {
  if (!pickerElement) return

  pickerElement.classList.toggle('dark', isDark.value)
  pickerElement.classList.toggle('light', !isDark.value)
}

watch(isDark, () => {
  syncPickerTheme()
})

const mountPicker = async () => {
  if (isMountingPicker || pickerElement || isUnmounted) {
    return
  }

  if (!pickerHost.value) {
    await nextTick()
  }

  if (!pickerHost.value || isUnmounted) {
    return
  }

  isMountingPicker = true

  try {
    const [{ default: Picker }, { default: ptBR }] = await Promise.all([
      import('emoji-picker-element/picker'),
      import('emoji-picker-element/i18n/pt_BR'),
    ]) as [{ default: EmojiPickerCtor }, { default: unknown }]

    if (!pickerHost.value || isUnmounted) {
      return
    }

    const handleEmojiClick = (event: Event) => {
      const detail = (event as CustomEvent<EmojiClickDetail>).detail
      const selectedEmoji = detail.unicode ?? detail.emoji?.unicode

      if (!selectedEmoji) {
        return
      }

      emit('select', selectedEmoji)
    }

    const picker = new Picker({
      locale: 'pt',
      dataSource: pickerDataSource,
      i18n: ptBR,
    })

    picker.addEventListener('emoji-click', handleEmojiClick)
    pickerHost.value.replaceChildren(picker)

    pickerElement = picker
    detachPickerListener = () => picker.removeEventListener('emoji-click', handleEmojiClick)
    syncPickerTheme()
    pickerMounted.value = true
  } catch {
    if (!isUnmounted) {
      pickerError.value = 'Nao foi possivel carregar o seletor de emoji.'
    }
  } finally {
    isMountingPicker = false
  }
}

watch(pickerHost, (host) => {
  if (host && !pickerElement) {
    void mountPicker()
  }
})

onMounted(() => {
  void mountPicker()
})

onBeforeUnmount(() => {
  isUnmounted = true
  detachPickerListener?.()
  pickerElement?.remove()
  detachPickerListener = null
  pickerElement = null
})
</script>

<style scoped>
.emoji-picker-host :deep(emoji-picker) {
  width: 100%;
  height: min(65vh, 26rem);
  --border-size: 0;
  --border-radius: 0;
  --num-columns: 8;
  --emoji-size: 1.45rem;
  --category-emoji-size: 1.15rem;
  --input-border-radius: 0.5rem;
}

@media (max-width: 640px) {
  .emoji-picker-host :deep(emoji-picker) {
    height: min(60vh, 22rem);
    --num-columns: 7;
  }
}
</style>