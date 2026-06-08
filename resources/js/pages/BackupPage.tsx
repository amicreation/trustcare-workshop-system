import React, { useState } from 'react';
import axios from 'axios';
import { Database, Download, Upload, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleExport = async () => {
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      const res = await axios.get('/api/backup/export', { responseType: 'blob' });
      
      // Generate virtual link to trigger browser download
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trustcare_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess('Database backup file successfully generated and downloaded.');
    } catch (err) {
      console.error(err);
      setError('Failed to generate database export.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('WARNING: Importing database overwrite replaces all current tables! Ensure you have an export of current data before continuing. Proceed?')) {
      e.target.value = '';
      return;
    }

    setLoading(true);
    setSuccess('');
    setError('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target?.result as string);
        if (!jsonContent.data) {
          throw new Error('Invalid backup file format.');
        }

        await axios.post('/api/backup/import', { data: jsonContent.data });
        setSuccess('Database successfully restored. Reloading settings in 2 seconds...');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.error || 'Invalid JSON backup file or import failed.');
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
        <Database className="text-red-500" size={24} />
        <div>
          <h3 className="font-bold text-slate-50">Database Backup & Restore</h3>
          <p className="text-xs text-slate-400 mt-0.5">Export SQLite tables to JSON or import from an active backup</p>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="p-6 bg-slate-950 border border-slate-850 rounded-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-200">Export Database</h4>
            <p className="text-xs text-slate-400 leading-normal">Downloads a complete snapshot of all settings, customers, vehicles, job cards, estimates, and invoices as a single secure JSON file.</p>
          </div>
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} className="text-red-500" />}
            <span>Export SQLite DB</span>
          </button>
        </div>

        {/* Import Card */}
        <div className="p-6 bg-slate-950 border border-slate-850 rounded-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold text-sm text-slate-200">Restore Database</h4>
            <p className="text-xs text-slate-400 leading-normal">Upload a previously exported JSON backup file. This will replace all current tables in the workspace database.</p>
          </div>
          
          <label className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-red-600/10">
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
            <span>Upload & Restore</span>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImport} 
              className="hidden" 
              disabled={loading} 
            />
          </label>
        </div>
      </div>
    </div>
  );
}
