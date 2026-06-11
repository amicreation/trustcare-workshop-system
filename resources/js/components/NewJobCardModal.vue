<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { X, PlusCircle, Search, Car, User } from 'lucide-vue-next'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'saved'])

const loading = ref(false)
const lookupLoading = ref(false)

// Form states
const formJob = ref({
  date: new Date().toISOString().substring(0, 10),
  customer_id: null as number | null,
  vehicle_reg_no: '',
  km_reading: 0,
  fuel_level: '1/2 Tank',
  complaints: [] as string[],
  status: 'Open'
})

const newComplaintInput = ref('')

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

const fetchMetadata = async () => {
  try {
    const [cRes, vRes] = await Promise.all([
      axios.get('/api/customers'),
      axios.get('/api/vehicles')
    ])
    customersList.value = cRes.data
    vehiclesList.value = vRes.data
  } catch (err) {
    console.error('Failed to load metadata', err)
  }
}

onMounted(() => {
  fetchMetadata()
})

// Watchers for reset and lookup trigger
watch(() => props.show, (newVal) => {
  if (newVal) {
    formJob.value = {
      date: new Date().toISOString().substring(0, 10),
      customer_id: null,
      vehicle_reg_no: '',
      km_reading: 0,
      fuel_level: '1/2 Tank',
      complaints: [],
      status: 'Open'
    }
    newComplaintInput.value = ''
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

const templateTimeout = (fn: Function, delay: number) => setTimeout(fn, delay)

// Auto suggest state for vehicle registration
const showVehicleSuggestions = ref(false)
const vehicleSuggestions = computed(() => {
  const val = (formJob.value.vehicle_reg_no || '').toLowerCase()
  if (!val) return []
  return vehiclesList.value.filter(v => 
    v.registration_no.toLowerCase().includes(val) ||
    (v.make && v.make.toLowerCase().includes(val)) ||
    (v.model && v.model.toLowerCase().includes(val))
  ).slice(0, 5)
})

const selectVehicleSuggestion = (v: any) => {
  formJob.value.vehicle_reg_no = v.registration_no
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
      formJob.value.customer_id = vehicle.customer.id
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
    formJob.value.customer_id = customer.id
    customerForm.value = {
      name: customer.name,
      mobile: customer.mobile,
      alternate_mobile: customer.alternate_mobile || '',
      email: customer.email || '',
      address_1: customer.address_1 || ''
    }
  } catch (err: any) {
    isNewCustomer.value = true
    formJob.value.customer_id = null
  } finally {
    lookupLoading.value = false
  }
}

const addComplaint = () => {
  if (newComplaintInput.value.trim()) {
    formJob.value.complaints.push(newComplaintInput.value.trim())
    newComplaintInput.value = ''
  }
}

const removeComplaint = (index: number) => {
  formJob.value.complaints.splice(index, 1)
}

const handleSubmit = async () => {
  if (!formJob.value.vehicle_reg_no) {
    alert('Please enter a vehicle registration number.')
    return
  }
  
  loading.value = true
  try {
    let customerId = formJob.value.customer_id
    
    // 1. Create customer if new
    if (isNewCustomer.value) {
      if (!customerForm.value.name || !customerForm.value.mobile) {
        alert('Please fill out customer name and mobile.')
        loading.value = false
        return
      }
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
    
    // 3. Create job card
    const payload = {
      date: formJob.value.date,
      customer_id: customerId,
      vehicle_reg_no: formJob.value.vehicle_reg_no.toUpperCase().replace(/\s/g, ''),
      km_reading: formJob.value.km_reading,
      fuel_level: formJob.value.fuel_level,
      complaints: formJob.value.complaints,
      status: formJob.value.status
    }
    
    await axios.post('/api/jobcards', payload)
    
    alert('Job Card created successfully!')
    emit('saved')
    emit('close')
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to save Job Card.')
  } finally {
    loading.value = false
  }
}

const selectExistingVehicle = (v: any) => {
  formJob.value.vehicle_reg_no = v.registration_no
  checkVehicle(v.registration_no)
}

const selectExistingCustomer = (c: any) => {
  customerForm.value.mobile = c.mobile
  checkCustomer(c.mobile)
}
</script>

<template>
  <div v-if="show" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
    <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 750px;">
      <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
        <h5 class="fw-bold m-0">Create New Job Card</h5>
        <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>
      <form @submit.prevent="handleSubmit">
        <div class="card-body px-4 py-3" style="max-height: 70vh; overflow-y: auto;">
          <div class="row g-3">
            <!-- Basic Details -->
            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-muted uppercase">Job Card Date <span class="text-danger">*</span></label>
              <input type="date" v-model="formJob.date" class="form-control" required />
            </div>
            
            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-muted uppercase">Odometer (KM) <span class="text-danger">*</span></label>
              <input type="number" v-model="formJob.km_reading" class="form-control" required />
            </div>

            <!-- Vehicle Search & Reg No -->
            <div class="col-12 col-md-6 position-relative">
              <label class="form-label small fw-bold text-muted uppercase">Vehicle Registration No <span class="text-danger">*</span></label>
              <div class="input-group">
                <input 
                  type="text" 
                  v-model="formJob.vehicle_reg_no" 
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
                  @click="checkVehicle(formJob.vehicle_reg_no)"
                  :disabled="lookupLoading"
                >
                  <Search :size="14" v-if="!lookupLoading" />
                  <span v-else class="spinner-border spinner-border-sm"></span>
                </button>
              </div>
              <span class="text-xs text-muted mt-1 d-block">Type to search existing or press search to check registration.</span>
              
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

            <!-- Fuel Level -->
            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-muted uppercase">Fuel Level <span class="text-danger">*</span></label>
              <select v-model="formJob.fuel_level" class="form-select" required>
                <option value="Empty">Empty</option>
                <option value="1/4 Tank">1/4 Tank</option>
                <option value="1/2 Tank">1/2 Tank</option>
                <option value="3/4 Tank">3/4 Tank</option>
                <option value="Full">Full Tank</option>
              </select>
            </div>

            <!-- Vehicle Details Fields -->
            <div v-if="formJob.vehicle_reg_no" class="col-12 bg-body p-3 rounded border mb-2">
              <div class="d-flex align-items-center gap-2 mb-3" :class="isNewVehicle ? 'text-warning' : 'text-success'">
                <Car :size="16" />
                <span class="fw-bold small uppercase">{{ isNewVehicle ? 'New Vehicle Registration Detected! Please fill details:' : 'Vehicle Details Loaded (Saved in DB)' }}</span>
              </div>
              <div class="row g-2">
                <div class="col-6 col-md-4">
                  <label class="form-label small-label text-muted">Make <span class="text-danger">*</span></label>
                  <input type="text" v-model="vehicleForm.make" class="form-control form-control-sm" placeholder="e.g. Maruti Suzuki" :readonly="!isNewVehicle" required />
                </div>
                <div class="col-6 col-md-4">
                  <label class="form-label small-label text-muted">Model <span class="text-danger">*</span></label>
                  <input type="text" v-model="vehicleForm.model" class="form-control form-control-sm" placeholder="e.g. Swift" :readonly="!isNewVehicle" required />
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
              </div>
            </div>

            <!-- Customer Search / Input -->
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
              <span class="text-xs text-muted mt-1 d-block">Type name or mobile to search existing database.</span>
              
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

            <!-- Customer Details Form -->
            <div class="col-12 col-md-6" v-if="customerForm.mobile">
              <div class="p-3 bg-body border rounded">
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
                    />
                  </div>
                  <div class="col-12">
                    <label class="form-label small-label text-muted">Email Address (Optional)</label>
                    <input type="email" v-model="customerForm.email" class="form-control form-control-sm" :readonly="!isNewCustomer" placeholder="optional" />
                  </div>
                  <div class="col-12">
                    <label class="form-label small-label text-muted">Address</label>
                    <input type="text" v-model="customerForm.address_1" class="form-control form-control-sm" :readonly="!isNewCustomer" placeholder="Address Details" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Complaints Entry -->
            <div class="col-12 border-top border-secondary pt-3">
              <label class="form-label small fw-bold text-muted uppercase">Customer Complaints / Tasks</label>
              <div class="input-group mb-2">
                <input 
                  type="text" 
                  v-model="newComplaintInput" 
                  class="form-control" 
                  placeholder="Add specific task/complaint..." 
                  @keydown.enter.prevent="addComplaint" 
                />
                <button class="btn btn-danger" type="button" @click="addComplaint">Add</button>
              </div>
              <div class="d-flex flex-wrap gap-2 mt-2">
                <span v-for="(c, idx) in formJob.complaints" :key="idx" class="badge bg-secondary d-flex align-items-center gap-1 py-2 px-3 fs-7 rounded-pill">
                  <span>{{ c }}</span>
                  <button type="button" class="btn-close btn-close-white" style="font-size: 8px;" @click="removeComplaint(idx)"></button>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary px-3" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-danger px-4" style="background-color: #d71920; border-color: #d71920;" :disabled="loading">
            <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
            Generate Job Card
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

.btn-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
