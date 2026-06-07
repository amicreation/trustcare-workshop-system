import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSettings } from '../App';
import { 
  Printer, FileText, Save, Plus, Trash2, Search, Eye, PlusCircle, RefreshCw, X
} from 'lucide-react';

export default function Invoices() {
  const { settings } = useSettings();
  const printAreaRef = useRef<HTMLDivElement>(null);

  // States
  const [invoiceList, setInvoiceList] = useState<any[]>([]);
  const [showInvoiceSelector, setShowInvoiceSelector] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Invoice field states
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [inwardDate, setInwardDate] = useState(new Date().toISOString().split('T')[0]);
  const [serviceType, setServiceType] = useState('General Service');
  
  // Customer states
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [city, setCity] = useState('AHMEDABAD');
  const [customerMob, setCustomerMob] = useState('');
  const [email, setEmail] = useState('');
  const [residence, setResidence] = useState('');
  
  // Vehicle states
  const [vehicleRegNo, setVehicleRegNo] = useState('');
  const [makeAndModel, setMakeAndModel] = useState('');
  const [chassisNo, setChassisNo] = useState('');
  const [engineNo, setEngineNo] = useState('');
  const [kms, setKms] = useState('');
  const [insuranceCo, setInsuranceCo] = useState('');

  // Items table state
  // Schema: { type: 'Part'|'Labour', description: '', qty: 1, rate: 0, tax: 0, amount: 0 }
  const [items, setItems] = useState<any[]>([
    { type: 'Part', description: '', qty: 1, rate: 0, cost: 0, tax: 0, amount: 0 }
  ]);
  const [discount, setDiscount] = useState('');

  // Lookup helper states
  const [mobileLookup, setMobileLookup] = useState('');
  const [vehicleLookup, setVehicleLookup] = useState('');
  const [lookupMessage, setLookupMessage] = useState('');

  // Preset services list for suggestions
  const presetServices = [
    "Engine Oil Change", "Oil Filter", "Air Filter", "Coolant", 
    "Brake Pad", "Brake Oil", "Wheel Alignment", "Wheel Balancing", 
    "AC Service", "Washing", "Denting", "Painting", "Labour Charges"
  ];

  // Helper keyword lists to auto-classify items
  const partKeywords = ["filter", "oil", "coolant", "pad", "plug", "tyre", "part", "fluid", "battery", "wiper"];
  const labourKeywords = ["labour", "service", "alignment", "balancing", "washing", "denting", "painting", "charges", "fitting", "repair"];

  const fetchInvoiceList = async () => {
    try {
      const res = await axios.get('/api/invoices');
      setInvoiceList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const generateNewInvoiceNo = async () => {
    try {
      const year = new Date().getFullYear();
      const prefix = `TCW-${year}-`;
      const res = await axios.get('/api/invoices');
      const nextNum = res.data.length + 1;
      setInvoiceNo(`${prefix}${String(nextNum).padStart(4, '0')}`);
    } catch (err) {
      console.error(err);
      setInvoiceNo(`TCW-${new Date().getFullYear()}-0001`);
    }
  };

  useEffect(() => {
    generateNewInvoiceNo();
    fetchInvoiceList();
  }, []);

  // Trigger auto-classify on description change
  const autoClassifyType = (desc: string) => {
    const val = desc.toLowerCase().trim();
    if (!val) return null;
    
    // Check keywords
    const isPart = partKeywords.some(kw => val.includes(kw));
    const isLabour = labourKeywords.some(kw => val.includes(kw));
    
    if (isPart && !isLabour) return 'Part';
    if (isLabour && !isPart) return 'Labour';
    return null;
  };

  const handleMobileLookup = async () => {
    if (!mobileLookup) return;
    try {
      setLookupMessage('Searching mobile...');
      const res = await axios.get(`/api/customers/lookup/${mobileLookup}`);
      const { customer, vehicles } = res.data;
      
      setCustomerName(customer.name);
      setCustomerAddress(`${customer.address_1 || ''} ${customer.address_2 || ''}`.trim());
      setCity(customer.city || 'AHMEDABAD');
      setCustomerMob(customer.mobile);
      setEmail(customer.email || '');
      
      if (vehicles && vehicles.length > 0) {
        const v = vehicles[0];
        setVehicleRegNo(v.registration_no);
        setMakeAndModel(`${v.make || ''} ${v.model || ''}`.trim());
        setChassisNo(v.chassis_no || '');
        setEngineNo(v.engine_no || '');
        setKms(v.current_km ? String(v.current_km) : '');
        setInsuranceCo(v.insurance_company || '');
      }
      setLookupMessage('✓ Customer details loaded!');
    } catch (err) {
      setLookupMessage('✗ Customer mobile not found.');
    }
  };

  const handleVehicleLookup = async () => {
    if (!vehicleLookup) return;
    try {
      setLookupMessage('Searching registration...');
      const res = await axios.get(`/api/vehicles/${encodeURIComponent(vehicleLookup)}`);
      const { vehicle } = res.data;
      
      setVehicleRegNo(vehicle.registration_no);
      setMakeAndModel(`${vehicle.make || ''} ${vehicle.model || ''}`.trim());
      setChassisNo(vehicle.chassis_no || '');
      setEngineNo(vehicle.engine_no || '');
      setKms(vehicle.current_km ? String(vehicle.current_km) : '');
      setInsuranceCo(vehicle.insurance_company || '');
      
      setCustomerName(vehicle.customer_name);
      setCustomerMob(vehicle.customer_mobile);
      setCustomerAddress(vehicle.address_1 || '');
      setCity(vehicle.city || 'AHMEDABAD');
      setEmail(vehicle.customer_email || '');
      setLookupMessage('✓ Vehicle and owner loaded!');
    } catch (err) {
      setLookupMessage('✗ Vehicle registration not found.');
    }
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
    
    // Auto classify type if description changed
    if (field === 'description') {
      const typeSug = autoClassifyType(value);
      if (typeSug) updated[index].type = typeSug;
    }

    // Recalculate row amount
    if (field === 'qty' || field === 'rate' || field === 'tax' || field === 'cost' || field === 'description') {
      const qty = parseFloat(updated[index].qty) || 0;
      const rate = parseFloat(updated[index].rate) || 0;
      const tax = parseFloat(updated[index].tax) || 0;
      const base = qty * rate;
      updated[index].amount = base + (base * tax) / 100;
    }
    setItems(updated);
  };

  const loadSavedInvoice = async (invNo: string) => {
    try {
      const res = await axios.get(`/api/invoices/${invNo}`);
      const inv = res.data;
      
      setInvoiceNo(inv.invoice_no);
      setInvoiceDate(inv.date);
      setInwardDate(inv.inward_date || inv.date);
      setServiceType(inv.service_type || 'General Service');
      
      setCustomerName(inv.customer_name || '');
      setCustomerAddress(inv.address_1 || '');
      setCity(inv.city || 'AHMEDABAD');
      setCustomerMob(inv.customer_mobile || '');
      setEmail(inv.customer_email || '');
      setResidence(inv.residence || '');
      
      setVehicleRegNo(inv.vehicle_reg_no || '');
      setMakeAndModel(inv.vehicle_make && inv.vehicle_model ? `${inv.vehicle_make} ${inv.vehicle_model}` : '');
      setChassisNo(inv.chassis_no || '');
      setEngineNo(inv.engine_no || '');
      setKms(inv.km_reading ? String(inv.km_reading) : '');
      setInsuranceCo(inv.vehicle_insurance || '');
      
      setItems(inv.items || []);
      setDiscount(inv.discount ? String(inv.discount) : '');
      
      setShowInvoiceSelector(false);
    } catch (err) {
      console.error(err);
      alert('Failed to load invoice details.');
    }
  };

  const handleNewInvoice = () => {
    generateNewInvoiceNo();
    setCustomerName('');
    setCustomerAddress('');
    setCity('AHMEDABAD');
    setCustomerMob('');
    setEmail('');
    setResidence('');
    setVehicleRegNo('');
    setMakeAndModel('');
    setChassisNo('');
    setEngineNo('');
    setKms('');
    setInsuranceCo('');
    setItems([{ type: 'Part', description: '', qty: 1, rate: 0, cost: 0, tax: 0, amount: 0 }]);
    setDiscount('');
    setMobileLookup('');
    setVehicleLookup('');
    setLookupMessage('');
  };

  // Calculations
  let partsTotal = 0;
  let labourTotal = 0;
  let gstTotal = 0;

  items.forEach((item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const tax = parseFloat(item.tax) || 0;
    const base = qty * rate;
    const taxv = (base * tax) / 100;
    
    if (item.type === 'Part') {
      partsTotal += base;
    } else {
      labourTotal += base;
    }
    gstTotal += taxv;
  });

  const disc = parseFloat(discount) || 0;
  const grandTotal = partsTotal + labourTotal + gstTotal - disc;

  // Owner calculations
  const totalCost = items.reduce((sum, item) => sum + ((parseFloat(item.qty) || 0) * (parseFloat(item.cost) || 0)), 0);
  const overallProfit = grandTotal - totalCost;
  const profitMargin = grandTotal > 0 ? (overallProfit / grandTotal) * 100 : 0;

  const handleSaveInvoice = async () => {
    if (!customerName || !customerMob || !vehicleRegNo) {
      alert('Please fill customer details and vehicle registration.');
      return;
    }

    try {
      // First save customer and vehicle automatically in DB if they don't exist
      let custId = null;
      try {
        const custRes = await axios.post('/api/customers', {
          name: customerName,
          mobile: customerMob,
          address_1: customerAddress,
          city,
          email
        });
        custId = custRes.data.id;
      } catch (err) {
        // Customer probably exists, retrieve it
        const custRes = await axios.get(`/api/customers/lookup/${customerMob}`);
        custId = custRes.data.customer.id;
      }

      // Save vehicle
      try {
        await axios.post('/api/vehicles', {
          registration_no: vehicleRegNo,
          customer_id: custId,
          make: makeAndModel.split(' ')[0] || '',
          model: makeAndModel.split(' ').slice(1).join(' ') || '',
          chassis_no: chassisNo,
          engine_no: engineNo,
          current_km: kms ? parseInt(kms) : 0,
          insurance_company: insuranceCo
        });
      } catch (err) {
        // Vehicle probably exists, update its km
        await axios.put(`/api/vehicles/${encodeURIComponent(vehicleRegNo)}`, {
          customer_id: custId,
          make: makeAndModel.split(' ')[0] || '',
          model: makeAndModel.split(' ').slice(1).join(' ') || '',
          chassis_no: chassisNo,
          engine_no: engineNo,
          current_km: kms ? parseInt(kms) : 0,
          insurance_company: insuranceCo
        });
      }

      // Save invoice
      const payload = {
        date: invoiceDate,
        inward_date: inwardDate,
        service_type: serviceType,
        customer_id: custId,
        vehicle_reg_no: vehicleRegNo,
        km_reading: kms ? parseInt(kms) : 0,
        items,
        parts_total: partsTotal,
        labour_total: labourTotal,
        gst_total: gstTotal,
        discount: disc,
        grand_total: grandTotal,
        residence,
        notes: ''
      };

      await axios.post('/api/invoices', payload);
      alert('Invoice saved successfully to database.');
      fetchInvoiceList();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save invoice.');
    }
  };

  const handleExportPDF = () => {
    const element = printAreaRef.current;
    if (!element) return;
    
    const filename = `${invoiceNo || 'Invoice'}_${vehicleRegNo || 'Vehicle'}.pdf`;
    const options = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: false, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(options).from(element).save();
    } else {
      alert('PDF generation library is loading, please try again in a moment.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Floating Toolbar Settings Console (Hidden on Print) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 noprint text-slate-800 dark:text-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleNewInvoice}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <PlusCircle size={14} className="text-red-500" />
            <span>New Invoice</span>
          </button>
          
          <button 
            onClick={() => setShowInvoiceSelector(!showInvoiceSelector)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RefreshCw size={14} className="text-blue-500 animate-spin-hover" />
            <span>Saved Invoices ({invoiceList.length})</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-4 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all
              ${previewMode 
                ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/10' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'}`}
          >
            <Eye size={14} />
            <span>{previewMode ? 'Exit Preview' : 'Preview Mode'}</span>
          </button>

          <button 
            onClick={handleSaveInvoice}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Save size={14} className="text-emerald-500" />
            <span>Save Invoice</span>
          </button>

          <button 
            onClick={handleExportPDF}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <FileText size={14} className="text-red-500" />
            <span>Export PDF</span>
          </button>

          <button 
            onClick={() => window.print()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-red-600/10"
          >
            <Printer size={14} />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* Database prefill lookups widget console (Hidden on Print/Preview) */}
      {!previewMode && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 noprint text-slate-800 dark:text-slate-200">
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Prefill Customer (Enter Mobile)</span>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={10}
                placeholder="Mobile number"
                value={mobileLookup}
                onChange={(e) => setMobileLookup(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none"
              />
              <button 
                type="button" 
                onClick={handleMobileLookup}
                className="px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <Search size={12} /> Lookup
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 rounded-xl space-y-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Prefill Vehicle (Enter Reg No)</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Registration number"
                value={vehicleLookup}
                onChange={(e) => setVehicleLookup(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs outline-none uppercase font-mono"
              />
              <button 
                type="button" 
                onClick={handleVehicleLookup}
                className="px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <Search size={12} /> Lookup
              </button>
            </div>
          </div>

          {lookupMessage && (
            <div className="col-span-full text-xs font-semibold px-4 text-emerald-500 -mt-2">
              {lookupMessage}
            </div>
          )}
        </div>
      )}

      {/* Saved Invoices Side Drawer (collapsible drawer list) */}
      {showInvoiceSelector && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end noprint">
          <div className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-850 h-full p-6 flex flex-col justify-between text-slate-800 dark:text-slate-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <h4 className="font-bold text-slate-800 dark:text-slate-50">Saved Invoices</h4>
                <button onClick={() => setShowInvoiceSelector(false)} className="text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-100">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
                {invoiceList.map((inv) => (
                  <div 
                    key={inv.invoice_no} 
                    onClick={() => loadSavedInvoice(inv.invoice_no)}
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 hover:border-red-600/50 rounded-xl cursor-pointer transition-all space-y-1 text-xs"
                  >
                    <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                      <span>{inv.invoice_no}</span>
                      <span className="font-mono">₹{inv.grand_total.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{inv.vehicle_reg_no}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{inv.customer_name}</div>
                  </div>
                ))}
                {invoiceList.length === 0 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 text-center block pt-8">No saved invoices found.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* centered Live A4 Paper preview Sheet */}
      <div className="overflow-auto pb-12">
        <div 
          ref={printAreaRef}
          className={`invoice-container ${previewMode ? 'previewMode' : ''}`} 
          id="invoice"
        >
          {/* Header block */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-red-600">
            <div className="flex items-center gap-4">
              {settings?.logo ? (
                <img id="logo" src={settings.logo} alt="Logo" className="w-16 h-16 object-contain border border-slate-200 p-1" />
              ) : (
                <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center text-slate-400 text-[10px] text-center p-1 noprint">
                  Logo
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight text-red-600 leading-none">{settings?.workshop_name || 'TRUST CARE WORKSHOP'}</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{settings?.tagline || 'Driven by Trust, Powered by Skill'}</p>
                <p className="text-[10px] text-slate-600 mt-1">{settings?.address || 'Near Vaishnodevi Circle, Ahmedabad'}</p>
                <p className="text-[10px] text-slate-600 font-mono">{settings?.mobile || '8200695660 | 9512660711'}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-lg font-black text-red-600 uppercase tracking-wider block leading-none">INVOICE</span>
              <span className="text-xs font-mono font-bold text-slate-800 block mt-1">NO: {invoiceNo}</span>
            </div>
          </div>

          {/* Restructured Metadata 2-column table matching screenshot */}
          <table className="meta-table">
            <tbody>
              <tr>
                <td style={{ width: '60%' }}>
                  <div className="flex items-center">
                    <span className="field-label mr-2">Name:</span>
                    <input 
                      type="text" 
                      value={customerName} 
                      onChange={(e) => setCustomerName(e.target.value)} 
                      placeholder="Customer Name"
                      disabled={previewMode}
                    />
                  </div>
                </td>
                <td style={{ width: '40%' }}>
                  <div className="flex items-center justify-between">
                    <span className="field-label">INWARD DATE:</span>
                    <input 
                      type="date" 
                      value={inwardDate} 
                      onChange={(e) => setInwardDate(e.target.value)} 
                      disabled={previewMode}
                      className="font-mono text-right w-36"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td rowSpan={2} className="align-top">
                  <div className="flex flex-col h-full">
                    <span className="field-label">Address :</span>
                    <textarea 
                      value={customerAddress} 
                      onChange={(e) => setCustomerAddress(e.target.value)} 
                      placeholder="Customer Address"
                      rows={2}
                      disabled={previewMode}
                      className="flex-1 mt-1 text-[11px]"
                    />
                  </div>
                </td>
                <td>
                  <div className="flex items-center justify-between">
                    <span className="field-label">INVOICE DATE:</span>
                    <input 
                      type="date" 
                      value={invoiceDate} 
                      onChange={(e) => setInvoiceDate(e.target.value)} 
                      disabled={previewMode}
                      className="font-mono text-right w-36"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <div className="flex items-center">
                    <span className="field-label mr-2">KMS.</span>
                    <input 
                      type="number" 
                      value={kms} 
                      onChange={(e) => setKms(e.target.value)} 
                      placeholder="KM Reading"
                      disabled={previewMode}
                      className="font-mono"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <div className="flex items-center">
                    <span className="field-label mr-2">Contact :</span>
                    <span className="field-label mr-2">Mob:</span>
                    <input 
                      type="text" 
                      value={customerMob} 
                      onChange={(e) => setCustomerMob(e.target.value)} 
                      placeholder="Mobile number"
                      disabled={previewMode}
                      className="font-mono"
                    />
                  </div>
                </td>
                <td>
                  <div className="flex items-center">
                    <span className="field-label mr-2">SERVICE TYPE:</span>
                    <input 
                      type="text" 
                      value={serviceType} 
                      onChange={(e) => setServiceType(e.target.value)} 
                      placeholder="Service Type"
                      disabled={previewMode}
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td>
                  <div className="flex items-center">
                    <span className="field-label mr-2">Email :</span>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="Customer Email Address"
                      disabled={previewMode}
                    />
                  </div>
                </td>
                <td>
                  <div className="flex items-center">
                    <span className="field-label mr-2">Residence:</span>
                    <input 
                      type="text" 
                      value={residence} 
                      onChange={(e) => setResidence(e.target.value)} 
                      placeholder="Residence No"
                      disabled={previewMode}
                      className="font-mono"
                    />
                  </div>
                </td>
              </tr>

              {/* Separator line */}
              <tr className="bg-black"><td colSpan={2} style={{ height: '3px', padding: 0 }}></td></tr>

              {/* Vehicle Section */}
              <tr>
                <td colSpan={2}>
                  <div className="flex items-center">
                    <span className="field-label mr-2">Vehicle Registration No.</span>
                    <input 
                      type="text" 
                      value={vehicleRegNo} 
                      onChange={(e) => setVehicleRegNo(e.target.value)} 
                      placeholder="Registration Number"
                      disabled={previewMode}
                      className="font-mono uppercase font-bold text-red-600"
                    />
                  </div>
                </td>
              </tr>

              <tr>
                <td colSpan={2}>
                  <div className="flex items-center">
                    <span className="field-label mr-2">Make & Model:</span>
                    <input 
                      type="text" 
                      value={makeAndModel} 
                      onChange={(e) => setMakeAndModel(e.target.value)} 
                      placeholder="Vehicle Make & Model"
                      disabled={previewMode}
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Datalist for autocomplete */}
          <datalist id="services">
            {presetServices.map((val) => (
              <option key={val} value={val} />
            ))}
          </datalist>

          {/* Services & Parts Table */}
          <table className="services-table" id="tbl">
            <thead>
              <tr>
                {/* Column 0: Hidden select cell */}
                <th style={{ display: 'none' }}>Type</th>
                <th>Description</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Rate</th>
                <th style={{ width: '140px', textAlign: 'right' }}>Amount</th>
                <th className="noprint action-cell" style={{ width: '50px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  {/* Column 0: Hidden select */}
                  <td style={{ display: 'none' }}>
                    <select 
                      value={item.type} 
                      onChange={(e) => handleItemChange(index, 'type', e.target.value)}
                    >
                      <option>Part</option>
                      <option>Labour</option>
                      <option>Service</option>
                    </select>
                  </td>
                  
                  <td>
                    <div className="flex flex-col">
                      <input 
                        list="services" 
                        placeholder="Description of work or part"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        disabled={previewMode}
                      />
                      {/* Low-profile inline classification switch & Cost input (Hidden on print/preview) */}
                      {!previewMode && (
                        <div className="flex items-center gap-3 mt-1.5 noprint">
                          <div className="type-pills">
                            <span 
                              onClick={() => handleItemChange(index, 'type', 'Part')}
                              className={`type-pill ${item.type === 'Part' ? 'active' : ''}`}
                            >
                              Part
                            </span>
                            <span 
                              onClick={() => handleItemChange(index, 'type', 'Labour')}
                              className={`type-pill ${item.type !== 'Part' ? 'active' : ''}`}
                            >
                              Labour
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <span>Cost:</span>
                            <input 
                              type="number" 
                              placeholder="Cost"
                              value={item.cost || ''}
                              onChange={(e) => handleItemChange(index, 'cost', e.target.value)}
                              className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-200 text-[10px] outline-none"
                              style={{ color: '#000', border: '1px solid #cbd5e1', padding: '1px 4px', width: '60px' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="number" 
                      value={item.qty}
                      onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                      disabled={previewMode}
                      style={{ textAlign: 'center' }}
                      className="font-mono"
                    />
                  </td>
                  
                  <td style={{ textAlign: 'right' }}>
                    <input 
                      type="number" 
                      value={item.rate || ''}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      placeholder="Rate"
                      disabled={previewMode}
                      style={{ textAlign: 'right' }}
                      className="font-mono"
                    />
                  </td>
                  
                  <td className="amt font-mono" style={{ textAlign: 'right', fontWeight: 700 }}>
                    ₹{(item.amount || 0).toFixed(2)}
                  </td>
                  
                  <td className="noprint action-cell" style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      disabled={items.length === 1 || previewMode}
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Add service button (Hidden on print/preview) */}
          {!previewMode && (
            <div className="noprint mt-4">
              <button 
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus size={12} />
                <span>+ Add Service</span>
              </button>
            </div>
          )}

          {/* Totals and calculations */}
          <div className="flex justify-end mt-6">
            <div className="w-80">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody className="text-xs text-slate-800">
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td className="py-2 font-semibold">Parts Total</td>
                    <td id="partsTotal" className="text-right font-mono py-2">₹{partsTotal.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td className="py-2 font-semibold">Labour Total</td>
                    <td id="labourTotal" className="text-right font-mono py-2">₹{labourTotal.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td className="py-2 font-semibold">Discount</td>
                    <td className="text-right py-1">
                      <input 
                        id="discount" 
                        type="number"
                        placeholder="0"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        disabled={previewMode}
                        className="font-mono text-right w-24 p-1 border rounded focus:border-red-600"
                        style={{ border: previewMode ? 'none' : '1px solid #cbd5e1' }}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold text-sm text-red-600">Grand Total</td>
                    <td className="text-right py-2.5"><b id="grandTotal" className="font-mono text-sm text-red-600">₹{grandTotal.toFixed(2)}</b></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Terms & Conditions footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 leading-normal">
            <strong>Terms & Conditions:</strong><br />
            {settings?.terms || 'Payment required upon vehicle collection. Parts warranty subject to manufacturer terms. Labour warranty applicable only to covered repairs.'}
          </div>

          {/* Signatures */}
          <div className="flex justify-between mt-12 pt-4">
            <div className="w-48 text-center text-[10px] text-slate-500 font-bold border-t border-slate-300 pt-1">
              Customer Signature
            </div>
            <div className="w-48 text-center text-[10px] text-slate-500 font-bold border-t border-slate-300 pt-1">
              Authorized Signature
            </div>
          </div>
        </div>
      </div>

      {/* Owner Only Financial Insights Dashboard (Hidden on print/preview) */}
      {!previewMode && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 noprint max-w-4xl mx-auto text-slate-800 dark:text-slate-200 mt-8 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="p-1.5 bg-red-500/10 text-red-500 rounded-lg">
              <Eye size={16} />
            </span>
            <div>
              <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm">Owner Only Financial Insights</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Private metrics for cost value of products and overall profit gain</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider block">Total Product Cost</span>
              <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-mono">₹{totalCost.toFixed(2)}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider block">Expected Revenue</span>
              <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100 font-mono">₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider block">Overall Profit Gain</span>
              <span className={`text-lg font-extrabold font-mono ${overallProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                ₹{overallProfit.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-855 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider block">Profit Margin</span>
              <span className={`text-lg font-extrabold font-mono ${overallProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
