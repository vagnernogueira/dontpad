import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
    envDir: '..',
    plugins: [
        vue(),
        VitePWA({
            strategies: 'generateSW',
            injectRegister: false,
            registerType: 'prompt',
            includeAssets: ['favicon.svg', 'pwa-icon.svg', 'pwa-maskable.svg'],
            manifest: {
                name: 'Dontpad',
                short_name: 'Dontpad',
                lang: 'pt-BR',
                description: 'Editor colaborativo de Markdown em tempo real.',
                theme_color: '#1E1E1E',
                background_color: '#09090B',
                display: 'standalone',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: 'pwa-icon.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'any',
                    },
                    {
                        src: 'pwa-maskable.svg',
                        sizes: 'any',
                        type: 'image/svg+xml',
                        purpose: 'maskable',
                    },
                ],
            },
            workbox: {
                cleanupOutdatedCaches: true,
                navigateFallback: 'index.html',
                navigateFallbackAllowlist: [/^\/$/, /^\/explorer(?:\/)?$/],
            },
            devOptions: {
                enabled: false,
            },
        }),
    ],
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
                    markdown: ['marked', 'dompurify'],
                    pdf: ['html2pdf.js']
                }
            }
        }
    }
}))
