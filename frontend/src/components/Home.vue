<template>
  <div class="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4">
    <h1 class="text-5xl font-bold mb-4 text-emerald-600">Dontpad</h1>
    <p class="text-xl mb-8 text-gray-600">Colaboração em texto, com suporte à Markdown.</p>
    
    <div class="w-full bg-white p-8 rounded-xl shadow-lg">
      <p class="mb-4 text-left font-medium text-gray-700">Acesse um documento digitando a URL ou criando um aqui:</p>
      <form @submit.prevent="goToDocument" class="flex gap-2">
        <span class="flex items-center text-gray-400 bg-gray-100 px-3 rounded-l-md border border-r-0 border-gray-300">
          {{ baseUrl }}/
        </span>
        <input 
          v-model="docName" 
          type="text" 
          placeholder="nome-do-documento"
          class="flex-1 border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          required
        />
        <button 
          type="submit"
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-r-md transition-colors"
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
