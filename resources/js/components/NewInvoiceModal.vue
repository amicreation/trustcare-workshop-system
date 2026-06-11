<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { X, Search, Plus, Trash2, ArrowRight, Car, User, Calculator } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'saved'])

const authStore = useAuthStore()

const loading = ref(false)
const lookupLoading = ref(false)

// Form states
const formInvoice = ref({
  date: new Date().toISOString().substring(0, 10),
  inward_date: new Date().toISOString().substring(0, 10),
  service_type: 'General Service',
  customer_id: null as number | null,
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

const tempItem = ref({
  type: 'Part' as 'Part' | 'Labour' | 'Service',
  description: '',
  qty: 1,
  rate: 0,
  cost: 0,
  tax_percent: 18
})

// Auto-lookup & auto-create states
const isNewCustomer = ref(false)
const isNewVehicle = ref(false)

const customerForm = ref({
  name: '',
  mobile: '',
  alternate_mobile: '',
  email: '',
  address_1: ''
})

const vehicleForm = ref({
  registration_no: '',
  make: '',
  model: '',
  year: new Date().getFullYear(),
  fuel_type: 'Petrol',
  chassis_no: '',
  engine_no: ''
})

// Metadata lists for dropdown fallback
const customersList = ref<any[]>([])
const vehiclesList = ref<any[]>([])
const inventoryItems = ref<any[]>([])
const pendingJobCards = ref<any[]>([])

// Auto suggest state
const showSuggestions = ref(false)
const suggestions = computed(() => {
  if (tempItem.value.type !== 'Part' || !tempItem.value.description) return []
  const query = tempItem.value.description.toLowerCase()
  return inventoryItems.value.filter(i => 
    i.name.toLowerCase().includes(query) || i.sku.toLowerCase().includes(query)
  ).slice(0, 5)
})

const templateTimeout = (fn: Function, delay: number) => setTimeout(fn, delay)

// Auto suggest state for vehicle registration
const showVehicleSuggestions = ref(false)
const vehicleSuggestions = computed(() => {
  const val = (formInvoice.value.vehicle_reg_no || '').toLowerCase()
  if (!val) return []
  return vehiclesList.value.filter(v => 
    v.registration_no.toLowerCase().includes(val) ||
    (v.make && v.make.toLowerCase().includes(val)) ||
    (v.model && v.model.toLowerCase().includes(val))
  ).slice(0, 5)
})

const selectVehicleSuggestion = (v: any) => {
  formInvoice.value.vehicle_reg_no = v.registration_no
  checkVehicle(v.registration_no)
  showVehicleSuggestions.value = false
}

// Auto suggest state for customer mobile/name
const showCustomerSuggestions = ref(false)
const customerSuggestions = computed(() => {
  const val = (customerForm.value.mobile || '').toLowerCase()
  if (!val) return []
  return customersList.value.filter(c => 
    c.mobile.toLowerCase().includes(val) ||
    c.name.toLowerCase().includes(val)
  ).slice(0, 5)
})

const selectCustomerSuggestion = (c: any) => {
  customerForm.value.mobile = c.mobile
  checkCustomer(c.mobile)
  showCustomerSuggestions.value = false
}


const fetchMetadata = async () => {
  try {
    const [cRes, vRes, iRes, jRes] = await Promise.all([
      axios.get('/api/customers'),
      axios.get('/api/vehicles'),
      axios.get('/api/inventory/items'),
      axios.get('/api/jobcards')
    ])
    customersList.value = cRes.data
    vehiclesList.value = vRes.data
    inventoryItems.value = iRes.data
    pendingJobCards.value = jRes.data.filter((j: any) => j.status === 'Completed' || j.status === 'In Progress')
  } catch (err) {
    console.error('Failed to fetch invoice metadata', err)
  }
}

onMounted(() => {
  fetchMetadata()
})

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

// Auto-fill selected suggestion
const selectSuggestion = (invItem: any) => {
  tempItem.value.description = invItem.name
  tempItem.value.rate = parseFloat(invItem.selling_price)
  tempItem.value.cost = parseFloat(invItem.purchase_price)
  tempItem.value.tax_percent = parseFloat(invItem.gst_percent)
  showSuggestions.value = false
}

// Watchers for reset and lookup trigger
watch(() => props.show, (newVal) => {
  if (newVal) {
    formInvoice.value = {
      date: new Date().toISOString().substring(0, 10),
      inward_date: new Date().toISOString().substring(0, 10),
      service_type: 'General Service',
      customer_id: null,
      vehicle_reg_no: '',
      km_reading: 0,
      items: [],
      discount: 0,
      paid_amount: 0,
      payment_mode: 'Cash',
      residence: '',
      notes: ''
    }
    isNewCustomer.value = false
    isNewVehicle.value = false
    customerForm.value = {
      name: '',
      mobile: '',
      alternate_mobile: '',
      email: '',
      address_1: ''
    }
    vehicleForm.value = {
      registration_no: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      fuel_type: 'Petrol',
      chassis_no: '',
      engine_no: ''
    }
    fetchMetadata()
  }
})

const checkVehicle = async (regNo: string) => {
  if (!regNo || regNo.length < 3) return
  const cleanReg = regNo.toUpperCase().replace(/\s/g, '')
  lookupLoading.value = true
  try {
    const res = await axios.get(`/api/vehicles/lookup/${cleanReg}`)
    const vehicle = res.data.vehicle
    isNewVehicle.value = false
    vehicleForm.value = {
      registration_no: vehicle.registration_no,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year || new Date().getFullYear(),
      fuel_type: vehicle.fuel_type || 'Petrol',
      chassis_no: vehicle.chassis_no || '',
      engine_no: vehicle.engine_no || ''
    }
    
    // Auto populate existing customer
    if (vehicle.customer) {
      isNewCustomer.value = false
      formInvoice.value.customer_id = vehicle.customer.id
      customerForm.value = {
        name: vehicle.customer.name,
        mobile: vehicle.customer.mobile,
        alternate_mobile: vehicle.customer.alternate_mobile || '',
        email: vehicle.customer.email || '',
        address_1: vehicle.customer.address_1 || ''
      }
    }
  } catch (err: any) {
    // 404 Vehicle not found
    isNewVehicle.value = true
    vehicleForm.value.registration_no = cleanReg
  } finally {
    lookupLoading.value = false
  }
}

const checkCustomer = async (mobile: string) => {
  if (!mobile || mobile.length < 9) return
  lookupLoading.value = true
  try {
    const res = await axios.get(`/api/customers/lookup/${mobile}`)
    const customer = res.data.customer
    isNewCustomer.value = false
    formInvoice.value.customer_id = customer.id
    customerForm.value = {
      name: customer.name,
      mobile: customer.mobile,
      alternate_mobile: customer.alternate_mobile || '',
      email: customer.email || '',
      address_1: customer.address_1 || ''
    }
  } catch (err: any) {
    isNewCustomer.value = true
    formInvoice.value.customer_id = null
  } finally {
    lookupLoading.value = false
  }
}

const parseNumber = (val: any, fallback = 0): number => {
  if (val === null || val === undefined || val === '') return fallback
  const num = parseFloat(val)
  return isNaN(num) ? fallback : num
}

// Import Job Card specs
const importJobCard = (jc: any) => {
  formInvoice.value.customer_id = jc.customer_id
  formInvoice.value.vehicle_reg_no = jc.vehicle_reg_no
  formInvoice.value.km_reading = jc.km_reading
  
  // Trigger vehicle auto-fill check
  checkVehicle(jc.vehicle_reg_no)
  
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
      rate: 350,
      cost: 0,
      tax_percent: 18,
      amount: 350 * 1.18
    })
  })
  
  // Import parts from updates
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

const formatName = (val: string) => {
  if (!val) return '';
  return val.trim().split(/\s+/).map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
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
  
  // Clear temp item fields
  tempItem.value = {
    type: tempItem.value.type,
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

const handleSubmit = async () => {
  // Validate discounts limits: Non-admins capped at 10% discount
  if (!authStore.isAdmin && formInvoice.value.discount > formCalculations.value.partsTotal * 0.10) {
    alert('Discount warning: Non-administrators cannot apply discounts exceeding 10% of parts subtotal.')
    return
  }
  
  if (formInvoice.value.items.length === 0) {
    alert('Please add at least one part or service item to the invoice.')
    return
  }
  
  loading.value = true
  try {
    let customerId = formInvoice.value.customer_id
    
    // 1. Create customer if new
    if (isNewCustomer.value) {
      if (!customerForm.value.name || !customerForm.value.mobile) {
        alert('Please fill out customer name and mobile.')
        loading.value = false
        return
      }
      customerForm.value.name = formatName(customerForm.value.name)
      const custRes = await axios.post('/api/customers', customerForm.value)
      customerId = custRes.data.id
    }
    
    // 2. Create vehicle if new
    if (isNewVehicle.value) {
      if (!vehicleForm.value.make || !vehicleForm.value.model) {
        alert('Please fill out vehicle make and model.')
        loading.value = false
        return
      }
      await axios.post('/api/vehicles', {
        ...vehicleForm.value,
        customer_id: customerId
      })
    }
    
    // 3. Save invoice
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
      customer_id: customerId,
      vehicle_reg_no: cleanReg,
      items: sanitizedItems,
      paid_amount: parseNumber(formInvoice.value.paid_amount, 0),
      discount: parseNumber(formInvoice.value.discount, 0)
    }
    
    const res = await axios.post('/api/invoices', payload)
    
    alert('Invoice generated successfully!')
    emit('saved', res.data.id)
    emit('close')
  } catch (err: any) {
    if (err.response?.data?.errors) {
      const messages = Object.values(err.response.data.errors).flat().join('\n')
      alert(`Failed to generate invoice:\n${messages}`)
    } else {
      alert(err.response?.data?.error || 'Failed to generate invoice.')
    }
  } finally {
    loading.value = false
  }
}

const selectExistingVehicle = (v: any) => {
  formInvoice.value.vehicle_reg_no = v.registration_no
  checkVehicle(v.registration_no)
}

const selectExistingCustomer = (c: any) => {
  customerForm.value.mobile = c.mobile
  checkCustomer(c.mobile)
}
</script>

<template>
  <div v-if="show" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
    <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 900px;">
      <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
        <h5 class="fw-bold m-0">Generate Invoice Bill</h5>
        <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="card-body px-4 py-3" style="max-height: 75vh; overflow-y: auto;">
          <!-- Basic selections -->
          <div class="row g-3 mb-4">
            <div class="col-12 col-md-3">
              <label class="form-label small fw-bold text-muted uppercase">Bill Date <span class="text-danger">*</span></label>
              <input type="date" v-model="formInvoice.date" class="form-control" required />
            </div>
            
            <div class="col-12 col-md-3">
              <label class="form-label small fw-bold text-muted uppercase">Service Type <span class="text-danger">*</span></label>
              <select v-model="formInvoice.service_type" class="form-select" required>
                <option value="General Service">General Service</option>
                <option value="Accident Repair">Accident Repair</option>
                <option value="Electrical Diagnostics">Electrical Diagnostics</option>
                <option value="Washing & Detailing">Washing & Detailing</option>
                <option value="Body Shop Paint">Body Shop Paint</option>
              </select>
            </div>

            <div class="col-12 col-md-3">
              <label class="form-label small fw-bold text-muted uppercase">Odometer In (KM) <span class="text-danger">*</span></label>
              <input type="number" v-model="formInvoice.km_reading" class="form-control" required />
            </div>

            <!-- Vehicle Search Input -->
            <div class="col-12 col-md-3 position-relative">
              <label class="form-label small fw-bold text-muted uppercase">Vehicle Registration <span class="text-danger">*</span></label>
              <div class="input-group">
                <input 
                  type="text" 
                  v-model="formInvoice.vehicle_reg_no" 
                  class="form-control" 
                  placeholder="e.g. GJ01AA1234" 
                  required 
                  @focus="showVehicleSuggestions = true"
                  @blur="templateTimeout(() => showVehicleSuggestions = false, 200)"
                  @input="isNewVehicle = false"
                />
                <button 
                  type="button" 
                  class="btn btn-outline-secondary" 
                  @click="checkVehicle(formInvoice.vehicle_reg_no)"
                  :disabled="lookupLoading"
                >
                  <Search :size="14" v-if="!lookupLoading" />
                  <span v-else class="spinner-border spinner-border-sm"></span>
                </button>
              </div>
              
              <!-- Vehicle Auto-suggest dropdown -->
              <div v-if="showVehicleSuggestions && vehicleSuggestions.length > 0" class="suggestions-dropdown position-absolute w-100 mt-1 small">
                <div 
                  v-for="v in vehicleSuggestions" 
                  :key="v.registration_no" 
                  class="suggestion-row font-monospace"
                  @mousedown="selectVehicleSuggestion(v)"
                >
                  {{ v.registration_no }} - {{ v.make }} {{ v.model }}
                </div>
              </div>
            </div>
          </div>

          <!-- Vehicle Details Fields -->
          <div v-if="formInvoice.vehicle_reg_no" class="col-12 bg-body p-3 rounded border mb-4">
            <div class="d-flex align-items-center gap-2 mb-3" :class="isNewVehicle ? 'text-warning' : 'text-success'">
              <Car :size="16" />
              <span class="fw-bold small uppercase">{{ isNewVehicle ? 'New Vehicle Registration Detected! Fill Details:' : 'Vehicle Details Loaded (Saved in DB)' }}</span>
            </div>
            <div class="row g-2">
              <div class="col-6 col-md-4">
                <label class="form-label small-label text-muted">Make <span class="text-danger">*</span></label>
                <input type="text" v-model="vehicleForm.make" class="form-control form-control-sm" placeholder="e.g. Hyundai" :readonly="!isNewVehicle" required />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label small-label text-muted">Model <span class="text-danger">*</span></label>
                <input type="text" v-model="vehicleForm.model" class="form-control form-control-sm" placeholder="e.g. i20" :readonly="!isNewVehicle" required />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label small-label text-muted">Fuel Type</label>
                <select v-model="vehicleForm.fuel_type" class="form-select form-select-sm" :disabled="!isNewVehicle">
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="CNG">CNG</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label small-label text-muted">Year</label>
                <input type="number" v-model="vehicleForm.year" class="form-control form-control-sm" :readonly="!isNewVehicle" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label small-label text-muted">Engine No (Optional)</label>
                <input type="text" v-model="vehicleForm.engine_no" class="form-control form-control-sm font-monospace text-uppercase" placeholder="Optional Engine ID" :readonly="!isNewVehicle" />
              </div>
              <div class="col-6 col-md-4">
                <label class="form-label small-label text-muted">Chassis No (Optional)</label>
                <input type="text" v-model="vehicleForm.chassis_no" class="form-control form-control-sm font-monospace text-uppercase" placeholder="Optional Chassis ID" :readonly="!isNewVehicle" />
              </div>
            </div>
          </div>

          <!-- Customer Input fields -->
          <div class="row g-3 mb-4">
            <div class="col-12 col-md-6 position-relative">
              <label class="form-label small fw-bold text-muted uppercase">Customer Contact Mobile <span class="text-danger">*</span></label>
              <div class="input-group">
                <input 
                  type="text" 
                  v-model="customerForm.mobile" 
                  class="form-control" 
                  placeholder="e.g. 9876543210" 
                  required
                  @focus="showCustomerSuggestions = true"
                  @blur="templateTimeout(() => showCustomerSuggestions = false, 200)"
                  @input="isNewCustomer = false"
                />
                <button 
                  type="button" 
                  class="btn btn-outline-secondary" 
                  @click="checkCustomer(customerForm.mobile)"
                  :disabled="lookupLoading"
                >
                  <Search :size="14" v-if="!lookupLoading" />
                  <span v-else class="spinner-border spinner-border-sm"></span>
                </button>
              </div>
              
              <!-- Customer Auto-suggest dropdown -->
              <div v-if="showCustomerSuggestions && customerSuggestions.length > 0" class="suggestions-dropdown position-absolute w-100 mt-1 small">
                <div 
                  v-for="c in customerSuggestions" 
                  :key="c.id" 
                  class="suggestion-row"
                  @mousedown="selectCustomerSuggestion(c)"
                >
                  {{ c.name }} ({{ c.mobile }})
                </div>
              </div>
            </div>

            <!-- Customer Details Block -->
            <div class="col-12 col-md-6" v-if="customerForm.mobile">
              <div class="p-3 bg-body rounded border">
                <div class="d-flex align-items-center gap-2 mb-2" :class="isNewCustomer ? 'text-warning' : 'text-info'">
                  <User :size="16" />
                  <span class="fw-bold small uppercase">{{ isNewCustomer ? 'New Customer Details' : 'Customer Details Loaded (Saved in DB)' }}</span>
                </div>
                <div class="row g-2">
                  <div class="col-12">
                    <label class="form-label small-label text-muted">Full Name <span class="text-danger">*</span></label>
                    <input 
                      type="text" 
                      v-model="customerForm.name" 
                      class="form-control form-control-sm" 
                      placeholder="e.g. John Doe"
                      :readonly="!isNewCustomer"
                      required 
                      @blur="customerForm.name = formatName(customerForm.name)"
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label small-label text-muted">Email Address (Optional)</label>
                    <input type="email" v-model="customerForm.email" class="form-control form-control-sm" :readonly="!isNewCustomer" />
                  </div>
                  <div class="col-12">
                    <label class="form-label small-label text-muted">Address</label>
                    <input type="text" v-model="customerForm.address_1" class="form-control form-control-sm" :readonly="!isNewCustomer" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Import Completed Job Cards -->
          <div v-if="pendingJobCards.length > 0" class="mb-4 bg-body p-3 rounded" style="border: 1px solid var(--primary-color);">
            <span class="small fw-bold text-danger uppercase d-block mb-2">Import components from completed job cards:</span>
            <div class="d-flex flex-wrap gap-2">
              <button 
                v-for="jc in pendingJobCards" 
                :key="jc.id" 
                type="button" 
                class="btn btn-sm btn-outline-danger d-flex align-items-center gap-1.5"
                @click="importJobCard(jc)"
              >
                <span>Import: {{ jc.job_card_no }} ({{ jc.vehicle_reg_no }})</span>
                <ArrowRight :size="12" />
              </button>
            </div>
          </div>

          <!-- Item entry wizard -->
          <div class="border-top border-secondary pt-3 mb-3">
            <span class="small fw-bold text-muted uppercase d-block mb-3">Invoice Line Items:</span>
            <div class="row g-2 align-items-end mb-3 bg-body p-3 rounded border mx-0">
              <div class="col-12 col-md-2">
                <label class="form-label small-label text-muted">Item Type</label>
                <select v-model="tempItem.type" class="form-select form-select-sm">
                  <option value="Part">Part (Item)</option>
                  <option value="Labour">Labour Fee</option>
                  <option value="Service">Outside job</option>
                </select>
              </div>
              <div class="col-12 col-md-4 position-relative">
                <label class="form-label small-label text-muted">Description</label>
                <input 
                  type="text" 
                  v-model="tempItem.description" 
                  class="form-control form-control-sm" 
                  placeholder="e.g. Engine Oil, Front brake pads..." 
                  @focus="showSuggestions = true"
                  @blur="tempItem.description = formatDescription(tempItem.description); templateTimeout(() => showSuggestions = false, 200)"
                />
                <!-- Auto-suggest -->
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
                <label class="form-label small-label text-muted">Qty</label>
                <input type="number" v-model="tempItem.qty" class="form-control form-control-sm font-monospace" min="1" />
              </div>
              <div class="col-4 col-md-2">
                <label class="form-label small-label text-muted">Rate (₹)</label>
                <input type="number" v-model="tempItem.rate" class="form-control form-control-sm font-monospace" min="0" />
              </div>
              <div class="col-4 col-md-2">
                <label class="form-label small-label text-muted">GST Tax %</label>
                <input type="number" v-model="tempItem.tax_percent" class="form-control form-control-sm font-monospace" min="0" />
              </div>
              <div class="col-12 col-md-1">
                <button class="btn btn-sm btn-danger w-100 py-1.5" type="button" @click="addInvoiceItem">
                  <Plus :size="14" />
                </button>
              </div>
            </div>

            <!-- Items Table List -->
            <div class="table-responsive">
              <table class="table table-bordered table-sm small">
                <thead>
                  <tr class="text-muted small">
                    <th class="ps-3">Description</th>
                    <th class="text-center">Type</th>
                    <th class="text-center">Qty</th>
                    <th class="text-end">Rate</th>
                    <th class="text-center">GST %</th>
                    <th class="text-end pe-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, idx) in formInvoice.items" :key="idx">
                    <td class="ps-3">{{ item.description }}</td>
                    <td class="text-center">{{ item.type }}</td>
                    <td class="text-center font-monospace">{{ item.qty }}</td>
                    <td class="text-end font-monospace">₹{{ item.rate }}</td>
                    <td class="text-center font-monospace">{{ item.tax_percent }}%</td>
                    <td class="text-end pe-3 font-monospace d-flex justify-content-between align-items-center">
                      <span>₹{{ item.amount.toFixed(2) }}</span>
                      <button type="button" class="btn btn-sm btn-outline-danger border-0 py-0 px-1" @click="removeInvoiceItem(idx)">
                        <Trash2 :size="12" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="formInvoice.items.length === 0">
                    <td colspan="6" class="text-center py-3 text-muted">No line items added yet. Please use the form above to add parts or services.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Payment and remarks details -->
          <div class="row g-3 border-top pt-3 mt-3">
            <div class="col-12 col-md-6">
              <div class="row g-2">
                <div class="col-6">
                  <label class="form-label small fw-bold text-muted uppercase">Paid Amount (₹)</label>
                  <input type="number" v-model="formInvoice.paid_amount" class="form-control font-monospace" min="0" />
                </div>
                <div class="col-6">
                  <label class="form-label small fw-bold text-muted uppercase">Discount Applied (₹)</label>
                  <input type="number" v-model="formInvoice.discount" class="form-control font-monospace" min="0" />
                </div>
                <div class="col-6">
                  <label class="form-label small fw-bold text-muted uppercase">Payment Mode</label>
                  <select v-model="formInvoice.payment_mode" class="form-select">
                    <option value="Cash">Cash</option>
                    <option value="UPI / Online">UPI / Online</option>
                    <option value="Card">Card</option>
                    <option value="Pending">Pending / Credit</option>
                  </select>
                </div>
                <div class="col-6">
                  <label class="form-label small fw-bold text-muted uppercase">Residence / City</label>
                  <input type="text" v-model="formInvoice.residence" class="form-control" placeholder="City" />
                </div>
              </div>
            </div>

            <!-- Invoice Summary and Totals -->
            <div class="col-12 col-md-6 bg-body p-3 rounded border">
              <span class="small fw-bold text-muted uppercase d-block mb-2">Invoice Cost Summary:</span>
              <table class="w-100 small">
                <tr class="border-bottom">
                  <td class="py-1 fw-bold text-muted">Parts Subtotal:</td>
                  <td class="py-1 text-end font-monospace">₹{{ formCalculations.partsTotal.toFixed(2) }}</td>
                </tr>
                <tr class="border-bottom">
                  <td class="py-1 fw-bold text-muted">Labour/Service Subtotal:</td>
                  <td class="py-1 text-end font-monospace">₹{{ formCalculations.labourTotal.toFixed(2) }}</td>
                </tr>
                <tr class="border-bottom">
                  <td class="py-1 fw-bold text-muted">GST Tax Total:</td>
                  <td class="py-1 text-end font-monospace">₹{{ formCalculations.gstTotal.toFixed(2) }}</td>
                </tr>
                <tr class="border-bottom" v-if="parseFloat(formInvoice.discount) > 0">
                  <td class="py-1 fw-bold text-danger">Discount:</td>
                  <td class="py-1 text-end text-danger font-monospace">-₹{{ parseFloat(formInvoice.discount || 0).toFixed(2) }}</td>
                </tr>
                <tr class="border-bottom">
                  <td class="py-2 fw-bold text-danger fs-6">Grand Total:</td>
                  <td class="py-2 text-end text-danger fw-bold font-monospace fs-6">₹{{ formCalculations.grandTotal.toFixed(2) }}</td>
                </tr>
                <tr>
                  <td class="py-1 fw-bold text-warning">Balance Due:</td>
                  <td class="py-1 text-end text-warning fw-bold font-monospace">₹{{ formCalculations.balanceDue.toFixed(2) }}</td>
                </tr>
              </table>
            </div>
          </div>
        </div>
        <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary px-3" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-danger px-4" style="background-color: #d71920; border-color: #d71920;" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
            Generate Invoice
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.bg-glass {
  background-color: rgba(var(--bg-card-rgb), 0.8) !important;
  backdrop-filter: blur(16px);
  border: 1px solid rgba(var(--bg-card-rgb), 0.2) !important;
}

.small-label {
  font-size: 11px;
}

.hover-item:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* Scrollbar Enhancement */
.card-body::-webkit-scrollbar {
  width: 6px;
}
.card-body::-webkit-scrollbar-thumb {
  background-color: rgba(215, 25, 32, 0.3);
  border-radius: 3px;
}
.card-body::-webkit-scrollbar-track {
  background-color: transparent;
}

/* Form inputs & selects */
.form-control, .form-select {
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  border-radius: 8px;
  padding: 0.55rem 0.75rem;
  font-size: 0.875rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-control:focus, .form-select:focus {
  border-color: #d71920 !important;
  box-shadow: 0 0 0 4px rgba(215, 25, 32, 0.12) !important;
  background-color: var(--bg-card);
  color: var(--text-main);
}

.input-group .form-control {
  border-top-left-radius: 8px !important;
  border-bottom-left-radius: 8px !important;
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.input-group .btn {
  border-top-right-radius: 8px !important;
  border-bottom-right-radius: 8px !important;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  border-color: var(--border-color);
  background-color: var(--bg-card);
  color: var(--text-muted);
  transition: all 0.2s ease;
}

.input-group .btn:hover {
  background-color: #d71920;
  border-color: #d71920;
  color: #fff;
}

/* Table styling */
.table {
  border-collapse: separate;
  border-spacing: 0 2px;
}

.table tr {
  background-color: rgba(var(--bg-body-rgb), 0.4);
  transition: background-color 0.15s ease;
}

.table tr:hover {
  background-color: rgba(var(--bg-body-rgb), 0.8);
}

.table th {
  border-bottom: 2px solid var(--border-color) !important;
  padding: 8px 12px;
}

.table td {
  padding: 8px 12px;
  vertical-align: middle;
}

/* Premium Buttons */
.btn-danger {
  background: linear-gradient(135deg, #e62027 0%, #b81218 100%) !important;
  border: none !important;
  box-shadow: 0 4px 10px rgba(215, 25, 32, 0.2);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-danger:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(215, 25, 32, 0.3);
}

.btn-danger:active {
  transform: translateY(1px);
}
</style>
