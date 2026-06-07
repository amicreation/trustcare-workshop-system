import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, Users, Car, CreditCard, Clock, CheckCircle, ClipboardList 
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Theme state for Recharts dynamic styling
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get('/api/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching dashboard statistics', err);
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 rounded-full border-2 border-red-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-center">
        {error}
      </div>
    );
  }

  const { today, thisMonth, trends } = data;

  const gridColor = isDark ? "#1e293b" : "#e2e8f0";
  const axisColor = isDark ? "#475569" : "#94a3b8";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#cbd5e1";
  const tooltipText = isDark ? "#f8fafc" : "#0f172a";

  const todayStats = [
    { name: "Today's Revenue", value: `₹${(today.revenue || 0).toLocaleString()}`, change: 'Live updates', icon: CreditCard, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    { name: 'Invoices Created', value: today.invoicesCreated, change: 'Today', icon: ClipboardList, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { name: 'Vehicles Received', value: today.vehiclesReceived, change: 'Job Cards', icon: Car, color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { name: 'Vehicles Delivered', value: today.vehiclesDelivered, change: 'Finished repairs', icon: CheckCircle, color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    { name: 'Outstanding Payments', value: `₹${(today.pendingPayments || 0).toLocaleString()}`, change: 'Accumulated', icon: Clock, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  ];

  const monthStats = [
    { name: 'Monthly Revenue', value: `₹${(thisMonth.totalRevenue || 0).toLocaleString()}`, label: 'This Month', icon: TrendingUp, color: 'border-emerald-500/20 text-emerald-400' },
    { name: 'Vehicles Repaired', value: thisMonth.totalVehicles, label: 'Unique Registration', icon: Car, color: 'border-red-500/20 text-red-400' },
    { name: 'Total Customers', value: thisMonth.newCustomers, label: 'Database Master', icon: Users, color: 'border-blue-500/20 text-blue-400' },
    { name: 'Repeat Customers', value: thisMonth.repeatCustomers, label: 'Loyal Clients', icon: Clock, color: 'border-purple-500/20 text-purple-400' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">TODAY AT A GLANCE</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {todayStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">{stat.name}</span>
                  <div className={`p-2 rounded-lg border ${stat.color}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">{stat.value}</h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">{stat.change}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Month Section */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">THIS MONTHLY TOTALS</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {monthStats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center gap-4 shadow-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <Icon className="text-red-500" size={24} />
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{stat.name}</span>
                  <h4 className="text-2xl font-black mt-0.5 font-mono text-slate-900 dark:text-slate-100">{stat.value}</h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{stat.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h4 className="font-bold text-slate-850 dark:text-slate-5">Revenue Trend</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daily income totals over the last 30 days</p>
          </div>
          <div className="h-80 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" stroke={axisColor} />
                <YAxis stroke={axisColor} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: tooltipText }}
                  labelClassName="text-slate-500 dark:text-slate-200"
                />
                <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#ef4444" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Workload Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <h4 className="font-bold text-slate-855 dark:text-slate-5">Vehicle Workload</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daily job cards processed over the last 30 days</p>
          </div>
          <div className="h-80 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" stroke={axisColor} />
                <YAxis stroke={axisColor} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: tooltipText }}
                  labelClassName="text-slate-500 dark:text-slate-200"
                />
                <Bar dataKey="vehicles" name="Vehicles Serviced" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
