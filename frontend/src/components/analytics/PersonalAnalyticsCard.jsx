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
  Calendar,
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
      setError(err?.message || 'Failed to fetch analytics');
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

  const rawRatings = data?.ratingsBreakdown || {};
  const getCat = (cat) => {
    if (typeof cat === 'object' && cat !== null) {
      return {
        average: Number(cat.average ?? 5.0),
        count: Number(cat.count ?? 0),
      };
    }
    return {
      average: typeof cat === 'number' ? cat : 5.0,
      count: 0,
    };
  };

  const ratings = {
    punctuality: getCat(rawRatings.punctuality),
    safety: getCat(rawRatings.safety),
    behaviour: getCat(rawRatings.behaviour),
    cleanliness: getCat(rawRatings.cleanliness),
  };

  // Safe rating extraction
  const userRatingAvg =
    typeof user?.rating === 'object' && user?.rating !== null
      ? user?.rating?.average
      : typeof user?.rating === 'number'
      ? user?.rating
      : 5.0;
  const displayRating = Number(userRatingAvg || 5.0).toFixed(1);

  const totalMoneySaved = Number(metrics.totalMoneySaved || 0);
  const totalDistanceKm = Number(metrics.totalDistanceKm || 0);
  const totalCo2SavedKg = Number(metrics.totalCo2SavedKg || 0);
  const treesEquivalent = Number(metrics.treesEquivalent || 0);
  const completedTrips = Number(metrics.completedTrips || 0);

  const rawTrends = Array.isArray(data?.monthlyTrends) ? data.monthlyTrends : [];
  const monthlyTrends =
    rawTrends.length > 0
      ? rawTrends.map((m) => ({
          month: m.month || 'Current',
          moneySaved: Number(m.moneySaved || 0),
          distanceKm: Number(m.distanceKm || 0),
          co2SavedKg: Number(m.co2SavedKg || 0),
          trips: Number(m.trips || 0),
        }))
      : [
          {
            month: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            moneySaved: 0,
            distanceKm: 0,
            co2SavedKg: 0,
            trips: 0,
          },
        ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Impact & commute analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            Computed strictly from your <strong>completed</strong> rides. Cancelled or open rides contribute 0.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5 relative z-10">
        {/* Money Saved */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">
              {user?.role === 'driver' ? 'Fuel offset recovered' : 'Money saved'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-sm">
              ₹
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-950">
              ₹{totalMoneySaved.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1">
            {user?.role === 'driver'
              ? 'Shared passenger contributions'
              : 'vs ₹15/km standard solo cab'}
          </p>
        </div>

        {/* Distance Shared */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs hover:border-slate-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              Distance shared
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {totalDistanceKm}
            </span>
            <span className="text-xs text-slate-500 font-bold">km</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {completedTrips} completed {completedTrips === 1 ? 'trip' : 'trips'}
          </p>
        </div>

        {/* CO2 Avoided */}
        <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/80 shadow-xs hover:border-teal-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-900">
              CO₂ avoided
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-800">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-950">
              {totalCo2SavedKg}
            </span>
            <span className="text-xs text-teal-700 font-bold">kg</span>
          </div>
          <p className="text-[11px] text-teal-700 mt-1">
            Based on ~150g CO₂/km baseline
          </p>
        </div>

        {/* Tree Equivalent */}
        <div className="p-4 rounded-xl bg-sunrise-50/50 border border-sunrise-200/80 shadow-xs hover:border-sunrise-300 transition group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sunrise-900">
              Trees equivalent
            </span>
            <div className="w-7 h-7 rounded-lg bg-sunrise-100 border border-sunrise-200 flex items-center justify-center text-sunrise-700">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-sunrise-950">
              {treesEquivalent}
            </span>
            <span className="text-xs text-sunrise-700 font-bold">🌲</span>
          </div>
          <p className="text-[11px] text-sunrise-700 mt-1">
            Mature tree annual CO₂ absorption
          </p>
        </div>
      </div>

      {/* Visualizations & Trust Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5 relative z-10">
        {/* Recharts Monthly History (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-50/70 border border-slate-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" /> Monthly trends
              </h3>
              <p className="text-xs text-slate-500">
                Tracking your commute trajectory and cumulative eco-gains
              </p>
            </div>

            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('savings')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'savings'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ₹ Savings
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('distance')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'distance'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Km & CO₂
              </button>
            </div>
          </div>

          <div className="h-64 w-full" style={{ minHeight: '256px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'savings' ? (
                <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '0.75rem',
                      color: '#0F172A',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                    }}
                    formatter={(value) => [`₹${Number(value || 0).toLocaleString()}`, 'Money Saved']}
                  />
                  <Area
                    type="monotone"
                    dataKey="moneySaved"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSavings)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '0.75rem',
                      color: '#0F172A',
                      boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar dataKey="distanceKm" name="Shared Distance (km)" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="co2SavedKg" name="CO₂ Avoided (kg)" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Rating & Trust Breakdown (1 Col) */}
        <div className="p-5 rounded-xl bg-slate-50/70 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-sunrise-500 fill-sunrise-500" /> Commuter trust
              </h3>
              <div className="flex items-center gap-1 bg-sunrise-50 border border-sunrise-200/80 px-2 py-0.5 rounded-lg">
                <Star className="w-3.5 h-3.5 text-sunrise-500 fill-sunrise-500" />
                <span className="text-xs font-bold text-sunrise-800">
                  {displayRating}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Verified feedback from co-riders across 4 categories
            </p>

            <div className="space-y-3.5 mt-5">
              {[
                { label: 'Punctuality', val: ratings.punctuality.average, count: ratings.punctuality.count },
                { label: 'Safety', val: ratings.safety.average, count: ratings.safety.count },
                { label: 'Behaviour', val: ratings.behaviour.average, count: ratings.behaviour.count },
                { label: 'Cleanliness', val: ratings.cleanliness.average, count: ratings.cleanliness.count },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-700 font-medium">{item.label}</span>
                    <span className="text-sunrise-800 font-bold">
                      {item.val.toFixed(1)} <span className="text-slate-400 font-normal">({item.count})</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sunrise-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (item.val / 5) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified rating score
            </span>
            <span className="text-slate-400">
              {completedTrips} total {completedTrips === 1 ? 'trip' : 'trips'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
