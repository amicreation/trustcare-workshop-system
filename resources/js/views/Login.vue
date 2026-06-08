<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { KeyRound, User as UserIcon, Sparkles } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = 'Please enter both username and password.'
    return
  }
  
  loading.value = true
  error.value = ''
  
  const res = await authStore.login(username.value, password.value)
  
  if (res.success) {
    router.push('/dashboard')
  } else {
    error.value = res.error || 'Invalid credentials or connection error.'
  }
  loading.value = false
}
</script>

<template>
  <div class="card login-card p-4 mx-3" style="width: 400px; border-radius: 16px;">
    <div class="text-center mb-4">
      <img src="/logo.png" alt="Trust Care" class="img-fluid mb-3" style="max-height: 60px; object-fit: contain;" />
      <h4 class="fw-bold mb-1">TRUST CARE WORKSHOP</h4>
      <p class="text-muted small">Workshop Management System</p>
    </div>

    <div v-if="error" class="alert alert-danger py-2 px-3 small rounded-3 mb-3">
      {{ error }}
    </div>

    <form @submit.prevent="handleLogin">
      <div class="mb-3">
        <label class="form-label small fw-bold text-muted uppercase">Username</label>
        <div class="input-group">
          <span class="input-group-text bg-transparent border-end-0 text-muted">
            <UserIcon :size="16" />
          </span>
          <input 
            type="text" 
            v-model="username" 
            class="form-control border-start-0" 
            placeholder="admin" 
            required 
          />
        </div>
      </div>

      <div class="mb-4">
        <label class="form-label small fw-bold text-muted uppercase">Password</label>
        <div class="input-group">
          <span class="input-group-text bg-transparent border-end-0 text-muted">
            <KeyRound :size="16" />
          </span>
          <input 
            type="password" 
            v-model="password" 
            class="form-control border-start-0" 
            placeholder="••••••••" 
            required 
          />
        </div>
      </div>

      <button 
        type="submit" 
        class="btn btn-danger w-full py-2.5 fw-bold text-white rounded-3 mb-3"
        style="background-color: #d71920; border-color: #d71920;"
        :disabled="loading"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        <span>Sign In</span>
      </button>

      <div class="text-center small">
        <span class="text-muted">Need a new staff account?</span>
        <router-link to="/register" class="text-danger fw-bold ms-1 text-decoration-none">Register Here</router-link>
      </div>
    </form>
  </div>
</template>

<style scoped>
.login-card {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.w-full {
  width: 100%;
}
</style>
