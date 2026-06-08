import React, { useState, useEffect } from 'react';
import { useSettings } from '../App';
import { Settings, Save, Upload } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings, refreshSettings } = useSettings();

  // Form states
  const [workshopName, setWorkshopName] = useState('');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gst, setGst] = useState('');
  const [terms, setTerms] = useState('');
  const [logoBase64, setLogoBase64] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setWorkshopName(settings.workshop_name || '');
      setTagline(settings.tagline || '');
      setAddress(settings.address || '');
      setMobile(settings.mobile || '');
      setEmail(settings.email || '');
      setGst(settings.gst || '');
      setTerms(settings.terms || '');
      setLogoBase64(settings.logo || '');
    }
  }, [settings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setLogoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const payload = {
      workshop_name: workshopName,
      tagline: tagline,
      address: address,
      mobile: mobile,
      email: email,
      gst: gst,
      terms: terms,
      logo: logoBase64
    };

    const success = await updateSettings(payload);
    if (success) {
      setMessage('Workshop configurations saved successfully.');
      refreshSettings();
    } else {
      setError('Failed to save settings. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
        <Settings className="text-red-500" size={24} />
        <div>
          <h3 className="font-bold text-slate-50">Workshop Settings</h3>
          <p className="text-xs text-slate-400 mt-0.5">Edit workshop identities, default values, and print headers</p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold">
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Logo and Name header */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-slate-950 border border-slate-850 rounded-xl">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
              {logoBase64 ? (
                <img src={logoBase64} alt="Workshop Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-[10px] text-slate-500 uppercase tracking-widest text-center px-2">No Logo</span>
              )}
            </div>
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-xl cursor-pointer transition-opacity">
              <Upload size={16} className="text-white" />
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>

          <div className="flex-1 w-full space-y-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Workshop Logo Uploader</span>
            <p className="text-xs text-slate-400">Click the box to upload a transparent PNG or JPG. Saved image appears in invoice header prints immediately.</p>
          </div>
        </div>

        {/* Text forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Workshop Name</label>
            <input
              type="text"
              required
              value={workshopName}
              onChange={(e) => setWorkshopName(e.target.value)}
              placeholder="TRUST CARE WORKSHOP"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl text-slate-200 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tagline / Slogan</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Driven by Trust, Powered by Skill"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl text-slate-200 text-sm outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Physical Address</label>
          <input
            type="text"
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Near Vaishnodevi Circle, Ahmedabad"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl text-slate-200 text-sm outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Mobile Numbers</label>
            <input
              type="text"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="8200695660 | 9512660711"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl text-slate-200 text-sm outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@trustcare.com"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl text-slate-200 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GST Identification No.</label>
            <input
              type="text"
              value={gst}
              onChange={(e) => setGst(e.target.value)}
              placeholder="24AAAAT0000A1Z1"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl text-slate-200 text-sm outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Invoice Terms & Conditions</label>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Payment details, warranty terms..."
            rows={4}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-red-600 rounded-xl text-slate-200 text-sm outline-none resize-none"
          />
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-end bg-slate-950 -mx-6 -mb-6 p-6">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-red-600/15 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                <span>Saving Settings...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Configurations</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
