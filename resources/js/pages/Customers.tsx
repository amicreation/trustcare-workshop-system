import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Search, UserPlus, Edit2, Trash2, Phone, Mail, 
  MapPin, Eye, ChevronRight, X, Sparkles
} from 'lucide-react';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<any>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [alternateMobile, setAlternateMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('AHMEDABAD');
  const [state, setState] = useState('GUJARAT');
  const [pin, setPin] = useState('');
  const [gst, setGst] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/customers?search=${search}`);
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const loadProfile = async (id: number) => {
    try {
      setProfileLoading(true);
      setSelectedCustomerId(id);
      const res = await axios.get(`/api/customers/${id}`);
      setProfileData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentCustomer(null);
    setName('');
    setMobile('');
    setAlternateMobile('');
    setEmail('');
    setAddress1('');
    setAddress2('');
    setCity('AHMEDABAD');
    setState('GUJARAT');
    setPin('');
    setGst('');
    setNotes('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (cust: any) => {
    setCurrentCustomer(cust);
    setName(cust.name);
    setMobile(cust.mobile);
    setAlternateMobile(cust.alternate_mobile || '');
    setEmail(cust.email || '');
    setAddress1(cust.address_1 || '');
    setAddress2(cust.address_2 || '');
    setCity(cust.city || 'AHMEDABAD');
    setState(cust.state || 'GUJARAT');
    setPin(cust.pin || '');
    setGst(cust.gst || '');
    setNotes(cust.notes || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mobile) {
      setFormError('Customer Name and Mobile are required.');
      return;
    }
    setFormError('');

    const payload = {
      name, mobile, alternate_mobile: alternateMobile, email,
      address_1: address1, address_2: address2, city, state, pin, gst, notes
    };

    try {
      if (currentCustomer) {
        await axios.put(`/api/customers/${currentCustomer.id}`, payload);
      } else {
        await axios.post('/api/customers', payload);
      }
      setShowModal(false);
      fetchCustomers();
      if (selectedCustomerId && selectedCustomerId === currentCustomer?.id) {
        loadProfile(selectedCustomerId);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Save failed. Verify mobile uniqueness.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete customer? All history remains in DB records, but link will clear.')) return;
    try {
      await axios.delete(`/api/customers/${id}`);
      if (selectedCustomerId === id) setSelectedCustomerId(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left panel: List & Search */}
      <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by name, mobile, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl outline-none text-slate-200 text-sm transition-all focus:ring-2 focus:ring-red-600/10"
            />
          </div>
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/15"
          >
            <UserPlus size={16} />
            <span>Add Customer</span>
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
                  <th className="p-4">Customer Details</th>
                  <th className="p-4">City</th>
                  <th className="p-4">GST No.</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {customers.map((cust) => (
                  <tr 
                    key={cust.id} 
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${selectedCustomerId === cust.id ? 'bg-slate-800/60' : ''}`}
                    onClick={() => loadProfile(cust.id)}
                  >
                    <td className="p-4">
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          {cust.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex flex-col gap-0.5">
                          <span className="font-mono">Mob: {cust.mobile}</span>
                          {cust.email && <span>Email: {cust.email}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold">{cust.city}</td>
                    <td className="p-4 font-mono text-xs text-slate-400">{cust.gst || '—'}</td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => loadProfile(cust.id)}
                          className="p-2 bg-slate-950 border border-slate-800 hover:border-blue-500 hover:text-blue-400 text-slate-400 rounded-lg transition-all"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => openEditModal(cust)}
                          className="p-2 bg-slate-950 border border-slate-800 hover:border-red-600 hover:text-red-500 text-slate-400 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cust.id)}
                          className="p-2 bg-slate-950 border border-slate-800 hover:border-red-600 hover:text-red-500 text-slate-400 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No customer records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right panel: Profile CRM history details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">CUSTOMER PROFILE & CRM</h3>
        
        {!selectedCustomerId ? (
          <div className="h-64 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <Users size={32} className="mb-2 text-slate-700" />
            <span className="text-sm">Click the eye icon or a row to load full customer history and vehicles.</span>
          </div>
        ) : profileLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header profile info */}
            <div className="pb-4 border-b border-slate-800">
              <h4 className="text-lg font-black text-slate-50">{profileData?.customer?.name}</h4>
              <p className="text-xs text-red-500 font-bold mt-1 font-mono">ID: TCW-C-{profileData?.customer?.id}</p>
              
              <div className="mt-4 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2"><Phone size={12} className="text-slate-500" /><span className="font-mono">{profileData?.customer?.mobile}</span></div>
                {profileData?.customer?.alternate_mobile && <div className="flex items-center gap-2 pl-5 text-slate-400"><span className="font-mono">Alt: {profileData?.customer?.alternate_mobile}</span></div>}
                {profileData?.customer?.email && <div className="flex items-center gap-2"><Mail size={12} className="text-slate-500" /><span>{profileData?.customer?.email}</span></div>}
                <div className="flex items-start gap-2"><MapPin size={12} className="text-slate-500 mt-0.5" /><span>{profileData?.customer?.address_1}, {profileData?.customer?.address_2 ? `${profileData?.customer?.address_2}, ` : ''}{profileData?.customer?.city}, {profileData?.customer?.pin}</span></div>
              </div>
            </div>

            {/* Vehicles */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">REGISTERED VEHICLES</h5>
              <div className="space-y-2">
                {profileData?.vehicles?.map((veh: any) => (
                  <div key={veh.registration_no} className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-100 uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">{veh.registration_no}</span>
                      <p className="text-slate-400 mt-1.5">{veh.make} {veh.model} ({veh.year || '—'})</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-600" />
                  </div>
                ))}
                {profileData?.vehicles?.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-2">No vehicles linked.</p>
                )}
              </div>
            </div>

            {/* Invoices */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">INVOICE HISTORY</h5>
              <div className="space-y-2">
                {profileData?.invoices?.map((inv: any) => (
                  <div key={inv.invoice_no} className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-200">{inv.invoice_no}</span>
                      <p className="text-[10px] text-slate-500 mt-1 flex gap-2">
                        <span>{inv.date}</span>
                        <span className="font-mono text-slate-400">{inv.vehicle_reg_no}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-mono text-slate-200">₹{inv.grand_total.toFixed(2)}</span>
                      <span className={`block text-[9px] font-semibold mt-0.5 uppercase ${inv.payment_status === 'Paid' ? 'text-emerald-500' : 'text-amber-500'}`}>{inv.payment_status}</span>
                    </div>
                  </div>
                ))}
                {profileData?.invoices?.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-2">No invoice history available.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950">
              <h4 className="font-bold text-slate-50 flex items-center gap-2">
                <Sparkles size={16} className="text-red-500" />
                <span>{currentCustomer ? 'Edit Customer Details' : 'Add New Customer'}</span>
              </h4>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Alternate Mobile</label>
                  <input
                    type="text"
                    value={alternateMobile}
                    onChange={(e) => setAlternateMobile(e.target.value)}
                    placeholder="9876543211"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Address Line 1</label>
                <input
                  type="text"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder="Street / House details"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="AHMEDABAD"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="GUJARAT"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">PIN Code</label>
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="380060"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GST Number</label>
                  <input
                    type="text"
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    placeholder="24AAAAT0000A1Z1"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Private Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="VIP Customer, prefers Oil A..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  />
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
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
