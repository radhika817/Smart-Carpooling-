import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { groupService } from '../services/groupService';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';
import {
  Users,
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
      <div className="min-h-[70vh] flex items-center justify-center text-slate-600 text-sm">
        Loading carpool circle...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <p className="text-slate-900 font-semibold text-base">Carpool circle not found.</p>
        <Link to="/groups" className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition border border-slate-200">
          Return to groups
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        to="/groups"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to groups</span>
      </Link>

      {/* Global Feedback */}
      {feedback.message && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold border flex items-center gap-2.5 animate-fadeIn shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-700" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Group Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-display">{group.name}</h1>
              {group.isPrivate ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Private circle
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-800 border border-brand-200 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-brand-700" />
                  Public community
                </span>
              )}
            </div>

            {group.organization && (
              <div className="flex items-center gap-1.5 text-xs text-sunrise-700 font-semibold mt-2">
                <Building className="w-4 h-4 shrink-0 text-sunrise-700" />
                <span>Affiliated with {group.organization}</span>
              </div>
            )}
          </div>

          {/* Invite Code Badge */}
          {group.inviteCode && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center gap-3 shrink-0">
              <div>
                <span className="text-xs font-medium text-slate-500 block">Invite code</span>
                <span className="text-base font-mono font-bold text-brand-800 tracking-wider">
                  {group.inviteCode}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                title="Copy invite code"
                className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition"
              >
                {copiedCode ? <Check className="w-4 h-4 text-brand-700" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {group.description && (
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            {group.description}
          </p>
        )}

        {/* Route Corridor Banner */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-brand-700" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-500 block">Origin</span>
              <span className="font-semibold text-slate-900 truncate block">{group.origin?.address || 'Flexible'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-lg bg-sunrise-50 border border-sunrise-200 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-sunrise-700" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-slate-500 block">Destination</span>
              <span className="font-semibold text-slate-900 truncate block">{group.destination?.address || 'Flexible'}</span>
            </div>
          </div>

          {group.scheduleDescription && (
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-indigo-700" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-medium text-slate-500 block">Schedule</span>
                <span className="font-semibold text-slate-900 truncate block">{group.scheduleDescription}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('rides')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'rides'
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Circle rides ({rides.length})
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'members'
                  ? 'bg-brand-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Members roster ({group.members?.length || 1})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === 'driver' && (
              <Link
                to={`/create-ride?groupId=${group._id}`}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-700 hover:bg-brand-800 text-white transition flex items-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post ride for circle</span>
              </Link>
            )}

            {isMember && !isCreator && (
              <button
                onClick={handleLeaveGroup}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-red-700 hover:bg-red-50 border border-red-200 transition flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave circle</span>
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
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No upcoming rides in this circle</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Any member with a registered vehicle can post a ride along this corridor.
              </p>
              {user?.role === 'driver' && (
                <Link
                  to={`/create-ride?groupId=${group._id}`}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-700 hover:bg-brand-800 text-white inline-flex items-center gap-1.5 shadow-xs transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post the first ride</span>
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
                    className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-300 hover:shadow-sm transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-800 border border-brand-200 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-brand-700" />
                          {ride.date} at {ride.departureTime}
                        </span>
                        {ride.recurrence?.isRecurring && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Recurring
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 text-slate-900 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-brand-700 shrink-0" />
                          <span>{ride.startLocation?.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sunrise-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-sunrise-700 shrink-0" />
                          <span>→ {ride.destination?.address}</span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-3 pt-1">
                        <span>Driver: <strong className="text-slate-800 font-semibold">{ride.driver?.name}</strong></span>
                        <span>Vehicle: {ride.vehicle?.model}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <span className="text-lg font-bold text-slate-900 block">₹{ride.estimatedCost}</span>
                        <span className="text-xs text-slate-500">{ride.availableSeats} seats left</span>
                      </div>

                      {isMyRide ? (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Your ride
                        </span>
                      ) : ride.availableSeats > 0 ? (
                        <button
                          onClick={() => handleBookSeat(ride._id)}
                          disabled={bookingRideId === ride._id}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-700 hover:bg-brand-800 text-white transition shadow-xs disabled:opacity-50"
                        >
                          {bookingRideId === ride._id ? 'Booking...' : 'Book 1 seat'}
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-400 border border-slate-200">
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
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs animate-fadeIn">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-700" />
              Circle roster ({group.members?.length || 1} members)
            </h3>
            <span className="text-xs text-slate-500">Mutual trust & verified commuters</span>
          </div>

          <div className="divide-y divide-slate-100">
            {group.members?.map((m) => {
              const u = m.user || {};
              const isLead = m.role === 'admin';
              return (
                <div key={u._id || u.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-xs font-bold text-brand-800">
                      {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{u.name}</span>
                        {isLead && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sunrise-50 text-sunrise-800 border border-sunrise-200">
                            Creator
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 block">
                        {u.organization || 'Community member'} • Joined {new Date(m.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    {u.verificationStatus?.govtId && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        ✓ ID verified
                      </span>
                    )}
                    {u.verificationStatus?.organization && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-brand-50 text-brand-800 border border-brand-200">
                        ✓ Org verified
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
