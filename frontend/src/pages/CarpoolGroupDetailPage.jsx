import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  KeyRound,
  Copy,
  Check,
  Building,
  MapPin,
  Clock,
  Lock,
  Globe,
  PlusCircle,
  Car,
  Calendar,
  ChevronLeft,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const CarpoolGroupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [group, setGroup] = useState(null);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState('rides'); // 'rides' | 'members'
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [bookingRideId, setBookingRideId] = useState(null);

  const loadGroupDetails = async () => {
    try {
      setLoading(true);
      const [groupRes, ridesRes] = await Promise.all([
        groupService.getGroupById(id),
        groupService.getGroupRides(id),
      ]);
      setGroup(groupRes.data);
      setRides(ridesRes.data || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load group details' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupDetails();
  }, [id]);

  const handleCopyCode = () => {
    if (!group?.inviteCode) return;
    navigator.clipboard.writeText(group.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this carpool circle?')) return;
    try {
      await groupService.leaveGroup(id);
      navigate('/groups');
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to leave group' });
    }
  };

  const handleBookSeat = async (rideId) => {
    try {
      setBookingRideId(rideId);
      await rideService.bookSeat(rideId, { seats: 1 });
      setFeedback({ type: 'success', message: 'Seat booked successfully!' });
      loadGroupDetails();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to book seat' });
    } finally {
      setBookingRideId(null);
    }
  };

  const isMember = group?.members?.some(
    (m) => (m.user?._id || m.user?.id || m.user) === (user?._id || user?.id)
  );
  const isCreator = (group?.creator?._id || group?.creator?.id || group?.creator) === (user?._id || user?.id);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400 text-sm">
        Loading carpool circle...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <p className="text-white text-base">Carpool circle not found.</p>
        <Link to="/groups" className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold">
          Return to Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/groups"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Groups</span>
      </Link>

      {/* Global Feedback */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold border flex items-center gap-2 animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
              : 'bg-red-500/10 text-red-300 border-red-500/20'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Group Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">{group.name}</h1>
              {group.isPrivate ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Private Circle
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Public Community
                </span>
              )}
            </div>

            {group.organization && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mt-1.5">
                <Building className="w-4 h-4 shrink-0" />
                <span>Affiliated with {group.organization}</span>
              </div>
            )}
          </div>

          {/* Invite Code Badge */}
          {group.inviteCode && (
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3 shrink-0">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Invite Code</span>
                <span className="text-base font-mono font-black text-brand-400 tracking-wider">
                  {group.inviteCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                title="Copy Invite Code"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {group.description && (
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            {group.description}
          </p>
        )}

        {/* Route Corridor Banner */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block">Origin</span>
              <span className="font-semibold text-white truncate">{group.origin?.address || 'Flexible'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block">Destination</span>
              <span className="font-semibold text-white truncate">{group.destination?.address || 'Flexible'}</span>
            </div>
          </div>

          {group.scheduleDescription && (
            <div className="flex items-center gap-2 truncate">
              <Clock className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-500 block">Schedule</span>
                <span className="font-semibold text-white truncate">{group.scheduleDescription}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('rides')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'rides'
                  ? 'bg-brand-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Circle Rides ({rides.length})
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'members'
                  ? 'bg-brand-500 text-slate-950'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Members Roster ({group.members?.length || 1})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === 'driver' && (
              <Link
                to={`/create-ride?groupId=${group._id}`}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 shadow"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                <span>Post Ride for Circle</span>
              </Link>
            )}

            {isMember && !isCreator && (
              <button
                onClick={handleLeaveGroup}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: GROUP RIDES */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'rides' && (
        <div className="space-y-4 animate-fadeIn">
          {rides.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <Car className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Upcoming Rides in This Circle</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Any member with a registered vehicle can post a ride for this group corridor.
              </p>
              {user?.role === 'driver' && (
                <Link
                  to={`/create-ride?groupId=${group._id}`}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 text-slate-950 inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post the First Ride</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {rides.map((ride) => {
                const isMyRide = (ride.driver?._id || ride.driver) === (user?._id || user?.id);
                return (
                  <div
                    key={ride._id}
                    className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-500/40 transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-300 border border-brand-500/20 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {ride.date} at {ride.departureTime}
                        </span>
                        {ride.recurrence?.isRecurring && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            🔄 Recurring
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{ride.startLocation?.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-brand-300 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                          <span>→ {ride.destination?.address}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                        <span>Driver: <strong className="text-white">{ride.driver?.name}</strong></span>
                        <span>Vehicle: {ride.vehicle?.model}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                      <div className="text-left sm:text-right">
                        <span className="text-base font-extrabold text-emerald-400 block">₹{ride.estimatedCost}</span>
                        <span className="text-[10px] text-slate-400">{ride.availableSeats} seats left</span>
                      </div>

                      {isMyRide ? (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-400">
                          Your Ride
                        </span>
                      ) : ride.availableSeats > 0 ? (
                        <button
                          onClick={() => handleBookSeat(ride._id)}
                          disabled={bookingRideId === ride._id}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-400 text-slate-950 transition shadow disabled:opacity-50"
                        >
                          {bookingRideId === ride._id ? 'Booking...' : 'Book 1 Seat'}
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-500">
                          Full
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: MEMBERS ROSTER */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'members' && (
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 overflow-hidden animate-fadeIn">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-400" />
              Circle Roster ({group.members?.length || 1} Members)
            </h3>
            <span className="text-[11px] text-slate-500">Mutual trust & verified commuters</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {group.members?.map((m) => {
              const u = m.user || {};
              const isLead = m.role === 'admin';
              return (
                <div key={u._id || u.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{u.name}</span>
                        {isLead && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Creator
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {u.organization || 'Community Member'} • Joined {new Date(m.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    {u.verificationStatus?.govtId && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ✓ ID
                      </span>
                    )}
                    {u.verificationStatus?.organization && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ✓ Org
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
