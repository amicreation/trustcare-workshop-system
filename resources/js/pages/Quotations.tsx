import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Plus, Edit2, Trash2, X, Sparkles, ArrowRight
} from 'lucide-react';

export default function Quotations() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<any>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mobileLookup, setMobileLookup] = useState('');
  const [customerData, setCustomerData] = useState<any>(null);
  const [vehiclesList, setVehiclesList] = useState<any[]>([]);
  const [selectedVehicleReg, setSelectedVehicleReg] = useState('');
  const [items, setItems] = useState<any[]>([{ type: 'Part', description: '', qty: 1, rate: 0, tax: 0, amount: 0 }]);
  const [discount, setDiscount] = useState('0');
  const [status, setStatus] = useState('Draft');
  
  const [formError, setFormError] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/quotations?search=${search}`);
      setQuotations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchQuotations();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Trigger mobile auto-lookup
  useEffect(() => {
    if (mobileLookup.length === 10) {
      const lookup = async () => {
        try {
          setLookupMessage('Looking up mobile...');
          const res = await axios.get(`/api/customers/lookup/${mobileLookup}`);
          setCustomerData(res.data.customer);
          setVehiclesList(res.data.vehicles || []);
          setLookupMessage('✓ Customer found!');
          if (res.data.vehicles.length > 0) {
            setSelectedVehicleReg(res.data.vehicles[0].registration_no);
          }
        } catch (err) {
          setCustomerData(null);
          setVehiclesList([]);
          setSelectedVehicleReg('');
          setLookupMessage('✗ Customer not found.');
        }
      };
      lookup();
    } else {
      setLookupMessage('');
    }
  }, [mobileLookup]);

  const openAddModal = () => {
    setCurrentQuote(null);
    setDate(new Date().toISOString().split('T')[0]);
    setMobileLookup('');
    setCustomerData(null);
    setVehiclesList([]);
    setSelectedVehicleReg('');
    setItems([{ type: 'Part', description: '', qty: 1, rate: 0, tax: 0, amount: 0 }]);
    setDiscount('0');
    setStatus('Draft');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (q: any) => {
    setCurrentQuote(q);
    setDate(q.date);
    setMobileLookup(q.customer_mobile || '');
    setCustomerData({
      id: q.customer_id,
      name: q.customer_name,
      mobile: q.customer_mobile
    });
    setVehiclesList([{
      registration_no: q.vehicle_reg_no,
      make: q.vehicle_make,
      model: q.vehicle_model
    }]);
    setSelectedVehicleReg(q.vehicle_reg_no);
    setItems(q.items || []);
    setDiscount(String(q.discount || '0'));
    setStatus(q.status || 'Draft');
    setFormError('');
    setShowModal(true);
  };

  const handleAddItem = () => {
    setItems([...items, { type: 'Part', description: '', qty: 1, rate: 0, tax: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index][field] = value;
    
    // Auto-calculate row amount
    if (field === 'qty' || field === 'rate' || field === 'tax') {
      const qty = parseFloat(updated[index].qty) || 0;
      const rate = parseFloat(updated[index].rate) || 0;
      const tax = parseFloat(updated[index].tax) || 0;
      const base = qty * rate;
      updated[index].amount = base + (base * tax) / 100;
    }
    setItems(updated);
  };

  const calculateTotals = () => {
    let parts_total = 0;
    let labour_total = 0;
    let gst_total = 0;

    items.forEach((item) => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const tax = parseFloat(item.tax) || 0;
      const base = qty * rate;
      const taxVal = (base * tax) / 100;

      if (item.type === 'Part') {
        parts_total += base;
      } else {
        labour_total += base;
      }
      gst_total += taxVal;
    });

    const disc = parseFloat(discount) || 0;
    const grand_total = parts_total + labour_total + gst_total - disc;

    return { parts_total, labour_total, gst_total, grand_total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData?.id) {
      setFormError('Must assign a valid customer (lookup by mobile).');
      return;
    }
    if (!selectedVehicleReg) {
      setFormError('Must link a vehicle.');
      return;
    }
    setFormError('');

    const { parts_total, labour_total, gst_total, grand_total } = calculateTotals();

    const payload = {
      date, customer_id: customerData.id, vehicle_reg_no: selectedVehicleReg,
      items, parts_total, labour_total, gst_total, discount: parseFloat(discount) || 0,
      grand_total, status
    };

    try {
      if (currentQuote) {
        await axios.put(`/api/quotations/${currentQuote.quotation_no}`, payload);
      } else {
        await axios.post('/api/quotations', payload);
      }
      setShowModal(false);
      fetchQuotations();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Save failed. Verify inputs.');
    }
  };

  const handleConvertInvoice = async (quoteId: string) => {
    if (!window.confirm('Convert this quotation to an active invoice? This updates quote status to "Invoiced".')) return;
    try {
      const res = await axios.post(`/api/quotations/${quoteId}/convert`);
      alert(`Quote successfully converted to Invoice: ${res.data.invoice_no}`);
      fetchQuotations();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to convert to invoice.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete quotation?')) return;
    try {
      await axios.delete(`/api/quotations/${id}`);
      fetchQuotations();
    } catch (err) {
      console.error(err);
    }
  };

  const { parts_total, labour_total, gst_total, grand_total } = calculateTotals();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search quotation number, vehicle, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl outline-none text-slate-200 text-sm transition-all"
          />
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/15 shrink-0"
        >
          <Plus size={16} />
          <span>New Quotation</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-xs font-bold uppercase tracking-wider">
                <th className="p-4">Quotation No.</th>
                <th className="p-4">Customer & Vehicle</th>
                <th className="p-4">Grand Total</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
              {quotations.map((q) => (
                <tr key={q.quotation_no} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-4 font-mono font-bold text-slate-100">{q.quotation_no}</td>
                  <td className="p-4">
                    <div>
                      <div className="font-semibold text-slate-200">{q.customer_name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{q.vehicle_reg_no} ({q.vehicle_make} {q.vehicle_model})</div>
                    </div>
                  </td>
                  <td className="p-4 font-mono font-bold">₹{(q.grand_total || 0).toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded-md border
                      ${q.status === 'Invoiced' 
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/25' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/25'}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {q.status !== 'Invoiced' && (
                        <button
                          onClick={() => handleConvertInvoice(q.quotation_no)}
                          title="Convert to Active Invoice"
                          className="px-2.5 py-1.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/20 hover:border-red-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <ArrowRight size={12} />
                          <span>Convert to Invoice</span>
                        </button>
                      )}
                      <button 
                        onClick={() => openEditModal(q)}
                        className="p-2 bg-slate-950 border border-slate-850 hover:border-red-600 hover:text-red-500 text-slate-400 rounded-lg transition-all"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={() => handleDelete(q.quotation_no)}
                        className="p-2 bg-slate-950 border border-slate-850 hover:border-red-600 hover:text-red-500 text-slate-400 rounded-lg transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {quotations.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No quotation estimates created.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Draft Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950">
              <h4 className="font-bold text-slate-50 flex items-center gap-2">
                <Sparkles size={16} className="text-red-500" />
                <span>{currentQuote ? 'Edit Quotation Details' : 'Generate Estimate / Quotation'}</span>
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {formError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">
                  {formError}
                </div>
              )}

              {/* Autocomplete customer lookup */}
              {!currentQuote && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Search Customer by Mobile</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={mobileLookup}
                      onChange={(e) => setMobileLookup(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-red-600 rounded-xl text-slate-200 text-sm outline-none font-mono"
                    />
                    {lookupMessage && (
                      <span className={`text-xs block font-semibold ${lookupMessage.startsWith('✓') ? 'text-emerald-500' : 'text-red-500'}`}>
                        {lookupMessage}
                      </span>
                    )}
                  </div>
                  {customerData && (
                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl text-xs space-y-2 text-slate-300">
                      <div><strong>Customer Name:</strong> {customerData.name}</div>
                      <div><strong>Contact:</strong> <span className="font-mono">{customerData.mobile}</span></div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estimate Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Linked Vehicle</label>
                  <select
                    required
                    value={selectedVehicleReg}
                    onChange={(e) => setSelectedVehicleReg(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none uppercase font-mono"
                  >
                    <option value="">-- Select Linked Vehicle --</option>
                    {vehiclesList.map((v) => (
                      <option key={v.registration_no} value={v.registration_no}>
                        {v.registration_no} ({v.make} {v.model})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Invoiced">Invoiced</option>
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Line Items (Parts & Labour)</span>
                
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-950 p-4 border border-slate-850 rounded-xl">
                      <div className="col-span-12 sm:col-span-2">
                        <select
                          value={item.type}
                          onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                          className="w-full px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs outline-none"
                        >
                          <option value="Part">Part</option>
                          <option value="Labour">Labour</option>
                        </select>
                      </div>
                      
                      <div className="col-span-12 sm:col-span-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Description (e.g. Engine Oil, Brake Pads)"
                          className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs outline-none focus:border-red-600"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-1">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                          placeholder="Qty"
                          className="w-full px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs outline-none font-mono text-center"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          placeholder="Rate"
                          className="w-full px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs outline-none font-mono text-right"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-1">
                        <input
                          type="number"
                          value={item.tax}
                          onChange={(e) => handleItemChange(index, 'tax', e.target.value)}
                          placeholder="Tax %"
                          className="w-full px-2 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs outline-none font-mono text-center"
                        />
                      </div>

                      <div className="col-span-2 text-right font-mono text-xs font-semibold text-slate-200">
                        ₹{(item.amount || 0).toFixed(2)}
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          disabled={items.length === 1}
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 hover:text-red-500 text-slate-500 disabled:opacity-30"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Totals Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Discount Apply (₹)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    className="w-48 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                  />
                </div>

                <div className="bg-slate-950 border border-slate-850 p-5 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between text-slate-400"><span>Parts Subtotal:</span><span className="font-mono">₹{parts_total.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-400"><span>Labour Subtotal:</span><span className="font-mono">₹{labour_total.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-400"><span>GST Aggregates:</span><span className="font-mono">₹{gst_total.toFixed(2)}</span></div>
                  <div className="flex justify-between text-slate-400 border-b border-slate-850 pb-2"><span>Discount Applied:</span><span className="font-mono text-red-500">-₹{(parseFloat(discount) || 0).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-sm text-slate-100 pt-1"><span>Estimated Grand Total:</span><span className="font-mono text-red-500">₹{grand_total.toFixed(2)}</span></div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950 -mx-6 -mb-6 p-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-600/15 cursor-pointer"
                >
                  Save Estimate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
