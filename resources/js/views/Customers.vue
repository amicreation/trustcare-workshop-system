<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { 
  Users, Search, PlusCircle, Edit, History, 
  MapPin, Phone, Mail, FileText, ChevronRight, X
} from 'lucide-vue-next'

const customers = ref<any[]>([])
const searchQuery = ref('')
const loading = ref(false)
const historyLoading = ref(false)
const selectedCustomer = ref<any | null>(null)
const customerHistory = ref<any[]>([])
const activeTab = ref('vehicles')

// Form Modal State
const showModal = ref(false)
const editMode = ref(false)
const formCustomer = ref({
  id: null as number | null,
  name: '',
  mobile: '',
  alternate_mobile: '',
  email: '',
  address_1: '',
  address_2: '',
  city: 'AHMEDABAD',
  state: 'GUJARAT',
  pin: '',
  gst: '',
  notes: ''
})

const fetchCustomers = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/customers', {
      params: { search: searchQuery.value }
    })
    customers.value = res.data
  } catch (err) {
    console.error('Failed to load customers', err)
  } finally {
    loading.value = false
  }
}

const openNewModal = () => {
  editMode.value = false
  formCustomer.value = {
    id: null,
    name: '',
    mobile: '',
    alternate_mobile: '',
    email: '',
    address_1: '',
    address_2: '',
    city: 'AHMEDABAD',
    state: 'GUJARAT',
    pin: '',
    gst: '',
    notes: ''
  }
  showModal.value = true
}

const openEditModal = (customer: any) => {
  editMode.value = true
  formCustomer.value = { ...customer }
  showModal.value = true
}

const formatName = (val: string) => {
  if (!val) return '';
  return val.trim().split(/\s+/).map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

const saveCustomer = async () => {
  try {
    formCustomer.value.name = formatName(formCustomer.value.name)
    if (editMode.value && formCustomer.value.id) {
      await axios.put(`/api/customers/${formCustomer.value.id}`, formCustomer.value)
    } else {
      await axios.post('/api/customers', formCustomer.value)
    }
    showModal.value = false
    fetchCustomers()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to save customer details.')
  }
}

const selectCustomer = async (customer: any) => {
  selectedCustomer.value = customer
  customerHistory.value = []
  historyLoading.value = true
  activeTab.value = 'vehicles'
  try {
    const res = await axios.get(`/api/customers/${customer.id}/history`)
    customerHistory.value = res.data
  } catch (err) {
    console.error('Failed to load customer history', err)
  } finally {
    historyLoading.value = false
  }
}

onMounted(() => {
  fetchCustomers()
})
</script>

<template>
  <div class="customers-container animate-fade-in">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-1">Customer Database</h3>
        <p class="text-muted small mb-0">Manage customer profile details, vehicles owned, and billing histories.</p>
      </div>
      <button class="btn btn-danger d-flex align-items-center gap-2 px-3 rounded-3" @click="openNewModal">
        <PlusCircle :size="16" />
        <span>Add Customer</span>
      </button>
    </div>

    <!-- Search bar & list layout -->
    <div class="row g-4">
      <div :class="selectedCustomer ? 'col-12 col-lg-7' : 'col-12'">
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
                placeholder="Search by customer name, mobile number, city..."
                @input="fetchCustomers"
              />
            </div>
          </div>
          <div class="card-body p-0 mt-3">
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-danger" role="status"></div>
            </div>
            <div v-else-if="customers.length === 0" class="text-center py-5 text-muted small">
              <Users :size="40" class="mb-2 text-muted" />
              <p class="m-0">No matching customer records found.</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr class="text-uppercase small text-muted">
                    <th class="ps-4">Name</th>
                    <th>Mobile</th>
                    <th>Location</th>
                    <th>GSTIN</th>
                    <th class="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="c in customers" 
                    :key="c.id" 
                    class="cursor-pointer"
                    :class="{'table-active-danger': selectedCustomer?.id === c.id}"
                    @click="selectCustomer(c)"
                  >
                    <td class="ps-4">
                      <div class="fw-bold">{{ c.name }}</div>
                      <span class="text-muted small">{{ c.email || 'No email' }}</span>
                    </td>
                    <td>
                      <div>{{ c.mobile }}</div>
                      <span v-if="c.alternate_mobile" class="text-muted small">Alt: {{ c.alternate_mobile }}</span>
                    </td>
                    <td>{{ c.city }}</td>
                    <td>
                      <span class="badge bg-secondary font-monospace">{{ c.gst || 'N/A' }}</span>
                    </td>
                    <td class="text-end pe-4" @click.stop>
                      <button class="btn btn-sm btn-outline-secondary me-2 btn-icon" @click="openEditModal(c)" title="Edit">
                        <Edit :size="14" />
                      </button>
                      <button class="btn btn-sm btn-dark btn-icon" @click="selectCustomer(c)">
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

      <!-- Customer Detail Sidebar Drawer -->
      <div v-if="selectedCustomer" class="col-12 col-lg-5 animate-slide-in">
        <div class="card border-0 shadow-sm bg-glass h-100">
          <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-start">
            <div>
              <span class="badge bg-danger bg-opacity-10 text-danger text-uppercase fw-bold small px-2 py-1 mb-2">Customer Profile</span>
              <h4 class="fw-bold m-0">{{ selectedCustomer.name }}</h4>
            </div>
            <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="selectedCustomer = null">
              <X :size="18" />
            </button>
          </div>

          <div class="card-body px-4">
            <!-- Details List -->
            <div class="d-flex flex-column gap-2 mb-4 bg-body bg-opacity-50 p-3 rounded-3 small">
              <div class="d-flex align-items-center gap-2">
                <Phone :size="14" class="text-danger" />
                <span>{{ selectedCustomer.mobile }} <span v-if="selectedCustomer.alternate_mobile">/ {{ selectedCustomer.alternate_mobile }}</span></span>
              </div>
              <div v-if="selectedCustomer.email" class="d-flex align-items-center gap-2">
                <Mail :size="14" class="text-danger" />
                <span>{{ selectedCustomer.email }}</span>
              </div>
              <div class="d-flex align-items-start gap-2">
                <MapPin :size="14" class="text-danger mt-1" />
                <span>{{ selectedCustomer.address_1 }} {{ selectedCustomer.address_2 }}<br>{{ selectedCustomer.city }}, {{ selectedCustomer.state }} {{ selectedCustomer.pin }}</span>
              </div>
            </div>

            <!-- Tabs: Vehicles / Invoice History -->
            <ul class="nav nav-tabs border-bottom mb-3" role="tablist">
              <li class="nav-item">
                <button 
                  class="nav-link bg-transparent border-0 fw-bold px-3 py-2 small"
                  :class="{'active-danger': activeTab === 'vehicles'}"
                  @click="activeTab = 'vehicles'"
                >
                  Vehicles Owned
                </button>
              </li>
              <li class="nav-item">
                <button 
                  class="nav-link bg-transparent border-0 fw-bold px-3 py-2 small"
                  :class="{'active-danger': activeTab === 'invoices'}"
                  @click="activeTab = 'invoices'"
                >
                  Invoice History
                </button>
              </li>
            </ul>

            <!-- Tab Contents -->
            <div v-if="historyLoading" class="text-center py-4">
              <div class="spinner-border text-danger spinner-border-sm" role="status"></div>
            </div>
            <div v-else>
              <!-- Vehicles Tab -->
              <div v-if="activeTab === 'vehicles'">
                <div v-if="!customerHistory.vehicles || customerHistory.vehicles.length === 0" class="text-center py-4 text-muted small">
                  No vehicles registered for this customer.
                </div>
                <div v-else class="list-group list-group-flush">
                  <div 
                    v-for="v in customerHistory.vehicles" 
                    :key="v.registration_no" 
                    class="list-group-item bg-transparent px-0 py-3 border-bottom d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div class="fw-bold font-monospace text-danger">{{ v.registration_no }}</div>
                      <span class="text-muted small">{{ v.make }} {{ v.model }} ({{ v.color }})</span>
                    </div>
                    <span class="badge bg-secondary rounded">{{ v.fuel_type }}</span>
                  </div>
                </div>
              </div>

              <!-- Invoices Tab -->
              <div v-if="activeTab === 'invoices'">
                <div v-if="!customerHistory.invoices || customerHistory.invoices.length === 0" class="text-center py-4 text-muted small">
                  No historical invoices found.
                </div>
                <div v-else class="list-group list-group-flush">
                  <div 
                    v-for="inv in customerHistory.invoices" 
                    :key="inv.id" 
                    class="list-group-item bg-transparent px-0 py-3 border-bottom d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div class="fw-bold">{{ inv.invoice_no }}</div>
                      <span class="text-muted small">{{ inv.date }} | {{ inv.vehicle_reg_no }}</span>
                    </div>
                    <div class="text-end">
                      <div class="fw-bold">₹{{ parseFloat(inv.grand_total).toFixed(2) }}</div>
                      <span class="badge" :class="{
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

    <!-- Edit/New Customer Modal -->
    <div v-if="showModal" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
      <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 600px;">
        <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold m-0">{{ editMode ? 'Edit Customer Details' : 'Add New Customer' }}</h5>
          <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="showModal = false">
            <X :size="18" />
          </button>
        </div>
        <form @submit.prevent="saveCustomer">
          <div class="card-body px-4 py-3" style="max-height: 70vh; overflow-y: auto;">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Full Name <span class="text-danger">*</span></label>
                <input type="text" v-model="formCustomer.name" class="form-control" placeholder="e.g. Rajesh Kumar" required @blur="formCustomer.name = formatName(formCustomer.name)" />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Mobile Number <span class="text-danger">*</span></label>
                <input type="text" v-model="formCustomer.mobile" class="form-control" placeholder="10-digit number" required />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Alternate Mobile</label>
                <input type="text" v-model="formCustomer.alternate_mobile" class="form-control" placeholder="Optional alternative contact" />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Email Address (Optional)</label>
                <input type="email" v-model="formCustomer.email" class="form-control" placeholder="name@domain.com" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold text-muted uppercase">Address Line 1</label>
                <input type="text" v-model="formCustomer.address_1" class="form-control" placeholder="House/Shop no, building name" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold text-muted uppercase">Address Line 2</label>
                <input type="text" v-model="formCustomer.address_2" class="form-control" placeholder="Street, locality, area" />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">City</label>
                <input type="text" v-model="formCustomer.city" class="form-control" placeholder="AHMEDABAD" />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">State</label>
                <input type="text" v-model="formCustomer.state" class="form-control" placeholder="GUJARAT" />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">PIN Code</label>
                <input type="text" v-model="formCustomer.pin" class="form-control" placeholder="6-digit pin code" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold text-muted uppercase">GSTIN</label>
                <input type="text" v-model="formCustomer.gst" class="form-control font-monospace" placeholder="15-digit GSTIN details (optional)" />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold text-muted uppercase">Customer Notes</label>
                <textarea v-model="formCustomer.notes" class="form-control" rows="2" placeholder="Reputation, special vehicle handling guidelines..."></textarea>
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
