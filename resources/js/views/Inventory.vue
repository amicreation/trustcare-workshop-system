<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { 
  Package, Search, PlusCircle, Edit, Trash2,
  TrendingUp, TrendingDown, ArrowDownUp, AlertTriangle, List, Plus, X
} from 'lucide-vue-next'

const authStore = useAuthStore()

const items = ref<any[]>([])
const categories = ref<any[]>([])
const transactionLogs = ref<any[]>([])

const activeTab = ref('items')
const searchQuery = ref('')
const selectedCategoryId = ref('')
const lowStockOnly = ref(false)

const loading = ref(false)
const listLoading = ref(false)

// Modals State
const showItemModal = ref(false)
const editItemMode = ref(false)
const formItem = ref({
  id: null as number | null,
  sku: '',
  name: '',
  category_id: '' as any,
  unit: 'Pcs',
  purchase_price: 0,
  selling_price: 0,
  gst_percent: 0,
  current_stock: 0,
  minimum_stock: 5
})

const showCategoryModal = ref(false)
const editCategoryMode = ref(false)
const formCategory = ref({
  id: null as number | null,
  name: '',
  description: ''
})

const showStockModal = ref(false)
const stockTransaction = ref({
  item_id: null as number | null,
  item_name: '',
  transaction_type: 'stock_in',
  quantity: 1,
  notes: ''
})

const fetchItems = async () => {
  listLoading.value = true
  try {
    const res = await axios.get('/api/inventory/items', {
      params: {
        search: searchQuery.value,
        category_id: selectedCategoryId.value,
        low_stock: lowStockOnly.value ? 'true' : 'false'
      }
    })
    items.value = res.data
  } catch (err) {
    console.error('Failed to load items', err)
  } finally {
    listLoading.value = false
  }
}

const fetchCategories = async () => {
  try {
    const res = await axios.get('/api/inventory/categories')
    categories.value = res.data
  } catch (err) {
    console.error('Failed to load categories', err)
  }
}

const fetchTransactions = async () => {
  try {
    const res = await axios.get('/api/inventory/transactions/log')
    transactionLogs.value = res.data
  } catch (err) {
    console.error('Failed to load transactions log', err)
  }
}

onMounted(() => {
  fetchItems()
  fetchCategories()
  fetchTransactions()
})

const changeTab = (tabName: string) => {
  activeTab.value = tabName
  if (tabName === 'items') {
    fetchItems()
  } else if (tabName === 'categories') {
    fetchCategories()
  } else if (tabName === 'logs') {
    fetchTransactions()
  }
}

// Item Actions
const openNewItemModal = () => {
  editItemMode.value = false
  formItem.value = {
    id: null,
    sku: '',
    name: '',
    category_id: categories.value[0]?.id || '',
    unit: 'Pcs',
    purchase_price: 0,
    selling_price: 0,
    gst_percent: 0,
    current_stock: 0,
    minimum_stock: 5
  }
  showItemModal.value = true
}

const openEditItemModal = (item: any) => {
  editItemMode.value = true
  formItem.value = { ...item }
  showItemModal.value = true
}

const saveItem = async () => {
  try {
    if (editItemMode.value && formItem.value.id) {
      await axios.put(`/api/inventory/items/${formItem.value.id}`, formItem.value)
    } else {
      await axios.post('/api/inventory/items', formItem.value)
    }
    showItemModal.value = false
    fetchItems()
    fetchTransactions()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to save item details.')
  }
}

// Delete Item Confirmation State
const showItemDeleteConfirmModal = ref(false)
const itemToDelete = ref<any | null>(null)
const deleteConfirmText = ref('')

const confirmDeleteItem = (item: any) => {
  itemToDelete.value = item
  deleteConfirmText.value = ''
  showItemDeleteConfirmModal.value = true
}

const executeDeleteItem = async () => {
  if (!itemToDelete.value) return
  if (deleteConfirmText.value !== itemToDelete.value.name) {
    alert('Confirmation text does not match the item name.')
    return
  }
  try {
    await axios.delete(`/api/inventory/items/${itemToDelete.value.id}`)
    showItemDeleteConfirmModal.value = false
    itemToDelete.value = null
    fetchItems()
    fetchTransactions()
    alert('Inventory item deleted successfully.')
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to delete item.')
  }
}

// Category Actions
const openNewCategoryModal = () => {
  editCategoryMode.value = false
  formCategory.value = {
    id: null,
    name: '',
    description: ''
  }
  showCategoryModal.value = true
}

const openEditCategoryModal = (cat: any) => {
  editCategoryMode.value = true
  formCategory.value = { ...cat }
  showCategoryModal.value = true
}

const saveCategory = async () => {
  try {
    if (editCategoryMode.value && formCategory.value.id) {
      await axios.put(`/api/inventory/categories/${formCategory.value.id}`, formCategory.value)
    } else {
      await axios.post('/api/inventory/categories', formCategory.value)
    }
    showCategoryModal.value = false
    fetchCategories()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to save category.')
  }
}

const deleteCategory = async (id: number) => {
  if (!authStore.isAdmin) {
    alert('Only administrators are allowed to delete categories.')
    return
  }
  if (!confirm('Are you sure you want to delete this category?')) return
  try {
    await axios.delete(`/api/inventory/categories/${id}`)
    fetchCategories()
    alert('Category deleted successfully.')
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to delete category.')
  }
}

// Stock Adjustment
const openStockModal = (item: any) => {
  stockTransaction.value = {
    item_id: item.id,
    item_name: item.name,
    transaction_type: 'stock_in',
    quantity: 1,
    notes: ''
  }
  showStockModal.value = true
}

const saveStockAdjustment = async () => {
  try {
    await axios.post('/api/inventory/transactions', stockTransaction.value)
    showStockModal.value = false
    fetchItems()
    fetchTransactions()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to update stock.')
  }
}
</script>

<template>
  <div class="inventory-container animate-fade-in">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-1">Inventory Management</h3>
        <p class="text-muted small mb-0">Monitor auto-parts stock, purchase values, alert limits, and audit logs.</p>
      </div>
      
      <!-- Quick Action buttons depending on active tab -->
      <div>
        <button v-if="activeTab === 'items'" class="btn btn-danger d-flex align-items-center gap-2 px-3 rounded-3" @click="openNewItemModal">
          <PlusCircle :size="16" />
          <span>Add Stock Item</span>
        </button>
        <button v-if="activeTab === 'categories'" class="btn btn-danger d-flex align-items-center gap-2 px-3 rounded-3" @click="openNewCategoryModal">
          <PlusCircle :size="16" />
          <span>New Category</span>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <ul class="nav nav-pills gap-2 border-bottom pb-3 mb-4" role="tablist">
      <li class="nav-item">
        <button 
          class="btn px-3 py-2 small fw-bold text-uppercase border-0 rounded-3"
          :class="activeTab === 'items' ? 'btn-danger bg-danger text-white' : 'btn-outline-secondary'"
          @click="changeTab('items')"
        >
          Stock Items List
        </button>
      </li>
      <li class="nav-item">
        <button 
          class="btn px-3 py-2 small fw-bold text-uppercase border-0 rounded-3"
          :class="activeTab === 'logs' ? 'btn-danger bg-danger text-white' : 'btn-outline-secondary'"
          @click="changeTab('logs')"
        >
          Stock Ledger / Audit Log
        </button>
      </li>
      <li class="nav-item">
        <button 
          class="btn px-3 py-2 small fw-bold text-uppercase border-0 rounded-3"
          :class="activeTab === 'categories' ? 'btn-danger bg-danger text-white' : 'btn-outline-secondary'"
          @click="changeTab('categories')"
        >
          Category Manager
        </button>
      </li>
    </ul>

    <!-- STOCK ITEMS TAB -->
    <div v-if="activeTab === 'items'" class="items-view">
      <!-- Filtering Options Row -->
      <div class="card border-0 shadow-sm bg-glass mb-4 p-3">
        <div class="row g-3 align-items-center">
          <div class="col-12 col-md-5">
            <div class="input-group">
              <span class="input-group-text bg-transparent border-end-0 text-muted">
                <Search :size="16" />
              </span>
              <input 
                type="text" 
                v-model="searchQuery" 
                class="form-control border-start-0 ps-1" 
                placeholder="Search by product name, SKU..."
                @input="fetchItems"
              />
            </div>
          </div>
          <div class="col-12 col-md-3">
            <select v-model="selectedCategoryId" class="form-select" @change="fetchItems">
              <option value="">All Categories</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div class="col-12 col-md-4">
            <div class="form-check form-switch m-0 pt-1">
              <input class="form-check-input" type="checkbox" id="lowStockSwitch" v-model="lowStockOnly" @change="fetchItems">
              <label class="form-check-label fw-bold small text-muted text-uppercase" for="lowStockSwitch">Show Low Stock Only</label>
            </div>
          </div>
        </div>
      </div>

      <!-- Items Grid / Table -->
      <div class="card border-0 shadow-sm bg-glass">
        <div class="card-body p-0">
          <div v-if="listLoading" class="text-center py-5">
            <div class="spinner-border text-danger" role="status"></div>
          </div>
          <div v-else-if="items.length === 0" class="text-center py-5 text-muted small">
            <Package :size="40" class="mb-2 text-muted" />
            <p class="m-0">No inventory products registered matching this criteria.</p>
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr class="text-uppercase small text-muted">
                  <th class="ps-4">SKU</th>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Purchase / Sale</th>
                  <th>Current Stock</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item.id">
                  <td class="ps-4 font-monospace fw-bold">{{ item.sku }}</td>
                  <td>
                    <div class="fw-bold">{{ item.name }}</div>
                    <span class="text-muted small">Unit: {{ item.unit }}</span>
                  </td>
                  <td>{{ item.category?.name || 'N/A' }}</td>
                  <td>
                    <div>Purchase: ₹{{ parseFloat(item.purchase_price).toFixed(2) }}</div>
                    <div class="text-danger fw-bold">Sale: ₹{{ parseFloat(item.selling_price).toFixed(2) }}</div>
                  </td>
                  <td>
                    <div class="d-flex align-items-center gap-2">
                      <span class="fw-bold fs-5" :class="item.current_stock <= item.minimum_stock ? 'text-danger' : 'text-success'">
                        {{ item.current_stock }}
                      </span>
                      <span v-if="item.current_stock <= item.minimum_stock" class="badge bg-danger bg-opacity-10 text-danger px-2 py-1 small rounded d-inline-flex align-items-center gap-1">
                        <AlertTriangle :size="10" />
                        <span>Low (Min: {{ item.minimum_stock }})</span>
                      </span>
                    </div>
                  </td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-danger me-2" @click="openStockModal(item)" title="Adjust Stock">
                      <ArrowDownUp :size="14" class="me-1" /> Stock
                    </button>
                    <button class="btn btn-sm btn-outline-secondary me-2 btn-icon" @click="openEditItemModal(item)" title="Edit">
                      <Edit :size="14" />
                    </button>
                    <button v-if="authStore.isAdmin" class="btn btn-sm btn-outline-danger btn-icon" @click="confirmDeleteItem(item)" title="Delete">
                      <Trash2 :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- STOCK LEDGER TAB -->
    <div v-if="activeTab === 'logs'" class="logs-view animate-fade-in">
      <div class="card border-0 shadow-sm bg-glass">
        <div class="card-header border-0 bg-transparent pt-4 px-4 pb-0">
          <h5 class="fw-bold m-0 d-flex align-items-center gap-2">
            <List :size="18" class="text-danger" />
            <span>Audit Logs & Stock Transaction Ledger</span>
          </h5>
        </div>
        <div class="card-body p-0 mt-3">
          <div v-if="transactionLogs.length === 0" class="text-center py-5 text-muted small">
            <ArrowDownUp :size="40" class="mb-2 text-muted" />
            <p class="m-0">No historical stock movements registered in the ledger.</p>
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr class="text-uppercase small text-muted">
                  <th class="ps-4">Timestamp</th>
                  <th>Item SKU & Name</th>
                  <th>Type</th>
                  <th>Qty Change</th>
                  <th>User Authorized</th>
                  <th class="pe-4">Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in transactionLogs" :key="log.id">
                  <td class="ps-4 text-muted small">{{ new Date(log.created_at).toLocaleString() }}</td>
                  <td>
                    <div class="fw-bold">{{ log.item?.name || 'N/A' }}</div>
                    <span class="text-muted small font-monospace">{{ log.item?.sku }}</span>
                  </td>
                  <td>
                    <span class="badge" :class="{
                      'bg-success': log.transaction_type === 'stock_in',
                      'bg-danger': log.transaction_type === 'stock_out',
                      'bg-info text-dark': log.transaction_type === 'adjustment'
                    }">
                      {{ log.transaction_type === 'stock_in' ? 'STOCK ADDITION' : log.transaction_type === 'stock_out' ? 'STOCK REDUCTION' : 'ADJUSTMENT' }}
                    </span>
                  </td>
                  <td class="fw-bold" :class="log.quantity > 0 ? 'text-success' : 'text-danger'">
                    {{ log.quantity > 0 ? `+${log.quantity}` : log.quantity }}
                  </td>
                  <td>{{ log.user?.name || 'System' }}</td>
                  <td class="text-muted pe-4 small">{{ log.notes || 'None' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- CATEGORIES TAB -->
    <div v-if="activeTab === 'categories'" class="categories-view animate-fade-in">
      <div class="card border-0 shadow-sm bg-glass">
        <div class="card-body p-0">
          <div v-if="categories.length === 0" class="text-center py-5 text-muted small">
            <List :size="40" class="mb-2 text-muted" />
            <p class="m-0">No inventory categories created.</p>
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr class="text-uppercase small text-muted">
                  <th class="ps-4">Category Name</th>
                  <th>Description</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cat in categories" :key="cat.id">
                  <td class="ps-4 fw-bold">{{ cat.name }}</td>
                  <td>{{ cat.description || 'No description provided.' }}</td>
                  <td class="text-end pe-4">
                    <button class="btn btn-sm btn-outline-secondary me-2 btn-icon" @click="openEditCategoryModal(cat)" title="Edit">
                      <Edit :size="14" />
                    </button>
                    <button v-if="authStore.isAdmin" class="btn btn-sm btn-outline-danger btn-icon" @click="deleteCategory(cat.id)" title="Delete">
                      <Trash2 :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit/New Item Modal -->
    <div v-if="showItemModal" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
      <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 600px;">
        <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold m-0">{{ editItemMode ? 'Edit Stock Item' : 'Register New Item' }}</h5>
          <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="showItemModal = false">
            <X :size="18" />
          </button>
        </div>
        <form @submit.prevent="saveItem">
          <div class="card-body px-4 py-3" style="max-height: 70vh; overflow-y: auto;">
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">SKU / Item Code</label>
                <input type="text" v-model="formItem.sku" class="form-control font-monospace" placeholder="e.g. FIL-OIL-01" required />
              </div>
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-muted uppercase">Category</label>
                <select v-model="formItem.category_id" class="form-select" required>
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label small fw-bold text-muted uppercase">Item Name</label>
                <input type="text" v-model="formItem.name" class="form-control" placeholder="e.g. Synthetic Engine Oil 5W30" required />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Unit Measure</label>
                <input type="text" v-model="formItem.unit" class="form-control" placeholder="e.g. Litre, Pcs, Set" required />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Purchase Price (₹)</label>
                <input type="number" step="0.01" v-model="formItem.purchase_price" class="form-control" required />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Selling Price (₹)</label>
                <input type="number" step="0.01" v-model="formItem.selling_price" class="form-control" required />
              </div>

              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Current Stock</label>
                <input type="number" v-model="formItem.current_stock" class="form-control" :disabled="editItemMode" required />
              </div>
              <div class="col-12 col-md-4">
                <label class="form-label small fw-bold text-muted uppercase">Minimum Stock Alert</label>
                <input type="number" v-model="formItem.minimum_stock" class="form-control" required />
              </div>
            </div>
          </div>
          <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary px-3" @click="showItemModal = false">Cancel</button>
            <button type="submit" class="btn btn-danger px-4" style="background-color: #d71920; border-color: #d71920;">Save Changes</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Category Modal -->
    <div v-if="showCategoryModal" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
      <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 500px;">
        <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold m-0">{{ editCategoryMode ? 'Edit Category' : 'New Category' }}</h5>
          <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="showCategoryModal = false">
            <X :size="18" />
          </button>
        </div>
        <form @submit.prevent="saveCategory">
          <div class="card-body px-4 py-3">
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted uppercase">Category Name</label>
              <input type="text" v-model="formCategory.name" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted uppercase">Description</label>
              <textarea v-model="formCategory.description" class="form-control" rows="3"></textarea>
            </div>
          </div>
          <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary px-3" @click="showCategoryModal = false">Cancel</button>
            <button type="submit" class="btn btn-danger px-4" style="background-color: #d71920; border-color: #d71920;">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Stock Adjustment Modal -->
    <div v-if="showStockModal" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
      <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 500px;">
        <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold m-0">Adjust Stock Level</h5>
          <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="showStockModal = false">
            <X :size="18" />
          </button>
        </div>
        <form @submit.prevent="saveStockAdjustment">
          <div class="card-body px-4 py-3">
            <div class="mb-3 small">
              <span class="text-muted uppercase font-bold d-block">Item Name</span>
              <span class="fs-6 fw-bold text-danger">{{ stockTransaction.item_name }}</span>
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted uppercase">Transaction Type</label>
              <select v-model="stockTransaction.transaction_type" class="form-select" required>
                <option value="stock_in">STOCK ADDITION (Stock In)</option>
                <option value="stock_out">STOCK REDUCTION (Stock Out)</option>
                <option value="adjustment">FORCE SET QUANTITY (Adjustment)</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted uppercase">Quantity</label>
              <input type="number" v-model="stockTransaction.quantity" class="form-control font-monospace" min="0" required />
            </div>
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted uppercase">Transaction Notes</label>
              <textarea v-model="stockTransaction.notes" class="form-control" rows="2" placeholder="Describe reasons (e.g. Purchase Invoice No, Damaged stock correction...)" required></textarea>
            </div>
          </div>
          <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary px-3" @click="showStockModal = false">Cancel</button>
            <button type="submit" class="btn btn-danger px-4" style="background-color: #d71920; border-color: #d71920;">Log Transaction</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showItemDeleteConfirmModal" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
      <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 450px;">
        <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold m-0 text-danger">Confirm Item Deletion</h5>
          <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="showItemDeleteConfirmModal = false">
            <X :size="18" />
          </button>
        </div>
        <div class="card-body px-4 py-3">
          <p class="small text-muted mb-3">
            Are you sure you want to delete inventory item <strong class="text-danger">{{ itemToDelete?.name }}</strong>? 
            This action is permanent and cannot be undone.
          </p>
          <div class="mb-3">
            <label class="form-label small-label fw-bold text-muted uppercase">To confirm, type the item name: <strong class="text-danger select-all">{{ itemToDelete?.name }}</strong></label>
            <input 
              type="text" 
              v-model="deleteConfirmText" 
              class="form-control text-center font-monospace" 
              :placeholder="itemToDelete?.name"
              required 
            />
          </div>
        </div>
        <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-outline-secondary px-3" @click="showItemDeleteConfirmModal = false">Cancel</button>
          <button 
            type="button" 
            class="btn btn-danger px-4" 
            :disabled="deleteConfirmText !== itemToDelete?.name"
            @click="executeDeleteItem"
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

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
