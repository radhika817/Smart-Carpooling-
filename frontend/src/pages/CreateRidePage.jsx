import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { rideService } from '../services/rideService';
import { vehicleService } from '../services/vehicleService';
import { LocationAutocomplete } from '../components/map/LocationAutocomplete';
import { LocationPickerModal } from '../components/map/LocationPickerModal';
import { RouteMap } from '../components/map/RouteMap';
import { PlusCircle, Calendar, Clock, Car, AlertCircle, Sparkles, Navigation } from 'lucide-react';

export const CreateRidePage = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Start & Destination locations with GeoJSON Point coordinates [lng, lat]
  const [startLocation, setStartLocation] = useState({
    address: 'Shivajinagar, Pune',
    coordinates: [73.8528, 18.5314],
  });

  const [destination, setDestination] = useState({
    address: 'Hinjewadi Phase 1, Pune',
    coordinates: [73.7389, 18.5913],
  });

  // Map picker modal state
  const [pickerConfig, setPickerConfig] = useState({
    isOpen: false,
    field: null, // 'start' or 'dest'
    title: '',
    initialCoords: [73.8567, 18.5204],
  });

  const [costBreakdown, setCostBreakdown] = useState({
    fuel: 200,
    toll: 0,
    parking: 0,
    other: 0,
  });

  const [formData, setFormData] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    departureTime: '08:30',
    totalSeats: 3,
    estimatedCost: 50, // default ₹200 / 4 occupants
    notes: '',
    preferences: {
      music: true,
      ac: true,
      smoking: false,
      petFriendly: false,
    },
  });

  // Calculate live fair cost split
  const totalTripCost =
    (Number(costBreakdown.fuel) || 0) +
    (Number(costBreakdown.toll) || 0) +
    (Number(costBreakdown.parking) || 0) +
    (Number(costBreakdown.other) || 0);

  const totalOccupants = 1 + (Number(formData.totalSeats) || 1);
  const calculatedFairShare = totalOccupants > 0 ? Math.round(totalTripCost / totalOccupants) : 0;
  const driverShare = Math.max(0, totalTripCost - calculatedFairShare * (Number(formData.totalSeats) || 1));

  useEffect(() => {
    setFormData((prev) => ({ ...prev, estimatedCost: calculatedFairShare }));
  }, [costBreakdown, formData.totalSeats]);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const data = await vehicleService.getVehicles();
        setVehicles(data || []);
        if (data && data.length > 0) {
          setFormData((prev) => ({ ...prev, vehicleId: data[0]._id }));
        }
      } catch (err) {
        setError('Failed to fetch vehicles. Please ensure you are logged in.');
      } finally {
        setLoading(false);
      }
    };
    loadVehicles();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [name]: checked,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'totalSeats' || name === 'estimatedCost' ? Number(value) : value,
      }));
    }
  };

  const handleOpenPicker = (field) => {
    const isStart = field === 'start';
    setPickerConfig({
      isOpen: true,
      field,
      title: isStart ? 'Select Starting Pickup Location' : 'Select Destination Drop-off Location',
      initialCoords: isStart ? startLocation.coordinates : destination.coordinates,
    });
  };

  const handleConfirmLocation = (loc) => {
    if (pickerConfig.field === 'start') {
      setStartLocation(loc);
    } else {
      setDestination(loc);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.vehicleId) {
      setError('Please select or register a vehicle first.');
      return;
    }

    if (!startLocation.address || !startLocation.coordinates) {
      setError('Please specify a valid start pickup location.');
      return;
    }

    if (!destination.address || !destination.coordinates) {
      setError('Please specify a valid destination.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        vehicleId: formData.vehicleId,
        startLocation: {
          address: startLocation.address.trim(),
          coordinates: startLocation.coordinates,
        },
        destination: {
          address: destination.address.trim(),
          coordinates: destination.coordinates,
        },
        date: formData.date,
        departureTime: formData.departureTime,
        totalSeats: formData.totalSeats,
        estimatedCost: formData.estimatedCost,
        costBreakdown: {
          fuel: Number(costBreakdown.fuel) || 0,
          toll: Number(costBreakdown.toll) || 0,
          parking: Number(costBreakdown.parking) || 0,
          other: Number(costBreakdown.other) || 0,
        },
        preferences: formData.preferences,
        notes: formData.notes,
      };

      await rideService.createRide(payload);
      navigate('/dashboard?created=true');
    } catch (err) {
      setError(err.message || 'Failed to post ride');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading ride creator...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="pb-6 border-b border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3">
          <PlusCircle className="w-8 h-8 text-brand-400" />
          Offer a Ride
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Pick your route on the map, set available seats, and split daily commute costs with peers.
        </p>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="mt-8 p-8 rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/5 text-center">
          <Car className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Registered Vehicles Found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-1">
            You need to register at least one vehicle to your account before posting rides.
          </p>
          <Link
            to="/vehicles"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm shadow-md transition"
          >
            Add a Vehicle Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Vehicle Selector */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Select Vehicle
            </label>
            <select
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.model} ({v.registrationNumber}) — {v.seats} Seats Max
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Route Selection with Nominatim & Map Picker */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-brand-400" />
                Route & Map Geometry
              </h3>
              <span className="text-[11px] text-slate-500">Live OSRM driving distance</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LocationAutocomplete
                label="Pickup Location (Start)"
                value={startLocation.address}
                iconColor="text-emerald-400"
                placeholder="Type start address (e.g. Shivajinagar Station)..."
                onChange={(addr) => setStartLocation((prev) => ({ ...prev, address: addr }))}
                onSelectLocation={(loc) => setStartLocation(loc)}
                onOpenMapPicker={() => handleOpenPicker('start')}
              />

              <LocationAutocomplete
                label="Drop-off Destination"
                value={destination.address}
                iconColor="text-sky-400"
                placeholder="Type destination (e.g. Hinjewadi Phase 1)..."
                onChange={(addr) => setDestination((prev) => ({ ...prev, address: addr }))}
                onSelectLocation={(loc) => setDestination(loc)}
                onOpenMapPicker={() => handleOpenPicker('dest')}
              />
            </div>

            {/* Live Leaflet Route Map Preview */}
            <div className="pt-2">
              <RouteMap
                startLocation={startLocation}
                destination={destination}
                height="280px"
                interactive={true}
              />
            </div>
          </div>

          {/* Timing & Seats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs text-slate-400 mb-1">Date</label>
              <div className="relative cursor-pointer">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  onClick={(e) => {
                    try {
                      e.target.showPicker?.();
                    } catch {}
                  }}
                  style={{ colorScheme: 'dark' }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs text-slate-400 mb-1">Departure Time</label>
              <div className="relative cursor-pointer">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type="time"
                  name="departureTime"
                  required
                  value={formData.departureTime}
                  onChange={handleChange}
                  onClick={(e) => {
                    try {
                      e.target.showPicker?.();
                    } catch {}
                  }}
                  style={{ colorScheme: 'dark' }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <label className="block text-xs text-slate-400 mb-1">Seats to Offer</label>
              <input
                type="number"
                name="totalSeats"
                min="1"
                max="8"
                required
                value={formData.totalSeats}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Pricing & Fair Cost-Sharing Calculator */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" />
                  Fair Cost-Sharing Calculator
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Peer-to-peer carpool model: Trip expenses split equally among driver and passengers.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 font-semibold text-xs border border-brand-500/20">
                Non-Commercial
              </span>
            </div>

            {/* Trip Expenses Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estimated Fuel (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={costBreakdown.fuel}
                    onChange={(e) => setCostBreakdown((prev) => ({ ...prev, fuel: e.target.value }))}
                    placeholder="200"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Toll Charges (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={costBreakdown.toll}
                    onChange={(e) => setCostBreakdown((prev) => ({ ...prev, toll: e.target.value }))}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Parking / Other (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={costBreakdown.parking}
                    onChange={(e) => setCostBreakdown((prev) => ({ ...prev, parking: e.target.value }))}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Arithmetic Calculation Box */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-200">
                  Total Trip Expense: <span className="text-white font-extrabold text-sm">₹{totalTripCost}</span>
                </span>
                <p className="text-slate-400">
                  Split across <span className="text-brand-300 font-semibold">{totalOccupants} people</span> (1 driver + {formData.totalSeats} seats) ={' '}
                  <span className="text-emerald-400 font-bold">₹{calculatedFairShare} / passenger</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Driver absorbs fair share of ₹{driverShare}. 100% peer-to-peer, zero commercial markup.
                </p>
              </div>

              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Seat Contribution</span>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    name="estimatedCost"
                    min="0"
                    required
                    value={formData.estimatedCost}
                    onChange={handleChange}
                    className="w-28 pl-7 pr-2 py-1.5 rounded-lg bg-slate-900 border border-brand-500/40 text-sm font-bold text-white text-right focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Ride Preferences
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-300">
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="music"
                    checked={formData.preferences.music}
                    onChange={handleChange}
                    className="accent-brand-500"
                  />
                  <span>Music Allowed</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="ac"
                    checked={formData.preferences.ac}
                    onChange={handleChange}
                    className="accent-brand-500"
                  />
                  <span>AC On</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="petFriendly"
                    checked={formData.preferences.petFriendly}
                    onChange={handleChange}
                    className="accent-brand-500"
                  />
                  <span>Pet Friendly</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    name="smoking"
                    checked={formData.preferences.smoking}
                    onChange={handleChange}
                    className="accent-brand-500"
                  />
                  <span>Smoking</span>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold text-sm shadow-xl shadow-brand-500/20 transition disabled:opacity-50"
          >
            {submitting ? 'Publishing Ride with Route...' : 'Publish Ride Offer'}
          </button>
        </form>
      )}

      {/* Interactive Map Picker Modal */}
      <LocationPickerModal
        isOpen={pickerConfig.isOpen}
        title={pickerConfig.title}
        initialCoordinates={pickerConfig.initialCoords}
        onClose={() => setPickerConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmLocation}
      />
    </div>
  );
};
