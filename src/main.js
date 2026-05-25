import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/index.js'
import { useAuthStore } from '@/store/auth.js'
import './assets/css/main.css'

const app = createApp(App)
app.use(createPinia())

const auth = useAuthStore()
auth.hydrate().finally(() => {
  app.use(router)
  app.mount('#app')
})
