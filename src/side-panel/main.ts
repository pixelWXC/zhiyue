import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../style.css'
import SidePanel from './SidePanel.vue'

console.log('[Side Panel] Initializing...')

const app = createApp(SidePanel)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')

console.log('[Side Panel] Mounted successfully')
