import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './index.css'
import App from './App.vue'
import Home from './components/Home.vue'
import Editor from './components/Editor.vue'

const routes = [
    { path: '/', component: Home },
    { path: '/:documentId(.*)', component: Editor } // Catch-all for subdocuments like /a/b/c
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App)
app.use(router)
app.mount('#app')
