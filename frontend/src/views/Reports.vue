<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { 
  FileText, Calendar, Download, TrendingUp, 
  Package, CheckSquare, Users, DollarSign, ArrowDownUp
} from 'lucide-vue-next'

const reportType = ref('sales')
const dateRange = ref('month')
const customStart = ref('')
const customEnd = ref('')
const categoryId = ref('')

const categories = ref<any[]>([])
const loading = ref(false)
const reportData = ref<any>(null)

const fetchCategories = async () => {
  try {
    const res = await axios.get('/api/inventory/categories')
    categories.value = res.data
  } catch (err) {
    console.error('Failed to load categories', err)
  }
}

const runReport = async () => {
  loading.value = true
  reportData.value = null
  try {
    let endpoint = `/api/reports/${reportType.value}`
    let params: any = {
      range: dateRange.value,
      start_date: customStart.value,
      end_date: customEnd.value
    }
    
    if (reportType.value === 'inventory' && categoryId.value) {
      params.category_id = categoryId.value
    }
    
    const res = await axios.get(endpoint, { params })
    reportData.value = res.data
  } catch (err) {
    console.error('Failed to run analytics report', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCategories()
  runReport()
})

watch([reportType, dateRange], () => {
  runReport()
})

const formatCurrency = (val: any) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(parseFloat(val || 0))
}

// Export Table to CSV
const exportCSV = () => {
  if (!reportData.value) return
  
  let headers: string[] = []
  let rows: any[] = []
  let filename = `${reportType.value}_report.csv`
  
  if (reportType.value === 'sales') {
    headers = ['Invoice No', 'Date', 'Customer', 'Vehicle Reg', 'Subtotal Parts', 'Subtotal Labour', 'GST Tax', 'Discount', 'Grand Total', 'Paid', 'Balance']
    rows = reportData.value.invoices.map((inv: any) => [
      inv.invoice_no,
      inv.date,
      inv.customer?.name,
      inv.vehicle_reg_no,
      inv.parts_total,
      inv.labour_total,
      inv.gst_total,
      inv.discount,
      inv.grand_total,
      inv.paid_amount,
      inv.balance_due
    ])
  } else if (reportType.value === 'inventory') {
    headers = ['SKU', 'Item Name', 'Category', 'Unit', 'Purchase Rate', 'Selling Rate', 'GST Rate', 'Stock level', 'Alert Level', 'Asset Value (Purchase)']
    rows = reportData.value.items.map((i: any) => [
      i.sku,
      i.name,
      i.category?.name,
      i.unit,
      i.purchase_price,
      i.selling_price,
      i.gst_percent,
      i.current_stock,
      i.minimum_stock,
      i.current_stock * i.purchase_price
    ])
  } else if (reportType.value === 'jobcards') {
    headers = ['Job Card No', 'Date', 'Customer', 'Vehicle Reg', 'Odometer Reading', 'Fuel Level', 'Status']
    rows = reportData.value.job_cards.map((jc: any) => [
      jc.job_card_no,
      jc.date,
      jc.customer?.name,
      jc.vehicle_reg_no,
      jc.km_reading,
      jc.fuel_level,
      jc.status
    ])
  } else if (reportType.value === 'customers') {
    headers = ['Customer Name', 'Mobile Number', 'City', 'Job Cards opened', 'Total Bills']
    rows = reportData.value.customers.map((c: any) => [
      c.name,
      c.mobile,
      c.city,
      c.job_cards_count,
      c.invoices_count
    ])
  }
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + [headers.join(','), ...rows.map(r => r.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement("a")
  link.setAttribute("href", encodedUri)
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="reports-container animate-fade-in">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-1">Business Reports & Analytics</h3>
        <p class="text-muted small mb-0">Generate audits, inspect tied capital values, calculate repeat client rates, and analyze daily revenue trends.</p>
      </div>
    </div>

    <!-- Configuration Ribbon -->
    <div class="card border-0 shadow-sm bg-glass mb-4 p-3">
      <div class="row g-3 align-items-end">
        <div class="col-12 col-md-3">
          <label class="form-label small fw-bold text-muted uppercase">Select Report</label>
          <select v-model="reportType" class="form-select">
            <option value="sales">📈 Sales & Revenue Audit</option>
            <option value="inventory">📦 Inventory Valuation & Assets</option>
            <option value="jobcards">🛠️ Job Card Operational Audit</option>
            <option value="customers">👥 Customer Value Metrics</option>
          </select>
        </div>

        <div class="col-12 col-md-3" v-if="reportType !== 'customers' && reportType !== 'inventory'">
          <label class="form-label small fw-bold text-muted uppercase">Date Filter Range</label>
          <select v-model="dateRange" class="form-select">
            <option value="today">Today Only</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        <div class="col-12 col-md-3" v-if="reportType === 'inventory'">
          <label class="form-label small fw-bold text-muted uppercase">Filter Category</label>
          <select v-model="categoryId" class="form-select" @change="runReport">
            <option value="">All Categories</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>

        <div class="col-12 col-md-4 d-flex gap-2" v-if="dateRange === 'custom' && reportType !== 'customers' && reportType !== 'inventory'">
          <div>
            <label class="form-label small fw-bold text-muted uppercase">Start Date</label>
            <input type="date" v-model="customStart" class="form-control" @change="runReport" />
          </div>
          <div>
            <label class="form-label small fw-bold text-muted uppercase">End Date</label>
            <input type="date" v-model="customEnd" class="form-control" @change="runReport" />
          </div>
        </div>

        <div class="col-12 col-md-2 ms-auto d-flex gap-2">
          <button class="btn btn-outline-danger w-100" @click="runReport" :disabled="loading">
            Run Report
          </button>
          <button class="btn btn-dark btn-icon" @click="exportCSV" :disabled="!reportData" title="Export as CSV/Excel">
            <Download :size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Analytics Loader -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-danger" role="status"></div>
    </div>

    <div v-else-if="reportData">
      <!-- SECTION 1: Summary Cards -->
      <!-- Sales Summary Cards -->
      <div class="row g-3 mb-4" v-if="reportType === 'sales'">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Sales (Grand Total)</span>
            <h3 class="fw-bold mt-1 text-danger font-monospace">{{ formatCurrency(reportData.summary.total_sales) }}</h3>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Total Cash Collections</span>
            <h3 class="fw-bold mt-1 text-success font-monospace">{{ formatCurrency(reportData.summary.total_paid) }}</h3>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Outstanding Receivables</span>
            <h3 class="fw-bold mt-1 text-warning font-monospace">{{ formatCurrency(reportData.summary.total_balance) }}</h3>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Total Invoices Raised</span>
            <h3 class="fw-bold mt-1 font-monospace">{{ reportData.summary.invoice_count }}</h3>
          </div>
        </div>
      </div>

      <!-- Inventory Summary Cards -->
      <div class="row g-3 mb-4" v-if="reportType === 'inventory'">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Stock Asset Value (Purchase)</span>
            <h3 class="fw-bold mt-1 text-success font-monospace">{{ formatCurrency(reportData.summary.total_value_purchase) }}</h3>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Stock Asset Value (Selling)</span>
            <h3 class="fw-bold mt-1 text-danger font-monospace">{{ formatCurrency(reportData.summary.total_value_selling) }}</h3>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Valuation Profit Margin</span>
            <h3 class="fw-bold mt-1 text-primary font-monospace">{{ formatCurrency(reportData.summary.total_value_selling - reportData.summary.total_value_purchase) }}</h3>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Stock Items count</span>
            <h3 class="fw-bold mt-1 font-monospace">{{ reportData.summary.total_items }}</h3>
          </div>
        </div>
      </div>

      <!-- Job Cards Summary Cards -->
      <div class="row g-3 mb-4" v-if="reportType === 'jobcards'">
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Total Job Cards Issued</span>
            <h3 class="fw-bold mt-1 text-danger font-monospace">{{ reportData.summary.total_cards }}</h3>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Active Workshop Queue</span>
            <h3 class="fw-bold mt-1 text-warning font-monospace">{{ reportData.summary.open_cards }}</h3>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Quality Verified (Completed)</span>
            <h3 class="fw-bold mt-1 text-success font-monospace">{{ reportData.summary.completed }}</h3>
          </div>
        </div>
        <div class="col-6 col-lg-3">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Delivered Vehicles</span>
            <h3 class="fw-bold mt-1 font-monospace">{{ reportData.summary.delivered }}</h3>
          </div>
        </div>
      </div>

      <!-- Customer Summary Cards -->
      <div class="row g-3 mb-4" v-if="reportType === 'customers'">
        <div class="col-6 col-lg-4">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Registered Clients</span>
            <h3 class="fw-bold mt-1 text-danger font-monospace">{{ reportData.summary.total_customers }}</h3>
          </div>
        </div>
        <div class="col-6 col-lg-4">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Billed Customers count</span>
            <h3 class="fw-bold mt-1 text-success font-monospace">{{ reportData.summary.active_customers }}</h3>
          </div>
        </div>
        <div class="col-12 col-lg-4">
          <div class="card border-0 shadow-sm bg-glass p-3 h-100">
            <span class="text-muted small text-uppercase">Repeat Visits Customers (Rate)</span>
            <h3 class="fw-bold mt-1 text-primary font-monospace">
              {{ reportData.summary.repeat_customers }} 
              <span class="fs-6 fw-normal text-muted">({{ reportData.summary.total_customers > 0 ? ((reportData.summary.repeat_customers / reportData.summary.total_customers) * 100).toFixed(1) : 0 }}%)</span>
            </h3>
          </div>
        </div>
      </div>

      <!-- SECTION 2: Data Tables -->
      <div class="card border-0 shadow-sm bg-glass">
        <div class="card-body p-0">
          
          <!-- Sales Report Table -->
          <div v-if="reportType === 'sales'" class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr class="text-uppercase small text-muted">
                  <th class="ps-4">Inv No</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>Vehicle Reg</th>
                  <th>Parts subtotal</th>
                  <th>Labour subtotal</th>
                  <th>GST Tax</th>
                  <th>Discount</th>
                  <th>Total Due</th>
                  <th class="pe-4 text-end">Received</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in reportData.invoices" :key="inv.id">
                  <td class="ps-4 fw-bold text-danger">{{ inv.invoice_no }}</td>
                  <td class="small">{{ inv.date }}</td>
                  <td>{{ inv.customer?.name }}</td>
                  <td class="fw-bold font-monospace">{{ inv.vehicle_reg_no }}</td>
                  <td class="font-monospace">₹{{ parseFloat(inv.parts_total).toFixed(2) }}</td>
                  <td class="font-monospace">₹{{ parseFloat(inv.labour_total).toFixed(2) }}</td>
                  <td class="font-monospace">₹{{ parseFloat(inv.gst_total).toFixed(2) }}</td>
                  <td class="font-monospace text-danger">-₹{{ parseFloat(inv.discount).toFixed(2) }}</td>
                  <td class="font-monospace fw-bold text-danger">₹{{ parseFloat(inv.grand_total).toFixed(2) }}</td>
                  <td class="pe-4 text-end font-monospace text-success fw-bold">₹{{ parseFloat(inv.paid_amount).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Inventory Asset Valuation Report Table -->
          <div v-if="reportType === 'inventory'" class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr class="text-uppercase small text-muted">
                  <th class="ps-4">SKU / Item code</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>Stock Levels</th>
                  <th class="pe-4 text-end">Asset Value (Cost)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in reportData.items" :key="item.id">
                  <td class="ps-4 font-monospace fw-bold">{{ item.sku }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.category?.name }}</td>
                  <td>{{ item.unit }}</td>
                  <td class="font-monospace">₹{{ parseFloat(item.purchase_price).toFixed(2) }}</td>
                  <td class="font-monospace">₹{{ parseFloat(item.selling_price).toFixed(2) }}</td>
                  <td>
                    <span :class="item.current_stock <= item.minimum_stock ? 'text-danger fw-bold' : ''">{{ item.current_stock }}</span>
                  </td>
                  <td class="pe-4 text-end font-monospace fw-bold">₹{{ (item.current_stock * item.purchase_price).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Job Card Operational Table -->
          <div v-if="reportType === 'jobcards'" class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr class="text-uppercase small text-muted">
                  <th class="ps-4">Job Card No</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>Vehicle Reg</th>
                  <th>KM Odo In</th>
                  <th>Fuel Gauge</th>
                  <th class="pe-4 text-end">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="jc in reportData.job_cards" :key="jc.id">
                  <td class="ps-4 fw-bold text-danger font-monospace">{{ jc.job_card_no }}</td>
                  <td>{{ jc.date }}</td>
                  <td>{{ jc.customer?.name }}</td>
                  <td class="fw-bold font-monospace">{{ jc.vehicle_reg_no }}</td>
                  <td>{{ jc.km_reading }} km</td>
                  <td>{{ jc.fuel_level }}</td>
                  <td class="pe-4 text-end">
                    <span class="badge font-monospace" :class="{
                      'bg-secondary': jc.status === 'Open',
                      'bg-info text-dark': jc.status === 'Inspection',
                      'bg-warning text-dark': jc.status === 'In Progress' || jc.status === 'Waiting Parts',
                      'bg-success': jc.status === 'Completed' || jc.status === 'Delivered'
                    }">{{ jc.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Customer Visit frequency Table -->
          <div v-if="reportType === 'customers'" class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr class="text-uppercase small text-muted">
                  <th class="ps-4">Customer Name</th>
                  <th>Mobile Contact</th>
                  <th>City Location</th>
                  <th>Job Cards opened</th>
                  <th class="pe-4 text-end">Total Bills Generated</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in reportData.customers" :key="c.id">
                  <td class="ps-4 fw-bold">{{ c.name }}</td>
                  <td class="font-monospace">{{ c.mobile }}</td>
                  <td>{{ c.city }}</td>
                  <td>{{ c.job_cards_count }}</td>
                  <td class="pe-4 text-end fw-bold">{{ c.invoices_count }}</td>
                </tr>
              </tbody>
            </table>
          </div>

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

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
