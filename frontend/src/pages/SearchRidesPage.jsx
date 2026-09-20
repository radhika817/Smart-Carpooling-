import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';
import { LocationAutocomplete } from '../components/map/LocationAutocomplete';
import { RouteMap } from '../components/map/RouteMap';
import {
  Search,
  MapPin,
  Calendar,
  Car,
  Star,
  CheckCircle,
  AlertCircle,
  Clock,
  Map,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Gauge,
  Sliders,
  DollarSign,
  Building,
  Repeat,
  Users,
  Lock,
} from 'lucide-react';

export const SearchRidesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [pickup, setPickup] = useState(searchParams.get('pickup') || '');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [destCoords, setDestCoords] = useState(null);
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [departureTime, setDepartureTime] = useState(searchParams.get('time') || '');
  const [seats, setSeats] = useState(searchParams.get('seats') || '1');
  const [communityOnly, setCommunityOnly] = useState(searchParams.get('communityOnly') === 'true');

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingRideId, setBookingRideId] = useState(null);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [expandedRouteRideId, setExpandedRouteRideId] = useState(null);
  const [expandedScoreRideId, setExpandedScoreRideId] = useState(null);

  const executeSearch = async () => {
    setLoading(true);
    setBookingError('');
    try {
      const params = {
        pickup: pickup.trim() || undefined,
        destination: destination.trim() || undefined,
        date: date || undefined,
        departureTime: departureTime || undefined,
        seats: seats ? parseInt(seats, 10) : 1,
      };

      if (pickupCoords && pickupCoords.length === 2) {
        params.pickupLng = pickupCoords[0];
        params.pickupLat = pickupCoords[1];
      }
      if (destCoords && destCoords.length === 2) {
        params.destLng = destCoords[0];
        params.destLat = destCoords[1];
      }

      if (communityOnly && user?.organization) {
        params.communityOnly = 'true';
        params.organization = user.organization;
      }

      const data = await rideService.searchRides(params);
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
    if (departureTime) params.time = departureTime;
    if (seats) params.seats = seats;
    if (communityOnly) params.communityOnly = 'true';
    setSearchParams(params);
    executeSearch();
  };

  useEffect(() => {
    executeSearch();
  }, [communityOnly]);

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
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Search className="w-7 h-7 text-brand-600" />
          Find Shared Commute Rides
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Search verified rides across campuses and workplaces with real-time route maps and road distances.
        </p>

        <form onSubmit={handleSearchSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <LocationAutocomplete
              label="Pickup location"
              value={pickup}
              placeholder="Search pickup (e.g. Pune Station, Chinchwad)..."
              iconColor="text-brand-600"
              onChange={(val) => {
                setPickup(val);
                setPickupCoords(null);
              }}
              onSelectLocation={(loc) => {
                setPickup(loc.shortName || loc.address);
                if (loc.coordinates) setPickupCoords(loc.coordinates);
              }}
            />

            <LocationAutocomplete
              label="Destination"
              value={destination}
              placeholder="Search destination (e.g. Hinjewadi, Kharadi)..."
              iconColor="text-sunrise-700"
              onChange={(val) => {
                setDestination(val);
                setDestCoords(null);
              }}
              onSelectLocation={(loc) => {
                setDestination(loc.shortName || loc.address);
                if (loc.coordinates) setDestCoords(loc.coordinates);
              }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Date</label>
              <div className="relative cursor-pointer">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.target.showPicker?.();
                    } catch {}
                  }}
                  style={{ colorScheme: 'light' }}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Departure time</label>
              <div className="relative cursor-pointer">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.target.showPicker?.();
                    } catch {}
                  }}
                  style={{ colorScheme: 'light' }}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Seats needed</label>
              <input
                type="number"
                min="1"
                max="8"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" /> Search rides
              </button>
            </div>
          </div>

          {/* Phase 8: Community Scoping Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-3">
              <label
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                  communityOnly
                    ? 'bg-teal-50 border-teal-300 text-teal-800 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                } ${!user?.organization ? 'opacity-40 cursor-not-allowed' : ''}`}
                title={user?.organization ? `Filter for ${user.organization} rides` : 'Set your organization in Profile to unlock community filtering'}
              >
                <Building className="w-3.5 h-3.5 text-teal-700" />
                <input
                  type="checkbox"
                  checked={communityOnly}
                  disabled={!user?.organization}
                  onChange={(e) => setCommunityOnly(e.target.checked)}
                  className="sr-only"
                />
                <span>My community only {user?.organization ? `(${user.organization})` : ''}</span>
              </label>
            </div>

            {user?.organization && communityOnly && (
              <span className="text-xs text-teal-700 font-medium">
                Filtering rides restricted to {user.organization} colleagues
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Booking Alerts */}
      {bookingError && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{bookingError}</span>
        </div>
      )}

      {bookingSuccess && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{bookingSuccess}</span>
        </div>
      )}

      {/* Rides List */}
      <div className="mt-8 space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-500">Searching active rides...</div>
        ) : rides.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-300 rounded-2xl bg-white/70">
            <Car className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900">No matching rides found</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto mt-1">
              Try adjusting your route, commute date, or seat count to discover more verified rides.
            </p>
          </div>
        ) : (
          rides.map((ride) => {
            const match = ride.match;
            const matchPct = match?.matchPercentage || 0;
            const badgeColor =
              matchPct >= 80
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : matchPct >= 60
                ? 'bg-sky-50 text-sky-800 border-sky-300'
                : 'bg-amber-50 text-amber-800 border-amber-300';

            return (
              <div
                key={ride._id}
                className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col gap-5 relative overflow-hidden"
              >
                {/* Match Highlight Header if match object exists */}
                {match && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 shadow-2xs ${badgeColor}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                        {matchPct}% Match
                      </span>
                      <span className="text-xs text-slate-600 font-medium">
                        {match.summary}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedScoreRideId((prev) => (prev === ride._id ? null : ride._id))}
                      className="text-xs text-brand-700 hover:text-brand-800 font-semibold flex items-center gap-1 transition ml-auto"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      {expandedScoreRideId === ride._id ? 'Hide breakdown' : 'Score breakdown'}
                      {expandedScoreRideId === ride._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                {/* Score Breakdown Drawer */}
                {expandedScoreRideId === ride._id && match && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-200">
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-brand-600" />
                        Algorithm score breakdown ({match.score}/100)
                      </span>
                      <span>Pure Function Matching Engine</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* 1. Route Similarity 40% */}
                      <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                        <div className="flex justify-between text-slate-500 mb-1">
                          <span className="font-semibold text-slate-800">Route Corridor</span>
                          <span className="text-brand-700 font-bold">{match.breakdown.routeSimilarity.points}/40 pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                          <div
                            className="bg-brand-600 h-full rounded-full"
                            style={{ width: `${(match.breakdown.routeSimilarity.points / 40) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">{match.breakdown.routeSimilarity.label}</span>
                      </div>

                      {/* 2. Time Compatibility 25% */}
                      <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                        <div className="flex justify-between text-slate-500 mb-1">
                          <span className="font-semibold text-slate-800">Departure Time</span>
                          <span className="text-brand-700 font-bold">{match.breakdown.timeCompatibility.points}/25 pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                          <div
                            className="bg-brand-600 h-full rounded-full"
                            style={{ width: `${(match.breakdown.timeCompatibility.points / 25) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">{match.breakdown.timeCompatibility.label}</span>
                      </div>

                      {/* 3. Pickup Proximity 20% */}
                      <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                        <div className="flex justify-between text-slate-500 mb-1">
                          <span className="font-semibold text-slate-800">Pickup Proximity</span>
                          <span className="text-brand-700 font-bold">{match.breakdown.pickupProximity.points}/20 pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                          <div
                            className="bg-brand-600 h-full rounded-full"
                            style={{ width: `${(match.breakdown.pickupProximity.points / 20) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">{match.breakdown.pickupProximity.label}</span>
                      </div>

                      {/* 4. Destination Proximity 15% */}
                      <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-2xs">
                        <div className="flex justify-between text-slate-500 mb-1">
                          <span className="font-semibold text-slate-800">Drop-off Proximity</span>
                          <span className="text-brand-700 font-bold">{match.breakdown.destinationProximity.points}/15 pts</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                          <div
                            className="bg-brand-600 h-full rounded-full"
                            style={{ width: `${(match.breakdown.destinationProximity.points / 15) * 100}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-500">{match.breakdown.destinationProximity.label}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Route & Driver Details */}
                  <div className="space-y-4 flex-1">
                    {/* Phase 8: Scope & Recurrence Badges */}
                    {(ride.communityScope?.isRestricted || ride.recurrence?.isRecurring || ride.carpoolGroup) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {ride.communityScope?.isRestricted && (
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-1">
                            <Building className="w-3 h-3 text-teal-700" />
                            {ride.communityScope.organization || 'Community only'}
                          </span>
                        )}
                        {ride.recurrence?.isRecurring && (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold flex items-center gap-1">
                            <Repeat className="w-3 h-3 text-purple-700" />
                            Recurring series
                          </span>
                        )}
                        {ride.carpoolGroup && (
                          <span className="px-2.5 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold flex items-center gap-1">
                            <Users className="w-3 h-3 text-brand-700" />
                            {ride.carpoolGroup.name || 'Carpool circle'}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-800 font-bold flex items-center justify-center text-sm border border-brand-200">
                        {ride.driver?.name?.charAt(0) || 'D'}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          {ride.driver?.name}
                          <span className="flex items-center text-xs text-amber-700 font-semibold">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-0.5" />
                            {ride.driver?.rating?.average?.toFixed(1) || '5.0'}
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          {ride.driver?.organization || 'Verified commuter'} • {ride.vehicle?.model} ({ride.vehicle?.registrationNumber})
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-brand-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs text-slate-500 font-semibold block">Pickup</span>
                          <span className="text-slate-900 font-medium">{ride.startLocation?.address}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-sunrise-700 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-xs text-slate-500 font-semibold block">Drop-off</span>
                          <span className="text-slate-900 font-medium">{ride.destination?.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {ride.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {ride.departureTime}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-800 font-semibold border border-brand-200">
                        {ride.availableSeats} of {ride.totalSeats} seats left
                      </span>

                      {ride.costBreakdown?.fuel > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                          Fuel ₹{ride.costBreakdown.fuel}{ride.costBreakdown.toll ? ` • Toll ₹${ride.costBreakdown.toll}` : ''}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleRouteMap(ride._id)}
                        className="ml-auto text-xs text-brand-700 hover:text-brand-800 font-semibold flex items-center gap-1 transition"
                      >
                        <Map className="w-3.5 h-3.5" />
                        {expandedRouteRideId === ride._id ? 'Hide route map' : 'View route map'}
                        {expandedRouteRideId === ride._id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Price & Booking Button */}
                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 gap-3">
                    <div>
                      <span className="text-xs text-slate-500 block text-right font-medium">Contribution</span>
                      <span className="text-2xl font-black text-slate-900">₹{ride.estimatedCost}</span>
                      <span className="text-[11px] text-slate-500 block text-right">per seat</span>
                    </div>

                    <button
                      onClick={() => handleBook(ride)}
                      disabled={ride.availableSeats === 0 || bookingRideId === ride._id}
                      className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-semibold text-sm shadow-md shadow-brand-600/20 transition disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {bookingRideId === ride._id ? 'Reserving...' : ride.availableSeats === 0 ? 'Full' : 'Book seat'}
                    </button>
                  </div>
                </div>

                {/* Collapsible Interactive Route Map for this Ride */}
                {expandedRouteRideId === ride._id && (
                  <div className="pt-2 border-t border-slate-200 animate-in fade-in duration-200">
                    <RouteMap
                      startLocation={ride.startLocation}
                      destination={ride.destination}
                      height="250px"
                      interactive={true}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
