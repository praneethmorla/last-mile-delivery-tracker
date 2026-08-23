import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Lock, Mail, AlertCircle, Sparkles, ChevronDown, CheckCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      login(data.token, data.user);
      
      if (data.user.role === 'ADMIN') navigate('/admin');
      else if (data.user.role === 'CUSTOMER') navigate('/customer');
      else if (data.user.role === 'AGENT') navigate('/agent');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
  };

  return (
    <div className="flex min-h-[75vh] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-5xl mx-auto">
      
      {/* LEFT SIDE: Brand Promotion Panel */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract background graphics */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-800/20 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-900/40 rounded-full blur-3xl transform -translate-x-10 translate-y-10"></div>

        <div className="flex items-center space-x-3 z-10">
          <div className="bg-indigo-600 p-2 rounded-xl text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-black text-2xl tracking-tight">DashMile</span>
        </div>

        <div className="space-y-6 z-10">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
            Intelligent Last-Mile <br />
            Delivery Management.
          </h1>
          <p className="text-indigo-200/90 text-sm leading-relaxed max-w-sm">
            Fully automated agent dispatching, dynamic volumetric rate calculation, and immutable tracking logs. Powering next-gen logistics workflow.
          </p>

          <div className="space-y-3 mt-8">
            <div className="flex items-center space-x-3 text-xs text-indigo-100">
              <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <span>99.8% On-Time Proximity Match Heuristic</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-indigo-100">
              <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <span>Real-time Auditable Status Timelines</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-indigo-100">
              <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <span>Zero-code Rate Card Engine Override API</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-indigo-300 z-10">
          Developed for Enterprise Dispatch Operations.
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form Panel */}
      <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Sign In to Dashboard</h2>
            <p className="text-gray-500 text-sm mt-1">Please enter your credentials to access the system.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center text-xs font-semibold animate-fadeIn">
              <AlertCircle className="h-4.5 w-4.5 mr-2 flex-shrink-0 text-red-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="pl-10 w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-100"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-2">
            Need an account?{' '}
            <Link to="/register" className="text-indigo-600 font-bold hover:underline">
              Create an account
            </Link>
          </p>

          {/* Collapsible Sandbox Accounts Picker */}
          <div className="pt-6 border-t border-gray-100">
            <button
              onClick={() => setShowSandbox(!showSandbox)}
              className="flex items-center justify-between w-full text-xs font-bold text-gray-500 hover:text-indigo-600 transition uppercase tracking-wider focus:outline-none"
            >
              <span className="flex items-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-yellow-500 animate-pulse" />
                <span>Demo Account Sandbox</span>
              </span>
              <ChevronDown className={`h-4 w-4 transform transition-transform ${showSandbox ? 'rotate-180' : ''}`} />
            </button>

            {showSandbox && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border space-y-2 animate-fadeIn">
                <p className="text-[10px] text-gray-400 font-medium mb-1">
                  Click below to fill credentials. Password for all sandbox accounts is <code className="bg-gray-200/80 px-1 py-0.5 rounded font-mono text-[9px]">password123</code>.
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={() => handleQuickLogin('admin@dashmile.com')}
                    className="flex justify-between items-center bg-white border px-3 py-1.5 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/20 transition text-[11px]"
                  >
                    <span className="font-bold text-gray-800">Eleanor Vance</span>
                    <span className="text-[9px] bg-red-100 text-red-800 rounded px-1.5 py-0.5 font-bold uppercase">Admin</span>
                  </button>
                  <button
                    onClick={() => handleQuickLogin('customer@example.com')}
                    className="flex justify-between items-center bg-white border px-3 py-1.5 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/20 transition text-[11px]"
                  >
                    <span className="font-bold text-gray-800">Acme Retail Group</span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 rounded px-1.5 py-0.5 font-bold uppercase">Customer</span>
                  </button>
                  <button
                    onClick={() => handleQuickLogin('agent1@dashmile.com')}
                    className="flex justify-between items-center bg-white border px-3 py-1.5 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/20 transition text-[11px]"
                  >
                    <span className="font-bold text-gray-800">David Vance (North Zone)</span>
                    <span className="text-[9px] bg-green-100 text-green-800 rounded px-1.5 py-0.5 font-bold uppercase">Courier Agent</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
