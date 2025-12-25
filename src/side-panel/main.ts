import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../../style.css'
import SidePanel from './SidePanel.vue'

const app = createApp(SidePanel)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')

