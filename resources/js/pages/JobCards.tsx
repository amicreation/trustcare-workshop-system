import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Plus, Edit2, Trash2, X, Sparkles
} from 'lucide-react';

export default function JobCards() {
  const [jobCards, setJobCards] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentJc, setCurrentJc] = useState<any>(null);

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mobileLookup, setMobileLookup] = useState('');
  const [customerData, setCustomerData] = useState<any>(null);
  const [vehiclesList, setVehiclesList] = useState<any[]>([]);
  const [selectedVehicleReg, setSelectedVehicleReg] = useState('');
  const [kmReading, setKmReading] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [advisorName, setAdvisorName] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [jcStatus, setJcStatus] = useState('Received');
  
  // Complaints checklist
  const presetComplaints = ['Noise', 'Brake Issue', 'AC Issue', 'Electrical Issue', 'Engine Issue'];
  const [selectedPresetComplaints, setSelectedPresetComplaints] = useState<string[]>([]);
  const [customComplaints, setCustomComplaints] = useState<string[]>([]);
  const [newCustomComplaint, setNewCustomComplaint] = useState('');
  const [formError, setFormError] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');

  const fetchJobCards = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/jobcards?search=${search}&status=${statusFilter}`);
      setJobCards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchJobCards();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  // Trigger mobile auto-lookup (Auto-detect existing customer)
  useEffect(() => {
    if (mobileLookup.length === 10) {
      const lookup = async () => {
        try {
          setLookupMessage('Looking up mobile...');
          const res = await axios.get(`/api/customers/lookup/${mobileLookup}`);
          setCustomerData(res.data.customer);
          setVehiclesList(res.data.vehicles || []);
          setLookupMessage('✓ Customer found! Loaded vehicles.');
          if (res.data.vehicles.length > 0) {
            setSelectedVehicleReg(res.data.vehicles[0].registration_no);
          }
        } catch (err) {
          setCustomerData(null);
          setVehiclesList([]);
          setSelectedVehicleReg('');
          setLookupMessage('✗ No customer found for this mobile number.');
        }
      };
      lookup();
    } else {
      setLookupMessage('');
    }
  }, [mobileLookup]);

  const openAddModal = () => {
    setCurrentJc(null);
    setDate(new Date().toISOString().split('T')[0]);
    setMobileLookup('');
    setCustomerData(null);
    setVehiclesList([]);
    setSelectedVehicleReg('');
    setKmReading('');
    setExpectedDelivery('');
    setAdvisorName('');
    setTechnicianName('');
    setJcStatus('Received');
    setSelectedPresetComplaints([]);
    setCustomComplaints([]);
    setNewCustomComplaint('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (jc: any) => {
    setCurrentJc(jc);
    setDate(jc.date);
    setMobileLookup(jc.customer_mobile || '');
    setCustomerData({
      id: jc.customer_id,
      name: jc.customer_name,
      mobile: jc.customer_mobile
    });
    setVehiclesList([{
      registration_no: jc.vehicle_reg_no,
      make: jc.vehicle_make,
      model: jc.vehicle_model
    }]);
    setSelectedVehicleReg(jc.vehicle_reg_no);
    setKmReading(String(jc.km_reading || ''));
    setExpectedDelivery(jc.expected_delivery || '');
    setAdvisorName(jc.advisor_name || '');
    setTechnicianName(jc.technician_name || '');
    setJcStatus(jc.status || 'Received');
    
    // Split complaints into preset vs custom
    const complaints: string[] = jc.complaints || [];
    const presets = complaints.filter(c => presetComplaints.includes(c));
    const customs = complaints.filter(c => !presetComplaints.includes(c));
    
    setSelectedPresetComplaints(presets);
    setCustomComplaints(customs);
    setFormError('');
    setShowModal(true);
  };

  const handleTogglePreset = (comp: string) => {
    if (selectedPresetComplaints.includes(comp)) {
      setSelectedPresetComplaints(selectedPresetComplaints.filter(c => c !== comp));
    } else {
      setSelectedPresetComplaints([...selectedPresetComplaints, comp]);
    }
  };

  const handleAddCustom = () => {
    if (newCustomComplaint.trim()) {
      setCustomComplaints([...customComplaints, newCustomComplaint.trim()]);
      setNewCustomComplaint('');
    }
  };

  const handleRemoveCustom = (index: number) => {
    setCustomComplaints(customComplaints.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData?.id) {
      setFormError('Must assign a valid customer (lookup by mobile).');
      return;
    }
    if (!selectedVehicleReg) {
      setFormError('Must select or link a vehicle.');
      return;
    }
    setFormError('');

    const finalComplaints = [...selectedPresetComplaints, ...customComplaints];

    const payload = {
      date, customer_id: customerData.id, vehicle_reg_no: selectedVehicleReg,
      km_reading: kmReading ? parseInt(kmReading) : 0,
      complaints: finalComplaints, expected_delivery: expectedDelivery,
      advisor_name: advisorName, technician_name: technicianName, status: jcStatus
    };

    try {
      if (currentJc) {
        await axios.put(`/api/jobcards/${currentJc.job_card_no}`, payload);
      } else {
        await axios.post('/api/jobcards', payload);
      }
      setShowModal(false);
      fetchJobCards();
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Save failed. Verify parameters.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete job card?')) return;
    try {
      await axios.delete(`/api/jobcards/${id}`);
      fetchJobCards();
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatusDirect = async (jcId: string, nextStatus: string) => {
    try {
      await axios.put(`/api/jobcards/${jcId}`, { status: nextStatus });
      fetchJobCards();
    } catch (err) {
      console.error(err);
    }
  };

  const statusColors: any = {
    'Received': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'Under Inspection': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Under Repair': 'bg-red-500/10 text-red-500 border-red-500/20',
    'Waiting Parts': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'Ready For Delivery': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Delivered': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search JC number, registration, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl outline-none text-slate-200 text-sm transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl outline-none text-slate-300 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="Received">Received</option>
            <option value="Under Inspection">Under Inspection</option>
            <option value="Under Repair">Under Repair</option>
            <option value="Waiting Parts">Waiting Parts</option>
            <option value="Ready For Delivery">Ready For Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        {/* Add trigger */}
        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/15 shrink-0"
        >
          <Plus size={16} />
          <span>New Job Card</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobCards.map((jc) => (
            <div key={jc.job_card_no} className="bg-slate-950 border border-slate-850 hover:border-slate-700 transition-all rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-slate-200">{jc.job_card_no}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{jc.date}</span>
                </div>
                
                <div className="mt-4">
                  <span className="font-mono font-bold text-xs uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-slate-200">{jc.vehicle_reg_no}</span>
                  <h4 className="text-sm font-bold text-slate-200 mt-2">{jc.vehicle_make} {jc.model}</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Owner: {jc.customer_name}</p>
                </div>

                <div className="mt-4 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Complaints:</span>
                  <div className="flex flex-wrap gap-1">
                    {jc.complaints?.map((comp: string, i: number) => (
                      <span key={i} className="text-[9px] px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-400 rounded-md font-semibold">{comp}</span>
                    ))}
                    {(!jc.complaints || jc.complaints.length === 0) && (
                      <span className="text-[10px] text-slate-600 italic">No complaints reported.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-semibold">Status:</span>
                  <span className={`text-[10px] px-2 py-0.5 font-bold uppercase rounded-md border ${statusColors[jc.status]}`}>
                    {jc.status}
                  </span>
                </div>
                
                {/* Status Switcher & Actions */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex-1">
                    <select
                      value={jc.status}
                      onChange={(e) => updateStatusDirect(jc.job_card_no, e.target.value)}
                      className="w-full text-[11px] px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 outline-none"
                    >
                      <option value="Received">Received</option>
                      <option value="Under Inspection">Under Inspection</option>
                      <option value="Under Repair">Under Repair</option>
                      <option value="Waiting Parts">Waiting Parts</option>
                      <option value="Ready For Delivery">Ready For Delivery</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditModal(jc)}
                      className="p-2 bg-slate-900 border border-slate-800 hover:border-red-600 hover:text-red-500 text-slate-400 rounded-lg transition-all"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => handleDelete(jc.job_card_no)}
                      className="p-2 bg-slate-900 border border-slate-800 hover:border-red-600 hover:text-red-500 text-slate-400 rounded-lg transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {jobCards.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No job cards found. Create one by clicking "New Job Card".
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-950">
              <h4 className="font-bold text-slate-50 flex items-center gap-2">
                <Sparkles size={16} className="text-red-500" />
                <span>{currentJc ? 'Edit Job Card' : 'Create Workshop Job Card'}</span>
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

              {/* Mobile Lookup Autoprefill */}
              {!currentJc && (
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Auto-detect Customer (Enter Mobile)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={mobileLookup}
                    onChange={(e) => setMobileLookup(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-red-600 rounded-xl text-slate-200 text-sm outline-none font-mono"
                  />
                  {lookupMessage && (
                    <span className={`text-xs block font-semibold ${lookupMessage.startsWith('✓') ? 'text-emerald-500' : lookupMessage.startsWith('✗') ? 'text-red-500' : 'text-slate-400'}`}>
                      {lookupMessage}
                    </span>
                  )}
                </div>
              )}

              {customerData && (
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl text-xs space-y-1.5 text-slate-300">
                  <div><strong>Customer:</strong> {customerData.name}</div>
                  <div><strong>Mobile:</strong> <span className="font-mono">{customerData.mobile}</span></div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Card Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Vehicle</label>
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
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current KM Reading</label>
                  <input
                    type="number"
                    value={kmReading}
                    onChange={(e) => setKmReading(e.target.value)}
                    placeholder="35000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Service Advisor</label>
                  <input
                    type="text"
                    value={advisorName}
                    onChange={(e) => setAdvisorName(e.target.value)}
                    placeholder="Advisor Name"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Technician Name</label>
                  <input
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="Technician Assignment"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  />
                </div>
              </div>

              {/* Complaints checklist */}
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Complaints</span>
                <div className="flex flex-wrap gap-2">
                  {presetComplaints.map((comp) => {
                    const isSelected = selectedPresetComplaints.includes(comp);
                    return (
                      <button
                        type="button"
                        key={comp}
                        onClick={() => handleTogglePreset(comp)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer
                          ${isSelected 
                            ? 'bg-red-600 text-white border-red-600 shadow-md' 
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'}`}
                      >
                        {comp}
                      </button>
                    );
                  })}
                </div>
                
                {/* Custom Complaints List */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCustomComplaint}
                      onChange={(e) => setNewCustomComplaint(e.target.value)}
                      placeholder="Add custom complaint..."
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl text-slate-200 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustom}
                      className="px-3.5 py-2 bg-slate-950 border border-slate-800 text-slate-200 hover:bg-slate-800 rounded-xl text-sm font-semibold transition-all"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {customComplaints.map((comp, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600/10 border border-red-600/20 text-red-500 rounded-lg text-xs font-semibold">
                        <span>{comp}</span>
                        <button type="button" onClick={() => handleRemoveCustom(idx)} className="hover:text-red-300">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {currentJc && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Card Status</label>
                  <select
                    value={jcStatus}
                    onChange={(e) => setJcStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  >
                    <option value="Received">Received</option>
                    <option value="Under Inspection">Under Inspection</option>
                    <option value="Under Repair">Under Repair</option>
                    <option value="Waiting Parts">Waiting Parts</option>
                    <option value="Ready For Delivery">Ready For Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              )}

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
                  Save Job Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
