import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './index.css'
import App from './App.vue'

const routes = [
    { path: '/', component: () => import('./components/Home.vue') },
    { path: '/:documentId(.*)', component: () => import('./components/Editor.vue') } // Catch-all for subdocuments like /a/b/c
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App)
app.use(router)
app.mount('#app')
