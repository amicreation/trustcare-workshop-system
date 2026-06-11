<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useSettingsStore } from '../stores/settings'
import { useAuthStore } from '../stores/auth'
import { 
  Settings, Info, FileText, Image, 
  Check, Save, Sparkles, AlertTriangle,
  User, KeyRound
} from 'lucide-vue-next'

const settingsStore = useSettingsStore()
const authStore = useAuthStore()

const loading = ref(false)
const saveSuccess = ref(false)
const base64Logo = ref('')

const formSettings = ref({
  workshop_name: '',
  tagline: '',
  address: '',
  mobile: '',
  email: '',
  gst: '',
  terms: '',
  logo: '',
  invoice_prefix: 'TCW-',
  jobcard_prefix: 'JC-'
})

const loadSettings = async () => {
  loading.value = true
  await settingsStore.fetchSettings()
  
  // Populate form values
  Object.keys(formSettings.value).forEach(key => {
    if (settingsStore.settings[key] !== undefined) {
      (formSettings.value as any)[key] = settingsStore.settings[key]
    }
  })
  
  base64Logo.value = formSettings.value.logo
  loading.value = false
}

const handleLogoUpload = (e: any) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event: any) => {
      base64Logo.value = event.target.result
      formSettings.value.logo = event.target.result
    }
    reader.readAsDataURL(file)
  }
}

const clearLogo = () => {
  base64Logo.value = ''
  formSettings.value.logo = ''
}

const triggerLogoInput = () => {
  document.getElementById('logoFileInput')?.click()
}

const saveSettings = async () => {
  loading.value = true
  saveSuccess.value = false
  
  const success = await settingsStore.saveSettings(formSettings.value)
  if (success) {
    saveSuccess.value = true
    setTimeout(() => saveSuccess.value = false, 3000)
  } else {
    alert('Failed to save settings to database.')
  }
  loading.value = false
}

// Password change state
const passwordForm = ref({
  current_password: '',
  new_password: '',
  confirm_password: ''
})
const passwordLoading = ref(false)
const passwordSuccess = ref(false)
const passwordError = ref('')

const changePassword = async () => {
  if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
    passwordError.value = 'New password and confirmation do not match.'
    return
  }
  passwordLoading.value = true
  passwordSuccess.value = false
  passwordError.value = ''
  try {
    await axios.post('/api/auth/change-password', {
      current_password: passwordForm.value.current_password,
      new_password: passwordForm.value.new_password
    })
    passwordSuccess.value = true
    passwordForm.value = {
      current_password: '',
      new_password: '',
      confirm_password: ''
    }
    setTimeout(() => passwordSuccess.value = false, 3000)
  } catch (err: any) {
    passwordError.value = err.response?.data?.error || 'Failed to update password. Verify your current password.'
  } finally {
    passwordLoading.value = false
  }
}

// Users list state
const users = ref<any[]>([])
const fetchUsers = async () => {
  try {
    const res = await axios.get('/api/settings/users')
    users.value = res.data
  } catch (err) {
    console.error('Failed to load system users', err)
  }
}

onMounted(() => {
  loadSettings()
  fetchUsers()
})
</script>

<template>
  <div class="settings-container animate-fade-in">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-1">System Configurations</h3>
        <p class="text-muted small mb-0">Adjust brand headers, taxes, policy terms, and document invoice series formats.</p>
      </div>
    </div>

    <!-- Alert Success -->
    <div v-if="saveSuccess" class="alert alert-success py-2.5 px-3 rounded-3 d-flex align-items-center gap-2 mb-4 animate-zoom-in">
      <Check :size="16" />
      <span class="small fw-bold">Workshop configurations saved successfully! Settings synced.</span>
    </div>

    <div class="row g-4">
      <!-- Forms Section -->
      <div class="col-12 col-lg-8">
        <div class="card border-0 shadow-sm bg-glass">
          <div class="card-header border-0 bg-transparent pt-4 px-4 pb-0">
            <h5 class="fw-bold m-0 d-flex align-items-center gap-2">
              <Info :size="18" class="text-danger" />
              <span>Workshop Information Details</span>
            </h5>
          </div>
          
          <form @submit.prevent="saveSettings">
            <div class="card-body px-4 py-3">
              <div class="row g-3">
                <div class="col-12">
                  <label class="form-label small fw-bold text-muted uppercase">Workshop / Business Name</label>
                  <input type="text" v-model="formSettings.workshop_name" class="form-control" placeholder="e.g. TRUST CARE WORKSHOP" required />
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold text-muted uppercase">Tagline / Subheading</label>
                  <input type="text" v-model="formSettings.tagline" class="form-control" placeholder="e.g. Automobile Multi-Brand Service Center" />
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold text-muted uppercase">Physical Address</label>
                  <textarea v-model="formSettings.address" class="form-control" rows="2" placeholder="Workshop road address..." required></textarea>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label small fw-bold text-muted uppercase">Contact Phone Numbers</label>
                  <input type="text" v-model="formSettings.mobile" class="form-control font-monospace" placeholder="e.g. 9876543210" required />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label small fw-bold text-muted uppercase">Email Address</label>
                  <input type="email" v-model="formSettings.email" class="form-control" placeholder="info@company.com" required />
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold text-muted uppercase">Workshop GSTIN Identification</label>
                  <input type="text" v-model="formSettings.gst" class="form-control font-monospace text-uppercase" placeholder="15-character GSTIN number" />
                </div>

                <!-- Prefixes -->
                <div class="col-12 pt-2 border-top">
                  <h6 class="fw-bold text-muted uppercase small mb-3">Document Prefixes & Formats</h6>
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label small fw-bold text-muted uppercase">Invoice Number Prefix</label>
                  <input type="text" v-model="formSettings.invoice_prefix" class="form-control font-monospace" required />
                </div>
                <div class="col-12 col-md-6">
                  <label class="form-label small fw-bold text-muted uppercase">Job Card Prefix</label>
                  <input type="text" v-model="formSettings.jobcard_prefix" class="form-control font-monospace" required />
                </div>

                <!-- Terms and conditions -->
                <div class="col-12 pt-2 border-top">
                  <h6 class="fw-bold text-muted uppercase small mb-3">Invoice Terms and declarations</h6>
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold text-muted uppercase">Terms & Conditions text</label>
                  <textarea v-model="formSettings.terms" class="form-control" rows="3" placeholder="Enter policies, storage disclaimer, labour policies..."></textarea>
                </div>
              </div>
            </div>

            <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end">
              <button type="submit" class="btn btn-danger px-4 py-2 d-flex align-items-center gap-2 fw-bold" style="background-color: #d71920; border-color: #d71920;" :disabled="loading">
                <Save :size="16" />
                <span>Save Configurations</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Brand Logo / File Drawer Section -->
      <div class="col-12 col-lg-4">
        <div class="card border-0 shadow-sm bg-glass">
          <div class="card-header border-0 bg-transparent pt-4 px-4 pb-0">
            <h5 class="fw-bold m-0 d-flex align-items-center gap-2">
              <Image :size="18" class="text-danger" />
              <span>Workshop Logo</span>
            </h5>
          </div>
          
          <div class="card-body px-4 py-3 text-center">
            <div class="logo-preview-box mx-auto mb-3 border rounded-3 d-flex align-items-center justify-content-center bg-body p-3" style="width: 150px; height: 150px;">
              <img v-if="base64Logo" :src="base64Logo" class="img-fluid rounded border shadow-sm" style="max-height: 120px;" />
              <img v-else src="/logo.png" class="img-fluid rounded border shadow-sm" style="max-height: 120px;" />
            </div>

            <div class="d-flex flex-column gap-2">
              <input type="file" id="logoFileInput" class="d-none" accept="image/*" @change="handleLogoUpload" />
              <button class="btn btn-outline-danger btn-sm w-100" @click="triggerLogoInput">
                Select Logo Image File
              </button>
              <button v-if="base64Logo" class="btn btn-outline-dark btn-sm w-100" @click="clearLogo">
                Remove Logo
              </button>
              <span class="small text-muted text-xxs block mt-1">Recommended: PNG / JPG file under 500kb. Matches print PDF.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Management Section -->
    <div class="row g-4 mt-2">
      <!-- User Accounts List -->
      <div class="col-12 col-lg-8">
        <div class="card border-0 shadow-sm bg-glass h-100 animate-zoom-in">
          <div class="card-header border-0 bg-transparent pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
            <h5 class="fw-bold m-0 d-flex align-items-center gap-2">
              <User :size="18" class="text-danger" />
              <span>User Accounts & Staff Access</span>
            </h5>
            <router-link to="/register" class="btn btn-sm btn-danger px-3 py-1.5 fw-bold text-white rounded-3" style="background-color: #d71920; border-color: #d71920;">
              + Register Staff
            </router-link>
          </div>
          <div class="card-body px-4 py-3">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr class="text-uppercase small text-muted">
                    <th class="ps-3">Full Name</th>
                    <th>Username</th>
                    <th>Email Address</th>
                    <th>System Role</th>
                    <th class="pe-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in users" :key="u.id">
                    <td class="ps-3 fw-bold">{{ u.name }}</td>
                    <td class="font-monospace">{{ u.username }}</td>
                    <td class="text-muted">{{ u.email || 'N/A' }}</td>
                    <td>
                      <span class="badge rounded px-2.5 py-1 text-uppercase" :class="{
                        'bg-danger bg-opacity-10 text-danger': u.role === 'admin',
                        'bg-warning bg-opacity-10 text-warning': u.role === 'manager',
                        'bg-info bg-opacity-10 text-info': u.role === 'advisor'
                      }">
                        {{ u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Manager' : 'Advisor' }}
                      </span>
                    </td>
                    <td class="text-muted small pe-3">{{ new Date(u.created_at).toLocaleDateString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Password Change Section -->
      <div class="col-12 col-lg-4">
        <div class="card border-0 shadow-sm bg-glass h-100 animate-zoom-in">
          <div class="card-header border-0 bg-transparent pt-4 px-4 pb-0">
            <h5 class="fw-bold m-0 d-flex align-items-center gap-2">
              <KeyRound :size="18" class="text-danger" />
              <span>Change Password</span>
            </h5>
          </div>
          <form @submit.prevent="changePassword">
            <div class="card-body px-4 py-3">
              <div v-if="passwordSuccess" class="alert alert-success py-2 px-3 small rounded-3 mb-3">
                Password updated successfully!
              </div>
              <div v-if="passwordError" class="alert alert-danger py-2 px-3 small rounded-3 mb-3">
                {{ passwordError }}
              </div>

              <div class="mb-3">
                <label class="form-label small fw-bold text-muted uppercase">Current Password</label>
                <input type="password" v-model="passwordForm.current_password" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted uppercase">New Password</label>
                <input type="password" v-model="passwordForm.new_password" class="form-control" required />
              </div>
              <div class="mb-3">
                <label class="form-label small fw-bold text-muted uppercase">Confirm Password</label>
                <input type="password" v-model="passwordForm.confirm_password" class="form-control" required />
              </div>
            </div>
            <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end">
              <button type="submit" class="btn btn-outline-danger btn-sm w-100 py-2 fw-bold" :disabled="passwordLoading">
                <span v-if="passwordLoading" class="spinner-border spinner-border-sm me-2"></span>
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-glass {
  background-color: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color) !important;
}

.logo-preview-box {
  border-style: dashed !important;
}

.text-xxs {
  font-size: 11px;
}

.animate-zoom-in {
  animation: zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
