<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { 
  CreditCard, Search, PlusCircle, Check, 
  User, DollarSign, Wallet, FileText, X
} from 'lucide-vue-next'

const invoices = ref<any[]>([])
const searchQuery = ref('')
const loading = ref(false)

const showPaymentModal = ref(false)
const selectedInvoice = ref<any | null>(null)
const formPayment = ref({
  amount: 0,
  payment_mode: 'Cash'
})

const fetchPendingInvoices = async () => {
  loading.value = true
  try {
    // Fetch all invoices. We will filter pending/partially paid in the UI or let user see all
    const res = await axios.get('/api/invoices')
    invoices.value = res.data
  } catch (err) {
    console.error('Failed to load invoices', err)
  } finally {
    loading.value = false
  }
}

// Filter invoices that have an outstanding balance due
const outstandingInvoices = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return invoices.value.filter(inv => {
    const isPending = inv.payment_status === 'Pending' || inv.payment_status === 'Partially Paid'
    const matchesSearch = inv.invoice_no.toLowerCase().includes(query) || 
                          inv.vehicle_reg_no.toLowerCase().includes(query) ||
                          inv.customer?.name.toLowerCase().includes(query) ||
                          inv.customer?.mobile.toLowerCase().includes(query)
    return isPending && matchesSearch
  })
})

const openPaymentModal = (invoice: any) => {
  selectedInvoice.value = invoice
  formPayment.value = {
    amount: parseFloat(invoice.balance_due),
    payment_mode: 'Cash'
  }
  showPaymentModal.value = true
}

const savePayment = async () => {
  if (!selectedInvoice.value) return
  if (formPayment.value.amount <= 0) {
    alert('Please enter a valid payment amount.')
    return
  }
  if (formPayment.value.amount > parseFloat(selectedInvoice.value.balance_due)) {
    alert('Payment amount cannot exceed the balance due.')
    return
  }
  
  try {
    await axios.post(`/api/invoices/${selectedInvoice.value.id}/payment`, formPayment.value)
    showPaymentModal.value = false
    fetchPendingInvoices()
  } catch (err: any) {
    alert(err.response?.data?.error || 'Failed to record payment.')
  }
}

onMounted(() => {
  fetchPendingInvoices()
})

const formatCurrency = (val: any) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(parseFloat(val))
}
</script>

<template>
  <div class="payments-container animate-fade-in">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="fw-bold mb-1">Accounts Outstanding Ledger</h3>
        <p class="text-muted small mb-0">Record customer cash/UPI collections, audit balances, and update receipts.</p>
      </div>
    </div>

    <!-- Stats summary bar -->
    <div class="row g-3 mb-4">
      <div class="col-12 col-md-4">
        <div class="card border-0 shadow-sm bg-glass p-3">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="text-muted text-uppercase small font-bold">Total Accounts Receivable</span>
              <h3 class="fw-bold text-danger mt-1 mb-0">
                {{ formatCurrency(invoices.reduce((acc, inv) => acc + (inv.payment_status !== 'Paid' ? parseFloat(inv.balance_due) : 0), 0)) }}
              </h3>
            </div>
            <div class="p-3 bg-danger bg-opacity-10 text-danger rounded-3">
              <Wallet :size="20" />
            </div>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="card border-0 shadow-sm bg-glass p-3">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <span class="text-muted text-uppercase small font-bold">Unpaid Vehicles</span>
              <h3 class="fw-bold text-warning mt-1 mb-0">
                {{ invoices.filter(inv => inv.payment_status !== 'Paid').length }}
              </h3>
            </div>
            <div class="p-3 bg-warning bg-opacity-10 text-warning rounded-3">
              <CreditCard :size="20" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Outstanding Invoices List -->
    <div class="card border-0 shadow-sm bg-glass">
      <div class="card-header border-0 bg-transparent pt-4 px-4 pb-0">
        <div class="row g-3 align-items-center justify-content-between">
          <div class="col-12 col-md-6">
            <h5 class="fw-bold m-0">Pending Invoice Payments</h5>
          </div>
          <div class="col-12 col-md-5">
            <div class="input-group">
              <span class="input-group-text bg-transparent border-end-0 text-muted">
                <Search :size="16" />
              </span>
              <input 
                type="text" 
                v-model="searchQuery" 
                class="form-control border-start-0 ps-1" 
                placeholder="Search by invoice, customer, registration..."
              />
            </div>
          </div>
        </div>
      </div>
      
      <div class="card-body p-0 mt-3">
        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-danger" role="status"></div>
        </div>
        <div v-else-if="outstandingInvoices.length === 0" class="text-center py-5 text-muted small">
          <Check :size="40" class="mb-2 text-success" />
          <p class="m-0">Outstanding ledger cleared! No pending balances.</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover mb-0">
            <thead>
              <tr class="text-uppercase small text-muted">
                <th class="ps-4">Invoice No</th>
                <th>Owner Details</th>
                <th>Reg No</th>
                <th>Bill Total</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
                <th class="text-end pe-4">Record Payment</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in outstandingInvoices" :key="inv.id">
                <td class="ps-4 fw-bold text-danger">{{ inv.invoice_no }}</td>
                <td>
                  <div class="fw-bold">{{ inv.customer?.name }}</div>
                  <span class="text-muted small">{{ inv.customer?.mobile }}</span>
                </td>
                <td class="fw-bold font-monospace">{{ inv.vehicle_reg_no }}</td>
                <td class="font-monospace">{{ formatCurrency(inv.grand_total) }}</td>
                <td class="font-monospace text-success">{{ formatCurrency(inv.paid_amount) }}</td>
                <td class="font-monospace text-danger fw-bold fs-6">{{ formatCurrency(inv.balance_due) }}</td>
                <td class="text-end pe-4">
                  <button class="btn btn-sm btn-danger px-3 rounded-2" @click="openPaymentModal(inv)">
                    Log Collection
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Log Payment Modal -->
    <div v-if="showPaymentModal" class="modal-backdrop bg-black bg-opacity-50 position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center">
      <div class="card border-0 shadow-lg bg-glass w-100 m-3 animate-zoom-in" style="max-width: 450px;">
        <div class="card-header border-0 bg-transparent pt-4 px-4 d-flex justify-content-between align-items-center">
          <h5 class="fw-bold m-0">Record Payment Collection</h5>
          <button class="btn btn-sm btn-outline-secondary border-0 btn-icon rounded-circle" @click="showPaymentModal = false">
            <X :size="18" />
          </button>
        </div>
        <form @submit.prevent="savePayment">
          <div class="card-body px-4 py-3" v-if="selectedInvoice">
            <div class="mb-3 small bg-light p-3 rounded">
              <div class="d-flex justify-content-between">
                <span>Invoice Number:</span>
                <strong class="font-monospace text-danger">{{ selectedInvoice.invoice_no }}</strong>
              </div>
              <div class="d-flex justify-content-between mt-1">
                <span>Registration No:</span>
                <strong class="font-monospace">{{ selectedInvoice.vehicle_reg_no }}</strong>
              </div>
              <div class="d-flex justify-content-between mt-1 pt-1 border-top">
                <span>Total Balance Due:</span>
                <strong class="text-danger">{{ formatCurrency(selectedInvoice.balance_due) }}</strong>
              </div>
            </div>
            
            <div class="mb-3">
              <label class="form-label small fw-bold text-muted uppercase">Collection Amount (₹)</label>
              <div class="input-group">
                <span class="input-group-text bg-transparent text-muted">₹</span>
                <input 
                  type="number" 
                  step="0.01" 
                  v-model="formPayment.amount" 
                  class="form-control font-monospace fw-bold fs-5 text-danger" 
                  :max="parseFloat(selectedInvoice.balance_due)"
                  required 
                />
              </div>
            </div>

            <div class="mb-3">
              <label class="form-label small fw-bold text-muted uppercase">Payment Channel</label>
              <select v-model="formPayment.payment_mode" class="form-select" required>
                <option value="Cash">💵 Cash</option>
                <option value="UPI">📱 UPI / PhonePay / GPay</option>
                <option value="Card">💳 Credit / Debit Card</option>
                <option value="NetBanking">🏦 Bank NEFT Transfer</option>
              </select>
            </div>
          </div>
          <div class="card-footer border-0 bg-transparent px-4 pb-4 pt-0 d-flex justify-content-end gap-2">
            <button type="button" class="btn btn-outline-secondary px-3" @click="showPaymentModal = false">Cancel</button>
            <button type="submit" class="btn btn-danger px-4" style="background-color: #d71920; border-color: #d71920;">Submit Collection</button>
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
