import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { rideService } from '../services/rideService';
import { bookingService } from '../services/bookingService';
import {
  User,
  Car,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  Star,
  PlusCircle,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  CheckCheck,
  Ban,
  ArrowRight,
  Radio,
} from 'lucide-react';
import { SafetySettingsCard } from '../components/safety/SafetySettingsCard';
import { RateRideModal } from '../components/safety/RateRideModal';
import { PersonalAnalyticsCard } from '../components/analytics/PersonalAnalyticsCard';
import { ErrorBoundary } from '../components/ErrorBoundary';

export const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const isDriver = user?.role === 'driver';

  const [myRides, setMyRides] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [activeRating, setActiveRating] = useState(null);

  const userId = user?._id || user?.id;

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (isDriver) {
        const rides = await rideService.getRides({ driver: userId });
        setMyRides(rides || []);
      }
      const bookings = await bookingService.getMyBookings();
      setMyBookings(bookings || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (refreshUser) {
      refreshUser();
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadDashboardData();
    }
  }, [userId, isDriver]);

  const handleStartRide = async (rideId) => {
    setActionError('');
    setActionSuccess('');
    try {
      await rideService.startRide(rideId);
      setActionSuccess('Ride started! Status is now IN_PROGRESS.');
      loadDashboardData();
    } catch (err) {
      setActionError(err.message || 'Failed to start ride');
    }
  };

  const handleCompleteRide = async (rideId) => {
    setActionError('');
    setActionSuccess('');
    try {
      await rideService.completeRide(rideId);
      setActionSuccess('Ride completed successfully!');
      loadDashboardData();
    } catch (err) {
      setActionError(err.message || 'Failed to complete ride');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this seat reservation? Seats will be restored atomically.')) return;
    setActionError('');
    setActionSuccess('');
    try {
      await bookingService.cancelBooking(bookingId);
      setActionSuccess('Booking cancelled. Reserved seats have been restored.');
      loadDashboardData();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {user?.name}!
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isDriver
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  : 'bg-brand-500/10 border border-brand-500/20 text-brand-400'
              }`}
            >
              {user?.role}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {user?.organization ? `Commuting with ${user.organization}` : 'Connected to SmartRide Platform'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition"
          >
            <Search className="w-4 h-4 text-brand-400" /> Find a Ride
          </Link>

          {isDriver && (
            <>
              <Link
                to="/vehicles"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition"
              >
                <Car className="w-4 h-4 text-amber-400" /> My Vehicles
              </Link>
              <Link
                to="/create-ride"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm shadow-md transition"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" /> Offer Ride
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Action Alerts */}
      {actionError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Phase 7 Personal Impact & Commute Analytics */}
      <ErrorBoundary>
        <PersonalAnalyticsCard user={user} />
      </ErrorBoundary>

      {/* Driver Section: Offered Rides */}
      {isDriver && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-amber-400" /> My Scheduled & Offered Rides
            </h2>
            <Link to="/create-ride" className="text-xs text-brand-400 font-semibold hover:underline">
              + Post Another
            </Link>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-400">Loading your rides...</div>
          ) : myRides.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center">
              <p className="text-slate-400 text-sm">You haven't posted any rides yet.</p>
              <Link
                to="/create-ride"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-400 font-bold hover:underline"
              >
                Post your first ride offer <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRides.map((ride) => (
                <div key={ride._id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          ride.status === 'IN_PROGRESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : ride.status === 'COMPLETED'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : ride.status === 'CANCELLED'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {ride.status}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        Vehicle: <span className="text-slate-200 font-semibold">{ride.vehicle?.model}</span> ({ride.vehicle?.registrationNumber})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-white">₹{ride.estimatedCost}</span>
                      <span className="text-[10px] text-slate-400 block">/ seat</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{ride.startLocation?.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      <span className="truncate">{ride.destination?.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" /> {ride.date} at {ride.departureTime}
                    </span>
                    <span className="font-semibold text-brand-300">
                      {ride.availableSeats} of {ride.totalSeats} seats open
                    </span>
                  </div>

                  {/* Lifecycle & Live Tracking Buttons */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Link
                      to={`/rides/${ride._id}/live`}
                      className="flex-1 py-2 px-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <Radio className="w-3.5 h-3.5 text-slate-950" /> Live Track & Chat
                    </Link>

                    {ride.status === 'OPEN' && (
                      <button
                        onClick={() => handleStartRide(ride._id)}
                        className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Start
                      </button>
                    )}

                    {ride.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleCompleteRide(ride._id)}
                        className="py-2 px-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 transition"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Complete
                      </button>
                    )}

                    {ride.status === 'COMPLETED' && (
                      <button
                        onClick={() =>
                          setActiveRating({
                            rideId: ride._id,
                            targetUser: { name: 'Ride Passenger', role: 'passenger' },
                          })
                        }
                        className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1 transition"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> Rate Passenger
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Passenger Section: Booked Rides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-400" /> My Bookings & Reservations
          </h2>
          <Link to="/search" className="text-xs text-brand-400 font-semibold hover:underline">
            + Book Another Ride
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-400">Loading your bookings...</div>
        ) : myBookings.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-center">
            <p className="text-slate-400 text-sm">You haven't booked any shared seats yet.</p>
            <Link
              to="/search"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-400 font-bold hover:underline"
            >
              Search available campus rides <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myBookings.map((b) => (
              <div key={b._id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : b.status === 'CANCELLED'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {b.status}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      Driver: <span className="text-slate-200 font-semibold">{b.ride?.driver?.name}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-white">₹{b.totalPrice}</span>
                    <span className="text-[10px] text-slate-400 block">{b.seats} seat(s)</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">{b.pickupPoint?.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                    <span className="truncate">{b.dropPoint?.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" /> {b.ride?.date} at {b.ride?.departureTime}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/rides/${b.ride?._id || b.ride}/live`}
                      className="py-1 px-2.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 font-semibold text-xs border border-brand-500/20 flex items-center gap-1 transition"
                    >
                      <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Live Track & Chat
                    </Link>

                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        className="text-xs text-red-400 hover:text-red-300 font-medium transition"
                      >
                        Cancel
                      </button>
                    )}

                    {(b.status === 'COMPLETED' || b.ride?.status === 'COMPLETED') && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveRating({
                            rideId: b.ride?._id || b.ride,
                            targetUser: b.ride?.driver || { name: 'Driver', role: 'driver' },
                          })
                        }
                        className="py-1 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold text-xs border border-amber-500/20 flex items-center gap-1 transition"
                      >
                        <Star className="w-3 h-3 fill-amber-400" /> Rate Driver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phase 6 Safety & Trust Section */}
      <SafetySettingsCard currentUser={user} onUpdate={loadDashboardData} />

      {/* Post-Ride Rating Modal */}
      <RateRideModal
        isOpen={!!activeRating}
        onClose={() => setActiveRating(null)}
        rideId={activeRating?.rideId}
        targetUser={activeRating?.targetUser}
        onSuccess={loadDashboardData}
      />
    </div>
  );
};
