import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, X, CheckCircle2, DollarSign
} from 'lucide-react';

export default function Payments() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rangeFilter, setRangeFilter] = useState('month'); // today, week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Payment Recording Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('Cash');
  const [paymentError, setPaymentError] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = `/api/invoices?search=${search}&status=${statusFilter}&range=${rangeFilter}`;
      if (rangeFilter === 'custom') {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }
      const res = await axios.get(url);
      setInvoices(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter, rangeFilter, startDate, endDate]);

  const openPaymentModal = (inv: any) => {
    setSelectedInvoice(inv);
    setPayAmount(String(inv.balance_due || ''));
    setPayMode('Cash');
    setPaymentError('');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) {
      setPaymentError('Please enter a valid amount.');
      return;
    }
    setPaymentError('');

    try {
      await axios.post(`/api/invoices/${selectedInvoice.invoice_no}/payment`, {
        amount: parseFloat(payAmount),
        payment_mode: payMode
      });
      setShowPaymentModal(false);
      fetchInvoices();
    } catch (err: any) {
      setPaymentError(err.response?.data?.error || 'Failed to record transaction.');
    }
  };

  const payStatusColors: any = {
    'Paid': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Partially Paid': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Pending': 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      {/* Controls & Filters */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search invoice number, customer, registration, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl outline-none text-slate-200 text-sm transition-all"
          />
        </div>

        {/* Date and Status Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl outline-none text-slate-300 text-xs font-semibold"
          >
            <option value="">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Pending">Pending</option>
          </select>

          {/* Time range */}
          <select
            value={rangeFilter}
            onChange={(e) => setRangeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl outline-none text-slate-300 text-xs font-semibold"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {/* Custom Date Inputs */}
          {rangeFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono outline-none"
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs font-mono outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-xs font-bold uppercase tracking-wider">
                <th className="p-4">Invoice No.</th>
                <th className="p-4">Date</th>
                <th className="p-4">Customer & Vehicle</th>
                <th className="p-4 text-right">Invoice Sum</th>
                <th className="p-4 text-right">Balance Due</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Payment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {invoices.map((inv) => (
                <tr key={inv.invoice_no} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-100">{inv.invoice_no}</td>
                  <td className="p-4 font-mono text-xs text-slate-400">{inv.date}</td>
                  <td className="p-4">
                    <div>
                      <div className="font-semibold text-slate-200">{inv.customer_name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{inv.vehicle_reg_no} ({inv.vehicle_make} {inv.vehicle_model})</div>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono font-bold">₹{inv.grand_total.toFixed(2)}</td>
                  <td className="p-4 text-right font-mono font-bold text-red-500">₹{inv.balance_due.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded-md border ${payStatusColors[inv.payment_status]}`}>
                      {inv.payment_status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {inv.balance_due > 0 ? (
                      <button
                        onClick={() => openPaymentModal(inv)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md cursor-pointer"
                      >
                        Record Payment
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-500 font-bold flex items-center justify-end gap-1"><CheckCircle2 size={12} /> Paid</span>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No invoice records found matching current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Dialog */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950">
              <h4 className="font-bold text-slate-50 flex items-center gap-2">
                <DollarSign size={16} className="text-red-500" />
                <span>Process Payment</span>
              </h4>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {paymentError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">
                  {paymentError}
                </div>
              )}

              <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-1 text-xs text-slate-400">
                <div>Invoice Number: <strong className="text-slate-200 font-mono">{selectedInvoice.invoice_no}</strong></div>
                <div>Customer Name: <strong className="text-slate-200">{selectedInvoice.customer_name}</strong></div>
                <div>Total Bill: <strong className="text-slate-200 font-mono">₹{selectedInvoice.grand_total.toFixed(2)}</strong></div>
                <div>Balance Due: <strong className="text-red-500 font-mono">₹{selectedInvoice.balance_due.toFixed(2)}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={selectedInvoice.balance_due}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl text-slate-200 text-sm outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl text-slate-200 text-sm outline-none font-semibold"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (IMPS, NEFT)</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-600/15 cursor-pointer"
                >
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
