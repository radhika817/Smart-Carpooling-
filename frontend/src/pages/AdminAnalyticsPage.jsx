import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Leaf,
  Users,
  Car,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Navigation,
  Layers,
  Building2,
  ArrowRight,
  Award,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { analyticsService } from '../services/analyticsService';

export const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await analyticsService.getAdminAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch platform analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const overview = data?.overview || {
    totalUsers: 0,
    driverUsers: 0,
    passengerUsers: 0,
    verifiedOrgUsers: 0,
    totalRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    activeRides: 0,
    completionRate: 100,
    platformTotalDistanceKm: 0,
    platformTotalSavings: 0,
    platformTotalCo2Kg: 0,
    platformTreesSaved: 0,
  };

  const topCorridors = data?.topCorridors || [];
  const monthlyTrends = data?.monthlyTrends || [];
  const statusDistribution = data?.statusDistribution || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Platform Analytics & ESG Impact
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Macro metrics, verified corridor density, and cumulative environmental impact
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Live Data Sync</span>
          </div>
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Cumulative Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Shared Distance */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cumulative Shared Km
            </span>
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white group-hover:text-brand-400 transition">
              {overview.platformTotalDistanceKm.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-bold">km</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Passenger-km shared on completed trips
          </p>
        </div>

        {/* Platform Cumulative Savings */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net Economic Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              ₹
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-black text-white group-hover:text-emerald-400 transition">
              ₹{overview.platformTotalSavings.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Savings + fuel recovery vs solo cabs
          </p>
        </div>

        {/* CO2 Avoided */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              CO₂ Emissions Avoided
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white group-hover:text-teal-400 transition">
              {overview.platformTotalCo2Kg.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-bold">kg</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {(overview.platformTotalCo2Kg / 1000).toFixed(2)} metric tons avoided
          </p>
        </div>

        {/* Mature Trees Equivalent */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Trees Saved Equivalent
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-white group-hover:text-amber-400 transition">
              {overview.platformTreesSaved.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-bold">🌲</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Annual mature tree carbon offset
          </p>
        </div>
      </div>

      {/* Secondary Row: Platform Demographics & Reliability */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-white">{overview.totalUsers}</div>
            <div className="text-[11px] text-slate-400">
              {overview.driverUsers} Drivers · {overview.passengerUsers} Passengers
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-white">{overview.verifiedOrgUsers}</div>
            <div className="text-[11px] text-slate-400">Corporate & Org Verified</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-white">{overview.completedRides}</div>
            <div className="text-[11px] text-slate-400">Completed Carpools</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-extrabold text-white">{overview.completionRate}%</div>
            <div className="text-[11px] text-slate-400">Trip Fulfillment Rate</div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Platform Trajectory (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400" /> Platform Volume & Shared Km Growth
              </h2>
              <p className="text-xs text-slate-400">
                Monthly trends of completed commuter trips and combined passenger distance
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="rides" name="Completed Rides" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sharedKm" name="Shared Distance (km)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ride Status Distribution PieChart (1 Col) */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-400" /> Ride Status Distribution
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of total scheduled carpool requests
            </p>

            <div className="h-56 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#ffffff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center">
            {statusDistribution.map((item) => (
              <div key={item.name} className="p-2 rounded-xl bg-slate-800/40 border border-slate-800">
                <div className="text-xs font-bold text-white">{item.value}</div>
                <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Corridors Section */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl shadow-xl space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Top Commuter Corridors
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Highest-frequency commute routes identified across completed rides
          </p>
        </div>

        {topCorridors.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-800/20 border border-slate-800/60">
            <Navigation className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No completed corridors yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Top commute routes will rank here as commuters complete scheduled trips.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCorridors.map((corr, idx) => (
              <div
                key={corr.corridor}
                className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800/80 hover:border-brand-500/30 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-bold text-brand-400">Rank #{idx + 1}</span>
                    <span>{corr.rides} completed {corr.rides === 1 ? 'ride' : 'rides'}</span>
                  </div>
                  <div className="font-bold text-sm text-white flex items-center gap-2 break-words">
                    <span>{corr.corridor}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>{corr.passengers} passengers carpooled</span>
                  <span className="font-bold text-emerald-400">{corr.distanceKm} km/trip</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
