import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Car, Search, Plus, Edit2, Trash2, X, Sparkles, Shield, User, Gauge, Eye
} from 'lucide-react';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<any>(null);
  const [selectedVehicleReg, setSelectedVehicleReg] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states
  const [registrationNo, setRegistrationNo] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [chassisNo, setChassisNo] = useState('');
  const [engineNo, setEngineNo] = useState('');
  const [color, setColor] = useState('');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [policyExpiry, setPolicyExpiry] = useState('');
  const [currentKm, setCurrentKm] = useState('');
  const [formError, setFormError] = useState('');

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/vehicles?search=${search}`);
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchVehicles();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const loadHistory = async (reg: string) => {
    try {
      setHistoryLoading(true);
      setSelectedVehicleReg(reg);
      const res = await axios.get(`/api/vehicles/${encodeURIComponent(reg)}`);
      setHistoryData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openAddModal = () => {
    setCurrentVehicle(null);
    setRegistrationNo('');
    setCustomerId('');
    setMake('');
    setModel('');
    setYear('');
    setFuelType('Petrol');
    setChassisNo('');
    setEngineNo('');
    setColor('');
    setInsuranceCompany('');
    setPolicyNumber('');
    setPolicyExpiry('');
    setCurrentKm('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (veh: any) => {
    setCurrentVehicle(veh);
    setRegistrationNo(veh.registration_no);
    setCustomerId(veh.customer_id || '');
    setMake(veh.make || '');
    setModel(veh.model || '');
    setYear(veh.year ? String(veh.year) : '');
    setFuelType(veh.fuel_type || 'Petrol');
    setChassisNo(veh.chassis_no || '');
    setEngineNo(veh.engine_no || '');
    setColor(veh.color || '');
    setInsuranceCompany(veh.insurance_company || '');
    setPolicyNumber(veh.policy_number || '');
    setPolicyExpiry(veh.policy_expiry || '');
    setCurrentKm(veh.current_km ? String(veh.current_km) : '');
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNo || !customerId) {
      setFormError('Registration Number and Customer assignment are required.');
      return;
    }
    setFormError('');

    const payload = {
      registration_no: registrationNo, customer_id: parseInt(customerId),
      make, model, year: year ? parseInt(year) : null, fuel_type: fuelType,
      chassis_no: chassisNo, engine_no: engineNo, color,
      insurance_company: insuranceCompany, policy_number: policyNumber,
      policy_expiry: policyExpiry, current_km: currentKm ? parseInt(currentKm) : 0
    };

    try {
      if (currentVehicle) {
        await axios.put(`/api/vehicles/${encodeURIComponent(currentVehicle.registration_no)}`, payload);
      } else {
        await axios.post('/api/vehicles', payload);
      }
      setShowModal(false);
      fetchVehicles();
      if (selectedVehicleReg === registrationNo) {
        loadHistory(registrationNo);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Save failed. Verify unique registration number.');
    }
  };

  const handleDelete = async (reg: string) => {
    if (!window.confirm('Delete vehicle record? Links to past service history will be cleared.')) return;
    try {
      await axios.delete(`/api/vehicles/${encodeURIComponent(reg)}`);
      if (selectedVehicleReg === reg) setSelectedVehicleReg(null);
      fetchVehicles();
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
              placeholder="Search by vehicle reg, make, client name, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl outline-none text-slate-200 text-sm transition-all focus:ring-2 focus:ring-red-600/10"
            />
          </div>
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/15"
          >
            <Plus size={16} />
            <span>Add Vehicle</span>
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
                  <th className="p-4">Reg No.</th>
                  <th className="p-4">Make / Model</th>
                  <th className="p-4">Customer Details</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {vehicles.map((veh) => (
                  <tr 
                    key={veh.registration_no} 
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${selectedVehicleReg === veh.registration_no ? 'bg-slate-800/60' : ''}`}
                    onClick={() => loadHistory(veh.registration_no)}
                  >
                    <td className="p-4 font-mono font-bold text-slate-100 uppercase">{veh.registration_no}</td>
                    <td className="p-4">{veh.make} {veh.model} {veh.year ? `(${veh.year})` : ''}</td>
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-slate-200">{veh.customer_name}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{veh.customer_mobile}</div>
                      </div>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => loadHistory(veh.registration_no)}
                          className="p-2 bg-slate-950 border border-slate-800 hover:border-blue-500 hover:text-blue-400 text-slate-400 rounded-lg transition-all"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => openEditModal(veh)}
                          className="p-2 bg-slate-950 border border-slate-800 hover:border-red-600 hover:text-red-500 text-slate-400 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(veh.registration_no)}
                          className="p-2 bg-slate-950 border border-slate-800 hover:border-red-600 hover:text-red-500 text-slate-400 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No vehicle records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right panel: Timeline service history */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">VEHICLE REPAIR LOG & HISTORY</h3>
        
        {!selectedVehicleReg ? (
          <div className="h-64 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            <Car size={32} className="mb-2 text-slate-700" />
            <span className="text-sm">Click a vehicle row or details eye to load service history.</span>
          </div>
        ) : historyLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header info */}
            <div className="pb-4 border-b border-slate-800">
              <span className="font-mono font-black text-slate-50 uppercase text-lg">{historyData?.vehicle?.registration_no}</span>
              <h4 className="text-sm font-bold text-red-500 mt-1">{historyData?.vehicle?.make} {historyData?.vehicle?.model}</h4>
              
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="flex items-center gap-1.5"><User size={12} className="text-slate-500" /><span className="truncate">{historyData?.vehicle?.customer_name}</span></div>
                <div className="flex items-center gap-1.5"><Gauge size={12} className="text-slate-500" /><span className="font-mono">{historyData?.vehicle?.current_km?.toLocaleString()} KMS</span></div>
                {historyData?.vehicle?.engine_no && <div className="col-span-2 text-[10px] text-slate-400 font-mono">Engine No: {historyData?.vehicle?.engine_no}</div>}
                {historyData?.vehicle?.chassis_no && <div className="col-span-2 text-[10px] text-slate-400 font-mono">VIN/Chassis: {historyData?.vehicle?.chassis_no}</div>}
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">SERVICE HISTORY TIMELINE</h5>
              <div className="relative border-l border-slate-800 pl-4 ml-2 space-y-6 text-xs">
                {historyData?.invoices?.map((inv: any) => {
                  const items = JSON.parse(inv.items || '[]');
                  return (
                    <div key={inv.invoice_no} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-red-600 border border-slate-900 flex items-center justify-center font-bold text-[7px] text-white">I</span>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{inv.invoice_no}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{inv.date}</span>
                        </div>
                        <p className="text-slate-400 font-semibold">{inv.service_type || 'General Repair'}</p>
                        <div className="text-[10px] text-slate-500 space-y-0.5">
                          {items.slice(0, 3).map((it: any, index: number) => (
                            <div key={index} className="truncate">• {it.description} (Qty: {it.qty})</div>
                          ))}
                          {items.length > 3 && <div>and {items.length - 3} more items...</div>}
                        </div>
                        <div className="pt-1 flex items-center justify-between font-mono font-bold text-[10px] text-red-400">
                          <span>Total Bill:</span>
                          <span>₹{inv.grand_total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {historyData?.jobCards?.map((jc: any) => (
                  <div key={jc.job_card_no} className="relative">
                    <span className="absolute -left-[21px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-600 border border-slate-900 flex items-center justify-center font-bold text-[7px] text-white">J</span>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-300">{jc.job_card_no}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{jc.date}</span>
                      </div>
                      <p className="text-slate-400 font-semibold">Job Card Created</p>
                      <div className="text-[10px] text-slate-500">
                        Status: <span className="font-bold text-slate-400 uppercase">{jc.status}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {(!historyData?.invoices || historyData.invoices.length === 0) && 
                 (!historyData?.jobCards || historyData.jobCards.length === 0) && (
                  <p className="text-slate-500 py-4 text-center">No service history records found for this vehicle.</p>
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
                <span>{currentVehicle ? 'Edit Vehicle Info' : 'Register New Vehicle'}</span>
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
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Registration Number *</label>
                  <input
                    type="text"
                    required
                    disabled={!!currentVehicle} // Reg no is key
                    value={registrationNo}
                    onChange={(e) => setRegistrationNo(e.target.value)}
                    placeholder="GJ01AB1234"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Assign Customer *</label>
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Make / Brand</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Maruti Suzuki, Hyundai, Honda..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Swift, Creta, City..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2020"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fuel Type</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="EV">EV (Electric)</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Chassis Number (VIN)</label>
                  <input
                    type="text"
                    value={chassisNo}
                    onChange={(e) => setChassisNo(e.target.value)}
                    placeholder="17-digit chassis code"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Engine Number</label>
                  <input
                    type="text"
                    value={engineNo}
                    onChange={(e) => setEngineNo(e.target.value)}
                    placeholder="Engine code"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="White, Silver..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-4">
                <span className="text-xs font-bold text-red-500 uppercase flex items-center gap-1.5"><Shield size={14} /> Insurance Information</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Insurance Co</label>
                    <input
                      type="text"
                      value={insuranceCompany}
                      onChange={(e) => setInsuranceCompany(e.target.value)}
                      placeholder="ICICI Lombard..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Policy Number</label>
                    <input
                      type="text"
                      value={policyNumber}
                      onChange={(e) => setPolicyNumber(e.target.value)}
                      placeholder="Policy No"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Policy Expiry</label>
                    <input
                      type="date"
                      value={policyExpiry}
                      onChange={(e) => setPolicyExpiry(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current KM Reading</label>
                <input
                  type="number"
                  value={currentKm}
                  onChange={(e) => setCurrentKm(e.target.value)}
                  placeholder="34500"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:border-red-600 outline-none font-mono"
                />
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
