import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Leaf,
  Navigation,
  Star,
  Award,
  ShieldCheck,
  RefreshCw,
  Info,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { analyticsService } from '../../services/analyticsService';

export const PersonalAnalyticsCard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('savings'); // 'savings' | 'distance'

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await analyticsService.getPersonalAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load personal analytics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const metrics = data?.metrics || {
    completedTrips: 0,
    driverTrips: 0,
    passengerTrips: 0,
    totalDistanceKm: 0,
    totalMoneySaved: 0,
    totalCo2SavedKg: 0,
    treesEquivalent: 0,
  };

  const ratings = data?.ratingsBreakdown || {
    punctuality: { average: 5.0, count: 0 },
    safety: { average: 5.0, count: 0 },
    behaviour: { average: 5.0, count: 0 },
    cleanliness: { average: 5.0, count: 0 },
  };

  const monthlyTrends = data?.monthlyTrends || [];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Impact & Commute Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            Computed strictly from your <strong>completed</strong> rides. Cancelled or open rides contribute 0.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 relative z-10">
        {/* Money Saved */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 hover:border-emerald-500/30 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {user?.role === 'driver' ? 'Fuel Offset Recovered' : 'Money Saved'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
              ₹
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-white group-hover:text-emerald-400 transition">
              ₹{metrics.totalMoneySaved.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {user?.role === 'driver'
              ? 'Shared passenger fare collections'
              : 'vs ₹15/km standard solo cab'}
          </p>
        </div>

        {/* Distance Shared */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 hover:border-brand-500/30 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Distance Shared
            </span>
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-white group-hover:text-brand-400 transition">
              {metrics.totalDistanceKm}
            </span>
            <span className="text-xs text-slate-400 font-bold">km</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {metrics.completedTrips} completed {metrics.completedTrips === 1 ? 'trip' : 'trips'}
          </p>
        </div>

        {/* CO2 Avoided */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 hover:border-teal-500/30 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              CO₂ Avoided
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-white group-hover:text-teal-400 transition">
              {metrics.totalCo2SavedKg}
            </span>
            <span className="text-xs text-slate-400 font-bold">kg</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Based on ~150g CO₂/km baseline
          </p>
        </div>

        {/* Tree Equivalent */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 hover:border-amber-500/30 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Trees Saved
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-white group-hover:text-amber-400 transition">
              {metrics.treesEquivalent}
            </span>
            <span className="text-xs text-slate-400 font-bold">🌲</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Mature tree annual CO₂ absorption
          </p>
        </div>
      </div>

      {/* Visualizations & Trust Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 relative z-10">
        {/* Recharts Monthly History (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-800/30 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" /> Monthly Trends
              </h3>
              <p className="text-xs text-slate-400">
                Tracking your commute trajectory and cumulative eco-gains
              </p>
            </div>

            <div className="flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('savings')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'savings'
                    ? 'bg-brand-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ₹ Savings
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('distance')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'distance'
                    ? 'bg-brand-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Km & CO₂
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'savings' ? (
                <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                    }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Money Saved']}
                  />
                  <Area
                    type="monotone"
                    dataKey="moneySaved"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSavings)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar dataKey="distanceKm" name="Shared Distance (km)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="co2SavedKg" name="CO₂ Avoided (kg)" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rating & Trust Breakdown (1 Col) */}
        <div className="p-5 rounded-2xl bg-slate-800/30 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Commuter Trust
              </h3>
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs font-black text-amber-300">
                  {user?.rating ? user.rating.toFixed(1) : '5.0'}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verified feedback from co-riders across 4 categories
            </p>

            <div className="space-y-3.5 mt-5">
              {[
                { label: 'Punctuality', value: ratings.punctuality?.average || 5.0, count: ratings.punctuality?.count || 0 },
                { label: 'Safety', value: ratings.safety?.average || 5.0, count: ratings.safety?.count || 0 },
                { label: 'Behaviour', value: ratings.behaviour?.average || 5.0, count: ratings.behaviour?.count || 0 },
                { label: 'Cleanliness', value: ratings.cleanliness?.average || 5.0, count: ratings.cleanliness?.count || 0 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">{item.label}</span>
                    <span className="text-amber-400 font-bold">
                      {Number(item.value).toFixed(1)} <span className="text-slate-500 font-normal">({item.count})</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (Number(item.value) / 5) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Rating Score
            </span>
            <span className="text-slate-500">
              {metrics.completedTrips} total {metrics.completedTrips === 1 ? 'trip' : 'trips'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
