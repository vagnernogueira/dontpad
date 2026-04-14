import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
    envDir: '..',
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            ...(command === 'build'
                ? {
                    '@vue/devtools-api': path.resolve(__dirname, './src/shims/vue-devtools-api.ts'),
                }
                : {}),
        },
    },
    server: {
        host: '0.0.0.0'
    },
    optimizeDeps: {
        include: ['yjs']
    },
    build: {
        rollupOptions: {
            maxParallelFileOps: 32,
            output: {
                manualChunks: {
                    vue: ['vue', 'vue-router'],
                    yjs: ['yjs', 'y-websocket', 'y-codemirror.next'],
                    codemirror: ['codemirror', '@codemirror/state', '@codemirror/view', '@codemirror/language', '@codemirror/lang-markdown'],
                    pdf: ['marked', 'html2pdf.js']
                }
            }
        }
    }
}))
