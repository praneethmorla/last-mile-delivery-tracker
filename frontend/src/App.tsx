import { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import AgentDashboard from './pages/AgentDashboard';
import { LogOut } from 'lucide-react';

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
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <span className="text-sm font-semibold text-gray-500">Loading DashMile System...</span>
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

function NavigationBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  // Initials for Avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <nav className="bg-white border-b border-gray-100 px-6 py-4 shadow-sm">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <Link to="/" className="flex items-center space-x-2.5">
          {/* Stylized custom SVG brand logo */}
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg text-gray-900 tracking-tight leading-none">DashMile</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Fleet Grid</span>
          </div>
          <span className={`text-[10px] rounded px-2 py-0.5 font-bold uppercase tracking-wider ml-2 ${
            user.role === 'ADMIN' ? 'bg-red-50 text-red-700' :
            user.role === 'CUSTOMER' ? 'bg-indigo-50 text-indigo-700' : 'bg-green-50 text-green-700'
          }`}>
            {user.role}
          </span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 border-r pr-4 border-gray-100">
            {/* User Avatar Circle */}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
              user.role === 'ADMIN' ? 'bg-red-500' :
              user.role === 'CUSTOMER' ? 'bg-indigo-600' : 'bg-green-600'
            }`}>
              {getInitials(user.name)}
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold text-gray-900 leading-none">{user.name}</span>
              <span className="text-[10px] text-gray-400 font-medium mt-0.5">{user.email}</span>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center text-sm font-semibold text-gray-500 hover:text-red-600 transition"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="flex flex-col min-h-screen bg-gray-50/50">
          <NavigationBar />
          <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

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
          <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 font-medium">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center px-6 gap-2">
              <p>&copy; {new Date().getFullYear()} DashMile Courier Logistics Inc. All rights reserved.</p>
              <div className="flex space-x-4 text-[11px] text-gray-400">
                <a href="#/support" className="hover:text-indigo-600">Support</a>
                <span>&bull;</span>
                <a href="#/privacy" className="hover:text-indigo-600">Privacy Policy</a>
                <span>&bull;</span>
                <a href="#/terms" className="hover:text-indigo-600">Terms of Service</a>
              </div>
            </div>
          </footer>
        </div>
      </HashRouter>
    </AuthProvider>
  );
}
