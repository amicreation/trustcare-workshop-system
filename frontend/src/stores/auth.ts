import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null') as any,
    token: localStorage.getItem('token') || (null as string | null),
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isAdvisor: (state) => state.user?.role === 'advisor',
    isManager: (state) => state.user?.role === 'manager'
  },
  actions: {
    async login(username: string, password: string) {
      this.loading = true
      try {
        const response = await axios.post('/api/auth/login', { username, password })
        const { token, user } = response.data
        
        this.token = token
        this.user = user
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        return { success: true }
      } catch (err: any) {
        console.error(err)
        return { 
          success: false, 
          error: err.response?.data?.error || 'Invalid credentials or login failed.' 
        }
      } finally {
        this.loading = false
      }
    },
    async logout() {
      try {
        await axios.post('/api/auth/logout')
      } catch (err) {
        console.error('Logout API failed', err)
      } finally {
        this.token = null
        this.user = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete axios.defaults.headers.common['Authorization']
      }
    },
    async fetchUser() {
      if (!this.token) return
      try {
        const res = await axios.get('/api/auth/me')
        this.user = res.data
        localStorage.setItem('user', JSON.stringify(res.data))
      } catch (err) {
        console.error('Failed to fetch user, logging out...', err)
        this.logout()
      }
    }
  }
})
