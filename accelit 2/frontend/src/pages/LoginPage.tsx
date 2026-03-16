// src/pages/LoginPage.tsx

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Input, Button } from '@/components/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0B1E] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <span className="text-4xl font-bold tracking-tight">
            <span className="text-purple-500">AC</span>
            <span className="text-white">CELIT</span>
          </span>
          <p className="text-purple-300/50 text-sm mt-2">Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-8 backdrop-blur">
          <h2 className="text-white font-semibold text-lg mb-6">Sign in</h2>

          {error && (
            <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-purple-300/60 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@accelit.com"
                required
                className="w-full px-3 py-2.5 text-sm bg-white/5 border border-purple-500/20 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-purple-300/60 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2.5 text-sm bg-white/5 border border-purple-500/20 rounded-lg text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
