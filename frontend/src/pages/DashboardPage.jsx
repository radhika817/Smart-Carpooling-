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

  const formatRideStatus = (status) => {
    switch (status) {
      case 'IN_PROGRESS': return 'In progress';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      case 'OPEN': return 'Open for booking';
      case 'DRIVER_ARRIVING': return 'Driver arriving';
      default: return status ? status.replace('_', ' ') : '';
    }
  };

  const formatBookingStatus = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmed';
      case 'CANCELLED': return 'Cancelled';
      case 'PENDING': return 'Pending';
      case 'COMPLETED': return 'Completed';
      default: return status ? status.replace('_', ' ') : '';
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Welcome back, {user?.name}!
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                isDriver
                  ? 'bg-sunrise-50 border border-sunrise-200 text-sunrise-800'
                  : 'bg-brand-50 border border-brand-200 text-brand-700'
              }`}
            >
              {user?.role}
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-1">
            {user?.organization ? `Commuting with ${user.organization}` : 'Connected to SmartRide Platform'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs transition"
          >
            <Search className="w-4 h-4 text-brand-600" /> Find a ride
          </Link>

          {isDriver && (
            <>
              <Link
                to="/vehicles"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs transition"
              >
                <Car className="w-4 h-4 text-sunrise-700" /> My vehicles
              </Link>
              <Link
                to="/create-ride"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-600/20 transition"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.5]" /> Offer ride
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Action Alerts */}
      {actionError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
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
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-sunrise-700" /> My scheduled & offered rides
            </h2>
            <Link to="/create-ride" className="text-xs text-brand-700 font-semibold hover:underline">
              + Post another
            </Link>
          </div>

          {loading ? (
            <div className="py-10 text-center text-slate-500">Loading your rides...</div>
          ) : myRides.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-white/60 text-center">
              <p className="text-slate-600 text-sm">You haven't posted any rides yet.</p>
              <Link
                to="/create-ride"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-700 font-bold hover:underline"
              >
                Post your first ride offer <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRides.map((ride) => (
                <div key={ride._id} className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ride.status === 'IN_PROGRESS'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : ride.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : ride.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-sunrise-50 text-sunrise-800 border border-sunrise-200'
                        }`}
                      >
                        {formatRideStatus(ride.status)}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">
                        Vehicle: <span className="text-slate-800 font-semibold">{ride.vehicle?.model}</span> ({ride.vehicle?.registrationNumber})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900">₹{ride.estimatedCost}</span>
                      <span className="text-[11px] text-slate-500 block">/ seat</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                      <span className="truncate">{ride.startLocation?.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-sunrise-700 flex-shrink-0" />
                      <span className="truncate">{ride.destination?.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {ride.date} at {ride.departureTime}
                    </span>
                    <span className="font-semibold text-brand-700">
                      {ride.availableSeats} of {ride.totalSeats} seats open
                    </span>
                  </div>

                  {/* Lifecycle & Live Tracking Buttons */}
                  <div className="pt-2 flex flex-wrap gap-2">
                    <Link
                      to={`/rides/${ride._id}/live`}
                      className="flex-1 py-2 px-3 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 font-semibold text-xs flex items-center justify-center gap-1.5 border border-brand-200 transition shadow-xs"
                    >
                      <Radio className="w-3.5 h-3.5 text-brand-700" /> Live track & chat
                    </Link>

                    {ride.status === 'OPEN' && (
                      <button
                        onClick={() => handleStartRide(ride._id)}
                        className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" /> Start
                      </button>
                    )}

                    {ride.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleCompleteRide(ride._id)}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1 transition"
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
                        className="py-2 px-3 rounded-xl bg-sunrise-50 hover:bg-sunrise-100 text-sunrise-800 border border-sunrise-200 text-xs font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <Star className="w-3.5 h-3.5 fill-sunrise-500 text-sunrise-500" /> Rate passenger
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
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-600" /> My bookings & reservations
          </h2>
          <Link to="/search" className="text-xs text-brand-700 font-semibold hover:underline">
            + Book another ride
          </Link>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Loading your bookings...</div>
        ) : myBookings.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-300 bg-white/60 text-center">
            <p className="text-slate-600 text-sm">You haven't booked any shared seats yet.</p>
            <Link
              to="/search"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-700 font-bold hover:underline"
            >
              Search available campus rides <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myBookings.map((b) => (
              <div key={b._id} className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : b.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-sunrise-50 text-sunrise-800 border border-sunrise-200'
                      }`}
                    >
                      {formatBookingStatus(b.status)}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">
                      Driver: <span className="text-slate-800 font-semibold">{b.ride?.driver?.name}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">₹{b.totalPrice}</span>
                    <span className="text-[11px] text-slate-500 block">{b.seats} seat(s)</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                    <span className="truncate">{b.pickupPoint?.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-sunrise-700 flex-shrink-0" />
                    <span className="truncate">{b.dropPoint?.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {b.ride?.date} at {b.ride?.departureTime}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/rides/${b.ride?._id || b.ride}/live`}
                      className="py-1 px-2.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-800 font-semibold text-xs border border-brand-200 flex items-center gap-1 transition"
                    >
                      <Radio className="w-3 h-3 text-brand-600 animate-pulse" /> Live track & chat
                    </Link>

                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCancelBooking(b._id)}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold transition"
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
                        className="py-1 px-2.5 rounded-lg bg-sunrise-50 hover:bg-sunrise-100 text-sunrise-800 font-semibold text-xs border border-sunrise-200 flex items-center gap-1 transition"
                      >
                        <Star className="w-3 h-3 fill-sunrise-500 text-sunrise-500" /> Rate driver
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
