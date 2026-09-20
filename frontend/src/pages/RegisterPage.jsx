import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Building2, 
  UserCheck, 
  AlertCircle, 
  Loader2, 
  Check, 
  Music, 
  Cigarette, 
  Dog, 
  VolumeX 
} from 'lucide-react';
import { motion } from 'framer-motion';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    organization: '',
    role: 'passenger',
    preferences: {
      smoking: false,
      music: true,
      petFriendly: false,
      quietRide: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const handleRoleChange = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handlePreferenceToggle = (prefKey) => {
    setFormData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [prefKey]: !prev.preferences[prefKey],
      },
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      await register(formData);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.errors) {
        const errorMap = {};
        err.errors.forEach((e) => {
          errorMap[e.field] = e.message;
        });
        setFieldErrors(errorMap);
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-100/50 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-xl w-full bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 text-white mb-3 shadow-md shadow-brand-600/20">
            <Car className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create your SmartRide profile</h2>
          <p className="text-slate-600 text-sm mt-1">Start sharing rides with verified community members</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Selector Tabs */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            I primarily want to:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRoleChange('passenger')}
              className={`p-3.5 rounded-xl border flex items-center justify-center space-x-2.5 text-sm font-semibold transition-all ${
                formData.role === 'passenger'
                  ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Find rides (Passenger)</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('driver')}
              className={`p-3.5 rounded-xl border flex items-center justify-center space-x-2.5 text-sm font-semibold transition-all ${
                formData.role === 'driver'
                  ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Offer rides (Driver)</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Full name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Rahul Sharma"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              {fieldErrors.name && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Email address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rahul@college.edu"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              {fieldErrors.password && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Phone number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">
              University / Company / Community
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                placeholder="e.g. Pune University, Hinjewadi Tech Park, Infosys"
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Preferences Section */}
          <div className="pt-2">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Commute preferences
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handlePreferenceToggle('music')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-colors ${
                  formData.preferences.music
                    ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>Music friendly</span>
              </button>

              <button
                type="button"
                onClick={() => handlePreferenceToggle('quietRide')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-colors ${
                  formData.preferences.quietRide
                    ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <VolumeX className="w-4 h-4" />
                <span>Quiet ride</span>
              </button>

              <button
                type="button"
                onClick={() => handlePreferenceToggle('petFriendly')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-colors ${
                  formData.preferences.petFriendly
                    ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Dog className="w-4 h-4" />
                <span>Pet friendly</span>
              </button>

              <button
                type="button"
                onClick={() => handlePreferenceToggle('smoking')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-colors ${
                  formData.preferences.smoking
                    ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Cigarette className="w-4 h-4" />
                <span>Smoking ok</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Complete registration</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-semibold underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
