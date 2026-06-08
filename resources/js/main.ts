// Import Bootstrap 5 CSS & JS first
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// Axios default base URL config
axios.defaults.baseURL = window.location.origin

// Set auth header from local storage if exists
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

import { useAuthStore } from './stores/auth'

// Intercept 401 errors to clear session and redirect to login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || ''
      if (!requestUrl.includes('/api/auth/logout')) {
        const authStore = useAuthStore()
        authStore.logout()
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

app.mount('#root')
