<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { 
  CheckSquare, Search, PlusCircle, Edit, Trash2, Clock, 
  User, Car, AlertTriangle, Plus, X, ChevronRight, Clipboard, FileText, Upload,
  ArrowRight, Check
} from 'lucide-vue-next'

const authStore = useAuthStore()
const route = useRoute()

const jobCards = ref<any[]>([])
const customers = ref<any[]>([])
const vehicles = ref<any[]>([])
const searchQuery = ref('')
const selectedStatus = ref('')

const loading = ref(false)
const detailsLoading = ref(false)
const selectedJobCard = ref<any | null>(null)
const activeTab = ref('timeline')

// Job Card Form State
const showFormModal = ref(false)
const editMode = ref(false)
const formJob = ref({
  id: null as number | null,
  date: new Date().toISOString().substring(0, 10),
  customer_id: null as any,
  vehicle_reg_no: '',
  km_reading: 0,
  fuel_level: '1/2 Tank',
  complaints: [] as string[],
  inspection_notes: '',
  status: 'Open'
})
const newComplaintInput = ref('')

// Mechanic Updates State
const mechanicUpdates = ref<any[]>([])
const showUpdateModal = ref(false)
const formUpdate = ref({
  mechanic_name: '',
  performed_work: '',
  parts_used: [] as Array<{ name: string; qty: number }>,
  labour_hours: 1.0,
  remarks: '',
  work_completed: false,
  test_drive_done: false,
  quality_check_done: false
})
const newPartName = ref('')
const newPartQty = ref(1)

// Vehicle Inspection Checklist State
const showInspectionModal = ref(false)
const formInspection = ref({
  odometer: 0,
  fuel_level: '1/2 Tank',
  exterior_status: 'Good',
  interior_status: 'Good',
  tyres_status: 'Good',
  battery_status: 'Good',
  lights_status: 'Good',
  brakes_status: 'Good',
  suspension_status: 'Good',
  engine_status: 'Good',
  notes: ''
})

// Inspection Photo Upload State
const uploadViewType = ref('front')
const uploadDescription = ref('')
const photoFile = ref<File | null>(null)
const photoUploading = ref(false)

const fetchJobCards = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/jobcards', {
      params: {
        search: searchQuery.value,
        status: selectedStatus.value
      }
    })
    jobCards.value = res.data
  } catch (err) {
    console.error('Failed to load job cards', err)
  } finally {
    loading.value = false
  }
}

const fetchCustomersAndVehicles = async () => {
  try {
    const custRes = await axios.get('/api/customers')
    customers.value = custRes.data
    const vehRes = await axios.get('/api/vehicles')
    vehicles.value = vehRes.data
  } catch (err) {
    console.error('Failed to load customers & vehicles list', err)
  }
}

const selectJobCard = async (id: number) => {
  detailsLoading.value = true
  activeTab.value = 'timeline'
  try {
    const res = await axios.get(`/api/jobcards/${id}`)
    selectedJobCard.value = res.data
    // Load associated updates
    mechanicUpdates.value = res.data.updates || []
  } catch (err) {
    console.error('Failed to load job card details', err)
  } finally {
    detailsLoading.value = false
  }
}

onMounted(async () => {
  await fetchJobCards()
  await fetchCustomersAndVehicles()
  
  // If id is passed in URL query, select it directly
  if (route.query.id) {
    selectJobCard(parseInt(route.query.id as string))
  }
})

// Job Card CRUD Methods
const openNewJobModal = () => {
  editMode.value = false
  formJob.value = {
    id: null,
    date: new Date().toISOString().substring(0, 10),
    customer_id: customers.value[0]?.id || null,
    vehicle_reg_no: vehicles.value[0]?.registration_no || '',
    km_reading: 0,
    fuel_level: '1/2 Tank',
    complaints: [],
    inspection_notes: '',
    status: 'Open'
  }
  showFormModal.value = true
}

const openEditJobModal = (job: any) => {
  editMode.value = true
  
  let complaintsArray = []
  if (Array.isArray(job.complaints)) {
    complaintsArray = [...job.complaints]
  } else if (typeof job.complaints === 'string') {
    try {
      const parsed = JSON.parse(job.complaints)
      complaintsArray = Array.isArray(parsed) ? parsed : []
    } catch (e) {
      complaintsArray = []
    }
  }
  
  formJob.value = { 
    ...job, 
    complaints: complaintsArray
  }
  showFormModal.value = true
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

const saveJobCard = async () => {
  try {
    const payload = { ...formJob.value }
    if (editMode.value && formJob.value.id) {
      await axios.put(`/api/jobcards/${formJob.value.id}`, payload)
    } else {
      await axios.post('/api/jobcards', payload)
    }
    showFormModal.value = false
    fetchJobCards()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to save Job Card.')
  }
}

const deleteJobCard = async (id: number) => {
  if (!confirm('Are you sure you want to delete this job card?')) return
  try {
    await axios.delete(`/api/jobcards/${id}`)
    selectedJobCard.value = null
    fetchJobCards()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to delete Job Card.')
  }
}

const parsedComplaints = computed(() => {
  if (!selectedJobCard.value || !selectedJobCard.value.complaints) return []
  if (Array.isArray(selectedJobCard.value.complaints)) return selectedJobCard.value.complaints
  if (typeof selectedJobCard.value.complaints === 'string') {
    try {
      const parsed = JSON.parse(selectedJobCard.value.complaints)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }
  return []
})

const parsePartsUsed = (partsUsed: any) => {
  if (!partsUsed) return []
  if (Array.isArray(partsUsed)) return partsUsed
  if (typeof partsUsed === 'string') {
    try {
      const parsed = JSON.parse(partsUsed)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      return []
    }
  }
  return []
}

// Timeline State Formatting
const getStatusStepClass = (step: string) => {
  if (!selectedJobCard.value) return ''
  const statuses = ['Open', 'Inspection', 'In Progress', 'Waiting Parts', 'Completed', 'Delivered']
  const currentIdx = statuses.indexOf(selectedJobCard.value.status)
  const stepIdx = statuses.indexOf(step)
  
  if (currentIdx === stepIdx) return 'step-active bg-danger text-white'
  if (currentIdx > stepIdx) return 'step-completed bg-success text-white'
  return 'step-pending text-muted border'
}

const changeStatus = async (newStatus: string) => {
  if (!selectedJobCard.value) return
  try {
    const res = await axios.put(`/api/jobcards/${selectedJobCard.value.id}`, {
      status: newStatus
    })
    selectedJobCard.value.status = res.data.status
    selectedJobCard.value.timeline_started_at = res.data.timeline_started_at
    selectedJobCard.value.timeline_completed_at = res.data.timeline_completed_at
    selectedJobCard.value.timeline_delivered_at = res.data.timeline_delivered_at
    fetchJobCards()
  } catch (err) {
    console.error('Failed to change status', err)
  }
}

// Mechanic Update Form Methods
const openUpdateModal = () => {
  formUpdate.value = {
    mechanic_name: '',
    performed_work: '',
    parts_used: [],
    labour_hours: 1.0,
    remarks: '',
    work_completed: false,
    test_drive_done: false,
    quality_check_done: false
  }
  showUpdateModal.value = true
}

const addPart = () => {
  if (newPartName.value.trim() && newPartQty.value > 0) {
    formUpdate.value.parts_used.push({
      name: newPartName.value.trim(),
      qty: newPartQty.value
    })
    newPartName.value = ''
    newPartQty.value = 1
  }
}

const removePart = (index: number) => {
  formUpdate.value.parts_used.splice(index, 1)
}

const saveMechanicUpdate = async () => {
  if (!selectedJobCard.value) return
  try {
    const res = await axios.post(`/api/jobcards/${selectedJobCard.value.id}/updates`, formUpdate.value)
    mechanicUpdates.value.push(res.data)
    showUpdateModal.value = false
    
    // Auto-update Job Card completion statuses if checkmarks ticked
    if (formUpdate.value.work_completed && selectedJobCard.value.status !== 'Completed') {
      await changeStatus('Completed')
    }
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to submit update.')
  }
}

// Inspection Operations
const openInspectionModal = () => {
  if (!selectedJobCard.value) return
  const insp = selectedJobCard.value.inspection
  
  formInspection.value = {
    odometer: insp?.odometer || selectedJobCard.value.km_reading,
    fuel_level: insp?.fuel_level || selectedJobCard.value.fuel_level,
    exterior_status: insp?.exterior_status || 'Good',
    interior_status: insp?.interior_status || 'Good',
    tyres_status: insp?.tyres_status || 'Good',
    battery_status: insp?.battery_status || 'Good',
    lights_status: insp?.lights_status || 'Good',
    brakes_status: insp?.brakes_status || 'Good',
    suspension_status: insp?.suspension_status || 'Good',
    engine_status: insp?.engine_status || 'Good',
    notes: insp?.notes || ''
  }
  showInspectionModal.value = true
}

const saveInspection = async () => {
  if (!selectedJobCard.value) return
  try {
    const res = await axios.post('/api/inspections', {
      job_card_id: selectedJobCard.value.id,
      ...formInspection.value
    })
    selectedJobCard.value.inspection = res.data
    showInspectionModal.value = false
    
    // Shift state automatically to 'Inspection'
    if (selectedJobCard.value.status === 'Open') {
      await changeStatus('Inspection')
    }
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to save vehicle inspection sheet.')
  }
}

const handleFileChange = (e: any) => {
  const file = e.target.files[0]
  if (file) {
    photoFile.value = file
  }
}

const uploadPhoto = async () => {
  if (!selectedJobCard.value?.inspection?.id || !photoFile.value) {
    alert('Please perform/save inspection specs first, and select a image file to upload.')
    return
  }
  
  photoUploading.value = true
  const formData = new FormData()
  formData.append('photo', photoFile.value)
  formData.append('view_type', uploadViewType.value)
  formData.append('description', uploadDescription.value)
  
  try {
    const res = await axios.post(`/api/inspections/${selectedJobCard.value.inspection.id}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    if (!selectedJobCard.value.inspection.photos) {
      selectedJobCard.value.inspection.photos = []
    }
    selectedJobCard.value.inspection.photos.push(res.data)
    
    // Clear photo form
    photoFile.value = null
    uploadDescription.value = ''
    const input = document.getElementById('photoInput') as any
    if (input) input.value = ''
  } catch (err: any) {
    alert(err.response?.data?.error || 'Photo upload failed.')
  } finally {
    photoUploading.value = false
  }
}

const generateInspectionPDF = async () => {
  if (!selectedJobCard.value?.inspection?.id) return
  try {
    const res = await axios.get(`/api/inspections/${selectedJobCard.value.inspection.id}/pdf`)
    window.open(res.data.pdf_url, '_blank')
  } catch (err) {
    console.error('Failed to generate PDF', err)
  }
}
</script>

<template>
  <div class="job-cards-container animate-fade-in">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-1">Job Cards & Service Track</h3>
        <p class="text-muted small mb-0">Initiate vehicle check-in, log diagnostic checklists, upload condition photos, and record mechanic updates.</p>
      </div>
      <button class="btn btn-danger d-flex align-items-center gap-2 px-3 rounded-3" @click="openNewJobModal">
        <PlusCircle :size="16" />
        <span>New Job Card</span>
      </button>
    </div>

    <!-- Search/Filters & Split Grid -->
    <div class="row g-4">
      <!-- Listings Column -->
      <div :class="selectedJobCard ? 'col-12 col-lg-6' : 'col-12'">
        <div class="card border-0 shadow-sm bg-glass mb-4 p-3">
          <div class="row g-3 align-items-center">
            <div class="col-12 col-md-7">
              <div class="input-group">
                <span class="input-group-text bg-transparent border-end-0 text-muted">
                  <Search :size="16" />
                </span>
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  class="form-control border-start-0 ps-1" 
                  placeholder="Search by Job Card No, registration, mobile..."
                  @input="fetchJobCards"
                />
              </div>
            </div>
            <div class="col-12 col-md-5">
              <select v-model="selectedStatus" class="form-select" @change="fetchJobCards">
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Inspection">Inspection</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting Parts">Waiting Parts</option>
                <option value="Completed">Completed</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card border-0 shadow-sm bg-glass">
          <div class="card-body p-0">
            <div v-if="loading" class="text-center py-5">
              <div class="spinner-border text-danger" role="status"></div>
            </div>
            <div v-else-if="jobCards.length === 0" class="text-center py-5 text-muted small">
              <CheckSquare :size="40" class="mb-2 text-muted" />
              <p class="m-0">No job cards found matching filters.</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr class="text-uppercase small text-muted">
                    <th class="ps-4">Job No</th>
                    <th>Vehicle Reg</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th class="text-end pe-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    v-for="job in jobCards" 
                    :key="job.id" 
                    class="cursor-pointer"
                    :class="{'table-active-danger': selectedJobCard?.id === job.id}"
                    @click="selectJobCard(job.id)"
                  >
                    <td class="ps-4 fw-bold text-danger">{{ job.job_card_no }}</td>
                    <td class="fw-bold font-monospace">{{ job.vehicle_reg_no }}</td>
                    <td>{{ job.customer?.name }}</td>
                    <td class="small">{{ job.date }}</td>
                    <td>
                      <span class="badge rounded font-monospace" :class="{
                        'bg-secondary': job.status === 'Open',
                        'bg-info text-dark': job.status === 'Inspection',
                        'bg-warning text-dark': job.status === 'In Progress' || job.status === 'Waiting Parts',
                        'bg-success': job.status === 'Completed' || job.status === 'Delivered'
                      }">{{ job.status }}</span>
                    </td>
                    <td class="text-end pe-4" @click.stop>
                      <button class="btn btn-sm btn-outline-secondary me-1 btn-icon" @click="openEditJobModal(job)" title="Edit">
                        <Edit :size="14" />
                      </button>
                      <button class="btn btn-sm btn-dark btn-icon" @click="selectJobCard(job.id)">
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

      <!-- Detail Actions Workspace Column -->
      <div v-if="selectedJobCard" class="col-12 col-lg-6 animate-slide-in">
        <div class="card border-0 shadow-sm bg-glass h-100">
          <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-start">
            <div>
              <span class="badge bg-danger bg-opacity-10 text-danger font-monospace fw-bold px-2 py-1 mb-2">{{ selectedJobCard.job_card_no }}</span>
              <h4 class="fw-bold m-0">{{ selectedJobCard.vehicle_reg_no }}</h4>
              <span class="text-muted small">Owner: {{ selectedJobCard.customer?.name }} | {{ selectedJobCard.customer?.mobile }}</span>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-dark btn-icon rounded-circle" @click="deleteJobCard(selectedJobCard.id)" title="Delete Card">
                <Trash2 :size="16" />
              </button>
              <button class="btn btn-sm btn-outline-secondary btn-icon rounded-circle" @click="selectedJobCard = null">
                <X :size="16" />
              </button>
            </div>
          </div>

          <div class="card-body px-4">
            <!-- Tabs Menu -->
            <ul class="nav nav-tabs border-bottom mb-3" role="tablist">
              <li class="nav-item">
                <button 
                  class="nav-link bg-transparent border-0 fw-bold px-3 py-2 small"
                  :class="{'active-danger': activeTab === 'timeline'}"
                  @click="activeTab = 'timeline'"
                >
                  Workflow Timeline
                </button>
              </li>
              <li class="nav-item">
                <button 
                  class="nav-link bg-transparent border-0 fw-bold px-3 py-2 small"
                  :class="{'active-danger': activeTab === 'inspection'}"
                  @click="activeTab = 'inspection'"
                >
                  Inspection Checklist
                </button>
              </li>
              <li class="nav-item">
                <button 
                  class="nav-link bg-transparent border-0 fw-bold px-3 py-2 small"
                  :class="{'active-danger': activeTab === 'updates'}"
                  @click="activeTab = 'updates'"
                >
                  Work Updates
                </button>
              </li>
            </ul>

            <!-- Details Loader -->
            <div v-if="detailsLoading" class="text-center py-5">
              <div class="spinner-border text-danger spinner-border-sm" role="status"></div>
            </div>

            <div v-else>
              <!-- Timeline Tab -->
              <div v-if="activeTab === 'timeline'" class="timeline-view">
                <!-- Status Actions -->
                <div class="d-flex flex-wrap gap-2 mb-4 bg-body bg-opacity-50 p-3 rounded-3 align-items-center">
                  <span class="small fw-bold text-muted uppercase me-2">Set status:</span>
                  <button 
                    v-for="st in ['Open', 'Inspection', 'In Progress', 'Waiting Parts', 'Completed', 'Delivered']"
                    :key="st"
                    class="btn btn-sm"
                    :class="selectedJobCard.status === st ? 'btn-danger' : 'btn-outline-secondary'"
                    @click="changeStatus(st)"
                  >
                    {{ st }}
                  </button>
                </div>

                <!-- Custom Visual Timeline -->
                <div class="timeline-trail d-flex flex-column gap-3 ps-3">
                  <div class="trail-item d-flex gap-3 position-relative">
                    <div class="trail-badge" :class="getStatusStepClass('Open')">1</div>
                    <div>
                      <div class="fw-bold">Job Initiated</div>
                      <span class="text-muted small">Registered: {{ selectedJobCard.timeline_created_at ? new Date(selectedJobCard.timeline_created_at).toLocaleString() : 'N/A' }}</span>
                    </div>
                  </div>
                  <div class="trail-item d-flex gap-3 position-relative">
                    <div class="trail-badge" :class="getStatusStepClass('Inspection')">2</div>
                    <div>
                      <div class="fw-bold">Vehicle Diagnostic Inspection</div>
                      <span class="text-muted small">Checked: {{ selectedJobCard.inspection ? 'Logged Successfully' : 'Not started' }}</span>
                    </div>
                  </div>
                  <div class="trail-item d-flex gap-3 position-relative">
                    <div class="trail-badge" :class="getStatusStepClass('In Progress')">3</div>
                    <div>
                      <div class="fw-bold">Repairs In Progress</div>
                      <span class="text-muted small">Started: {{ selectedJobCard.timeline_started_at ? new Date(selectedJobCard.timeline_started_at).toLocaleString() : 'Not started' }}</span>
                    </div>
                  </div>
                  <div class="trail-item d-flex gap-3 position-relative">
                    <div class="trail-badge" :class="getStatusStepClass('Completed')">4</div>
                    <div>
                      <div class="fw-bold">Quality Check & Completed</div>
                      <span class="text-muted small">Completed: {{ selectedJobCard.timeline_completed_at ? new Date(selectedJobCard.timeline_completed_at).toLocaleString() : 'Not finished' }}</span>
                    </div>
                  </div>
                  <div class="trail-item d-flex gap-3 position-relative">
                    <div class="trail-badge" :class="getStatusStepClass('Delivered')">5</div>
                    <div>
                      <div class="fw-bold">Vehicle Delivered</div>
                      <span class="text-muted small">Handed over: {{ selectedJobCard.timeline_delivered_at ? new Date(selectedJobCard.timeline_delivered_at).toLocaleString() : 'Pending' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Quick Workflow Action Buttons -->
                <div class="mt-4 p-3 bg-light rounded border text-dark">
                  <div class="small fw-bold text-muted uppercase mb-2">Recommended Next Action:</div>
                  <div v-if="selectedJobCard.status === 'Open'">
                    <button class="btn btn-sm btn-danger w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2" style="background-color: #d71920; border-color: #d71920;" @click="changeStatus('Inspection')">
                      <ArrowRight :size="14" />
                      <span>Start Inspection Check-sheet</span>
                    </button>
                  </div>
                  <div v-else-if="selectedJobCard.status === 'Inspection'">
                    <button class="btn btn-sm btn-warning w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2" @click="changeStatus('In Progress')">
                      <ArrowRight :size="14" />
                      <span>Put In Progress (Start Repairs)</span>
                    </button>
                  </div>
                  <div v-else-if="selectedJobCard.status === 'In Progress' || selectedJobCard.status === 'Waiting Parts'">
                    <button class="btn btn-sm btn-success w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2" @click="changeStatus('Completed')">
                      <Check :size="14" />
                      <span>Repairs Finished (Complete Job Card)</span>
                    </button>
                  </div>
                  <div v-else-if="selectedJobCard.status === 'Completed'">
                    <button class="btn btn-sm btn-danger w-100 py-2 fw-bold d-flex align-items-center justify-content-center gap-2" style="background-color: #d71920; border-color: #d71920;" @click="changeStatus('Delivered')">
                      <Check :size="14" />
                      <span>Deliver Vehicle (Close Job Card)</span>
                    </button>
                  </div>
                  <div v-else-if="selectedJobCard.status === 'Delivered'">
                    <div class="text-success small fw-bold d-flex align-items-center gap-1.5 justify-content-center py-1">
                      <Check :size="16" />
                      <span>Job Card is Closed & Vehicle is Delivered!</span>
                    </div>
                  </div>
                </div>

                <!-- Complaints Display -->
                <div class="mt-4 pt-3 border-top">
                  <h6 class="fw-bold small text-muted uppercase">Customer Complaints / Tasks:</h6>
                  <ul class="list-group mt-2">
                    <li v-for="(comp, i) in parsedComplaints" :key="i" class="list-group-item bg-transparent py-2 border-bottom-0 d-flex gap-2">
                      <span class="text-danger">•</span>
                      <span>{{ comp }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Inspection Tab -->
              <div v-if="activeTab === 'inspection'" class="inspection-view">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="fw-bold small text-muted uppercase m-0">Inspection Log:</h6>
                  <button class="btn btn-sm btn-outline-danger" @click="openInspectionModal">
                    {{ selectedJobCard.inspection ? 'Edit Inspection Check' : 'Start Check-sheet' }}
                  </button>
                </div>

                <!-- Condition table summary -->
                <div v-if="!selectedJobCard.inspection" class="text-center py-4 bg-body bg-opacity-25 rounded border border-dashed small text-muted">
                  No inspection sheet logged for this job card.
                </div>
                <div v-else>
                  <div class="row g-2 mb-3 small">
                    <div class="col-4 border-end">
                      <span class="text-muted d-block uppercase font-bold text-xxs">Checked Odometer</span>
                      <strong class="font-monospace text-danger">{{ selectedJobCard.inspection.odometer }} km</strong>
                    </div>
                    <div class="col-4 border-end">
                      <span class="text-muted d-block uppercase font-bold text-xxs">Fuel Level</span>
                      <strong>{{ selectedJobCard.inspection.fuel_level }}</strong>
                    </div>
                    <div class="col-4">
                      <span class="text-muted d-block uppercase font-bold text-xxs">Exterior Rating</span>
                      <span class="badge" :class="{
                        'bg-success': selectedJobCard.inspection.exterior_status === 'Good',
                        'bg-warning text-dark': selectedJobCard.inspection.exterior_status === 'Attention Required',
                        'bg-danger': selectedJobCard.inspection.exterior_status === 'Critical'
                      }">{{ selectedJobCard.inspection.exterior_status }}</span>
                    </div>
                  </div>

                  <!-- PDF Print Buttons -->
                  <div class="mb-4 d-flex gap-2">
                    <button class="btn btn-sm btn-dark w-100 d-flex align-items-center justify-content-center gap-2 rounded-2" @click="generateInspectionPDF">
                      <FileText :size="14" />
                      <span>Download Inspection PDF</span>
                    </button>
                  </div>

                  <!-- Photos Section -->
                  <div class="pt-3 border-top">
                    <div class="fw-bold small text-muted uppercase mb-3">Condition Verification Photos:</div>
                    
                    <!-- Form for uploading -->
                    <div class="row g-2 align-items-end mb-3 bg-body p-2 rounded-2 border">
                      <div class="col-4">
                        <select v-model="uploadViewType" class="form-select form-select-sm">
                          <option value="front">Front View</option>
                          <option value="rear">Rear View</option>
                          <option value="left">Left View</option>
                          <option value="right">Right View</option>
                          <option value="damage">Damage Detail</option>
                        </select>
                      </div>
                      <div class="col-8">
                        <input type="text" v-model="uploadDescription" class="form-control form-control-sm" placeholder="Brief note (e.g. Left fender scratch)" />
                      </div>
                      <div class="col-9 mt-2">
                        <input type="file" id="photoInput" class="form-control form-control-sm" @change="handleFileChange" accept="image/*" />
                      </div>
                      <div class="col-3 mt-2">
                        <button class="btn btn-sm btn-danger w-100 py-1" :disabled="photoUploading" @click="uploadPhoto">
                          <Upload :size="12" class="me-1" /> Up
                        </button>
                      </div>
                    </div>

                    <!-- Photo Gallery list -->
                    <div v-if="!selectedJobCard.inspection.photos || selectedJobCard.inspection.photos.length === 0" class="text-center py-3 text-muted small">
                      No photos uploaded for this inspection yet.
                    </div>
                    <div v-else class="row g-2">
                      <div v-for="ph in selectedJobCard.inspection.photos" :key="ph.id" class="col-4">
                        <div class="card p-1 border">
                          <img :src="ph.photo_path" class="card-img-top rounded img-fluid" style="height: 80px; object-fit: cover;" />
                          <div class="p-1 text-center small-text">
                            <span class="badge bg-secondary font-monospace" style="font-size: 8px;">{{ ph.view_type }}</span>
                            <div class="text-truncate text-muted" style="font-size: 9px;" :title="ph.description">{{ ph.description || 'View' }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Work Updates Tab -->
              <div v-if="activeTab === 'updates'" class="updates-view">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="fw-bold small text-muted uppercase m-0">Mechanic Logs:</h6>
                  <button class="btn btn-sm btn-danger" @click="openUpdateModal">
                    <Plus :size="14" class="me-1" /> Log Update
                  </button>
                </div>

                <div v-if="mechanicUpdates.length === 0" class="text-center py-4 bg-body bg-opacity-25 rounded border border-dashed small text-muted">
                  No mechanic updates logged for this job card.
                </div>
                <div v-else class="list-group list-group-flush">
                  <div v-for="up in mechanicUpdates" :key="up.id" class="list-group-item bg-transparent px-0 py-3 border-bottom">
                    <div class="d-flex justify-content-between">
                      <strong class="text-danger">{{ up.mechanic_name || 'Assigned Mechanic' }}</strong>
                      <span class="text-muted small">{{ new Date(up.created_at).toLocaleDateString() }}</span>
                    </div>
                    <div class="mt-1 small">{{ up.performed_work }}</div>
                    
                    <div v-if="up.parts_used && parsePartsUsed(up.parts_used).length > 0" class="mt-2 bg-body bg-opacity-50 p-2 rounded-2 small text-muted">
                      <strong>Parts used:</strong>
                      <div v-for="(p, j) in parsePartsUsed(up.parts_used)" :key="j" class="font-monospace text-xxs">• {{ p.name }} (Qty: {{ p.qty }})</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit/New Job Card Modal -->
    <div v-if="showFormModal" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
      <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 600px;">
        <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold m-0">{{ editMode ? 'Modify Job Card' : 'Open New Job Card' }}</h5>
          <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="showFormModal = false">
            <X :size="18" />
          </button>
        </div>
        <form @submit.prevent="saveJobCard">
          <div class="card-body px-4 py-3" style="max-height: 70vh; overflow-y: auto;">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Job Card Date</label>
                <input type="date" v-model="formJob.date" class="form-control" required />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Vehicle Registration</label>
                <select v-model="formJob.vehicle_reg_no" class="form-select" required>
                  <option v-for="v in vehicles" :key="v.registration_no" :value="v.registration_no">{{ v.registration_no }} ({{ v.make }} {{ v.model }})</option>
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Customer / Owner</label>
                <select v-model="formJob.customer_id" class="form-select" required>
                  <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} ({{ c.mobile }})</option>
                </select>
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Odometer In (KM)</label>
                <input type="number" v-model="formJob.km_reading" class="form-control" required />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Fuel Level</label>
                <select v-model="formJob.fuel_level" class="form-select" required>
                  <option value="Empty">Empty</option>
                  <option value="1/4 Tank">1/4 Tank</option>
                  <option value="1/2 Tank">1/2 Tank</option>
                  <option value="3/4 Tank">3/4 Tank</option>
                  <option value="Full">Full Tank</option>
                </select>
              </div>
              <div class="col-12 col-md-6" v-if="editMode">
                <label class="form-label small fw-bold text-muted uppercase">Status</label>
                <select v-model="formJob.status" class="form-select" required>
                  <option value="Open">Open</option>
                  <option value="Inspection">Inspection</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Waiting Parts">Waiting Parts</option>
                  <option value="Completed">Completed</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>

              <!-- Complaints lists building -->
              <div class="col-12 border-top pt-3">
                <label class="form-label small fw-bold text-muted uppercase">Customer Complaints / Tasks</label>
                <div class="input-group mb-2">
                  <input type="text" v-model="newComplaintInput" class="form-control" placeholder="Add specific task/complaint..." @keydown.enter.prevent="addComplaint" />
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
            <button type="button" class="btn btn-outline-secondary px-3" @click="showFormModal = false">Cancel</button>
            <button type="submit" class="btn btn-danger px-4" style="background-color: #d71920; border-color: #d71920;">Generate Job Card</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Inspection Checklist Modal -->
    <div v-if="showInspectionModal" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
      <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 650px;">
        <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold m-0">Diagnostic Inspection Check-sheet</h5>
          <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="showInspectionModal = false">
            <X :size="18" />
          </button>
        </div>
        <form @submit.prevent="saveInspection">
          <div class="card-body px-4 py-3" style="max-height: 70vh; overflow-y: auto;">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Verified Odometer</label>
                <input type="number" v-model="formInspection.odometer" class="form-control" required />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Verified Fuel Level</label>
                <select v-model="formInspection.fuel_level" class="form-select" required>
                  <option value="Empty">Empty</option>
                  <option value="1/4 Tank">1/4 Tank</option>
                  <option value="1/2 Tank">1/2 Tank</option>
                  <option value="3/4 Tank">3/4 Tank</option>
                  <option value="Full">Full Tank</option>
                </select>
              </div>

              <!-- Parameter ratings -->
              <div class="col-12 pt-2 border-top">
                <h6 class="fw-bold text-muted uppercase small mb-3">Vehicle Parameter Assessments</h6>
              </div>

              <div v-for="param in ['exterior', 'interior', 'tyres', 'battery', 'lights', 'brakes', 'suspension', 'engine']" :key="param" class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">{{ param }} status</label>
                <select v-model="(formInspection as any)[`${param}_status`]" class="form-select" required>
                  <option value="Good">🟢 Good / Normal</option>
                  <option value="Attention Required">🟡 Attention Required</option>
                  <option value="Critical">🔴 Critical / Damaged</option>
                </select>
              </div>

              <div class="col-12 mt-2">
                <label class="form-label small fw-bold text-muted uppercase">Inspection Remarks / Diagnostic Notes</label>
                <textarea v-model="formInspection.notes" class="form-control" rows="3" placeholder="Identify issues, leakages, dents, parts requiring replacements..."></textarea>
              </div>
            </div>
          </div>
          <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary px-3" @click="showInspectionModal = false">Cancel</button>
            <button type="submit" class="btn btn-danger px-4" style="background-color: #d71920; border-color: #d71920;">Save Assessment</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Mechanic Update Modal -->
    <div v-if="showUpdateModal" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
      <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 550px;">
        <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold m-0">Log Work Update</h5>
          <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="showUpdateModal = false">
            <X :size="18" />
          </button>
        </div>
        <form @submit.prevent="saveMechanicUpdate">
          <div class="card-body px-4 py-3" style="max-height: 70vh; overflow-y: auto;">
            <div class="row g-3">
              <div class="col-12 col-md-8">
                <label class="form-label small fw-bold text-muted uppercase">Mechanic Name</label>
                <input type="text" v-model="formUpdate.mechanic_name" class="form-control" placeholder="Assigned mechanic" required />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Labour Hours</label>
                <input type="number" step="0.1" v-model="formUpdate.labour_hours" class="form-control font-monospace" required />
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold text-muted uppercase">Performed Repairs / Actions</label>
                <textarea v-model="formUpdate.performed_work" class="form-control" rows="2" placeholder="List mechanical adjustments, oil flushes performed..." required></textarea>
              </div>

              <!-- Add parts utilized -->
              <div class="col-12 border-top pt-3">
                <label class="form-label small fw-bold text-muted uppercase">Parts Replaced / Used</label>
                <div class="row g-2">
                  <div class="col-7">
                    <input type="text" v-model="newPartName" class="form-control form-control-sm" placeholder="Part description..." />
                  </div>
                  <div class="col-3">
                    <input type="number" v-model="newPartQty" class="form-control form-control-sm" min="1" />
                  </div>
                  <div class="col-2">
                    <button class="btn btn-sm btn-dark w-100" type="button" @click="addPart">Add</button>
                  </div>
                </div>
                <div class="d-flex flex-wrap gap-2 mt-2">
                  <span v-for="(p, idx) in formUpdate.parts_used" :key="idx" class="badge bg-secondary d-flex align-items-center gap-1 py-1.5 px-3 rounded font-monospace">
                    <span>{{ p.name }} (Qty: {{ p.qty }})</span>
                    <button type="button" class="btn-close btn-close-white" style="font-size: 8px;" @click="removePart(idx)"></button>
                  </span>
                </div>
              </div>

              <!-- General comments -->
              <div class="col-12">
                <label class="form-label small fw-bold text-muted uppercase">Supervisor Remarks</label>
                <input type="text" v-model="formUpdate.remarks" class="form-control" />
              </div>

              <!-- Checkbox controls -->
              <div class="col-12 border-top pt-3">
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="workCompleteCheck" v-model="formUpdate.work_completed">
                  <label class="form-check-label small fw-bold text-muted uppercase" for="workCompleteCheck">Repairs Finished (Complete)</label>
                </div>
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="testDriveCheck" v-model="formUpdate.test_drive_done">
                  <label class="form-check-label small fw-bold text-muted uppercase" for="testDriveCheck">Road Test / Test Drive Verified</label>
                </div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="qualityCheck" v-model="formUpdate.quality_check_done">
                  <label class="form-check-label small fw-bold text-muted uppercase" for="qualityCheck">Supervisor Quality Assurance Approved</label>
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary px-3" @click="showUpdateModal = false">Cancel</button>
            <button type="submit" class="btn btn-danger px-4" style="background-color: #d71920; border-color: #d71920;">Log Work</button>
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

.timeline-trail {
  border-left: 2px dashed var(--border-color);
  position: relative;
}

.trail-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -25px;
  z-index: 2;
}

.step-active {
  box-shadow: 0 0 8px rgba(215, 25, 32, 0.5);
}

.step-completed {
  background-color: #198754 !important;
}

.step-pending {
  background-color: var(--bg-body) !important;
  border-color: var(--border-color) !important;
}

.small-text {
  font-size: 10px;
}

.text-xxs {
  font-size: 11px;
}

.text-xxs span {
  font-size: 8px;
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
