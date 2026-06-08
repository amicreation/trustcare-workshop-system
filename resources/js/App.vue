<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useSettingsStore } from './stores/settings'
import { 
  LayoutDashboard, Users, Car, FileText, Settings, Database, 
  CreditCard, LogOut, Sun, Moon, Menu, X, CheckSquare, Shield,
  Package, FileBarChart
} from 'lucide-vue-next' // Lucide icons for Vue

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const router = useRouter()
const route = useRoute()

// Theme State
const darkMode = ref(localStorage.getItem('theme') !== 'light')
const sidebarOpen = ref(true)

// Toggle Theme
const toggleTheme = () => {
  darkMode.value = !darkMode.value
  if (darkMode.value) {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-bs-theme', 'dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-bs-theme', 'light')
    localStorage.setItem('theme', 'light')
  }
}

// Sync theme class on load
onMounted(() => {
  if (darkMode.value) {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-bs-theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-bs-theme', 'light')
  }
  
  if (authStore.isAuthenticated) {
    settingsStore.fetchSettings()
  }
})

// Check if current route is a guest page (Login/Register)
const isGuestPage = computed(() => route.meta.guest === true)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Sidebar Menu Items filtered by active user role permissions
const menuItems = computed(() => {
  const allItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'advisor', 'manager'] },
    { name: 'Job Cards', path: '/jobcards', icon: CheckSquare, roles: ['admin', 'advisor'] },
    { name: 'Invoices', path: '/invoices', icon: FileText, roles: ['admin', 'advisor'] },
    { name: 'Payments', path: '/payments', icon: CreditCard, roles: ['admin', 'advisor'] },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: ['admin', 'manager'] },
    { name: 'Customer DB', path: '/customers', icon: Users, roles: ['admin', 'advisor'] },
    { name: 'Vehicle DB', path: '/vehicles', icon: Car, roles: ['admin', 'advisor'] },
    { name: 'Reports', path: '/reports', icon: FileBarChart, roles: ['admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
  ]
  
  if (!authStore.user) return []
  return allItems.filter(item => item.roles.includes(authStore.user.role))
})

// Auto close mobile sidebar on route change
watch(() => route.path, () => {
  if (window.innerWidth < 992) {
    sidebarOpen.value = false
  }
})

// Fetch settings when user becomes authenticated
watch(() => authStore.isAuthenticated, (newVal) => {
  if (newVal) {
    settingsStore.fetchSettings()
  }
})

const handleNavClick = () => {
  if (window.innerWidth < 992) {
    sidebarOpen.value = false
  }
}
</script>

<template>
  <div :class="{'dark-theme': darkMode, 'light-theme': !darkMode}">
    <!-- Guest Layout -->
    <div v-if="isGuestPage" class="guest-container">
      <router-view />
    </div>

    <!-- Main Workspace Layout -->
    <div v-else class="app-layout">
      <!-- Sidebar -->
      <aside class="sidebar noprint" :class="{'sidebar-closed': !sidebarOpen}">
        <div class="sidebar-header d-flex align-items-center justify-content-between">
          <img src="/logo.png" alt="Trust Care" class="sidebar-logo-img" style="max-height: 42px; max-width: 175px; object-fit: contain;" />
          <button class="close-sidebar-btn" @click="sidebarOpen = false">
            <X :size="18" />
          </button>
        </div>

        <nav class="sidebar-nav">
          <router-link 
            v-for="item in menuItems" 
            :key="item.name" 
            :to="item.path"
            class="nav-item"
            active-class="nav-item-active"
            @click="handleNavClick"
          >
            <component :is="item.icon" :size="16" />
            <span>{{ item.name }}</span>
          </router-link>
        </nav>

        <div class="sidebar-footer">
          <div class="user-meta">
            <div class="username">{{ authStore.user?.name || 'User' }}</div>
            <div class="role-badge">{{ authStore.user?.role }}</div>
          </div>
          <div class="footer-actions">
            <button class="btn-theme" @click="toggleTheme" title="Toggle Theme">
              <Sun v-if="darkMode" :size="14" />
              <Moon v-else :size="14" />
            </button>
            <button class="btn-logout" @click="handleLogout" title="Logout">
              <LogOut :size="14" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Section -->
      <div class="main-wrapper">
        <!-- Top Navbar -->
        <header class="topbar noprint">
          <button class="menu-toggle-btn" @click="sidebarOpen = !sidebarOpen">
            <Menu :size="20" />
          </button>
          
          <div class="topbar-right">
            <span class="workshop-heading">{{ settingsStore.settings?.workshop_name || 'TRUST CARE WORKSHOP' }}</span>
          </div>
        </header>

        <!-- View content -->
        <main class="page-content">
          <div class="container-fluid py-4">
            <router-view />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style>
/* Global CSS variables matching Brand Colors */
:root {
  --primary-color: #d71920; /* Trust Care Red */
  --bg-light: #f8f9fa;
  --bg-dark: #111111;
  --border-light: #dee2e6;
  
  --font-family: 'Inter', sans-serif;
}

body {
  font-family: var(--font-family);
  margin: 0;
  padding: 0;
}

/* Light Theme */
.light-theme {
  --bg-body: #f8f9fa;
  --bg-body-rgb: 248, 249, 250;
  --bg-sidebar: #ffffff;
  --bg-card: #ffffff;
  --bg-card-rgb: 255, 255, 255;
  --text-main: #111111;
  --text-muted: #6c757d;
  --border-color: #dee2e6;
  --sidebar-active: #d71920;
  --sidebar-text: #495057;
  --sidebar-active-text: #ffffff;
}

/* Dark Theme */
.dark-theme {
  --bg-body: #0a0a0a;
  --bg-body-rgb: 10, 10, 10;
  --bg-sidebar: #121212;
  --bg-card: #1e1e1e;
  --bg-card-rgb: 30, 30, 30;
  --text-main: #f8f9fa;
  --text-muted: #adb5bd;
  --border-color: #2c2c2c;
  --sidebar-active: #d71920;
  --sidebar-text: #adb5bd;
  --sidebar-active-text: #ffffff;
}

/* Layout Framework */
.app-layout {
  display: flex;
  min-h: 100vh;
  background-color: var(--bg-body);
  color: var(--text-main);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.guest-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111111;
}

/* Sidebar Styling */
.sidebar {
  width: 250px;
  background-color: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  z-index: 1000;
  transition: transform 0.3s ease, width 0.3s ease, background-color 0.2s ease;
}

.sidebar-closed {
  width: 0;
  transform: translateX(-250px);
  overflow: hidden;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.logo-box {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background-color: var(--primary-color);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
}

.logo-text {
  margin-left: 10px;
}

.logo-text h5 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.1;
}

.logo-text span {
  font-size: 9px;
  color: var(--primary-color);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.close-sidebar-btn {
  display: none;
  background: none;
  border: none;
  color: var(--text-main);
  position: absolute;
  right: 15px;
}

.sidebar-nav {
  flex: 1;
  padding: 15px 10px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  margin-bottom: 4px;
  border-radius: 8px;
  color: var(--sidebar-text);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  gap: 10px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: rgba(215, 25, 32, 0.08);
  color: var(--primary-color);
}

.nav-item-active {
  background-color: var(--sidebar-active) !important;
  color: var(--sidebar-active-text) !important;
  box-shadow: 0 4px 12px rgba(215, 25, 32, 0.2);
}

.sidebar-footer {
  padding: 15px;
  border-top: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.02);
}

.user-meta {
  margin-bottom: 12px;
}

.username {
  font-size: 13px;
  font-weight: 600;
}

.role-badge {
  display: inline-block;
  font-size: 9px;
  padding: 2px 6px;
  background-color: rgba(215, 25, 32, 0.1);
  color: var(--primary-color);
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  margin-top: 2px;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.btn-theme {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-sidebar);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-logout {
  flex: 1;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-sidebar);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
}

.btn-logout:hover {
  background-color: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

/* Main Section Styling */
.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 100vh;
}

.topbar {
  height: 60px;
  background-color: var(--bg-sidebar);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  transition: background-color 0.2s ease;
}

.menu-toggle-btn {
  background: none;
  border: none;
  color: var(--text-main);
  cursor: pointer;
}

.workshop-heading {
  font-size: 14px;
  font-weight: 700;
}

.page-content {
  flex: 1;
  overflow-y: auto;
}

/* Card overrides for Bootstrap to inherit variables */
.card {
  background-color: var(--bg-card) !important;
  border-color: var(--border-color) !important;
  color: var(--text-main) !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05) !important;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.card-header {
  border-bottom-color: var(--border-color) !important;
  background-color: rgba(0,0,0,0.02) !important;
}

/* Fix Bootstrap background utility classes in dark mode */
.bg-body {
  background-color: var(--bg-body) !important;
}
.bg-body.bg-opacity-50 {
  background-color: rgba(var(--bg-body-rgb), 0.5) !important;
}
.bg-body.bg-opacity-25 {
  background-color: rgba(var(--bg-body-rgb), 0.25) !important;
}
.bg-card {
  background-color: var(--bg-card) !important;
}
.bg-glass {
  background-color: var(--bg-card) !important;
  backdrop-filter: blur(10px) !important;
}

/* Global border overrides for theme cohesion */
.border, .border-top, .border-bottom, .border-start, .border-end, .border-secondary {
  border-color: var(--border-color) !important;
}

.table {
  color: var(--text-main) !important;
  border-color: var(--border-color) !important;
  background-color: transparent !important;
}

.table tr, .table td, .table th {
  background-color: transparent !important;
}

.table th {
  background-color: rgba(0,0,0,0.04) !important;
  border-bottom-color: var(--border-color) !important;
  font-weight: 700;
}

.dark-theme .table th {
  background-color: rgba(255,255,255,0.04) !important;
}

.table td {
  border-bottom-color: var(--border-color) !important;
  vertical-align: middle;
}

.form-control, .form-select {
  background-color: var(--bg-body) !important;
  border-color: var(--border-color) !important;
  color: var(--text-main) !important;
}

.form-control:focus, .form-select:focus {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 0.25rem rgba(215, 25, 32, 0.15) !important;
}

.dark-theme .text-muted,
.dark-theme .text-secondary,
.light-theme .text-muted,
.light-theme .text-secondary {
  color: var(--text-muted) !important;
}

.dark-theme .form-control::placeholder,
.dark-theme textarea::placeholder,
.light-theme .form-control::placeholder,
.light-theme textarea::placeholder {
  color: var(--text-muted) !important;
  opacity: 0.6 !important;
}

/* Global Autocomplete Suggestion Dropdowns */
.suggestions-dropdown {
  background-color: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-main) !important;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1050;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -2px rgba(0,0,0,0.3);
}

.suggestion-row {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.15s, color 0.15s;
  text-align: left;
}

.suggestion-row:last-child {
  border-bottom: none;
}

.suggestion-row:hover, .suggestion-row.active {
  background-color: var(--primary-color) !important;
  color: #ffffff !important;
}

/* Print CSS overrides */
@media print {
  .noprint {
    display: none !important;
  }
  .app-layout {
    display: block !important;
    background: #fff !important;
    color: #000 !important;
  }
  .main-wrapper {
    min-height: auto !important;
  }
}

/* Mobile Screen */
@media (max-width: 991.98px) {
  .close-sidebar-btn {
    display: block;
  }
  .sidebar {
    position: fixed;
    height: 100vh;
    left: 0;
    transform: translateX(0);
    z-index: 1050;
  }
  .sidebar-closed {
    transform: translateX(-100%);
  }
}
</style>
