import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    server: {
        host: '0.0.0.0'
    },
    optimizeDeps: {
        include: ['yjs']
    },
    build: {
        rollupOptions: {
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
})
