import { defineStore } from 'pinia'
import axios from 'axios'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: {} as Record<string, string>,
    loading: false
  }),
  actions: {
    async fetchSettings() {
      this.loading = true
      try {
        const res = await axios.get('/api/settings')
        this.settings = res.data
      } catch (err) {
        console.error('Failed to load settings', err)
      } finally {
        this.loading = false
      }
    },
    async saveSettings(payload: Record<string, string>) {
      this.loading = true
      try {
        const res = await axios.post('/api/settings', payload)
        this.settings = res.data.settings
        return true
      } catch (err) {
        console.error('Failed to save settings', err)
        return false
      } finally {
        this.loading = false
      }
    }
  }
})
