import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Users,
  CheckCircle2,
  RefreshCw,
  Navigation,
  Layers,
  Building2,
  Award,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">
                Platform analytics & ESG impact
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Macro metrics, verified corridor density, and cumulative environmental impact
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-50 border border-brand-200 text-xs font-semibold text-brand-800">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-ping" />
            <span>Live data sync</span>
          </div>
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 transition flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-700' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold shadow-xs">
          {error}
        </div>
      )}

      {/* Cumulative Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Shared Distance */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Cumulative shared distance
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-display">
              {Number(overview?.platformTotalDistanceKm || 0).toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-bold">km</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Passenger-km shared on completed trips
          </p>
        </div>

        {/* Platform Cumulative Savings */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Net economic value
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold">
              ₹
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate-900 font-display">
              ₹{Number(overview?.platformTotalSavings || 0).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Savings & fuel recovery vs solo rides
          </p>
        </div>

        {/* CO2 Avoided */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              CO₂ emissions avoided
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-display">
              {Number(overview?.platformTotalCo2Kg || 0).toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-bold">kg</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {(Number(overview?.platformTotalCo2Kg || 0) / 1000).toFixed(2)} metric tons avoided
          </p>
        </div>

        {/* Mature Trees Equivalent */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Trees saved equivalent
            </span>
            <div className="w-8 h-8 rounded-lg bg-sunrise-50 border border-sunrise-200 flex items-center justify-center text-sunrise-800">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-display">
              {Number(overview?.platformTreesSaved || 0).toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-bold">trees</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Annual mature tree carbon offset
          </p>
        </div>
      </div>

      {/* Secondary Row: Platform Demographics & Reliability */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{overview.totalUsers}</div>
            <div className="text-xs text-slate-500">
              {overview.driverUsers} drivers · {overview.passengerUsers} passengers
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{overview.verifiedOrgUsers}</div>
            <div className="text-xs text-slate-500">Corporate & org verified</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{overview.completedRides}</div>
            <div className="text-xs text-slate-500">Completed carpools</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sunrise-50 border border-sunrise-200 text-sunrise-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">{overview.completionRate}%</div>
            <div className="text-xs text-slate-500">Trip fulfillment rate</div>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Platform Trajectory (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-700" /> Platform volume & shared distance growth
              </h2>
              <p className="text-xs text-slate-500">
                Monthly trends of completed commuter trips and combined passenger distance
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '0.75rem',
                    color: '#0F172A',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="rides" name="Completed rides" fill="#047857" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sharedKm" name="Shared distance (km)" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ride Status Distribution PieChart (1 Col) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-700" /> Ride status distribution
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
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
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '0.75rem',
                      color: '#0F172A',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            {statusDistribution.map((item) => (
              <div key={item.name} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="text-xs font-bold text-slate-900">{item.value}</div>
                <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Corridors Section */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-700" /> Top commuter corridors
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Highest-frequency commute routes identified across completed rides
          </p>
        </div>

        {topCorridors.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200">
            <Navigation className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No completed corridors yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Top commute routes will rank here as commuters complete scheduled trips.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topCorridors.map((corr, idx) => (
              <div
                key={corr.corridor}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-brand-300 hover:bg-white transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-bold text-brand-800">Rank #{idx + 1}</span>
                    <span>{corr.rides} completed {corr.rides === 1 ? 'ride' : 'rides'}</span>
                  </div>
                  <div className="font-semibold text-sm text-slate-900 flex items-center gap-2 break-words">
                    <span>{corr.corridor}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                  <span>{corr.passengers} passengers carpooled</span>
                  <span className="font-bold text-emerald-800">{corr.distanceKm} km/trip</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
