import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import {
  LogOut,
  Package,
  Truck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  Users,
  PackagePlus,
  History
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER' | 'AGENT';
  agentProfile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent"></div>
          <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">Initializing DashMile...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function RoleRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'CUSTOMER') return <Navigate to="/customer" replace />;
  if (user.role === 'AGENT') return <Navigate to="/agent" replace />;

  return <Navigate to="/login" replace />;
}

// Sidebar Component
function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (val: boolean) => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const navLinks = [
    ...(user.role === 'CUSTOMER' ? [
      { name: 'Place Order', path: '/customer/booking', icon: PackagePlus },
      { name: 'Order History', path: '/customer/history', icon: History },
    ] : []),
    ...(user.role === 'AGENT' ? [
      { name: 'Deliveries & Tasks', path: '/agent', icon: Truck },
    ] : []),
    ...(user.role === 'ADMIN' ? [
      { name: 'Operations Console', path: '/admin', icon: LayoutDashboard },
    ] : []),
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-white border-r border-zinc-200/80 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-100">
        <Link to="/" className="flex items-center space-x-3 overflow-hidden">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base text-zinc-900 tracking-tight leading-none">DashMile</span>
                <span className="text-[10px] bg-zinc-100 text-zinc-600 font-bold px-1.5 py-0.5 rounded border border-zinc-200/60 leading-none">v2.4</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-medium tracking-wide mt-1">Autonomous Grid</span>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition hidden sm:flex items-center justify-center"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-4 py-3">
        <div className={`flex items-center rounded-lg px-2.5 py-1.5 border text-xs font-semibold ${
          user.role === 'ADMIN' ? 'bg-rose-50/70 border-rose-200/60 text-rose-800' :
          user.role === 'CUSTOMER' ? 'bg-indigo-50/70 border-indigo-200/60 text-indigo-800' :
          'bg-emerald-50/70 border-emerald-200/60 text-emerald-800'
        }`}>
          {user.role === 'ADMIN' && <Shield className="w-3.5 h-3.5 flex-shrink-0 mr-2 text-rose-600" />}
          {user.role === 'CUSTOMER' && <Package className="w-3.5 h-3.5 flex-shrink-0 mr-2 text-indigo-600" />}
          {user.role === 'AGENT' && <Truck className="w-3.5 h-3.5 flex-shrink-0 mr-2 text-emerald-600" />}
          {!collapsed && (
            <span className="truncate tracking-wide uppercase text-[10px] font-bold">
              {user.role === 'ADMIN' ? 'Administrator' : user.role === 'CUSTOMER' ? 'Enterprise Client' : 'Dispatch Courier'}
            </span>
          )}
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-3 mb-2">
          {!collapsed ? 'Primary Workspace' : '•••'}
        </div>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isBookingDefault = link.path === '/customer/booking' && (location.pathname === '/customer' || location.pathname === '/customer/');
          const isActive = location.pathname.startsWith(link.path) || isBookingDefault;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-zinc-900 text-white shadow-sm shadow-zinc-900/10'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
              title={collapsed ? link.name : undefined}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
              {!collapsed && <span>{link.name}</span>}
            </Link>
          );
        })}

        {/* Operational System Info card for expanded mode */}
        {!collapsed && (
          <div className="pt-6 px-1">
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/70 text-zinc-600 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-700">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                  Dispatch Grid
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/50">Online</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Haversine proximity algorithm active. Real-time rate cards loaded.
              </p>
            </div>
          </div>
        )}
      </nav>

      {/* User Profile Card at Bottom */}
      <div className="p-3 border-t border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-100/80 transition">
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm flex-shrink-0 ${
              user.role === 'ADMIN' ? 'bg-rose-600' :
              user.role === 'CUSTOMER' ? 'bg-indigo-600' :
              'bg-emerald-600'
            }`}>
              {getInitials(user.name)}
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-zinc-900 truncate leading-none">{user.name}</span>
                <span className="text-[10px] text-zinc-500 truncate mt-1">{user.email}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

// App Header for Authenticated Workspace
function AppHeader({ collapsed }: { collapsed: boolean }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getBreadcrumb = () => {
    if (location.pathname.startsWith('/admin')) return 'Operations & Fleet Governance';
    if (location.pathname.startsWith('/customer')) return 'Enterprise Booking & Real-Time Tracking';
    if (location.pathname.startsWith('/agent')) return 'Field Agent Dispatch & Delivery Handover';
    return 'Dashboard';
  };

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-zinc-200/80 px-6 flex items-center justify-between transition-all duration-300 ${
        collapsed ? 'left-20' : 'left-64'
      }`}
    >
      <div className="flex items-center space-x-3 text-xs">
        <span className="font-semibold text-zinc-400">DashMile</span>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-900 tracking-tight">{getBreadcrumb()}</span>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-2 text-xs text-zinc-500 bg-zinc-100/70 border border-zinc-200/60 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>SMTP Engine: Active</span>
        </div>
        <div className="text-xs font-mono text-zinc-400 hidden sm:block">
          {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Routes inside Left Sidebar Shell */}
          <Route
            path="/*"
            element={
              <div className="min-h-screen bg-zinc-50 flex">
                <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
                <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
                  <AppHeader collapsed={collapsed} />
                  <main className="flex-1 mt-16 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
                    <Routes>
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/customer"
                        element={
                          <ProtectedRoute allowedRoles={['CUSTOMER']}>
                            <CustomerDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/customer/*"
                        element={
                          <ProtectedRoute allowedRoles={['CUSTOMER']}>
                            <CustomerDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/agent"
                        element={
                          <ProtectedRoute allowedRoles={['AGENT']}>
                            <AgentDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/" element={<RoleRedirect />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                  <footer className="border-t border-zinc-200/60 bg-white/50 py-4 px-8 text-xs text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p>&copy; {new Date().getFullYear()} DashMile Autonomous Logistics Engine. All rights reserved.</p>
                    <div className="flex items-center space-x-3 text-[11px] text-zinc-400">
                      <span>Proximity Heuristics v2</span>
                      <span>&bull;</span>
                      <span>Volumetric Calculator</span>
                      <span>&bull;</span>
                      <span className="text-emerald-600 font-medium">System Online</span>
                    </div>
                  </footer>
                </div>
              </div>
            }
          />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
