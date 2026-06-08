<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import NewJobCardModal from '../components/NewJobCardModal.vue'
import NewInvoiceModal from '../components/NewInvoiceModal.vue'
import { 
  Car, CheckSquare, Package, DollarSign, TrendingUp, 
  PlusCircle, FileText, ClipboardList, ShieldAlert, ChevronRight, Activity
} from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const showNewJobModal = ref(false)
const showNewInvoiceModal = ref(false)

const handleInvoiceSaved = async (invoiceId: number) => {
  fetchDashboardData()
  // Generate and open PDF automatically for the printed bill
  try {
    const res = await axios.get(`/api/invoices/${invoiceId}/pdf`)
    window.open(res.data.pdf_url, '_blank')
  } catch (err) {
    console.error('Failed to generate PDF', err)
  }
}

const loading = ref(true)
const stats = ref({
  total_vehicles_today: 0,
  open_job_cards: 0,
  completed_jobs: 0,
  inventory_alerts: 0,
  pending_deliveries: 0,
  daily_revenue: 0,
  monthly_revenue: 0
})

const statusDistribution = ref<Record<string, number>>({
  'Open': 0,
  'Inspection': 0,
  'In Progress': 0,
  'Waiting Parts': 0,
  'Completed': 0,
  'Delivered': 0
})

const trends = ref<Array<{ date: string; label: string; revenue: number; vehicles: number }>>([])
const activeJobCards = ref<any[]>([])

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const statsRes = await axios.get('/api/dashboard')
    stats.value = statsRes.data.stats
    statusDistribution.value = statsRes.data.status_distribution
    trends.value = statsRes.data.trends

    // Also fetch recent job cards to display in the queue
    const jobsRes = await axios.get('/api/jobcards')
    // Get top 5 active/open jobs
    activeJobCards.value = jobsRes.data
      .filter((j: any) => j.status !== 'Delivered')
      .slice(0, 5)
  } catch (err) {
    console.error('Failed to load dashboard data', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

// Calculations for custom SVG charts
const maxRevenue = computed(() => {
  if (trends.value.length === 0) return 1000
  const max = Math.max(...trends.value.map(t => t.revenue))
  return max > 0 ? max : 1000
})

const maxVehicles = computed(() => {
  if (trends.value.length === 0) return 5
  const max = Math.max(...trends.value.map(t => t.vehicles))
  return max > 0 ? max : 5
})

const svgPoints = computed(() => {
  if (trends.value.length === 0) return ''
  const width = 600
  const height = 150
  const padding = 10
  const stepX = (width - padding * 2) / (trends.value.length - 1)
  
  return trends.value.map((t, idx) => {
    const x = padding + idx * stepX
    const y = height - padding - (t.revenue / maxRevenue.value) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val)
}
</script>

<template>
  <div class="dashboard-container animate-fade-in">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-1">Welcome back, {{ authStore.user?.name }}</h3>
        <p class="text-muted small mb-0">Here is the current state of Trust Care workshop today.</p>
      </div>
      <button class="btn btn-outline-danger btn-sm" @click="fetchDashboardData" :disabled="loading">
        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
        Refresh Data
      </button>
    </div>

    <!-- Quick Action Ribbon (For Authorized Roles) -->
    <div class="row g-3 mb-4" v-if="authStore.isAdmin || authStore.isAdvisor">
      <div class="col-12 col-md-3">
        <button class="btn btn-danger w-100 py-3 d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm hover-lift" @click="showNewJobModal = true">
          <PlusCircle :size="18" />
          <span>New Job Card</span>
        </button>
      </div>
      <div class="col-12 col-md-3">
        <button class="btn btn-dark w-100 py-3 d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm hover-lift" @click="showNewInvoiceModal = true">
          <FileText :size="18" />
          <span>Generate Invoice</span>
        </button>
      </div>
      <div class="col-12 col-md-3" v-if="authStore.isAdmin">
        <button class="btn btn-outline-danger w-100 py-3 d-flex align-items-center justify-content-center gap-2 rounded-3 shadow-sm hover-lift" @click="router.push('/reports')">
          <ClipboardList :size="18" />
          <span>View Reports</span>
        </button>
      </div>
    </div>

    <!-- Metrics Cards Grid -->
    <div class="row g-3 mb-4">
      <!-- Card 1: Today's Intake -->
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card metric-card bg-glass border-0 h-100 shadow-sm">
          <div class="card-body p-4 d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted text-uppercase fw-bold small">Today's Vehicles</span>
              <h2 class="fw-bold mt-2 mb-0">{{ stats.total_vehicles_today }}</h2>
              <span class="text-success small"><TrendingUp :size="12" class="me-1" />New Entries</span>
            </div>
            <div class="icon-circle bg-danger bg-opacity-10 text-danger">
              <Car :size="24" />
            </div>
          </div>
        </div>
      </div>

      <!-- Card 2: Open Job Cards -->
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card metric-card bg-glass border-0 h-100 shadow-sm">
          <div class="card-body p-4 d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted text-uppercase fw-bold small">Active Queue</span>
              <h2 class="fw-bold mt-2 mb-0">{{ stats.open_job_cards }}</h2>
              <span class="text-warning small">In repair cycle</span>
            </div>
            <div class="icon-circle bg-primary bg-opacity-10 text-primary">
              <CheckSquare :size="24" />
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: Monthly Revenue -->
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card metric-card bg-glass border-0 h-100 shadow-sm">
          <div class="card-body p-4 d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted text-uppercase fw-bold small">Monthly Revenue</span>
              <h3 class="fw-bold mt-2 mb-0">{{ formatCurrency(stats.monthly_revenue) }}</h3>
              <span class="text-muted small">This Month</span>
            </div>
            <div class="icon-circle bg-success bg-opacity-10 text-success">
              <DollarSign :size="24" />
            </div>
          </div>
        </div>
      </div>

      <!-- Card 4: Inventory Alerts -->
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card metric-card bg-glass border-0 h-100 shadow-sm" :class="{'border-danger-glow': stats.inventory_alerts > 0}">
          <div class="card-body p-4 d-flex align-items-center justify-content-between">
            <div>
              <span class="text-muted text-uppercase fw-bold small">Low Stock Items</span>
              <h2 class="fw-bold mt-2 mb-0" :class="{'text-danger': stats.inventory_alerts > 0}">{{ stats.inventory_alerts }}</h2>
              <span class="small" :class="stats.inventory_alerts > 0 ? 'text-danger fw-bold' : 'text-muted'">
                <ShieldAlert v-if="stats.inventory_alerts > 0" :size="12" class="me-1" />
                {{ stats.inventory_alerts > 0 ? 'Requires attention' : 'All items stocked' }}
              </span>
            </div>
            <div class="icon-circle" :class="stats.inventory_alerts > 0 ? 'bg-danger bg-opacity-20 text-danger' : 'bg-secondary bg-opacity-10 text-muted'">
              <Package :size="24" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts & Analytics Section -->
    <div class="row g-4 mb-4">
      <!-- 30-Day Revenue Trend (Custom SVG Line Chart) -->
      <div class="col-12 col-lg-8">
        <div class="card border-0 shadow-sm bg-glass h-100">
          <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
            <h5 class="fw-bold m-0 d-flex align-items-center gap-2">
              <Activity :size="18" class="text-danger" />
              <span>30-Day Revenue Performance</span>
            </h5>
            <span class="badge bg-danger bg-opacity-10 text-danger fw-bold rounded-pill">Total: {{ formatCurrency(stats.monthly_revenue) }}</span>
          </div>
          <div class="card-body px-4 pb-4">
            <!-- Custom responsive SVG Chart -->
            <div class="chart-container mt-3">
              <svg viewBox="0 0 600 150" class="w-100 svg-chart">
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#d71920" stop-opacity="0.25"/>
                    <stop offset="100%" stop-color="#d71920" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>
                <!-- Grid Lines -->
                <line x1="0" y1="10" x2="600" y2="10" stroke="var(--border-color)" stroke-dasharray="3,3" />
                <line x1="0" y1="75" x2="600" y2="75" stroke="var(--border-color)" stroke-dasharray="3,3" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="var(--border-color)" stroke-dasharray="3,3" />
                
                <!-- Area Under Line -->
                <path v-if="trends.length > 0" 
                  :d="`M 10,140 L ${svgPoints} L 590,140 Z`" 
                  fill="url(#chart-grad)" />

                <!-- The Actual Trend Line -->
                <polyline v-if="trends.length > 0"
                  fill="none"
                  stroke="#d71920"
                  stroke-width="3"
                  :points="svgPoints" />
              </svg>
            </div>
            
            <div class="d-flex justify-content-between text-muted small mt-2 px-1">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Workshop Status Distribution -->
      <div class="col-12 col-lg-4">
        <div class="card border-0 shadow-sm bg-glass h-100">
          <div class="card-header border-0 bg-transparent pt-4 px-4">
            <h5 class="fw-bold m-0">Job Status Summary</h5>
          </div>
          <div class="card-body px-4 pb-4">
            <div class="status-list d-flex flex-column gap-3 mt-2">
              <div v-for="(count, status) in statusDistribution" :key="status" class="status-item">
                <div class="d-flex justify-content-between align-items-center mb-1 small fw-bold">
                  <span>{{ status }}</span>
                  <span class="badge" :class="{
                    'bg-secondary': status === 'Open',
                    'bg-info text-dark': status === 'Inspection',
                    'bg-warning text-dark': status === 'In Progress' || status === 'Waiting Parts',
                    'bg-success': status === 'Completed' || status === 'Delivered'
                  }">{{ count }}</span>
                </div>
                <div class="progress rounded-pill" style="height: 6px;">
                  <div 
                    class="progress-bar rounded-pill" 
                    :class="{
                      'bg-secondary': status === 'Open',
                      'bg-info': status === 'Inspection',
                      'bg-warning': status === 'In Progress' || status === 'Waiting Parts',
                      'bg-success': status === 'Completed' || status === 'Delivered'
                    }"
                    :style="{ width: stats.open_job_cards > 0 ? `${(count / (stats.open_job_cards + stats.completed_jobs + 1)) * 100}%` : '0%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Vehicle Queue -->
    <div class="card border-0 shadow-sm bg-glass mb-4">
      <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
        <h5 class="fw-bold m-0">Active Repair Queue</h5>
        <router-link to="/jobcards" class="text-danger small fw-bold text-decoration-none d-flex align-items-center gap-1">
          <span>Manage All Job Cards</span>
          <ChevronRight :size="16" />
        </router-link>
      </div>
      <div class="card-body p-0">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-danger" role="status"></div>
        </div>
        <div v-else-if="activeJobCards.length === 0" class="text-center py-5 text-muted small">
          <Car :size="40" class="mb-2 text-muted" />
          <p class="m-0">No active vehicles in the repair queue right now.</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr class="text-uppercase small text-muted">
                <th class="ps-4">Job No</th>
                <th>Reg Number</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Complaints</th>
                <th class="text-end pe-4">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="job in activeJobCards" :key="job.id">
                <td class="ps-4 fw-bold text-danger">{{ job.job_card_no }}</td>
                <td class="fw-bold">{{ job.vehicle_reg_no }}</td>
                <td>{{ job.customer?.name || 'N/A' }}</td>
                <td>
                  <span class="badge font-monospace rounded" :class="{
                    'bg-secondary': job.status === 'Open',
                    'bg-info text-dark': job.status === 'Inspection',
                    'bg-warning text-dark': job.status === 'In Progress' || job.status === 'Waiting Parts',
                    'bg-success': job.status === 'Completed'
                  }">{{ job.status }}</span>
                </td>
                <td class="text-truncate" style="max-width: 250px;">
                  {{ Array.isArray(JSON.parse(job.complaints || '[]')) ? JSON.parse(job.complaints || '[]').join(', ') : job.complaints }}
                </td>
                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-dark btn-circle" @click="router.push(`/jobcards?id=${job.id}`)" title="View Job Card">
                    <ChevronRight :size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Action Modals -->
    <NewJobCardModal 
      :show="showNewJobModal" 
      @close="showNewJobModal = false" 
      @saved="fetchDashboardData" 
    />
    <NewInvoiceModal 
      :show="showNewInvoiceModal" 
      @close="showNewInvoiceModal = false" 
      @saved="handleInvoiceSaved" 
    />
  </div>
</template>

<style scoped>
.bg-glass {
  background-color: var(--bg-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color) !important;
}

.metric-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.border-danger-glow {
  border: 1px solid rgba(215, 25, 32, 0.3) !important;
  box-shadow: 0 0 10px rgba(215, 25, 32, 0.05) !important;
}

.icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(215, 25, 32, 0.15) !important;
}

.btn-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.svg-chart {
  overflow: visible;
}

.svg-chart polyline {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawLine 2s forwards ease-in-out;
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
