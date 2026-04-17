import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './index.css'
import App from './App.vue'
import { trimTrailingSlashes } from './cm-utils/document-name'
import { initializeColorMode } from './composables/useColorMode'

initializeColorMode()

const routes = [
    { path: '/', component: () => import('./components/Home.vue') },
    { path: '/explorer', component: () => import('./components/Explorer.vue') },
    { path: '/:documentId(.*)', name: 'document', component: () => import('./components/DocumentRoute.vue') } // Catch-all for subdocuments like /a/b/c
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to) => {
    if (to.name !== 'document') return true

    const documentId = typeof to.params.documentId === 'string' ? to.params.documentId : ''
    const normalizedDocumentId = trimTrailingSlashes(documentId)

    if (!documentId || normalizedDocumentId === documentId) return true

    return {
        path: `/${normalizedDocumentId}`,
        query: to.query,
        hash: to.hash,
        replace: true,
    }
})

const app = createApp(App)
app.use(router)
app.mount('#app')
