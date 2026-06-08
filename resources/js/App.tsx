import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Car, FileText, FileSpreadsheet, 
  Settings, Database, CreditCard, LogOut, Sun, Moon, Menu, X, CheckSquare
} from 'lucide-react';

// Create contexts
const AuthContext = createContext<any>(null);
const SettingsContext = createContext<any>(null);

export const useAuth = () => useContext(AuthContext);
export const useSettings = () => useContext(SettingsContext);

// Layout Component
const DashboardLayout = ({ children, darkMode, setDarkMode }: { children: React.ReactNode, darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
  const { logout, user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Job Cards', path: '/jobcards', icon: CheckSquare },
    { name: 'Quotations', path: '/quotations', icon: FileSpreadsheet },
    { name: 'Invoice Builder', path: '/invoices', icon: FileText },
    { name: 'Invoices & Payments', path: '/payments', icon: CreditCard },
    { name: 'Customer DB', path: '/customers', icon: Users },
    { name: 'Vehicle DB', path: '/vehicles', icon: Car },
    { name: 'Workshop Settings', path: '/settings', icon: Settings },
    { name: 'Backup & Restore', path: '/backup', icon: Database },
  ];

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 border-r transition-transform duration-300 transform lg:translate-x-0 lg:static lg:inset-0 noprint
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-inherit">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-bold text-white">TC</div>
            <div>
              <h1 className="font-bold text-sm leading-tight">TRUST CARE</h1>
              <span className="text-[10px] text-red-500 font-semibold tracking-wider block -mt-0.5">WORKSHOP</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-inherit">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 12rem)' }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : darkMode 
                      ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-100' 
                      : 'hover:bg-slate-100 text-slate-600 hover:text-slate-950'}`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-inherit">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-slate-500">Logged in as: <b className="text-slate-400">{user?.username}</b></span>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-1.5 rounded-lg border border-inherit text-inherit`}
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 text-xs font-semibold transition-all border border-slate-700"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className={`h-16 flex items-center justify-between px-6 border-b noprint
          ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
        >
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-inherit">
              <Menu size={20} />
            </button>
            <div>
              <h2 className="font-bold text-lg leading-tight uppercase">
                {menuItems.find(item => item.path === location.pathname)?.name || 'Trust Care'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {settings?.logo && (
              <img src={settings.logo} alt="Logo" className="h-9 object-contain" />
            )}
            <span className="text-sm font-semibold hidden md:inline-block">
              {settings?.workshop_name || 'TRUST CARE WORKSHOP'}
            </span>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// Protected Route check wrapper
const ProtectedRoute = ({ children, darkMode, setDarkMode }: { children: React.ReactNode, darkMode: boolean, setDarkMode: (v: boolean) => void }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <DashboardLayout darkMode={darkMode} setDarkMode={setDarkMode}>{children}</DashboardLayout>;
};

// Main Routing App wrapper
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [settings, setSettings] = useState<any>(null);
  const [darkMode, setDarkMode] = useState<boolean>(localStorage.getItem('theme') !== 'light');
  const [loading, setLoading] = useState(true);

  // Configure Axios default authorization token
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  // Manage application theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Load user status on startup
  useEffect(() => {
    const fetchMeAndSettings = async () => {
      // First load public settings
      try {
        const setRes = await axios.get('/api/settings');
        setSettings(setRes.data);
      } catch (err) {
        console.error('Error fetching settings', err);
      }

      if (token) {
        try {
          const authRes = await axios.get('/api/auth/me');
          setUser(authRes.data);
        } catch (err) {
          console.error('Invalid token, logging out', err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchMeAndSettings();
  }, [token]);

  const login = (newToken: string, newUser: any) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshSettings = async () => {
    try {
      const setRes = await axios.get('/api/settings');
      setSettings(setRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateSettings = async (newData: any) => {
    try {
      const res = await axios.post('/api/settings', newData);
      setSettings(res.data.settings);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-full border-4 border-red-600 border-t-transparent animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-widest text-slate-400">LOADING TRUST CARE SYSTEM...</p>
      </div>
    );
  }

  // Lazy loaded Pages (we'll implement them below)
  // Let's create route imports. We will write placeholder or basic imports, but actually we will create the page files directly.
  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <SettingsContext.Provider value={{ settings, refreshSettings, updateSettings }}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={!token ? <LoginPage /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!token ? <RegisterPage /> : <Navigate to="/dashboard" />} />
            
            <Route path="/dashboard" element={<ProtectedRoute darkMode={darkMode} setDarkMode={setDarkMode}><DashboardPage /></ProtectedRoute>} />
            <Route path="/jobcards" element={<ProtectedRoute darkMode={darkMode} setDarkMode={setDarkMode}><JobCardsPage /></ProtectedRoute>} />
            <Route path="/quotations" element={<ProtectedRoute darkMode={darkMode} setDarkMode={setDarkMode}><QuotationsPage /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute darkMode={darkMode} setDarkMode={setDarkMode}><InvoicesPage /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute darkMode={darkMode} setDarkMode={setDarkMode}><PaymentsPage /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute darkMode={darkMode} setDarkMode={setDarkMode}><CustomersPage /></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute darkMode={darkMode} setDarkMode={setDarkMode}><VehiclesPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute darkMode={darkMode} setDarkMode={setDarkMode}><SettingsPage /></ProtectedRoute>} />
            <Route path="/backup" element={<ProtectedRoute darkMode={darkMode} setDarkMode={setDarkMode}><BackupPage /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </SettingsContext.Provider>
    </AuthContext.Provider>
  );
}

// Temporary layout route stub mappings to actual page classes we are creating in pages/
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import JobCardsPage from './pages/JobCards';
import QuotationsPage from './pages/Quotations';
import InvoicesPage from './pages/Invoices';
import PaymentsPage from './pages/Payments';
import CustomersPage from './pages/Customers';
import VehiclesPage from './pages/Vehicles';
import SettingsPage from './pages/SettingsPage';
import BackupPage from './pages/BackupPage';
