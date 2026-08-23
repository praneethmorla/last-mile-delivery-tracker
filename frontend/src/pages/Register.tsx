import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Mail, Lock, User, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
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
    <div className="flex min-h-[75vh] bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-5xl mx-auto">
      
      {/* LEFT SIDE: Brand Promotion Panel */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-950 text-white p-12 flex-col justify-between relative overflow-hidden">
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
            Join the DashMile <br />
            Logistics Grid.
          </h1>
          <p className="text-indigo-200/90 text-sm leading-relaxed max-w-sm">
            Whether you want to dispatch bulk retail orders or register as a delivery executive, get onboarded in seconds.
          </p>

          <div className="space-y-3 mt-8">
            <div className="flex items-center space-x-3 text-xs text-indigo-100">
              <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <span>Instantly book with dynamic zone-rate sheets</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-indigo-100">
              <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <span>Agent availability auto-dispatch system</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-indigo-100">
              <CheckCircle className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <span>Complete delivery history timeline ledger</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-indigo-300 z-10">
          DashMile System Gateway.
        </div>
      </div>

      {/* RIGHT SIDE: Register Form Panel */}
      <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white">
        <div className="max-w-md w-full mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Create an Account</h2>
            <p className="text-gray-500 text-sm mt-1">Register to start booking and delivering packages.</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center text-xs font-semibold animate-fadeIn">
              <AlertCircle className="h-4.5 w-4.5 mr-2 flex-shrink-0 text-red-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Eleanor Vance"
                  className="pl-10 w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4.5 w-4.5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 transition bg-white"
              >
                <option value="CUSTOMER">Customer (Book & Ship)</option>
                <option value="AGENT">Delivery Executive (Deliver)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-100"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-bold hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
