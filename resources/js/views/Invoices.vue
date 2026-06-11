<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { useSettingsStore } from '../stores/settings'
import { 
  FileText, Search, PlusCircle, Printer, Download, Edit,
  Trash2, Plus, X, ChevronRight, Calculator, Check, ArrowRight
} from 'lucide-vue-next'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const invoices = ref<any[]>([])
const customers = ref<any[]>([])
const vehicles = ref<any[]>([])
const inventoryItems = ref<any[]>([])
const pendingJobCards = ref<any[]>([])

const searchQuery = ref('')
const selectedStatus = ref('')
const dateRange = ref('month')
const customStart = ref('')
const customEnd = ref('')

const loading = ref(false)
const detailsLoading = ref(false)
const selectedInvoice = ref<any | null>(null)

// Invoice Form State
const showFormModal = ref(false)
const editMode = ref(false)
const formInvoice = ref({
  date: new Date().toISOString().substring(0, 10),
  inward_date: new Date().toISOString().substring(0, 10),
  service_type: 'General Service',
  customer_id: null as any,
  vehicle_reg_no: '',
  km_reading: 0,
  items: [] as Array<{
    type: 'Part' | 'Labour' | 'Service';
    description: string;
    qty: number;
    rate: number;
    cost: number;
    tax_percent: number;
    amount: number;
  }>,
  discount: 0,
  paid_amount: 0,
  payment_mode: 'Cash',
  residence: '',
  notes: ''
})

// Temp input variables for current item editing in form
const tempItem = ref({
  type: 'Part' as 'Part' | 'Labour' | 'Service',
  description: '',
  qty: 1,
  rate: 0,
  cost: 0,
  tax_percent: 18
})

const templateTimeout = (fn: Function, delay: number) => setTimeout(fn, delay)

// Auto suggest state
const showSuggestions = ref(false)
const suggestions = computed(() => {
  if (tempItem.value.type !== 'Part' || !tempItem.value.description) return []
  const query = tempItem.value.description.toLowerCase()
  return inventoryItems.value.filter(i => 
    i.name.toLowerCase().includes(query) || i.sku.toLowerCase().includes(query)
  ).slice(0, 5)
})

const fetchInvoices = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/invoices', {
      params: {
        search: searchQuery.value,
        status: selectedStatus.value,
        range: dateRange.value,
        start_date: customStart.value,
        end_date: customEnd.value
      }
    })
    invoices.value = res.data
  } catch (err) {
    console.error('Failed to load invoices', err)
  } finally {
    loading.value = false
  }
}

const fetchMetadata = async () => {
  try {
    const [cRes, vRes, iRes, jRes] = await Promise.all([
      axios.get('/api/customers'),
      axios.get('/api/vehicles'),
      axios.get('/api/inventory/items'),
      axios.get('/api/jobcards')
    ])
    customers.value = cRes.data
    vehicles.value = vRes.data
    inventoryItems.value = iRes.data
    // Filter completed or active job cards to import from
    pendingJobCards.value = jRes.data.filter((j: any) => j.status === 'Completed' || j.status === 'In Progress')
  } catch (err) {
    console.error('Failed to fetch invoice metadata', err)
  }
}

const selectInvoice = async (id: number) => {
  detailsLoading.value = true
  try {
    const res = await axios.get(`/api/invoices/${id}`)
    selectedInvoice.value = res.data
  } catch (err) {
    console.error('Failed to load invoice details', err)
  } finally {
    detailsLoading.value = false
  }
}

onMounted(() => {
  fetchInvoices()
  fetchMetadata()
})

watch(selectedStatus, () => fetchInvoices())
watch(dateRange, () => fetchInvoices())

// Calculations on form Invoice
const formCalculations = computed(() => {
  let partsTotal = 0
  let labourTotal = 0
  let gstTotal = 0
  
  formInvoice.value.items.forEach(item => {
    const base = item.qty * item.rate
    const tax = (base * item.tax_percent) / 100
    gstTotal += tax
    if (item.type === 'Part') {
      partsTotal += base
    } else {
      labourTotal += base
    }
  })
  
  const discount = formInvoice.value.discount || 0
  const grandTotal = partsTotal + labourTotal + gstTotal - discount
  const balanceDue = grandTotal - (formInvoice.value.paid_amount || 0)
  
  return {
    partsTotal,
    labourTotal,
    gstTotal,
    grandTotal: grandTotal > 0 ? grandTotal : 0,
    balanceDue: balanceDue > 0 ? balanceDue : 0
  }
})

// Suggestions matching
const selectSuggestion = (invItem: any) => {
  tempItem.value.description = invItem.name
  tempItem.value.rate = parseFloat(invItem.selling_price)
  tempItem.value.cost = parseFloat(invItem.purchase_price)
  tempItem.value.tax_percent = parseFloat(invItem.gst_percent)
  showSuggestions.value = false
}

// Form methods
const openNewInvoiceModal = () => {
  editMode.value = false
  formInvoice.value = {
    date: new Date().toISOString().substring(0, 10),
    inward_date: new Date().toISOString().substring(0, 10),
    service_type: 'General Service',
    customer_id: customers.value[0]?.id || null,
    vehicle_reg_no: vehicles.value[0]?.registration_no || '',
    km_reading: 0,
    items: [],
    discount: 0,
    paid_amount: 0,
    payment_mode: 'Cash',
    residence: '',
    notes: ''
  }
  
  tempItem.value = {
    type: 'Part',
    description: '',
    qty: 1,
    rate: 0,
    cost: 0,
    tax_percent: 18
  }
  
  showFormModal.value = true
}

const openEditInvoiceModal = () => {
  if (!selectedInvoice.value) return
  editMode.value = true
  
  formInvoice.value = {
    id: selectedInvoice.value.id,
    date: selectedInvoice.value.date,
    inward_date: selectedInvoice.value.inward_date || selectedInvoice.value.date,
    service_type: selectedInvoice.value.service_type || 'General Service',
    customer_id: selectedInvoice.value.customer_id,
    vehicle_reg_no: selectedInvoice.value.vehicle_reg_no,
    km_reading: selectedInvoice.value.km_reading || 0,
    items: selectedInvoice.value.items.map((item: any) => ({
      type: item.type,
      description: item.description,
      qty: parseInt(item.qty),
      rate: parseFloat(item.rate),
      cost: parseFloat(item.cost || 0),
      tax_percent: parseFloat(item.tax_percent || 18),
      amount: parseFloat(item.amount)
    })),
    discount: parseFloat(selectedInvoice.value.discount || 0),
    paid_amount: parseFloat(selectedInvoice.value.paid_amount || 0),
    payment_mode: selectedInvoice.value.payment_mode || 'Cash',
    residence: selectedInvoice.value.residence || '',
    notes: selectedInvoice.value.notes || ''
  }

  tempItem.value = {
    type: 'Part',
    description: '',
    qty: 1,
    rate: 0,
    cost: 0,
    tax_percent: 18
  }

  showFormModal.value = true
}

const parseNumber = (val: any, fallback = 0): number => {
  if (val === null || val === undefined || val === '') return fallback
  const num = parseFloat(val)
  return isNaN(num) ? fallback : num
}

const importJobCard = (jc: any) => {
  formInvoice.value.customer_id = jc.customer_id
  formInvoice.value.vehicle_reg_no = jc.vehicle_reg_no
  formInvoice.value.km_reading = jc.km_reading
  
  // Import complaints as labour tasks
  let complaints = []
  if (Array.isArray(jc.complaints)) {
    complaints = jc.complaints
  } else if (typeof jc.complaints === 'string') {
    try {
      const parsed = JSON.parse(jc.complaints)
      complaints = Array.isArray(parsed) ? parsed : []
    } catch (e) {
      complaints = []
    }
  }
  complaints.forEach((c: string) => {
    formInvoice.value.items.push({
      type: 'Labour',
      description: `Labour charges for ${c}`,
      qty: 1,
      rate: 350, // Default labour fee, adjustable
      cost: 0,
      tax_percent: 18,
      amount: 350 * 1.18
    })
  })
  
  // Import parts from updates if logged
  if (jc.updates) {
    jc.updates.forEach((up: any) => {
      let parts = []
      if (Array.isArray(up.parts_used)) {
        parts = up.parts_used
      } else if (typeof up.parts_used === 'string') {
        try {
          const parsed = JSON.parse(up.parts_used)
          parts = Array.isArray(parsed) ? parsed : []
        } catch (e) {
          parts = []
        }
      }
      parts.forEach((p: any) => {
        // Look up item in database to match price
        const match = inventoryItems.value.find(i => i.name.toLowerCase() === p.name.toLowerCase())
        const rate = match ? parseNumber(match.selling_price, 100) : 100
        const cost = match ? parseNumber(match.purchase_price, 50) : 50
        const tax = match ? parseNumber(match.gst_percent, 18) : 18
        const qty = parseNumber(p.qty, 1)
        
        formInvoice.value.items.push({
          type: 'Part',
          description: p.name,
          qty,
          rate,
          cost,
          tax_percent: tax,
          amount: qty * rate * (1 + tax / 100)
        })
      })
    })
  }
}

const formatDescription = (val: string) => {
  if (!val) return '';
  return val.trim().split(/\s+/).map(word => {
    if (!word) return '';
    // If it contains letters and numbers (like 5w40, 10w30, skf123), capitalize all of it
    if (/[a-zA-Z]/.test(word) && /[0-9]/.test(word)) {
      return word.toUpperCase();
    }
    // Otherwise, capitalize first letter (Title Case)
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

const addInvoiceItem = () => {
  if (!tempItem.value.description) {
    alert('Please enter a description for the item.')
    return
  }
  
  const qtyNum = parseNumber(tempItem.value.qty, 1)
  const rateNum = parseNumber(tempItem.value.rate, 0)
  const taxNum = parseNumber(tempItem.value.tax_percent, 18)
  const costNum = parseNumber(tempItem.value.cost, 0)

  if (qtyNum <= 0) {
    alert('Please enter a valid quantity (greater than 0).')
    return
  }
  if (rateNum < 0) {
    alert('Please enter a valid rate (0 or greater).')
    return
  }
  if (taxNum < 0) {
    alert('Please enter a valid GST tax percentage (0 or greater).')
    return
  }
  
  const formattedDesc = formatDescription(tempItem.value.description)
  const base = qtyNum * rateNum
  const tax = (base * taxNum) / 100
  
  formInvoice.value.items.push({
    type: tempItem.value.type,
    description: formattedDesc,
    qty: qtyNum,
    rate: rateNum,
    cost: costNum,
    tax_percent: taxNum,
    amount: base + tax
  })
  
  // Clear temp item
  tempItem.value = {
    type: tempItem.value.type, // keep type to add multiple parts easily
    description: '',
    qty: 1,
    rate: 0,
    cost: 0,
    tax_percent: 18
  }
}

const removeInvoiceItem = (index: number) => {
  formInvoice.value.items.splice(index, 1)
}

const saveInvoice = async () => {
  // Validate discounts limits: Non-admins capped at 10% discount
  if (!authStore.isAdmin && formInvoice.value.discount > formCalculations.value.partsTotal * 0.10) {
    alert('Discount warning: Non-administrators cannot apply discounts exceeding 10% of parts subtotal.')
    return
  }
  
  if (formInvoice.value.items.length === 0) {
    alert('Please add at least one part or service item to the invoice.')
    return
  }
  
  try {
    let res
    const cleanReg = formInvoice.value.vehicle_reg_no.toUpperCase().replace(/\s/g, '')
    const sanitizedItems = formInvoice.value.items.map(item => ({
      type: item.type,
      description: item.description,
      qty: parseNumber(item.qty, 1),
      rate: parseNumber(item.rate, 0),
      cost: parseNumber(item.cost, 0),
      tax_percent: parseNumber(item.tax_percent, 18),
      amount: parseNumber(item.amount, 0)
    }))
    
    const payload = {
      ...formInvoice.value,
      vehicle_reg_no: cleanReg,
      items: sanitizedItems,
      paid_amount: parseNumber(formInvoice.value.paid_amount, 0),
      discount: parseNumber(formInvoice.value.discount, 0)
    }
    
    if (editMode.value) {
      res = await axios.put(`/api/invoices/${(formInvoice.value as any).id}`, payload)
    } else {
      res = await axios.post('/api/invoices', payload)
    }
    showFormModal.value = false
    fetchInvoices()
    selectInvoice(res.data.id)
  } catch (err: any) {
    if (err.response?.data?.errors) {
      const messages = Object.values(err.response.data.errors).flat().join('\n')
      alert(`Failed to save invoice:\n${messages}`)
    } else {
      alert(err.response?.data?.error || 'Failed to save invoice.')
    }
  }
}

const deleteInvoice = async (id: number) => {
  if (!confirm('Are you sure you want to delete this invoice? This will restore inventory stocks.')) return
  try {
    await axios.delete(`/api/invoices/${id}`)
    selectedInvoice.value = null
    fetchInvoices()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to delete invoice.')
  }
}

const downloadPDF = async () => {
  if (!selectedInvoice.value) return
  try {
    const res = await axios.get(`/api/invoices/${selectedInvoice.value.id}/pdf`)
    window.open(res.data.pdf_url, '_blank')
  } catch (err) {
    console.error('Failed to generate/download invoice PDF', err)
  }
}

const printWindow = () => {
  window.print()
}
</script>

<template>
  <div class="invoices-container animate-fade-in">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4 noprint">
      <div>
        <h3 class="fw-bold mb-1">Invoice Builder</h3>
        <p class="text-muted small mb-0">Build professional tax bills, search past receipts, and track pending outstanding credits.</p>
      </div>
      <button class="btn btn-danger d-flex align-items-center gap-2 px-3 rounded-3" @click="openNewInvoiceModal">
        <PlusCircle :size="16" />
        <span>Create Invoice</span>
      </button>
    </div>

    <!-- Filters and Grid -->
    <div class="row g-4">
      <!-- Invoice Listings Column -->
      <div :class="selectedInvoice ? 'col-12 col-lg-5' : 'col-12'" class="noprint">
        <!-- Date / Range Filter Card -->
        <div class="card border-0 shadow-sm bg-glass mb-4 p-3">
          <div class="row g-3 align-items-center">
            <div class="col-12">
              <div class="input-group">
                <span class="input-group-text bg-transparent border-end-0 text-muted">
                  <Search :size="16" />
                </span>
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  class="form-control border-start-0 ps-1" 
                  placeholder="Search by invoice number, registration..."
                  @input="fetchInvoices"
                />
              </div>
            </div>
            <div class="col-6">
              <select v-model="dateRange" class="form-select">
                <option value="today">Today's Invoices</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
            <div class="col-6">
              <select v-model="selectedStatus" class="form-select">
                <option value="">All Payment status</option>
                <option value="Paid">Paid Only</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Unpaid / Pending</option>
              </select>
            </div>
            <div v-if="dateRange === 'custom'" class="col-12 d-flex gap-2">
              <input type="date" v-model="customStart" class="form-control form-control-sm" @change="fetchInvoices" />
              <span class="align-self-center">to</span>
              <input type="date" v-model="customEnd" class="form-control form-control-sm" @change="fetchInvoices" />
            </div>
          </div>
        </div>

        <!-- Invoice List -->
        <div class="card border-0 shadow-sm bg-glass">
          <div class="card-body p-0">
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-danger" role="status"></div>
            </div>
            <div v-else-if="invoices.length === 0" class="text-center py-5 text-muted small">
              <FileText :size="40" class="mb-2 text-muted" />
              <p class="m-0">No invoice bills matching this query.</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr class="text-uppercase small text-muted">
                    <th class="ps-4">Inv No</th>
                    <th>Vehicle Reg</th>
                    <th>Grand Total</th>
                    <th>Status</th>
                    <th class="text-end pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="inv in invoices" 
                    :key="inv.id" 
                    class="cursor-pointer"
                    :class="{'table-active-danger': selectedInvoice?.id === inv.id}"
                    @click="selectInvoice(inv.id)"
                  >
                    <td class="ps-4 fw-bold text-danger">{{ inv.invoice_no }}</td>
                    <td class="fw-bold font-monospace">{{ inv.vehicle_reg_no }}</td>
                    <td>₹{{ parseFloat(inv.grand_total).toFixed(2) }}</td>
                    <td>
                      <span class="badge font-monospace" :class="{
                        'bg-success': inv.payment_status === 'Paid',
                        'bg-warning text-dark': inv.payment_status === 'Partially Paid',
                        'bg-danger': inv.payment_status === 'Pending'
                      }">{{ inv.payment_status }}</span>
                    </td>
                    <td class="text-end pe-4">
                      <button class="btn btn-sm btn-dark btn-icon" @click="selectInvoice(inv.id)">
                        <ChevronRight :size="14" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Sheet A4 Column -->
      <div v-if="selectedInvoice" class="col-12" :class="selectedInvoice ? 'col-lg-7' : ''">
        <div class="card border-0 shadow-sm bg-glass h-100 preview-wrapper">
          <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center noprint">
            <h5 class="fw-bold m-0 text-muted small uppercase">Invoice A4 Print Preview</h5>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1.5" @click="openEditInvoiceModal">
                <Edit :size="14" />
                <span>Edit</span>
              </button>
              <button class="btn btn-sm btn-dark d-flex align-items-center gap-1.5" @click="printWindow">
                <Printer :size="14" />
                <span>Print Bill</span>
              </button>
              <button class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1.5" @click="downloadPDF">
                <Download :size="14" />
                <span>PDF</span>
              </button>
              <button class="btn btn-sm btn-outline-dark btn-icon rounded-circle" @click="deleteInvoice(selectedInvoice.id)" title="Delete Invoice">
                <Trash2 :size="14" />
              </button>
              <button class="btn btn-sm btn-outline-secondary btn-icon rounded-circle" @click="selectedInvoice = null">
                <X :size="14" />
              </button>
            </div>
          </div>

          <!-- Fixed A4 Page Container (This matches PDF output and looks like a real invoice) -->
          <div class="card-body p-0 d-flex justify-content-center bg-dark bg-opacity-10 print-page-container">
            <div class="invoice-a4-sheet p-5 bg-white text-dark shadow border">
                           <!-- Company Header Table (Exactly like PDF) -->
              <table class="header-table" style="width: 100%; border-bottom: 2px solid #d71920; padding-bottom: 10px; margin-bottom: 15px; border-collapse: collapse;">
                <tr>
                  <td style="width: 18%; vertical-align: middle; padding: 0; text-align: left; border: none !important; background: transparent !important;">
                    <img v-if="settingsStore.settings?.logo" :src="settingsStore.settings.logo" alt="Trust Care Logo" style="max-height: 55px; display: block;" />
                    <img v-else src="/logo.png" alt="Trust Care Logo" style="max-height: 55px; display: block;" />
                  </td>
                  <td style="width: 47%; vertical-align: middle; padding-left: 10px; text-align: left; border: none !important; background: transparent !important;">
                    <div style="font-size: 20px; font-weight: bold; color: #d71920; margin: 0; text-transform: uppercase;">
                      {{ settingsStore.settings?.workshop_name || 'TRUST CARE WORKSHOP' }}
                    </div>
                    <div style="font-size: 9px; font-weight: bold; color: #555; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                      {{ settingsStore.settings?.tagline || 'Driven by Trust, Powered by Skill' }}
                    </div>
                    <div style="font-size: 10px; color: #444; margin-top: 5px; line-height: 1.4;">
                      {{ settingsStore.settings?.address || 'Near Vaishnodevi Circle, Ahmedabad' }}<br>
                      Contact: {{ settingsStore.settings?.mobile || '8200695660 | 9512660711' }} | Email: {{ settingsStore.settings?.email || 'info@trustcare.com' }}<br>
                      <strong>GSTIN:</strong> {{ settingsStore.settings?.gst || 'N/A' }}
                    </div>
                  </td>
                  <td style="width: 35%; text-align: right; vertical-align: middle; padding: 0; border: none !important; background: transparent !important; color: #111;">
                    <div style="font-size: 18px; font-weight: 900; color: #d71920; margin: 0; text-transform: uppercase; letter-spacing: 1px;">INVOICE</div>
                    <div style="font-size: 11px; font-weight: bold; color: #111; margin-top: 3px;">NO: {{ selectedInvoice.invoice_no }}</div>
                  </td>
                </tr>
              </table>

              <!-- Metadata Details Grid (Boxed like PDF) -->
              <table class="meta-table">
                <tr>
                  <td style="width: 60%;">
                    <span class="field-label">Name:</span> {{ selectedInvoice.customer?.name }}<br>
                    <span class="field-label">Contact:</span> {{ selectedInvoice.customer?.mobile }} <span v-if="selectedInvoice.customer?.alternate_mobile">/ {{ selectedInvoice.customer?.alternate_mobile }}</span><br>
                    <span class="field-label">Email:</span> {{ selectedInvoice.customer?.email || 'N/A' }}<br>
                    <span class="field-label">Address:</span> {{ selectedInvoice.customer?.address_1 }} {{ selectedInvoice.customer?.address_2 }}
                  </td>
                  <td style="width: 40%;">
                    <span class="field-label">Inward Date:</span> {{ selectedInvoice.inward_date || selectedInvoice.date }}<br>
                    <span class="field-label">Invoice Date:</span> {{ selectedInvoice.date }}<br>
                    <span class="field-label">Residence:</span> {{ selectedInvoice.residence || 'N/A' }}<br>
                    <span class="field-label">Service Type:</span> {{ selectedInvoice.service_type }}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="background-color: #f8f9fa !important; font-weight: bold; border-top: 1.5px solid #111 !important; border-bottom: 1.5px solid #111 !important; padding: 4px 8px; font-size: 9px; text-transform: uppercase; text-align: left;">
                    Vehicle Information
                  </td>
                </tr>
                <tr>
                  <td>
                    <span class="field-label">Registration No:</span> <strong style="color: #d71920;">{{ selectedInvoice.vehicle_reg_no }}</strong><br>
                    <span class="field-label">Make & Model:</span> {{ selectedInvoice.vehicle?.make }} {{ selectedInvoice.vehicle?.model }}
                  </td>
                  <td>
                    <span class="field-label">Odometer:</span> {{ selectedInvoice.km_reading }} KMS
                  </td>
                </tr>
              </table>

              <!-- Services & Parts Table (Exactly like PDF) -->
              <table class="services-table">
                <thead>
                  <tr>
                    <th style="width: 5%; text-align: center;">#</th>
                    <th style="width: 10%;">Type</th>
                    <th style="width: 45%;">Description</th>
                    <th style="width: 10%; text-align: center;">Qty</th>
                    <th style="width: 15%; text-align: right;">Rate</th>
                    <th style="width: 15%; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in selectedInvoice.items" :key="item.id">
                    <td style="text-align: center;">{{ idx + 1 }}</td>
                    <td>{{ item.type }}</td>
                    <td>{{ item.description }}</td>
                    <td style="text-align: center;" class="font-monospace">{{ item.qty }}</td>
                    <td style="text-align: right;" class="font-monospace">₹{{ parseFloat(item.rate).toFixed(2) }}</td>
                    <td style="text-align: right;" class="font-monospace fw-bold">₹{{ (item.qty * item.rate).toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Totals and Terms Block (Structured like PDF) -->
              <div class="d-flex justify-content-between align-items-start mt-3">
                <div style="width: 60%; text-align: left;" class="small">
                  <!-- Terms and Conditions -->
                  <div style="font-size: 9px; color: #555; line-height: 1.3; text-align: left; padding-top: 5px;">
                    <strong>Terms & Conditions:</strong><br>
                    {{ settingsStore.settings?.terms || 'Payment required upon vehicle collection. Parts warranty subject to manufacturer terms. Labour warranty applicable only to covered repairs.' }}
                  </div>
                </div>
                
                <div style="width: 35%;">
                  <!-- Totals Table -->
                  <table style="width: 100%; border-collapse: collapse; margin-left: auto;">
                    <tr>
                      <td style="font-weight: bold; text-align: left; padding: 4px 8px; font-size: 10px; border-bottom: 1px solid #ddd; color: #111;">Parts Total:</td>
                      <td style="text-align: right; padding: 4px 8px; font-size: 10px; border-bottom: 1px solid #ddd; color: #111;" class="font-monospace">₹{{ parseFloat(selectedInvoice.parts_total).toFixed(2) }}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: bold; text-align: left; padding: 4px 8px; font-size: 10px; border-bottom: 1px solid #ddd; color: #111;">Labour Total:</td>
                      <td style="text-align: right; padding: 4px 8px; font-size: 10px; border-bottom: 1px solid #ddd; color: #111;" class="font-monospace">₹{{ parseFloat(selectedInvoice.labour_total).toFixed(2) }}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: bold; text-align: left; padding: 4px 8px; font-size: 10px; border-bottom: 1px solid #ddd; color: #111;">GST Total:</td>
                      <td style="text-align: right; padding: 4px 8px; font-size: 10px; border-bottom: 1px solid #ddd; color: #111;" class="font-monospace">₹{{ parseFloat(selectedInvoice.gst_total).toFixed(2) }}</td>
                    </tr>
                    <tr v-if="parseFloat(selectedInvoice.discount) > 0">
                      <td style="font-weight: bold; text-align: left; padding: 4px 8px; font-size: 10px; border-bottom: 1px solid #ddd; color: #d71920;">Discount:</td>
                      <td style="text-align: right; padding: 4px 8px; font-size: 10px; border-bottom: 1px solid #ddd; color: #d71920;" class="font-monospace">-₹{{ parseFloat(selectedInvoice.discount).toFixed(2) }}</td>
                    </tr>
                    <tr>
                      <td style="font-weight: bold; text-align: left; padding: 8px 8px 4px 8px; font-size: 11px; border-bottom: none; color: #d71920;">Grand Total:</td>
                      <td style="text-align: right; padding: 8px 8px 4px 8px; font-size: 11px; border-bottom: none; color: #d71920; font-weight: bold;" class="font-monospace">₹{{ parseFloat(selectedInvoice.grand_total).toFixed(2) }}</td>
                    </tr>
                  </table>
                </div>
              </div>

              <!-- Signatures Table (Exactly like PDF) -->
              <table style="width: 100%; margin-top: 50px; border-collapse: collapse;">
                <tr>
                  <td style="width: 50%; padding: 0; text-align: left; border: none !important; background: transparent !important;">
                    <div style="width: 180px; border-top: 1px solid #333; text-align: center; font-size: 9px; font-weight: bold; color: #555; padding-top: 4px;">Customer Signature</div>
                  </td>
                  <td style="width: 50%; padding: 0; text-align: right; border: none !important; background: transparent !important;">
                    <div style="width: 180px; border-top: 1px solid #333; text-align: center; font-size: 9px; font-weight: bold; color: #555; padding-top: 4px; margin-left: auto;">Authorized Signature</div>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Invoice Generation Wizard Modal -->
    <div v-if="showFormModal" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center noprint">
      <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 900px;">
        <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold m-0">{{ editMode ? 'Edit Tax Invoice Bill' : 'Build Tax Invoice Bill' }}</h5>
          <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="showFormModal = false">
            <X :size="18" />
          </button>
        </div>
        <form @submit.prevent="saveInvoice">
          <div class="card-body px-4 py-3" style="max-height: 75vh; overflow-y: auto;">
            <!-- Step 1: Customer / Vehicle Selection -->
            <div class="row g-3 mb-4">
              <div class="col-12 col-md-3">
                <label class="form-label small fw-bold text-muted uppercase">Bill Date</label>
                <input type="date" v-model="formInvoice.date" class="form-control" required />
              </div>
              <div class="col-12 col-md-3">
                <label class="form-label small fw-bold text-muted uppercase">Service Type</label>
                <select v-model="formInvoice.service_type" class="form-select" required>
                  <option value="General Service">General Service</option>
                  <option value="Accident Repair">Accident Repair</option>
                  <option value="Electrical Diagnostics">Electrical Diagnostics</option>
                  <option value="Washing & Detailing">Washing & Detailing</option>
                  <option value="Body Shop Paint">Body Shop Paint</option>
                </select>
              </div>
              <div class="col-12 col-md-3">
                <label class="form-label small fw-bold text-muted uppercase">Vehicle Registration</label>
                <select v-model="formInvoice.vehicle_reg_no" class="form-select" required>
                  <option v-for="v in vehicles" :key="v.registration_no" :value="v.registration_no">{{ v.registration_no }} ({{ v.make }} {{ v.model }})</option>
                </select>
              </div>
              <div class="col-12 col-md-3">
                <label class="form-label small fw-bold text-muted uppercase">Billed Customer</label>
                <select v-model="formInvoice.customer_id" class="form-select" required>
                  <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.mobile }})</option>
                </select>
              </div>
            </div>

            <!-- Optional: Import from Job Cards Ribbon -->
            <div v-if="pendingJobCards.length > 0" class="mb-4 bg-glass border-danger bg-opacity-5 p-3 rounded-3">
              <span class="small fw-bold text-danger uppercase d-block mb-2">Import components from completed job cards:</span>
              <div class="d-flex flex-wrap gap-2">
                <button 
                  v-for="jc in pendingJobCards" 
                  :key="jc.id" 
                  type="button" 
                  class="btn btn-xs btn-outline-danger d-flex align-items-center gap-1.5"
                  @click="importJobCard(jc)"
                >
                  <span>Import: {{ jc.job_card_no }} ({{ jc.vehicle_reg_no }})</span>
                  <ArrowRight :size="12" />
                </button>
              </div>
            </div>

            <!-- Step 2: Item Entry Forms -->
            <div class="border-top pt-3 mb-3">
              <span class="small fw-bold text-muted uppercase d-block mb-3">Invoice Line Items:</span>
              <div class="row g-2 align-items-end mb-3 bg-body p-3 rounded border">
                <div class="col-12 col-md-2">
                  <label class="form-label small-label font-bold text-muted">Item Type</label>
                  <select v-model="tempItem.type" class="form-select form-select-sm">
                    <option value="Part">Part (Item)</option>
                    <option value="Labour">Labour Fee</option>
                    <option value="Service">Outside job</option>
                  </select>
                </div>
                <div class="col-12 col-md-4 position-relative">
                  <label class="form-label small-label font-bold text-muted">Description</label>
                  <input 
                    type="text" 
                    v-model="tempItem.description" 
                    class="form-control form-control-sm" 
                    placeholder="e.g. Engine Oil, Front brake pads..." 
                    @focus="showSuggestions = true"
                    @blur="tempItem.description = formatDescription(tempItem.description); templateTimeout(() => showSuggestions = false, 200)"
                  />
                  <!-- Suggestion list -->
                  <div v-if="showSuggestions && suggestions.length > 0" class="suggestions-dropdown position-absolute w-100 mt-1 small">
                    <div 
                      v-for="s in suggestions" 
                      :key="s.id" 
                      class="suggestion-row font-monospace"
                      @mousedown="selectSuggestion(s)"
                    >
                      {{ s.sku }} - {{ s.name }} (₹{{ s.selling_price }})
                    </div>
                  </div>
                </div>
                <div class="col-4 col-md-1">
                  <label class="form-label small-label font-bold text-muted">Qty</label>
                  <input type="number" v-model="tempItem.qty" class="form-control form-control-sm font-monospace" min="1" />
                </div>
                <div class="col-4 col-md-2">
                  <label class="form-label small-label font-bold text-muted">Rate (₹)</label>
                  <input type="number" v-model="tempItem.rate" class="form-control form-control-sm font-monospace" min="0" />
                </div>
                <div class="col-4 col-md-2">
                  <label class="form-label small-label font-bold text-muted">GST Tax %</label>
                  <input type="number" v-model="tempItem.tax_percent" class="form-control form-control-sm font-monospace" min="0" />
                </div>
                <div class="col-12 col-md-1">
                  <button class="btn btn-sm btn-danger w-100 py-1.5" type="button" @click="addInvoiceItem">
                    <Plus :size="14" />
                  </button>
                </div>
              </div>

              <!-- Added Items List -->
              <div class="table-responsive">
                <table class="table table-bordered table-sm small">
                  <thead>
                    <tr>
                      <th class="ps-3">Description</th>
                      <th class="text-center">Type</th>
                      <th class="text-center">Qty</th>
                      <th class="text-end">Rate</th>
                      <th class="text-center">GST %</th>
                      <th class="text-end">Tax Amount</th>
                      <th class="text-end pe-3">Subtotal</th>
                      <th class="text-center" style="width: 5%">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in formInvoice.items" :key="idx">
                      <td class="ps-3">{{ item.description }}</td>
                      <td class="text-center small">{{ item.type }}</td>
                      <td class="text-center font-monospace">{{ item.qty }}</td>
                      <td class="text-end font-monospace">₹{{ parseFloat(item.rate).toFixed(2) }}</td>
                      <td class="text-center font-monospace">{{ item.tax_percent }}%</td>
                      <td class="text-end font-monospace">₹{{ ((item.qty * item.rate * item.tax_percent) / 100).toFixed(2) }}</td>
                      <td class="text-end font-monospace fw-bold pe-3">₹{{ parseFloat(item.amount).toFixed(2) }}</td>
                      <td class="text-center">
                        <button class="btn btn-xs btn-outline-danger border-0 rounded-circle" type="button" @click="removeInvoiceItem(idx)">
                          <X :size="12" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Summary calculations and payments details -->
            <div class="border-top pt-3 mt-4 row g-3">
              <div class="col-12 col-md-6 small text-muted">
                <div class="mb-3">
                  <label class="form-label small fw-bold text-muted uppercase">Resident Address / Region</label>
                  <input type="text" v-model="formInvoice.residence" class="form-control form-control-sm" placeholder="e.g. Gota, Ahmedabad" />
                </div>
                <div>
                  <label class="form-label small fw-bold text-muted uppercase">Billing Invoice Notes</label>
                  <textarea v-model="formInvoice.notes" class="form-control form-control-sm" rows="2" placeholder="Vehicle diagnostic summaries, terms etc..."></textarea>
                </div>
              </div>
              
              <div class="col-12 col-md-6 bg-body p-3 rounded border">
                <div class="d-flex flex-column gap-2 small">
                  <div class="d-flex justify-content-between border-bottom pb-1">
                    <span>Parts Total:</span>
                    <strong class="font-monospace">₹{{ formCalculations.partsTotal.toFixed(2) }}</strong>
                  </div>
                  <div class="d-flex justify-content-between border-bottom pb-1">
                    <span>Labour / Service Total:</span>
                    <strong class="font-monospace">₹{{ formCalculations.labourTotal.toFixed(2) }}</strong>
                  </div>
                  <div class="d-flex justify-content-between border-bottom pb-1">
                    <span>Calculated GST Tax:</span>
                    <strong class="font-monospace">₹{{ formCalculations.gstTotal.toFixed(2) }}</strong>
                  </div>
                  
                  <!-- Adjustments: Discount / Paid Cash -->
                  <div class="row g-2 align-items-center border-bottom pb-2 pt-1">
                    <div class="col-6">
                      <label class="small-label fw-bold text-muted">Apply Discount (₹)</label>
                      <input type="number" v-model="formInvoice.discount" class="form-control form-control-sm font-monospace text-danger" min="0" />
                    </div>
                    <div class="col-6">
                      <label class="small-label fw-bold text-muted font-bold text-success">Paid Amount (₹)</label>
                      <input type="number" v-model="formInvoice.paid_amount" class="form-control form-control-sm font-monospace text-success" min="0" />
                    </div>
                  </div>

                  <div class="d-flex justify-content-between border-bottom pb-1 fs-6 fw-bold text-danger pt-1">
                    <span>Grand Total:</span>
                    <strong class="font-monospace">₹{{ formCalculations.grandTotal.toFixed(2) }}</strong>
                  </div>
                  
                  <div class="d-flex justify-content-between border-bottom pb-1 align-items-center">
                    <span>Payment Method:</span>
                    <select v-model="formInvoice.payment_mode" class="form-select form-select-sm font-bold w-auto border-0 bg-transparent text-end">
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI / GPay</option>
                      <option value="Card">Credit Card</option>
                      <option value="NetBanking">NetBanking</option>
                    </select>
                  </div>
                  
                  <div class="d-flex justify-content-between font-monospace text-danger fs-6 fw-bold">
                    <span>Balance Due:</span>
                    <strong>₹{{ formCalculations.balanceDue.toFixed(2) }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary px-3" @click="showFormModal = false">Cancel</button>
            <button type="submit" class="btn btn-danger px-4" style="background-color: #d71920; border-color: #d71920;">{{ editMode ? 'Update Invoice Bill' : 'Generate Invoice Bill' }}</button>
          </div>
        </form>
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

.cursor-pointer {
  cursor: pointer;
}

.table-active-danger {
  background-color: rgba(215, 25, 32, 0.08) !important;
  border-left: 3px solid #d71920;
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

.small-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  display: block;
  margin-bottom: 4px;
}

/* A4 Sheet Container Styles */
.print-page-container {
  overflow-y: auto;
  max-height: 80vh;
  padding: 20px;
}

.invoice-a4-sheet {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  color: #111 !important;
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.suggestion-row:hover {
  background-color: rgba(215, 25, 32, 0.1) !important;
}

.text-xxs {
  font-size: 11px;
}

/* Print CSS Styles */
@media print {
  @page {
    size: A4;
    margin: 0;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    height: 100% !important;
    width: 100% !important;
  }

  /* Force display none on noprint elements and all their descendants */
  .noprint,
  .noprint *,
  .no-print,
  .no-print *,
  button,
  .btn,
  header,
  nav,
  aside,
  .sidebar,
  .topbar {
    display: none !important;
  }
  
  .app-layout,
  .main-wrapper,
  .page-content,
  .container-fluid,
  .invoices-container,
  .row,
  .preview-wrapper,
  .print-page-container {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    box-shadow: none !important;
    background: transparent !important;
    height: auto !important;
    min-height: auto !important;
    overflow: hidden !important;
  }
  
  .row, div[class*="col-"]:not(.noprint) {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  
  .invoice-a4-sheet {
    display: block !important;
    margin: 0 auto !important;
    border: none !important;
    box-shadow: none !important;
    padding: 15mm !important;
    width: 210mm !important;
    height: 297mm !important;
    box-sizing: border-box !important;
    background: #ffffff !important;
    color: #111111 !important;
    page-break-inside: avoid !important;
    page-break-after: avoid !important;
  }
}

.animate-zoom-in {
  animation: zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
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

/* Scoped dark theme overrides for invoice builder */
.table {
  background-color: var(--bg-card) !important;
  color: var(--text-main) !important;
  border-color: var(--border-color) !important;
}
.table th, .table td {
  background-color: var(--bg-card) !important;
  color: var(--text-main) !important;
  border-color: var(--border-color) !important;
}
.bg-body {
  background-color: var(--bg-body) !important;
  border-color: var(--border-color) !important;
}
.suggestion-row {
  border-bottom: 1px solid var(--border-color) !important;
  color: var(--text-main) !important;
}
.invoice-a4-sheet .meta-table,
.invoice-a4-sheet .meta-table td,
.invoice-a4-sheet .services-table,
.invoice-a4-sheet .services-table th,
.invoice-a4-sheet .services-table td {
  background-color: #ffffff !important;
  color: #111111 !important;
  border: 1px solid #111111 !important;
}

.invoice-a4-sheet .meta-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  margin-top: 15px;
}

.invoice-a4-sheet .services-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.invoice-a4-sheet .services-table th {
  background-color: #111111 !important;
  color: #ffffff !important;
  font-weight: bold;
  font-size: 10px;
  text-transform: uppercase;
  padding: 6px 8px;
  text-align: left;
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

.invoice-a4-sheet .services-table td {
  padding: 5px 8px;
  font-size: 10px;
}

.invoice-a4-sheet .field-label {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 9px;
  color: #555 !important;
}
</style>
