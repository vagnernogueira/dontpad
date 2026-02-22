<template>
  <div class="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4">
    <h1 class="text-5xl font-bold mb-4 text-gray-800">Dontpad</h1>
    <p class="text-xl mb-8 text-gray-600">Colaboração em texto, com suporte à Markdown.</p>
    
    <div class="w-full bg-white p-8 rounded-xl shadow-lg">
      <p class="mb-4 text-left font-medium text-gray-700">Acesse um documento digitando a URL ou criando um aqui:</p>
      <form @submit.prevent="goToDocument" class="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch">
        <div class="flex min-w-0 flex-1 overflow-hidden rounded-md border border-gray-300">
          <span class="flex items-center whitespace-nowrap bg-gray-100 px-3 text-gray-400 border-r border-gray-300">
            {{ baseUrl }}/
          </span>
          <input
            v-model="docName"
            type="text"
            placeholder="documento"
            class="min-w-0 flex-1 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
            required
          />
        </div>
        <button
          type="submit"
          class="w-full shrink-0 rounded-md bg-gray-800 px-6 py-2 font-bold text-white transition-colors hover:bg-gray-900 sm:w-auto"
        >
          Acessar
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const docName = ref('')

const baseUrl = computed(() => {
  if (typeof window !== 'undefined') {
    return window.location.host
  }
  return 'localhost'
})

const goToDocument = () => {
  if (docName.value) {
    router.push(`/${docName.value}`)
  }
}
</script>
