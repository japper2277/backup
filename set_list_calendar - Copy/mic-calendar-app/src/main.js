import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import CalendarView from './views/CalendarView.vue'
import JokeLibrary from './views/JokeLibrary.vue'
import Stats from './views/Stats.vue'

// Router configuration
const routes = [
  { path: '/', component: CalendarView },
  { path: '/library', component: JokeLibrary },
  { path: '/stats', component: Stats }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Create and mount the app
const app = createApp(App)
app.use(router)
app.mount('#app')
