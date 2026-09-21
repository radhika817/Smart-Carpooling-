import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { rideService } from '../services/rideService';
import { vehicleService } from '../services/vehicleService';
import { groupService } from '../services/groupService';
import { useAuth } from '../context/AuthContext';
import { LocationAutocomplete } from '../components/map/LocationAutocomplete';
import { LocationPickerModal } from '../components/map/LocationPickerModal';
import { RouteMap } from '../components/map/RouteMap';
import {
  PlusCircle,
  Calendar,
  Clock,
  Car,
  AlertCircle,
  Sparkles,
  Navigation,
  Repeat,
  Users,
  Building,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export const CreateRidePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Phase 8: Carpool Group & Scoping State
  const preselectedGroupId = searchParams.get('groupId') || '';
  const [carpoolGroups, setCarpoolGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(preselectedGroupId);
  const [isCommunityOnly, setIsCommunityOnly] = useState(false);

  // Phase 8: Recurring Schedule State
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Default: Mon-Fri
  const [repeatWeeks, setRepeatWeeks] = useState(4);

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

  // Clean number inputs to prevent leading zero bugs (e.g. '0400' -> '400')
  const cleanNumberInput = (raw) => {
    if (raw === '' || raw === undefined || raw === null) return '';
    return String(raw).replace(/^0+(?=\d)/, '');
  };

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
    const loadInitialData = async () => {
      try {
        const [vehiclesData, groupsRes] = await Promise.all([
          vehicleService.getVehicles().catch(() => []),
          groupService.getGroups({ myGroups: 'true' }).catch(() => ({ data: [] })),
        ]);
        setVehicles(vehiclesData || []);
        if (vehiclesData && vehiclesData.length > 0) {
          setFormData((prev) => ({ ...prev, vehicleId: vehiclesData[0]._id }));
        }
        setCarpoolGroups(groupsRes?.data || []);
      } catch (err) {
        setError('Failed to fetch initial data. Please ensure you are logged in.');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
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
    } else if (name === 'totalSeats') {
      const cleaned = cleanNumberInput(value);
      setFormData((prev) => ({
        ...prev,
        totalSeats: cleaned === '' ? '' : Math.max(1, Number(cleaned)),
      }));
    } else if (name === 'estimatedCost') {
      const cleaned = cleanNumberInput(value);
      setFormData((prev) => ({
        ...prev,
        estimatedCost: cleaned === '' ? '' : Number(cleaned),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
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
      let recurrence = { isRecurring: false };
      if (isRecurring) {
        const startD = new Date(formData.date);
        const endD = new Date(startD.getTime() + repeatWeeks * 7 * 24 * 60 * 60 * 1000);
        recurrence = {
          isRecurring: true,
          frequency: 'weekly',
          daysOfWeek: selectedDays,
          startDate: formData.date,
          endDate: endD.toISOString().split('T')[0],
        };
      }

      const communityScope = {
        isRestricted: isCommunityOnly,
        organization: isCommunityOnly ? (user?.organization || '') : '',
      };

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
        recurrence,
        communityScope,
        carpoolGroup: selectedGroupId || null,
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
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <PlusCircle className="w-8 h-8 text-brand-600" />
          Offer a Ride
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Pick your route on the map, set available seats, and split daily commute costs with peers.
        </p>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="mt-8 p-8 rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 text-center">
          <Car className="w-12 h-12 text-amber-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No registered vehicles found</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto mt-1">
            You need to register at least one vehicle to your account before posting rides.
          </p>
          <Link
            to="/vehicles"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-600/20 transition"
          >
            Add a vehicle now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Vehicle Selector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              Select vehicle
            </label>
            <select
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.model} ({v.registrationNumber}) — {v.seats} Seats Max
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Route Selection with Nominatim & Map Picker */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Navigation className="w-4 h-4 text-brand-600" />
                Route & map geometry
              </h3>
              <span className="text-xs text-slate-500">Live OSRM driving distance</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LocationAutocomplete
                label="Pickup location (Start)"
                value={startLocation.address}
                iconColor="text-brand-600"
                placeholder="Type start address (e.g. Shivajinagar Station)..."
                onChange={(addr) => setStartLocation((prev) => ({ ...prev, address: addr }))}
                onSelectLocation={(loc) => setStartLocation(loc)}
                onOpenMapPicker={() => handleOpenPicker('start')}
              />

              <LocationAutocomplete
                label="Drop-off destination"
                value={destination.address}
                iconColor="text-sunrise-700"
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
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Date</label>
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
                  style={{ colorScheme: 'light' }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Departure time</label>
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
                  style={{ colorScheme: 'light' }}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">Seats to offer</label>
              <input
                type="number"
                name="totalSeats"
                min="1"
                max="8"
                required
                value={formData.totalSeats}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Pricing & Fair Cost-Sharing Calculator */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  Fair Cost-Sharing Calculator
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Peer-to-peer carpool model: Trip expenses split equally among driver and passengers.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 font-semibold text-xs border border-brand-200">
                Non-Commercial
              </span>
            </div>

            {/* Trip Expenses Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated fuel (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={costBreakdown.fuel === 0 ? '0' : (costBreakdown.fuel || '')}
                    onChange={(e) => setCostBreakdown((prev) => ({ ...prev, fuel: cleanNumberInput(e.target.value) }))}
                    placeholder="200"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Toll charges (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={costBreakdown.toll === 0 ? '0' : (costBreakdown.toll || '')}
                    onChange={(e) => setCostBreakdown((prev) => ({ ...prev, toll: cleanNumberInput(e.target.value) }))}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Parking / Other (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={costBreakdown.parking === 0 ? '0' : (costBreakdown.parking || '')}
                    onChange={(e) => setCostBreakdown((prev) => ({ ...prev, parking: cleanNumberInput(e.target.value) }))}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Live Arithmetic Calculation Box (Tier 3 Recessed Panel) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <span className="font-bold text-slate-900">
                  Total trip expense: <span className="text-slate-900 font-extrabold text-sm">₹{totalTripCost}</span>
                </span>
                <p className="text-slate-700">
                  Split across <span className="text-brand-700 font-semibold">{totalOccupants} people</span> (1 driver + {formData.totalSeats} seats) ={' '}
                  <span className="text-brand-700 font-bold">₹{calculatedFairShare} / passenger</span>
                </p>
                <p className="text-xs text-slate-500">
                  Driver absorbs fair share of ₹{driverShare}. 100% peer-to-peer, zero commercial markup.
                </p>
              </div>

              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-xs font-semibold text-slate-700">Seat contribution</span>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    name="estimatedCost"
                    min="0"
                    required
                    value={formData.estimatedCost === 0 ? '0' : (formData.estimatedCost || '')}
                    onChange={handleChange}
                    className="w-28 pl-7 pr-2 py-1.5 rounded-lg bg-white border border-brand-500/40 text-sm font-bold text-slate-900 text-right focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Ride preferences
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-700">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    name="music"
                    checked={formData.preferences.music}
                    onChange={handleChange}
                    className="accent-brand-600"
                  />
                  <span className="font-medium">Music allowed</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    name="ac"
                    checked={formData.preferences.ac}
                    onChange={handleChange}
                    className="accent-brand-600"
                  />
                  <span className="font-medium">AC on</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    name="petFriendly"
                    checked={formData.preferences.petFriendly}
                    onChange={handleChange}
                    className="accent-brand-600"
                  />
                  <span className="font-medium">Pet friendly</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    name="smoking"
                    checked={formData.preferences.smoking}
                    onChange={handleChange}
                    className="accent-brand-600"
                  />
                  <span className="font-medium">Smoking ok</span>
                </label>
              </div>
            </div>
          </div>

          {/* Phase 8: Recurring Schedule Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Recurring commuter schedule
                  </h3>
                  <p className="text-xs text-slate-600">
                    Automatically generate independent ride instances for your regular commute routine.
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-slate-800">Repeat days</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                      >
                        Mon–Fri
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDays([1, 3, 5])}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                      >
                        Mon/Wed/Fri
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                        className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
                      >
                        All 7 Days
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {[
                      { day: 0, label: 'Sun' },
                      { day: 1, label: 'Mon' },
                      { day: 2, label: 'Tue' },
                      { day: 3, label: 'Wed' },
                      { day: 4, label: 'Thu' },
                      { day: 5, label: 'Fri' },
                      { day: 6, label: 'Sat' },
                    ].map(({ day, label }) => {
                      const isSelected = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              if (selectedDays.length > 1) {
                                setSelectedDays(selectedDays.filter((d) => d !== day));
                              }
                            } else {
                              setSelectedDays([...selectedDays, day].sort());
                            }
                          }}
                          className={`py-2 text-xs font-bold rounded-xl border transition ${
                            isSelected
                              ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">Schedule duration</label>
                    <select
                      value={repeatWeeks}
                      onChange={(e) => setRepeatWeeks(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20"
                    >
                      <option value={2}>2 Weeks</option>
                      <option value={4}>4 Weeks (1 Month)</option>
                      <option value={8}>8 Weeks (2 Months max)</option>
                    </select>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-700 flex-shrink-0" />
                    <span className="text-slate-700">
                      Each occurrence gets its own ride document and independent bookings. You can cancel individual dates or the entire series later.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Phase 8: Community Scoping & Carpool Circles */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Community scoping & carpool circles
                </h3>
                <p className="text-xs text-slate-600">
                  Restrict this ride to your verified workplace/campus or an existing carpool group.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Organization Restriction */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-teal-700" />
                    Community only
                  </span>
                  <input
                    type="checkbox"
                    checked={isCommunityOnly}
                    disabled={!user?.organization}
                    onChange={(e) => setIsCommunityOnly(e.target.checked)}
                    className="accent-teal-600 w-4 h-4 cursor-pointer disabled:opacity-40"
                  />
                </div>
                {user?.organization ? (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Limit ride visibility to verified commuters from{' '}
                    <span className="text-teal-800 font-semibold">{user.organization}</span>. Only colleagues/peers can book.
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Add and verify your organization email in Profile to restrict rides to your company or college.
                  </p>
                )}
              </div>

              {/* Carpool Group Selector */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-600" />
                  Assign to carpool group
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">None (Open Public Listing)</option>
                  {carpoolGroups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.name} ({g.members?.length || 0} members)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  {carpoolGroups.length === 0
                    ? 'No carpool groups joined yet. You can create or join one on the Groups page.'
                    : 'Rides linked to a group appear directly in the group dashboard for your circle.'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-md shadow-brand-600/20 transition disabled:opacity-50"
          >
            {submitting ? 'Publishing ride with route...' : 'Publish ride offer'}
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
