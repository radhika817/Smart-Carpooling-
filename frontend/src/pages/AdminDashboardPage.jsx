import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Car,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Ban,
  Activity,
  Layers,
  Shield,
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'rides' | 'sos'

  // Overview State
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Users State
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  // Rides State
  const [rides, setRides] = useState([]);
  const [rideStatusFilter, setRideStatusFilter] = useState('all');
  const [loadingRides, setLoadingRides] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedRideForCancel, setSelectedRideForCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // SOS Incidents State
  const [sosAlerts, setSosAlerts] = useState([]);
  const [sosStatusFilter, setSosStatusFilter] = useState('all');
  const [loadingSos, setLoadingSos] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedSos, setSelectedSos] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // General Notification
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 5000);
  };

  // Load Overview Data
  const loadOverview = async () => {
    try {
      setLoadingOverview(true);
      const res = await adminService.getOverview();
      setOverview(res.data);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to load system overview');
    } finally {
      setLoadingOverview(false);
    }
  };

  // Load Users
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const params = {};
      if (userSearch.trim()) params.search = userSearch.trim();
      if (userRoleFilter !== 'all') params.role = userRoleFilter;
      if (userStatusFilter === 'suspended') params.isSuspended = 'true';
      if (userStatusFilter === 'active') params.isSuspended = 'false';

      const res = await adminService.getUsers(params);
      setUsers(res.data.users || []);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to fetch platform users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load Rides
  const loadRides = async () => {
    try {
      setLoadingRides(true);
      const params = {};
      if (rideStatusFilter !== 'all') params.status = rideStatusFilter;
      const res = await adminService.getRides(params);
      setRides(res.data.rides || []);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to fetch platform rides');
    } finally {
      setLoadingRides(false);
    }
  };

  // Load SOS Incidents
  const loadSosAlerts = async () => {
    try {
      setLoadingSos(true);
      const params = {};
      if (sosStatusFilter !== 'all') params.status = sosStatusFilter;
      const res = await adminService.getSosAlerts(params);
      setSosAlerts(res.data || []);
    } catch (err) {
      showFeedback('error', err.message || 'Failed to load safety alerts');
    } finally {
      setLoadingSos(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'rides') loadRides();
    if (activeTab === 'sos') loadSosAlerts();
  }, [activeTab, userRoleFilter, userStatusFilter, rideStatusFilter, sosStatusFilter]);

  // Handle User Suspension Toggle
  const handleConfirmSuspension = async () => {
    if (!selectedUserForAction) return;
    try {
      const nextSuspended = !selectedUserForAction.isSuspended;
      await adminService.updateUserStatus(selectedUserForAction._id || selectedUserForAction.id, {
        isSuspended: nextSuspended,
        reason: suspendReason,
      });
      showFeedback('success', `User account ${nextSuspended ? 'suspended' : 'reactivated'} successfully.`);
      setSuspendModalOpen(false);
      setSelectedUserForAction(null);
      setSuspendReason('');
      loadUsers();
      loadOverview();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update account status');
    }
  };

  // Handle User Role Change
  const handleChangeUserRole = async (targetUser, newRole) => {
    try {
      await adminService.updateUserRole(targetUser._id || targetUser.id, newRole);
      showFeedback('success', `User role changed to ${newRole}.`);
      loadUsers();
      loadOverview();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update role');
    }
  };

  // Handle Verification Override
  const handleToggleUserVerification = async (targetUser, key) => {
    try {
      const currentVal = Boolean(targetUser.verificationStatus?.[key]);
      await adminService.updateUserVerification(targetUser._id || targetUser.id, {
        [key]: !currentVal,
      });
      showFeedback('success', `Updated ${key} verification status.`);
      loadUsers();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to update verification status');
    }
  };

  // Handle Admin Ride Cancellation
  const handleConfirmRideCancel = async () => {
    if (!selectedRideForCancel) return;
    try {
      await adminService.cancelRide(selectedRideForCancel._id, cancelReason);
      showFeedback('success', 'Ride cancelled by administrator.');
      setCancelModalOpen(false);
      setSelectedRideForCancel(null);
      setCancelReason('');
      loadRides();
      loadOverview();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to cancel ride');
    }
  };

  // Handle SOS Resolution
  const handleConfirmResolveSos = async () => {
    if (!selectedSos) return;
    try {
      await adminService.resolveSosAlert(selectedSos._id, resolutionNotes);
      showFeedback('success', 'SOS incident marked as resolved.');
      setResolveModalOpen(false);
      setSelectedSos(null);
      setResolutionNotes('');
      loadSosAlerts();
      loadOverview();
    } catch (err) {
      showFeedback('error', err.message || 'Failed to resolve incident');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 shadow-xs">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-display">
                Operations console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                Admin privilege
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Platform administration, community scoping, user governance, and safety oversight.
            </p>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback.message && (
          <div
            className={`px-4 py-3 rounded-xl text-xs font-semibold border flex items-center gap-2 animate-fadeIn shadow-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" /> : <XCircle className="w-4 h-4 shrink-0 text-red-700" />}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Activity className="w-4 h-4 text-brand-700" />
          <span>System overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Users className="w-4 h-4 text-brand-700" />
          <span>User management</span>
          {overview?.totalUsers > 0 && (
            <span className="px-2 py-0.2 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
              {overview.totalUsers}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rides')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'rides'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Car className="w-4 h-4 text-brand-700" />
          <span>Rides oversight</span>
          {overview?.totalRides > 0 && (
            <span className="px-2 py-0.2 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
              {overview.totalRides}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
            activeTab === 'sos'
              ? 'bg-red-600 text-white shadow-xs'
              : 'text-red-700 hover:text-red-800 hover:bg-red-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>SOS incident center</span>
          {overview?.activeSosCount > 0 && (
            <span className="px-2 py-0.2 rounded-full text-xs font-bold bg-white text-red-700 border border-red-200 animate-pulse">
              {overview.activeSosCount} active
            </span>
          )}
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: SYSTEM OVERVIEW */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total users</span>
                <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-2 font-display">
                {loadingOverview ? '...' : overview?.totalUsers || 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Drivers: {overview?.driverCount || 0} • Passengers: {overview?.passengerCount || 0}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Platform rides</span>
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Car className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-2 font-display">
                {loadingOverview ? '...' : overview?.totalRides || 0}
              </div>
              <div className="text-xs text-emerald-800 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>{overview?.completedRides || 0} completed</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">{overview?.activeRides || 0} active</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Active SOS incidents</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${overview?.activeSosCount > 0 ? 'bg-red-100 border border-red-200 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-3xl font-bold mt-2 font-display ${overview?.activeSosCount > 0 ? 'text-red-700 animate-pulse' : 'text-slate-900'}`}>
                {loadingOverview ? '...' : overview?.activeSosCount || 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {overview?.activeSosCount > 0 ? 'Urgent attention required' : 'All incidents clear'}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Carpool groups</span>
                <div className="w-8 h-8 rounded-lg bg-sunrise-50 border border-sunrise-200 flex items-center justify-center text-sunrise-700">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-2 font-display">
                {loadingOverview ? '...' : overview?.totalGroups || 0}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Active commuter circles
              </div>
            </div>
          </div>

          {/* Quick Operations Actions */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-700" />
              Administrative capabilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <span className="font-bold text-slate-900 block mb-1 text-sm">User governance & suspension</span>
                Instantly suspend suspicious accounts or promote users to driver/admin. Suspended accounts are immediately blocked from logging in.
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <span className="font-bold text-slate-900 block mb-1 text-sm">Ride oversight & cancellation</span>
                Inspect platform rides, view active recurring series, and cancel problematic trips with logged administrative reasons.
              </div>
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <span className="font-bold text-slate-900 block mb-1 text-sm">Live SOS resolution</span>
                Real-time visibility into emergency alarms with GPS coordinates, emergency contact logs, and post-dispatch resolution signoff.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: USER MANAGEMENT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                placeholder="Search by name, email, or phone..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-brand-600 transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:bg-white"
              >
                <option value="all">All roles</option>
                <option value="passenger">Passengers</option>
                <option value="driver">Drivers</option>
                <option value="admin">Administrators</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:bg-white"
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="suspended">Suspended only</option>
              </select>

              <button
                onClick={loadUsers}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Affiliation</th>
                    <th className="py-3 px-4">Verifications</th>
                    <th className="py-3 px-4">Account status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isSelf = (currentUser?._id || currentUser?.id) === (u._id || u.id);
                      return (
                        <tr key={u._id || u.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center font-bold text-xs text-brand-800">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-900 block">{u.name}</span>
                                <span className="text-[11px] text-slate-500">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <select
                              value={u.role}
                              disabled={isSelf}
                              onChange={(e) => handleChangeUserRole(u, e.target.value)}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                u.role === 'admin'
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : u.role === 'driver'
                                  ? 'bg-brand-50 text-brand-800 border-brand-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              } focus:outline-none`}
                            >
                              <option value="passenger">Passenger</option>
                              <option value="driver">Driver</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-slate-700">
                              {u.organization || <span className="text-slate-400">None</span>}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleUserVerification(u, 'email')}
                                title="Toggle email verified"
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                                  u.verificationStatus?.email
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                Email
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserVerification(u, 'phone')}
                                title="Toggle phone verified"
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                                  u.verificationStatus?.phone
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                Phone
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserVerification(u, 'organization')}
                                title="Toggle organization verified"
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                                  u.verificationStatus?.organization
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                Org
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserVerification(u, 'govtId')}
                                title="Toggle government ID verified"
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition ${
                                  u.verificationStatus?.govtId
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                ID
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {u.isSuspended ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
                                <Ban className="w-3 h-3" />
                                Suspended
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                Active
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {isSelf ? (
                              <span className="text-xs text-slate-400 italic">Self (Protected)</span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedUserForAction(u);
                                  setSuspendReason(u.suspendedReason || '');
                                  setSuspendModalOpen(true);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition ${
                                  u.isSuspended
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                                }`}
                              >
                                {u.isSuspended ? 'Reactivate' : 'Suspend'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 3: RIDES OVERSIGHT */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'rides' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Status filter:</span>
              <select
                value={rideStatusFilter}
                onChange={(e) => setRideStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">All rides</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <button
              onClick={loadRides}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh rides</span>
            </button>
          </div>

          {/* Rides List Table */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date & time</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Seats / price</th>
                    <th className="py-3 px-4">Status & scope</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingRides ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        Loading rides...
                      </td>
                    </tr>
                  ) : rides.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-slate-500">
                        No rides found.
                      </td>
                    </tr>
                  ) : (
                    rides.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{r.date}</span>
                          <span className="text-[11px] text-slate-500">{r.departureTime}</span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="text-slate-900 block font-medium truncate max-w-[180px]">
                              {r.startLocation?.address}
                            </span>
                            <span className="text-[11px] text-sunrise-700 block truncate max-w-[180px] font-medium">
                              → {r.destination?.address}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{r.driver?.name}</span>
                          <span className="text-[11px] text-slate-500">{r.driver?.organization || 'Individual'}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-800 block font-medium">{r.vehicle?.model}</span>
                          <span className="text-[11px] text-slate-500">{r.vehicle?.registrationNumber}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-900 font-semibold block">{r.availableSeats} / {r.totalSeats} seats</span>
                          <span className="text-xs text-brand-800 font-bold">₹{r.estimatedCost}</span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                r.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : r.status === 'IN_PROGRESS'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : r.status === 'CANCELLED'
                                  ? 'bg-red-50 text-red-800 border-red-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {r.status}
                            </span>

                            {r.recurrence?.isRecurring && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Recurring
                              </span>
                            )}

                            {r.communityScope?.isRestricted && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-sunrise-50 text-sunrise-800 border border-sunrise-200">
                                🏢 {r.communityScope.organization}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {['OPEN', 'BOOKING', 'IN_PROGRESS'].includes(r.status) && (
                            <button
                              onClick={() => {
                                setSelectedRideForCancel(r);
                                setCancelModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition"
                            >
                              Cancel ride
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 4: SOS INCIDENT CENTER */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'sos' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Incident status:</span>
              <select
                value={sosStatusFilter}
                onChange={(e) => setSosStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">All incidents</option>
                <option value="ACTIVE">Active alarms only</option>
                <option value="RESOLVED">Resolved only</option>
              </select>
            </div>

            <button
              onClick={loadSosAlerts}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh feed</span>
            </button>
          </div>

          {/* SOS Incidents Table */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Initiator</th>
                    <th className="py-3 px-4">Reported location</th>
                    <th className="py-3 px-4">Dispatched contacts</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingSos ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        Loading safety alerts...
                      </td>
                    </tr>
                  ) : sosAlerts.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-500">
                        No SOS alarms on record. Safety network is clear.
                      </td>
                    </tr>
                  ) : (
                    sosAlerts.map((alert) => (
                      <tr key={alert._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4">
                          {alert.status === 'ACTIVE' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5 w-fit animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              Active alarm
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              Resolved
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{alert.triggeredBy?.name}</span>
                          <span className="text-[11px] text-slate-500">
                            Role: {alert.userRole} • Phone: {alert.triggeredBy?.phone || 'N/A'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-900 block font-medium truncate max-w-[200px]">
                            {alert.location?.address}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            [{alert.location?.coordinates?.join(', ')}]
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-900 block font-semibold">
                            {alert.notifiedContacts?.length || 0} contacts notified
                          </span>
                          <span className="text-[11px] text-slate-500">
                            112 Police & 108 Medics dispatched
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-900 block font-medium">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {new Date(alert.createdAt).toLocaleTimeString()}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {alert.status === 'ACTIVE' && (
                            <button
                              onClick={() => {
                                setSelectedSos(alert);
                                setResolveModalOpen(true);
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition shadow-xs"
                            >
                              Resolve incident
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: SUSPEND / REACTIVATE USER */}
      {/* ---------------------------------------------------- */}
      {suspendModalOpen && selectedUserForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-600" />
              {selectedUserForAction.isSuspended ? 'Reactivate account' : 'Suspend account'}
            </h3>
            <p className="text-xs text-slate-600">
              User: <span className="font-semibold text-slate-900">{selectedUserForAction.name}</span> ({selectedUserForAction.email})
            </p>

            {!selectedUserForAction.isSuspended && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for suspension (visible to user):
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Conduct violation, safety report, ID verification mismatch"
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-red-500 min-h-[80px]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspension}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs ${
                  selectedUserForAction.isSuspended
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Confirm {selectedUserForAction.isSuspended ? 'reactivation' : 'suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADMIN CANCEL RIDE */}
      {/* ---------------------------------------------------- */}
      {cancelModalOpen && selectedRideForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Administrative ride cancellation
            </h3>
            <p className="text-xs text-slate-600">
              Ride: <span className="font-semibold text-slate-900">{selectedRideForCancel.startLocation?.address} → {selectedRideForCancel.destination?.address}</span> on {selectedRideForCancel.date}
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Reason for cancellation:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Safety investigation, driver vehicle breakdown, route road closure"
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-red-500 min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRideCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition"
              >
                Confirm cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: RESOLVE SOS ALERT */}
      {/* ---------------------------------------------------- */}
      {resolveModalOpen && selectedSos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              Mark SOS incident as resolved
            </h3>
            <p className="text-xs text-slate-600">
              Initiator: <span className="font-semibold text-slate-900">{selectedSos.triggeredBy?.name}</span> ({selectedSos.userRole})
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Resolution investigation notes:
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Commuter verified safe. False alarm / Authorities responded."
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-600 min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResolveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolveSos}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition"
              >
                Sign off & close incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
