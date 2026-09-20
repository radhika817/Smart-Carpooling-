import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Mail, Lock, LogIn, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (role) => {
    if (role === 'passenger') {
      setEmail('demo.passenger@smartride.edu');
      setPassword('DemoPass123!');
    } else if (role === 'driver') {
      setEmail('demo.driver@smartride.edu');
      setPassword('DemoPass123!');
    } else if (role === 'admin') {
      setEmail('demo.admin@smartride.edu');
      setPassword('DemoPass123!');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
      {/* Soft Glow */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-brand-100/50 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white mb-3 shadow-md shadow-brand-600/20">
            <Car className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="text-slate-600 text-sm mt-1">Sign in to your SmartRide account</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign in</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Quick demo fill:
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoFill('passenger')}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-center"
            >
              Demo Passenger
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('driver')}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-center"
            >
              Demo Driver
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('admin')}
              className="px-2 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors text-center"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-brand-600 hover:text-brand-700 font-semibold underline">
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
