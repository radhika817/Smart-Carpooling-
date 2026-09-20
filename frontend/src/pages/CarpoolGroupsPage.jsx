import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  KeyRound,
  Search,
  Building,
  MapPin,
  Clock,
  Lock,
  Globe,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Car,
} from 'lucide-react';

export const CarpoolGroupsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [myGroupsOnly, setMyGroupsOnly] = useState(false);

  // Modals State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinCodeModalOpen, setJoinCodeModalOpen] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');

  // Create Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    organization: user?.organization || '',
    originAddress: 'Shivajinagar, Pune',
    originCoords: [73.852, 18.531],
    destinationAddress: 'Hinjewadi Phase 1, Pune',
    destinationCoords: [73.738, 18.591],
    scheduleDescription: 'Mon-Fri 08:30 AM',
    isPrivate: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadGroups = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (myGroupsOnly) params.myGroups = 'true';
      const res = await groupService.getGroups(params);
      setGroups(res.data || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [myGroupsOnly]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Group name is required.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError('');
      const res = await groupService.createGroup({
        name: formData.name.trim(),
        description: formData.description.trim(),
        organization: formData.organization.trim(),
        origin: { address: formData.originAddress, coordinates: formData.originCoords },
        destination: { address: formData.destinationAddress, coordinates: formData.destinationCoords },
        scheduleDescription: formData.scheduleDescription.trim(),
        isPrivate: formData.isPrivate,
      });
      setCreateModalOpen(false);
      navigate(`/groups/${res.data._id}`);
    } catch (err) {
      setFormError(err.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) {
      setJoinError('Please enter an invite code.');
      return;
    }
    try {
      setJoinError('');
      const res = await groupService.joinByCode(inviteCodeInput.trim());
      setJoinCodeModalOpen(false);
      setInviteCodeInput('');
      navigate(`/groups/${res.data._id}`);
    } catch (err) {
      setJoinError(err.message || 'Failed to join group with this code.');
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center shadow-2xs">
            <Users className="w-8 h-8 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Carpool Groups & Commuter Circles</h1>
            <p className="text-sm text-slate-600 mt-1">
              Join or create recurring carpooling communities with colleagues, classmates, and verified neighbors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setJoinCodeModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition flex items-center gap-1.5"
          >
            <KeyRound className="w-4 h-4 text-brand-600" />
            <span>Join by code</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create group</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadGroups()}
            placeholder="Search groups by name, route corridor, or community..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMyGroupsOnly(!myGroupsOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              myGroupsOnly
                ? 'bg-brand-50 text-brand-700 border-brand-300 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {myGroupsOnly ? '✓ Showing my groups' : 'My groups'}
          </button>

          <button
            onClick={loadGroups}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-sm">
          Loading carpool communities...
        </div>
      ) : groups.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-300 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No carpool groups found</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {myGroupsOnly
              ? "You haven't joined any carpool groups yet. Create one or join an existing community with an invite code!"
              : 'Be the first to create a commuter circle for your campus or workplace!'}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white inline-flex items-center gap-1.5 shadow-md shadow-brand-600/20"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create first group</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const isMember = group.members?.some(
              (m) => (m.user?._id || m.user?.id || m.user) === (user?._id || user?.id)
            );
            return (
              <div
                key={group._id}
                className="p-5 rounded-xl bg-white border border-slate-200/90 hover:border-brand-500/50 hover:shadow-md transition flex flex-col justify-between shadow-xs group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-700 transition">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {group.isPrivate ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Private
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          Public
                        </span>
                      )}
                    </div>
                  </div>

                  {group.organization && (
                    <div className="flex items-center gap-1.5 text-xs text-sunrise-700 font-semibold">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span>{group.organization}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {group.description || 'Shared commuter circle with verified community members.'}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                      <span className="truncate">{group.origin?.address || 'Origin TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-sunrise-700 shrink-0" />
                      <span className="truncate">→ {group.destination?.address || 'Destination TBD'}</span>
                    </div>
                    {group.scheduleDescription && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{group.scheduleDescription}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {group.members?.length || 1} members
                    </span>
                    {isMember && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                        Joined
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/groups/${group._id}`}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition flex items-center gap-1"
                  >
                    <span>View circle</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: CREATE GROUP */}
      {/* ---------------------------------------------------- */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-600" />
              Create Carpool Community Circle
            </h3>

            {formError && (
              <div className="p-3 rounded-xl text-xs bg-red-50 text-red-700 border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Group name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Hinjewadi IT Express, BITS Pilani Commuters"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Affiliation / Organization</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Infosys, IIT Bombay, Symbiosis"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Frequent origin</label>
                  <input
                    type="text"
                    value={formData.originAddress}
                    onChange={(e) => setFormData({ ...formData, originAddress: e.target.value })}
                    placeholder="e.g. Kothrud, Pune"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Frequent destination</label>
                  <input
                    type="text"
                    value={formData.destinationAddress}
                    onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })}
                    placeholder="e.g. Hinjewadi Phase 2"
                    className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Schedule timing</label>
                <input
                  type="text"
                  value={formData.scheduleDescription}
                  onChange={(e) => setFormData({ ...formData, scheduleDescription: e.target.value })}
                  placeholder="e.g. Mon-Fri 08:30 AM departure"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Commute guidelines, shared route expectations, etc."
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 min-h-[60px]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Private group</span>
                  <span className="text-[11px] text-slate-500">
                    Require invite code to join this circle
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="w-4 h-4 rounded accent-brand-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-600/20 transition"
                >
                  {submitting ? 'Creating...' : 'Create group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: JOIN BY CODE */}
      {/* ---------------------------------------------------- */}
      {joinCodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-brand-600" />
              Join Group by Invite Code
            </h3>
            <p className="text-xs text-slate-600">
              Enter the unique invite code provided by your carpool circle creator.
            </p>

            {joinError && (
              <div className="p-3 rounded-xl text-xs bg-red-50 text-red-700 border border-red-200">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinByCode} className="space-y-3">
              <input
                type="text"
                required
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. 3637B4"
                className="w-full p-3 rounded-xl bg-white border border-slate-300 text-base tracking-widest text-center font-mono font-bold text-brand-700 uppercase focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setJoinCodeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition shadow-md shadow-brand-600/20"
                >
                  Join circle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
