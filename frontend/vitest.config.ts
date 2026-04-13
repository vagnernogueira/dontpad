import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/__tests__/**/*.test.ts'],
    globals: false,
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      reporter: ['text', 'json-summary'],
      include: ['src/cm-utils/**', 'src/composables/**'],
    },
  },
})