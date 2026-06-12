<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { 
  Car, Search, PlusCircle, Edit, History, 
  User, CheckSquare, ShieldCheck, ChevronRight, X, Trash2
} from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
const authStore = useAuthStore()

const vehicles = ref<any[]>([])
const customersList = ref<any[]>([])
const searchQuery = ref('')
const loading = ref(false)
const historyLoading = ref(false)
const selectedVehicle = ref<any | null>(null)
const vehicleHistory = ref<any[]>([])
const activeTab = ref('jobcards')

// Form Modal State
const showModal = ref(false)
const editMode = ref(false)
const formVehicle = ref({
  registration_no: '',
  customer_id: null as number | null,
  make: '',
  model: '',
  year: new Date().getFullYear(),
  fuel_type: 'PETROL',
  engine_no: '',
  chassis_no: '',
  color: '',
  insurance_company: '',
  policy_number: '',
  policy_expiry: '',
  current_km: 0
})

const fetchVehicles = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/vehicles', {
      params: { search: searchQuery.value }
    })
    vehicles.value = res.data
  } catch (err) {
    console.error('Failed to load vehicles', err)
  } finally {
    loading.value = false
  }
}

const fetchCustomers = async () => {
  try {
    const res = await axios.get('/api/customers')
    customersList.value = res.data
  } catch (err) {
    console.error('Failed to load customers', err)
  }
}

const openNewModal = () => {
  editMode.value = false
  formVehicle.value = {
    registration_no: '',
    customer_id: customersList.value[0]?.id || null,
    make: '',
    model: '',
    year: new Date().getFullYear(),
    fuel_type: 'PETROL',
    engine_no: '',
    chassis_no: '',
    color: '',
    insurance_company: '',
    policy_number: '',
    policy_expiry: '',
    current_km: 0
  }
  showModal.value = true
}

const openEditModal = (vehicle: any) => {
  editMode.value = true
  formVehicle.value = { ...vehicle }
  showModal.value = true
}

const saveVehicle = async () => {
  try {
    if (editMode.value) {
      await axios.put(`/api/vehicles/${formVehicle.value.registration_no}`, formVehicle.value)
    } else {
      await axios.post('/api/vehicles', formVehicle.value)
    }
    showModal.value = false
    fetchVehicles()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to save vehicle details.')
  }
}

const selectVehicle = async (vehicle: any) => {
  selectedVehicle.value = vehicle
  vehicleHistory.value = []
  historyLoading.value = true
  activeTab.value = 'jobcards'
  try {
    const res = await axios.get(`/api/vehicles/${vehicle.registration_no}/history`)
    vehicleHistory.value = res.data
  } catch (err) {
    console.error('Failed to load vehicle history', err)
  } finally {
    historyLoading.value = false
  }
}

onMounted(() => {
  fetchVehicles()
  fetchCustomers()
})

// Delete confirmation states
const showDeleteConfirmModal = ref(false)
const vehicleToDelete = ref<any | null>(null)
const deleteConfirmText = ref('')

const confirmDeleteVehicle = (vehicle: any) => {
  vehicleToDelete.value = vehicle
  deleteConfirmText.value = ''
  showDeleteConfirmModal.value = true
}

const executeDeleteVehicle = async () => {
  if (!vehicleToDelete.value) return
  if (deleteConfirmText.value !== vehicleToDelete.value.registration_no) {
    alert('Registration number does not match confirmation text.')
    return
  }
  try {
    await axios.delete(`/api/vehicles/${vehicleToDelete.value.registration_no}`)
    showDeleteConfirmModal.value = false
    vehicleToDelete.value = null
    selectedVehicle.value = null
    fetchVehicles()
    alert('Vehicle record deleted successfully.')
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to delete vehicle.')
  }
}
</script>

<template>
  <div class="vehicles-container animate-fade-in">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-1">Vehicle Database</h3>
        <p class="text-muted small mb-0">Track vehicles, owners, technical specs, insurance, and service histories.</p>
      </div>
      <button class="btn btn-danger d-flex align-items-center gap-2 px-3 rounded-3" @click="openNewModal">
        <PlusCircle :size="16" />
        <span>Add Vehicle</span>
      </button>
    </div>

    <!-- Search & List Layout -->
    <div class="row g-4">
      <div :class="selectedVehicle ? 'col-12 col-lg-7' : 'col-12'">
        <div class="card border-0 shadow-sm bg-glass h-100">
          <div class="card-header border-0 bg-transparent pt-4 px-4 pb-0">
            <div class="input-group">
              <span class="input-group-text bg-transparent border-end-0 text-muted">
                <Search :size="16" />
              </span>
              <input 
                type="text" 
                v-model="searchQuery" 
                class="form-control border-start-0 ps-1" 
                placeholder="Search by registration number, make, model, owner..."
                @input="fetchVehicles"
              />
            </div>
          </div>
          <div class="card-body p-0 mt-3">
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-danger" role="status"></div>
            </div>
            <div v-else-if="vehicles.length === 0" class="text-center py-5 text-muted small">
              <Car :size="40" class="mb-2 text-muted" />
              <p class="m-0">No matching vehicle records found.</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr class="text-uppercase small text-muted">
                    <th class="ps-4">Registration No</th>
                    <th>Vehicle Model</th>
                    <th>Current Odo</th>
                    <th>Owner Name</th>
                    <th class="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="v in vehicles" 
                    :key="v.registration_no" 
                    class="cursor-pointer"
                    :class="{'table-active-danger': selectedVehicle?.registration_no === v.registration_no}"
                    @click="selectVehicle(v)"
                  >
                    <td class="ps-4 font-monospace fw-bold text-danger">
                      {{ v.registration_no }}
                    </td>
                    <td>
                      <div class="fw-bold">{{ v.make }} {{ v.model }}</div>
                      <span class="text-muted small">{{ v.fuel_type }} | {{ v.color }}</span>
                    </td>
                    <td>{{ v.current_km }} km</td>
                    <td>{{ v.customer?.name || 'Unknown' }}</td>
                    <td class="text-end pe-4" @click.stop>
                      <button class="btn btn-sm btn-outline-secondary me-2 btn-icon" @click="openEditModal(v)" title="Edit">
                        <Edit :size="14" />
                      </button>
                      <button v-if="authStore.isAdmin" class="btn btn-sm btn-outline-danger me-2 btn-icon" @click="confirmDeleteVehicle(v)" title="Delete">
                        <Trash2 :size="14" />
                      </button>
                      <button class="btn btn-sm btn-dark btn-icon" @click="selectVehicle(v)">
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

      <!-- Vehicle Detail Sidebar Drawer -->
      <div v-if="selectedVehicle" class="col-12 col-lg-5 animate-slide-in">
        <div class="card border-0 shadow-sm bg-glass h-100">
          <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-start">
            <div>
              <span class="badge bg-danger bg-opacity-10 text-danger font-monospace fw-bold px-2 py-1 mb-2">{{ selectedVehicle.registration_no }}</span>
              <h4 class="fw-bold m-0">{{ selectedVehicle.make }} {{ selectedVehicle.model }}</h4>
            </div>
            <div class="d-flex gap-2">
              <button v-if="authStore.isAdmin" class="btn btn-sm btn-outline-danger btn-icon rounded-circle" @click="confirmDeleteVehicle(selectedVehicle)" title="Delete Vehicle">
                <Trash2 :size="14" />
              </button>
              <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="selectedVehicle = null">
                <X :size="18" />
              </button>
            </div>
          </div>

          <div class="card-body px-4">
            <!-- Owners & Tech Specs list -->
            <div class="d-flex flex-column gap-2 mb-4 bg-body bg-opacity-50 p-3 rounded-3 small">
              <div class="d-flex align-items-center gap-2">
                <User :size="14" class="text-danger" />
                <span>Owner: <strong>{{ selectedVehicle.customer?.name }}</strong> ({{ selectedVehicle.customer?.mobile }})</span>
              </div>
              <div class="row g-2 mt-1 pt-2 border-top border-secondary border-opacity-10">
                <div class="col-6">
                  <span class="text-muted d-block small-label">Fuel Type</span>
                  <span>{{ selectedVehicle.fuel_type }}</span>
                </div>
                <div class="col-6">
                  <span class="text-muted d-block small-label">Odometer</span>
                  <span>{{ selectedVehicle.current_km }} km</span>
                </div>
                <div class="col-6">
                  <span class="text-muted d-block small-label">Engine No</span>
                  <span class="font-monospace text-uppercase">{{ selectedVehicle.engine_no || 'N/A' }}</span>
                </div>
                <div class="col-6">
                  <span class="text-muted d-block small-label">Chassis No</span>
                  <span class="font-monospace text-uppercase">{{ selectedVehicle.chassis_no || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Insurance Policy Block -->
            <div v-if="selectedVehicle.insurance_company" class="mb-4 bg-danger bg-opacity-5 border-start border-danger p-3 rounded-2 small">
              <div class="fw-bold mb-1 text-danger">Insurance Details</div>
              <div>Company: {{ selectedVehicle.insurance_company }}</div>
              <div>Policy: {{ selectedVehicle.policy_number }}</div>
              <div>Expiry: {{ selectedVehicle.policy_expiry || 'N/A' }}</div>
            </div>

            <!-- Tabs: Job Cards / Invoices -->
            <ul class="nav nav-tabs border-bottom mb-3" role="tablist">
              <li class="nav-item">
                <button 
                  class="nav-link bg-transparent border-0 fw-bold px-3 py-2 small"
                  :class="{'active-danger': activeTab === 'jobcards'}"
                  @click="activeTab = 'jobcards'"
                >
                  Job Cards
                </button>
              </li>
              <li class="nav-item">
                <button 
                  class="nav-link bg-transparent border-0 fw-bold px-3 py-2 small"
                  :class="{'active-danger': activeTab === 'invoices'}"
                  @click="activeTab = 'invoices'"
                >
                  Invoices
                </button>
              </li>
            </ul>

            <!-- Tab Content -->
            <div v-if="historyLoading" class="text-center py-4">
              <div class="spinner-border text-danger spinner-border-sm" role="status"></div>
            </div>
            <div v-else>
              <!-- Job Cards -->
              <div v-if="activeTab === 'jobcards'">
                <div v-if="!vehicleHistory.jobcards || vehicleHistory.jobcards.length === 0" class="text-center py-4 text-muted small">
                  No job card history on record.
                </div>
                <div v-else class="list-group list-group-flush">
                  <div 
                    v-for="jc in vehicleHistory.jobcards" 
                    :key="jc.id" 
                    class="list-group-item bg-transparent px-0 py-3 border-bottom d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div class="fw-bold font-monospace">{{ jc.job_card_no }}</div>
                      <span class="text-muted small">{{ jc.date }} | {{ jc.km_reading }} km</span>
                    </div>
                    <span class="badge" :class="{
                      'bg-secondary': jc.status === 'Open',
                      'bg-info text-dark': jc.status === 'Inspection',
                      'bg-warning text-dark': jc.status === 'In Progress' || jc.status === 'Waiting Parts',
                      'bg-success': jc.status === 'Completed' || jc.status === 'Delivered'
                    }">{{ jc.status }}</span>
                  </div>
                </div>
              </div>

              <!-- Invoices -->
              <div v-if="activeTab === 'invoices'">
                <div v-if="!vehicleHistory.invoices || vehicleHistory.invoices.length === 0" class="text-center py-4 text-muted small">
                  No invoice records found for this vehicle.
                </div>
                <div v-else class="list-group list-group-flush">
                  <div 
                    v-for="inv in vehicleHistory.invoices" 
                    :key="inv.id" 
                    class="list-group-item bg-transparent px-0 py-3 border-bottom d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div class="fw-bold font-monospace">{{ inv.invoice_no }}</div>
                      <span class="text-muted small">{{ inv.date }}</span>
                    </div>
                    <div class="text-end">
                      <div class="fw-bold">₹{{ parseFloat(inv.grand_total).toFixed(2) }}</div>
                      <span class="badge font-monospace" :class="{
                        'bg-success': inv.payment_status === 'Paid',
                        'bg-warning text-dark': inv.payment_status === 'Partially Paid',
                        'bg-danger': inv.payment_status === 'Pending'
                      }">{{ inv.payment_status }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit/New Vehicle Modal -->
    <div v-if="showModal" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
      <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 650px;">
        <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold m-0">{{ editMode ? 'Edit Vehicle Details' : 'Add New Vehicle' }}</h5>
          <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="showModal = false">
            <X :size="18" />
          </button>
        </div>
        <form @submit.prevent="saveVehicle">
          <div class="card-body px-4 py-3" style="max-height: 70vh; overflow-y: auto;">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Registration No <span class="text-danger">*</span></label>
                <input 
                  type="text" 
                  v-model="formVehicle.registration_no" 
                  @input="formVehicle.registration_no = formVehicle.registration_no.toUpperCase().replace(/\s+/g, '')"
                  class="form-control font-monospace text-uppercase" 
                  placeholder="e.g. GJ01XX1234" 
                  required 
                  :disabled="editMode" 
                />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Owner / Customer <span class="text-danger">*</span></label>
                <select v-model="formVehicle.customer_id" class="form-select" required>
                  <option v-for="c in customersList" :key="c.id" :value="c.id">{{ c.name }} ({{ c.mobile }})</option>
                </select>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Make / Brand <span class="text-danger">*</span></label>
                <input type="text" v-model="formVehicle.make" class="form-control" placeholder="e.g. Maruti Suzuki" required />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Model Name <span class="text-danger">*</span></label>
                <input type="text" v-model="formVehicle.model" class="form-control" placeholder="e.g. Swift" required />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Fuel Type <span class="text-danger">*</span></label>
                <select v-model="formVehicle.fuel_type" class="form-select" required>
                  <option value="PETROL">PETROL</option>
                  <option value="DIESEL">DIESEL</option>
                  <option value="CNG">CNG</option>
                  <option value="ELECTRIC">ELECTRIC</option>
                  <option value="HYBRID">HYBRID</option>
                </select>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Manufacturing Year</label>
                <input type="number" v-model="formVehicle.year" class="form-control" placeholder="2020" />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Current Odometer (KM)</label>
                <input type="number" v-model="formVehicle.current_km" class="form-control" placeholder="e.g. 52000" />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Body Color</label>
                <input type="text" v-model="formVehicle.color" class="form-control" placeholder="e.g. RED" />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Engine No (Optional)</label>
                <input type="text" v-model="formVehicle.engine_no" class="form-control font-monospace text-uppercase" placeholder="Optional Engine ID" />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Chassis No (Optional)</label>
                <input type="text" v-model="formVehicle.chassis_no" class="form-control font-monospace text-uppercase" placeholder="Optional Chassis ID" />
              </div>

              <!-- Insurance Details -->
              <div class="col-12 pt-2 border-top border-secondary border-opacity-10">
                <h6 class="fw-bold mb-3 text-muted uppercase small">Insurance Policy (Optional)</h6>
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Insurance Co.</label>
                <input type="text" v-model="formVehicle.insurance_company" class="form-control" placeholder="e.g. HDFC Ergo" />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Policy Number</label>
                <input type="text" v-model="formVehicle.policy_number" class="form-control font-monospace" placeholder="e.g. PO102930219" />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Policy Expiry</label>
                <input type="date" v-model="formVehicle.policy_expiry" class="form-control" />
              </div>
            </div>
          </div>
          <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary px-3" @click="showModal = false">Cancel</button>
            <button type="submit" class="btn btn-danger px-4" style="background-color: #d71920; border-color: #d71920;">Save Changes</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmModal" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
      <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 450px;">
        <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold m-0 text-danger">Confirm Vehicle Deletion</h5>
          <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="showDeleteConfirmModal = false">
            <X :size="18" />
          </button>
        </div>
        <div class="card-body px-4 py-3">
          <p class="small text-muted mb-3">
            Are you sure you want to delete vehicle <strong class="text-danger">{{ vehicleToDelete?.registration_no }}</strong> ({{ vehicleToDelete?.make }} {{ vehicleToDelete?.model }})? 
            This action is permanent and will delete all associated histories.
          </p>
          <div class="mb-3">
            <label class="form-label small-label fw-bold text-muted uppercase">To confirm, type the vehicle registration: <strong class="text-danger select-all">{{ vehicleToDelete?.registration_no }}</strong></label>
            <input 
              type="text" 
              v-model="deleteConfirmText" 
              class="form-control text-center font-monospace text-uppercase" 
              :placeholder="vehicleToDelete?.registration_no"
              required 
            />
          </div>
        </div>
        <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary px-3" @click="showDeleteConfirmModal = false">Cancel</button>
          <button 
            type="button" 
            class="btn btn-danger px-4" 
            :disabled="deleteConfirmText !== vehicleToDelete?.registration_no"
            @click="executeDeleteVehicle"
          >
            Confirm Delete
          </button>
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
}

.nav-link {
  color: var(--text-muted);
}

.active-danger {
  color: #d71920 !important;
  border-bottom: 2px solid #d71920 !important;
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
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
</style>
