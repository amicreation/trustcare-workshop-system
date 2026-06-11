<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'
import { KeyRound, User as UserIcon, Shield, Mail, Sparkles } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const name = ref('')
const username = ref('')
const email = ref('')
const password = ref('')
const role = ref('advisor') // default

const error = ref('')
const success = ref('')
const loading = ref(false)

const handleRegister = async () => {
  if (!name.value || !username.value || !password.value) {
    error.value = 'Please fill out all mandatory fields.'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    await axios.post('/api/auth/register', {
      name: name.value,
      username: username.value,
      email: email.value || null,
      password: password.value,
      role: role.value
    })
    
    success.value = 'Staff registration successful! The new account is active.'
    
    // Reset form fields so admin can add another user
    name.value = ''
    username.value = ''
    email.value = ''
    password.value = ''
    role.value = 'advisor'

    setTimeout(() => {
      success.value = ''
    }, 4000)
    
  } catch (err: any) {
    console.error(err)
    error.value = err.response?.data?.error || 'Registration failed. Check if username is taken.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card register-card p-4 mx-3" style="width: 420px; border-radius: 16px;">
    <div class="text-center mb-4">
      <img src="/logo.png" alt="Trust Care" class="img-fluid mb-3" style="max-height: 60px; object-fit: contain;" />
      <h4 class="fw-bold mb-1">STAFF REGISTRATION</h4>
      <p class="text-muted small">Create Trust Care Workshop Account</p>
    </div>

    <div v-if="error" class="alert alert-danger py-2 px-3 small rounded-3 mb-3">
      {{ error }}
    </div>

    <div v-if="success" class="alert alert-success py-2 px-3 small rounded-3 mb-3">
      {{ success }}
    </div>

    <form @submit.prevent="handleRegister">
      <div class="mb-3">
        <label class="form-label small fw-bold text-muted uppercase">Full Name</label>
        <div class="input-group">
          <span class="input-group-text bg-transparent border-end-0 text-muted">
            <UserIcon :size="16" />
          </span>
          <input 
            type="text" 
            v-model="name" 
            class="form-control border-start-0" 
            placeholder="John Doe" 
            required 
          />
        </div>
      </div>

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
            placeholder="john_doe" 
            required 
          />
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label small fw-bold text-muted uppercase">Email Address (Optional)</label>
        <div class="input-group">
          <span class="input-group-text bg-transparent border-end-0 text-muted">
            <Mail :size="16" />
          </span>
          <input 
            type="email" 
            v-model="email" 
            class="form-control border-start-0" 
            placeholder="john@trustcare.com" 
          />
        </div>
      </div>

      <div class="mb-3">
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

      <div class="mb-4">
        <label class="form-label small fw-bold text-muted uppercase">Staff Role</label>
        <div class="input-group">
          <span class="input-group-text bg-transparent border-end-0 text-muted">
            <Shield :size="16" />
          </span>
          <select v-model="role" class="form-select border-start-0" required>
            <option value="advisor">Service Advisor</option>
            <option value="manager">Store Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <button 
        type="submit" 
        class="btn btn-danger w-full py-2.5 fw-bold text-white rounded-3 mb-3"
        style="background-color: #d71920; border-color: #d71920;"
        :disabled="loading"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
        <span>Register Account</span>
      </button>

      <div class="text-center small">
        <router-link to="/settings" class="text-danger fw-bold text-decoration-none">← Go to Configurations</router-link>
      </div>
    </form>
  </div>
</template>

<style scoped>
.register-card {
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.w-full {
  width: 100%;
}
</style>
