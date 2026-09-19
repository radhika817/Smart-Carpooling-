import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';
import { LocationAutocomplete } from '../components/map/LocationAutocomplete';
import { RouteMap } from '../components/map/RouteMap';
import { Search, MapPin, Calendar, Car, Star, CheckCircle, AlertCircle, Clock, Map, ChevronDown, ChevronUp } from 'lucide-react';

export const SearchRidesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [pickup, setPickup] = useState(searchParams.get('pickup') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [seats, setSeats] = useState(searchParams.get('seats') || '1');

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingRideId, setBookingRideId] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [expandedRouteRideId, setExpandedRouteRideId] = useState(null);

  const executeSearch = async () => {
    setLoading(true);
    setBookingError('');
    try {
      const data = await rideService.searchRides({
        pickup: pickup.trim() || undefined,
        destination: destination.trim() || undefined,
        date: date || undefined,
        seats: seats ? parseInt(seats, 10) : 1,
      });
      setRides(data || []);
    } catch (err) {
      setBookingError(err.message || 'Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (pickup) params.pickup = pickup;
    if (destination) params.destination = destination;
    if (date) params.date = date;
    if (seats) params.seats = seats;
    setSearchParams(params);
    executeSearch();
  };

  const handleBook = async (ride) => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/search');
      return;
    }

    if (user?._id === ride.driver?._id) {
      setBookingError('You cannot book your own ride!');
      return;
    }

    setBookingRideId(ride._id);
    setBookingError('');
    setBookingSuccess('');

    try {
      await rideService.bookSeat(ride._id, {
        seats: parseInt(seats, 10) || 1,
      });
      setBookingSuccess(`Seat successfully booked on ${ride.driver?.name}'s ride!`);
      executeSearch();
    } catch (err) {
      setBookingError(err.message || 'Failed to book seat. It may have just been reserved by someone else.');
    } finally {
      setBookingRideId(null);
    }
  };

  const toggleRouteMap = (rideId) => {
    setExpandedRouteRideId((prev) => (prev === rideId ? null : rideId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Search Header */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <Search className="w-7 h-7 text-brand-400" />
          Find Shared Commute Rides
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Search verified rides across campuses and workplaces with real-time route maps and road distances.
        </p>

        <form onSubmit={handleSearchSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LocationAutocomplete
              label="Pickup Location"
              value={pickup}
              placeholder="Search pickup (e.g. Pune Station, Chinchwad)..."
              iconColor="text-emerald-400"
              onChange={(val) => setPickup(val)}
              onSelectLocation={(loc) => setPickup(loc.shortName || loc.address)}
            />

            <LocationAutocomplete
              label="Destination"
              value={destination}
              placeholder="Search destination (e.g. Hinjewadi, Kharadi)..."
              iconColor="text-sky-400"
              onChange={(val) => setDestination(val)}
              onSelectLocation={(loc) => setDestination(loc.shortName || loc.address)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-2 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Seats Needed</label>
              <input
                type="number"
                min="1"
                max="8"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" /> Search Rides
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Booking Alerts */}
      {bookingError && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{bookingError}</span>
        </div>
      )}

      {bookingSuccess && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{bookingSuccess}</span>
        </div>
      )}

      {/* Rides List */}
      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400">Searching active rides...</div>
        ) : rides.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
            <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Matching Rides Found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
              Try adjusting your route, commute date, or seat count to discover more verified rides.
            </p>
          </div>
        ) : (
          rides.map((ride) => (
            <div
              key={ride._id}
              className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col gap-5"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Route & Driver Details */}
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-500/20 text-brand-300 font-bold flex items-center justify-center text-sm border border-brand-500/30">
                      {ride.driver?.name?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        {ride.driver?.name}
                        <span className="flex items-center text-xs text-amber-400 font-normal">
                          <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
                          {ride.driver?.rating?.average?.toFixed(1) || '5.0'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400">
                        {ride.driver?.organization || 'Verified Commuter'} • {ride.vehicle?.model} ({ride.vehicle?.registrationNumber})
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Pickup</span>
                        <span className="text-slate-200 font-medium">{ride.startLocation?.address}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Drop-off</span>
                        <span className="text-slate-200 font-medium">{ride.destination?.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" /> {ride.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" /> {ride.departureTime}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 font-semibold border border-brand-500/20">
                      {ride.availableSeats} of {ride.totalSeats} seats left
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleRouteMap(ride._id)}
                      className="ml-auto text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 transition"
                    >
                      <Map className="w-3.5 h-3.5" />
                      {expandedRouteRideId === ride._id ? 'Hide Route Map' : 'View Route Map'}
                      {expandedRouteRideId === ride._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Price & Booking Button */}
                <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 gap-3">
                  <div>
                    <span className="text-xs text-slate-400 block text-right">Contribution</span>
                    <span className="text-2xl font-black text-white">₹{ride.estimatedCost}</span>
                    <span className="text-[10px] text-slate-400 block text-right">per seat</span>
                  </div>

                  <button
                    onClick={() => handleBook(ride)}
                    disabled={ride.availableSeats === 0 || bookingRideId === ride._id}
                    className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 active:scale-95 text-slate-950 font-bold text-sm shadow-lg shadow-brand-500/20 transition disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {bookingRideId === ride._id ? 'Reserving...' : ride.availableSeats === 0 ? 'Full' : 'Book Seat'}
                  </button>
                </div>
              </div>

              {/* Collapsible Interactive Route Map for this Ride */}
              {expandedRouteRideId === ride._id && (
                <div className="pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
                  <RouteMap
                    startLocation={ride.startLocation}
                    destination={ride.destination}
                    height="250px"
                    interactive={true}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
