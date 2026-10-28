import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Lock, Mail, AlertCircle, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent, directEmail?: string, directPassword?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginEmail = directEmail || email;
    const loginPass = directPassword || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
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
    handleSubmit(undefined, roleEmail, 'password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-zinc-50 relative overflow-hidden">
      {/* Subtle modern background grid */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"
      />
      
      {/* Ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 text-white shadow-xl shadow-zinc-900/10 mb-4 ring-1 ring-zinc-900/10">
            <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Welcome back to <span className="text-zinc-950 font-black">DashMile</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1.5 font-medium">
            Autonomous Last-Mile Logistics Management Engine
          </p>
        </div>

        {/* Card Panel */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xl shadow-zinc-200/50 p-6 sm:p-8 backdrop-blur-sm">
          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200/70 text-rose-700 px-3.5 py-2.5 rounded-xl flex items-center text-xs font-semibold animate-fadeIn">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-zinc-400 font-medium">Encrypted SSL</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-zinc-900 text-white py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 transition shadow-sm flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating Session...' : 'Sign In to Workspace'}</span>
              {!loading && <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />}
            </button>
          </form>

          {/* Quick Demo Sandboxes - 1 Click Login */}
          <div className="mt-6 pt-5 border-t border-zinc-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase flex items-center">
                <Sparkles className="w-3 h-3 text-indigo-500 mr-1.5" />
                One-Click Sandbox Accounts
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">auto-fills</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@dashmile.com')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-zinc-200/80 hover:border-zinc-900 hover:bg-zinc-50 transition text-center group"
              >
                <span className="text-[11px] font-bold text-zinc-800 group-hover:text-zinc-950">Admin</span>
                <span className="text-[9px] text-rose-600 font-bold bg-rose-50 px-1 py-0.5 rounded mt-0.5">Control</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('customer@example.com')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-zinc-200/80 hover:border-zinc-900 hover:bg-zinc-50 transition text-center group"
              >
                <span className="text-[11px] font-bold text-zinc-800 group-hover:text-zinc-950">Customer</span>
                <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded mt-0.5">Acme Corp</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('agent1@dashmile.com')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-zinc-200/80 hover:border-zinc-900 hover:bg-zinc-50 transition text-center group"
              >
                <span className="text-[11px] font-bold text-zinc-800 group-hover:text-zinc-950">Agent</span>
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded mt-0.5">Courier</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-xs text-zinc-500 font-medium">
              Don't have an enterprise account?{' '}
              <Link to="/register" className="text-zinc-900 font-bold hover:underline">
                Create Account
              </Link>
            </span>
          </div>
        </div>

        {/* Footer info badge */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-[11px] text-zinc-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Haversine Dispatch Algorithm v2.4 Active</span>
        </div>
      </div>
    </div>
  );
}
