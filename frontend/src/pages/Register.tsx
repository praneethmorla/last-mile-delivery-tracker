import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Mail, Lock, User as UserIcon, AlertCircle, ArrowRight, Package, Truck } from 'lucide-react';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'AGENT'>('CUSTOMER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      login(data.token, data.user);

      if (data.user.role === 'ADMIN') navigate('/admin');
      else if (data.user.role === 'CUSTOMER') navigate('/customer');
      else if (data.user.role === 'AGENT') navigate('/agent');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
            Join the <span className="text-zinc-950 font-black">DashMile</span> Grid
          </h1>
          <p className="text-xs text-zinc-500 mt-1.5 font-medium">
            Create an enterprise dispatch account or register as a courier
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Segmented Selector */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-2 bg-zinc-100/70 p-1 rounded-xl border border-zinc-200/60">
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                    role === 'CUSTOMER'
                      ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('AGENT')}
                  className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-bold transition ${
                    role === 'AGENT'
                      ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/60'
                      : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Courier Agent</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Full Name / Organization
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'CUSTOMER' ? 'e.g. Acme Retailers' : 'e.g. John Doe'}
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@company.com"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-zinc-50/50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
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
              <span>{loading ? 'Registering Account...' : 'Create DashMile Account'}</span>
              {!loading && <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-zinc-500 font-medium">
              Already have an account?{' '}
              <Link to="/login" className="text-zinc-900 font-bold hover:underline">
                Sign In
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
