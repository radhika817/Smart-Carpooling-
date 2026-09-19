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
  Filter,
  RefreshCw,
  Clock,
  MapPin,
  Building,
  UserCheck,
  Phone,
  Mail,
  Shield,
  FileCheck,
  Ban,
  Activity,
  Award,
  Layers,
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Shield className="w-8 h-8 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-white">Platform Operations Console</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                Admin Privilege
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Platform administration, community scoping, user governance, and safety oversight.
            </p>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback.message && (
          <div
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold border flex items-center gap-2 animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-red-500/10 text-red-300 border-red-500/20'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
          {overview?.totalUsers > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 text-slate-300">
              {overview.totalUsers}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('rides')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'rides'
              ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Rides Oversight</span>
          {overview?.totalRides > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 text-slate-300">
              {overview.totalRides}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'sos'
              ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
              : 'text-slate-400 hover:text-red-400 hover:bg-slate-800/50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>SOS Incident Center</span>
          {overview?.activeSosCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-950 text-red-200 border border-red-800 animate-pulse">
              {overview.activeSosCount} Active
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
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Users</span>
                <Users className="w-5 h-5 text-brand-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2">
                {loadingOverview ? '...' : overview?.totalUsers || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Drivers: {overview?.driverCount || 0} • Passengers: {overview?.passengerCount || 0}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform Rides</span>
                <Car className="w-5 h-5 text-teal-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2">
                {loadingOverview ? '...' : overview?.totalRides || 0}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{overview?.completedRides || 0} Completed</span>
                <span className="text-slate-500">• {overview?.activeRides || 0} Active</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active SOS Incidents</span>
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </div>
              <div className={`text-3xl font-black mt-2 ${overview?.activeSosCount > 0 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                {loadingOverview ? '...' : overview?.activeSosCount || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {overview?.activeSosCount > 0 ? 'Urgent attention required' : 'All incidents resolved'}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Carpool Groups</span>
                <Layers className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-3xl font-black text-white mt-2">
                {loadingOverview ? '...' : overview?.totalGroups || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Active campus & corporate commuter circles
              </div>
            </div>
          </div>

          {/* Quick Operations Actions */}
          <div className="p-6 rounded-3xl bg-slate-950/70 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
              Administrative Capabilities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="font-bold text-white block mb-1">User Governance & Suspension</span>
                Instantly suspend suspicious accounts or promote users to driver/admin. Suspended accounts are immediately blocked from logging in.
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="font-bold text-white block mb-1">Ride Oversight & Cancellation</span>
                Inspect platform rides, view active recurring series, and cancel problematic trips with logged administrative reasons.
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <span className="font-bold text-white block mb-1">Live SOS Resolution</span>
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
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                placeholder="Search by name, email, or phone..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="passenger">Passengers</option>
                <option value="driver">Drivers</option>
                <option value="admin">Administrators</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>

              <button
                onClick={loadUsers}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Affiliation</th>
                    <th className="py-3 px-4">Verifications</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
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
                        <tr key={u._id || u.id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <span className="font-semibold text-white block">{u.name}</span>
                                <span className="text-[10px] text-slate-400">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <select
                              value={u.role}
                              disabled={isSelf}
                              onChange={(e) => handleChangeUserRole(u, e.target.value)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                u.role === 'admin'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                  : u.role === 'driver'
                                  ? 'bg-teal-500/10 text-teal-400 border-teal-500/30'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              } focus:outline-none`}
                            >
                              <option value="passenger">Passenger</option>
                              <option value="driver">Driver</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-slate-300">
                              {u.organization || <span className="text-slate-500">None</span>}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleUserVerification(u, 'email')}
                                title="Toggle Email Verified"
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  u.verificationStatus?.email
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                Email
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserVerification(u, 'phone')}
                                title="Toggle Phone Verified"
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  u.verificationStatus?.phone
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                Phone
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserVerification(u, 'organization')}
                                title="Toggle Organization Verified"
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  u.verificationStatus?.organization
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                Org
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserVerification(u, 'govtId')}
                                title="Toggle Government ID Verified"
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  u.verificationStatus?.govtId
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                ID
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {u.isSuspended ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1 w-fit">
                                <Ban className="w-3 h-3" />
                                Suspended
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {isSelf ? (
                              <span className="text-[10px] text-slate-500 italic">Self (Protected)</span>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedUserForAction(u);
                                  setSuspendReason(u.suspendedReason || '');
                                  setSuspendModalOpen(true);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
                                  u.isSuspended
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
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
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Status Filter:</span>
              <select
                value={rideStatusFilter}
                onChange={(e) => setRideStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Rides</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <button
              onClick={loadRides}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Rides</span>
            </button>
          </div>

          {/* Rides List Table */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Driver</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Seats / Price</th>
                    <th className="py-3 px-4">Status & Scope</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
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
                      <tr key={r._id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{r.date}</span>
                          <span className="text-[10px] text-slate-400">{r.departureTime}</span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="text-white block font-medium truncate max-w-[180px]">
                              {r.startLocation?.address}
                            </span>
                            <span className="text-[10px] text-brand-400 block truncate max-w-[180px]">
                              → {r.destination?.address}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{r.driver?.name}</span>
                          <span className="text-[10px] text-slate-500">{r.driver?.organization || 'Individual'}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-300 block">{r.vehicle?.model}</span>
                          <span className="text-[10px] text-slate-500">{r.vehicle?.registrationNumber}</span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-white font-semibold block">{r.availableSeats} / {r.totalSeats} seats</span>
                          <span className="text-[10px] text-emerald-400">₹{r.estimatedCost}</span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                r.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : r.status === 'IN_PROGRESS'
                                  ? 'bg-brand-500/10 text-brand-400 border-brand-500/30'
                                  : r.status === 'CANCELLED'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {r.status}
                            </span>

                            {r.recurrence?.isRecurring && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                🔄 Recurring Series
                              </span>
                            )}

                            {r.communityScope?.isRestricted && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
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
                              className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                            >
                              Admin Cancel
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
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Incident Status:</span>
              <select
                value={sosStatusFilter}
                onChange={(e) => setSosStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Incidents</option>
                <option value="ACTIVE">Active Alarms Only</option>
                <option value="RESOLVED">Resolved Only</option>
              </select>
            </div>

            <button
              onClick={loadSosAlerts}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh SOS Feed</span>
            </button>
          </div>

          {/* SOS Incidents Table */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Initiator</th>
                    <th className="py-3 px-4">Reported Location</th>
                    <th className="py-3 px-4">Dispatched Contacts</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
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
                      <tr key={alert._id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4">
                          {alert.status === 'ACTIVE' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1.5 w-fit animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Active Alarm
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Resolved
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{alert.triggeredBy?.name}</span>
                          <span className="text-[10px] text-slate-400">
                            Role: {alert.userRole} • Phone: {alert.triggeredBy?.phone || 'N/A'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-white block font-medium truncate max-w-[200px]">
                            {alert.location?.address}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            [{alert.location?.coordinates?.join(', ')}]
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-300 block font-semibold">
                            {alert.notifiedContacts?.length || 0} Contacts Notified
                          </span>
                          <span className="text-[10px] text-slate-500">
                            112 Police & 108 Medics Dispatched
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-300 block">
                            {new Date(alert.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-slate-500">
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
                              className="px-3 py-1 rounded-xl text-[10px] font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition"
                            >
                              Resolve Incident
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-400" />
              {selectedUserForAction.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
            </h3>
            <p className="text-xs text-slate-300">
              User: <span className="font-semibold text-white">{selectedUserForAction.name}</span> ({selectedUserForAction.email})
            </p>

            {!selectedUserForAction.isSuspended && (
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Reason for Suspension (Visible to User):
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g. Conduct violation, safety report, ID verification mismatch"
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-red-500 min-h-[80px]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspension}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  selectedUserForAction.isSuspended
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20'
                }`}
              >
                Confirm {selectedUserForAction.isSuspended ? 'Reactivation' : 'Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: ADMIN CANCEL RIDE */}
      {/* ---------------------------------------------------- */}
      {cancelModalOpen && selectedRideForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              Administrative Ride Cancellation
            </h3>
            <p className="text-xs text-slate-300">
              Ride: <span className="font-semibold text-white">{selectedRideForCancel.startLocation?.address} → {selectedRideForCancel.destination?.address}</span> on {selectedRideForCancel.date}
            </p>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Reason for Cancellation:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Safety investigation, driver vehicle breakdown, route road closure"
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-red-500 min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRideCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20 transition"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: RESOLVE SOS ALERT */}
      {/* ---------------------------------------------------- */}
      {resolveModalOpen && selectedSos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Mark SOS Incident as Resolved
            </h3>
            <p className="text-xs text-slate-300">
              Initiator: <span className="font-semibold text-white">{selectedSos.triggeredBy?.name}</span> ({selectedSos.userRole})
            </p>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Resolution Investigation Notes:
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Commuter verified safe. False alarm / Authorities responded."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResolveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResolveSos}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition"
              >
                Sign Off & Close Incident
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
