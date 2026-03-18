<template>
  <div class="absolute inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-xl p-4 sm:p-5 w-full max-w-[calc(100vw-2rem)] sm:max-w-sm mx-4">
      <h3 class="font-bold text-gray-800 mb-4 text-lg">Meu Perfil</h3>

      <!-- Emoji picker -->
      <div class="mb-4">
        <label class="block text-sm text-gray-600 mb-2">Escolha seu avatar</label>
        <div class="grid grid-cols-8 gap-1.5 max-h-40 overflow-y-auto p-1 border border-gray-200 rounded-md bg-gray-50">
          <button
            v-for="animal in ANIMAL_EMOJIS"
            :key="animal"
            class="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 transition-colors text-lg"
            :class="{ 'bg-emerald-100 ring-2 ring-emerald-500': selectedEmoji === animal }"
            @click="selectedEmoji = animal"
          >
            {{ animal }}
          </button>
        </div>
      </div>

      <!-- Name input -->
      <div class="mb-4">
        <label class="block text-sm text-gray-600 mb-1">Nome exibido</label>
        <input
          ref="nameInput"
          v-model="editName"
          type="text"
          class="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          placeholder="Seu nome"
          maxlength="30"
          @keyup.enter="save"
        />
      </div>

      <!-- Telemetry info -->
      <div v-if="profile" class="mb-4 text-xs text-gray-400 space-y-0.5">
        <p>ID: <span class="font-mono">{{ profile.id.slice(0, 8) }}…</span></p>
        <p>Primeira sessão: {{ formatDate(profile.joinedAt) }}</p>
        <p>Dispositivo: {{ profile.deviceType === 'mobile' ? '📱 Mobile' : '🖥️ Desktop' }}</p>
        <p v-if="profile.ip">IP: <span class="font-mono">{{ profile.ip }}</span></p>
      </div>

      <div class="flex justify-end gap-2 text-sm">
        <button @click="$emit('close')" class="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded focus:outline-none">Cancelar</button>
        <button @click="save" class="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded shadow-sm focus:outline-none" :disabled="!editName.trim()">Salvar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ANIMAL_EMOJIS, type CollaboratorProfile } from '../cm-utils/cursor'

const props = defineProps<{
  profile: CollaboratorProfile
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: { name: string; emoji: string }): void
}>()

const editName = ref(props.profile.name)
const selectedEmoji = ref(props.profile.emoji)
const nameInput = ref<HTMLInputElement | null>(null)

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch {
    return iso
  }
}

function save() {
  const name = editName.value.trim()
  if (!name) return
  emit('save', { name, emoji: selectedEmoji.value })
}

onMounted(async () => {
  await nextTick()
  nameInput.value?.select()
})
</script>
