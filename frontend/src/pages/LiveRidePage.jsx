import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import L from 'leaflet';
import { rideService } from '../services/rideService';
import { useAuth } from '../context/AuthContext';
import { connectRideSocket } from '../services/socket';
import { InRideChat } from '../components/chat/InRideChat';
import { fixLeafletMarkerIcons } from '../utils/geo';
import {
  Navigation,
  Clock,
  Car,
  MapPin,
  Play,
  Pause,
  SkipForward,
  Compass,
  CheckCircle,
  AlertCircle,
  Shield,
  Phone,
  Radio,
  ArrowLeft,
  Star,
} from 'lucide-react';
import { SosAlertModal } from '../components/safety/SosAlertModal';
import { ShareTrackingModal } from '../components/safety/ShareTrackingModal';
import { RateRideModal } from '../components/safety/RateRideModal';

// Custom Vehicle Pin SVG for Live Map
const carIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="38" height="38">
  <circle cx="12" cy="12" r="11" fill="#0f172a" stroke="#10b981" stroke-width="2.5"/>
  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4.66l.12-.34h13.77l.11.34V17z" fill="#ffffff"/>
  <circle cx="7.5" cy="14.5" r="1.5" fill="#10b981"/>
  <circle cx="16.5" cy="14.5" r="1.5" fill="#10b981"/>
</svg>`;

const createVehicleIcon = () =>
  L.divIcon({
    html: `<div class="live-vehicle-marker shadow-lg shadow-emerald-500/40">${carIconSvg}</div>`,
    className: 'custom-vehicle-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });

const pickupIcon = L.divIcon({
  html: `<div class="w-7 h-7 rounded-full bg-emerald-600 border-2 border-white flex items-center justify-center text-white font-bold shadow-md">A</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const dropoffIcon = L.divIcon({
  html: `<div class="w-7 h-7 rounded-full bg-sunrise-600 border-2 border-white flex items-center justify-center text-white font-bold shadow-md">B</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export const LiveRidePage = () => {
  const { id: rideId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);

  // Live real-time ride tracking states
  const [driverLocation, setDriverLocation] = useState(null); // [lat, lng]
  const [heading, setHeading] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [distanceRemaining, setDistanceRemaining] = useState(null);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [rideStatus, setRideStatus] = useState('CONFIRMED');
  const [statusNotification, setStatusNotification] = useState('');
  const [showRateModal, setShowRateModal] = useState(false);

  // Simulation controls (for Driver)
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIndex, setSimIndex] = useState(0);
  const simTimerRef = useRef(null);
  const [routeWaypoints, setRouteWaypoints] = useState([]);

  // Leaflet Map Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  useEffect(() => {
    fixLeafletMarkerIcons();
  }, []);

  // Fetch ride details
  useEffect(() => {
    let isMounted = true;
    const fetchRide = async () => {
      try {
        setLoading(true);
        const data = await rideService.getRideById(rideId);
        if (!isMounted) return;
        setRide(data);
        setRideStatus(data.status || 'CONFIRMED');

        const startLngLat = data.startLocation?.coordinates || [73.8567, 18.5204];
        const destLngLat = data.destination?.coordinates || [73.7389, 18.5913];

        let waypoints = [];
        if (data.route?.coordinates && Array.isArray(data.route.coordinates) && data.route.coordinates.length > 5) {
          waypoints = data.route.coordinates;
        } else {
          // Generate 25 smooth interpolated waypoints between start and destination
          const steps = 25;
          for (let i = 0; i <= steps; i++) {
            const frac = i / steps;
            const lng = startLngLat[0] + (destLngLat[0] - startLngLat[0]) * frac;
            const lat = startLngLat[1] + (destLngLat[1] - startLngLat[1]) * frac;
            waypoints.push([lng, lat]);
          }
        }
        setRouteWaypoints(waypoints);
        setDriverLocation([startLngLat[1], startLngLat[0]]);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load ride tracking session');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRide();
    return () => {
      isMounted = false;
    };
  }, [rideId]);

  // Connect authorized Socket.IO client instance
  useEffect(() => {
    if (!rideId) return;

    const s = connectRideSocket(rideId);
    setSocket(s);

    // 1. Listen for live location broadcasts from driver
    s.on('location:broadcast', (loc) => {
      if (loc.coordinates && loc.coordinates.length === 2) {
        // loc.coordinates is [lng, lat] -> Leaflet requires [lat, lng]
        const latLng = [loc.coordinates[1], loc.coordinates[0]];
        setDriverLocation(latLng);
        setHeading(loc.heading || 0);
        setSpeed(loc.speed || 0);
        if (loc.distanceRemainingKm !== undefined) setDistanceRemaining(loc.distanceRemainingKm);
        if (loc.etaMinutes !== undefined) setEtaMinutes(loc.etaMinutes);
      }
    });

    // 2. Listen for real-time ride status transitions
    s.on('ride:status', (statusData) => {
      if (statusData.status) {
        setRideStatus(statusData.status);
        setStatusNotification(statusData.message || `Ride status updated to ${statusData.status}`);
        setTimeout(() => setStatusNotification(''), 6000);
        if (statusData.status === 'COMPLETED') {
          setShowRateModal(true);
        }
      }
    });

    return () => {
      s.disconnect();
    };
  }, [rideId]);

  // Determine if logged-in user is the driver
  const isDriver =
    user?._id === ride?.driver?._id ||
    user?.id === ride?.driver?._id ||
    user?._id === ride?.driver ||
    user?.id === ride?.driver;

  // Initialize and update Leaflet map
  useEffect(() => {
    if (loading || !mapContainerRef.current || !ride) return;

    const startLat = ride.startLocation?.coordinates?.[1] || 18.5204;
    const startLng = ride.startLocation?.coordinates?.[0] || 73.8567;
    const destLat = ride.destination?.coordinates?.[1] || 18.5913;
    const destLng = ride.destination?.coordinates?.[0] || 73.7389;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Pickup Marker
      L.marker([startLat, startLng], { icon: pickupIcon })
        .addTo(map)
        .bindPopup(`<strong>Pickup</strong><br/>${ride.startLocation?.address}`);

      // Dropoff Marker
      L.marker([destLat, destLng], { icon: dropoffIcon })
        .addTo(map)
        .bindPopup(`<strong>Drop-off</strong><br/>${ride.destination?.address}`);

      // Route Polyline
      const pts = routeWaypoints.map((w) => [w[1], w[0]]);
      polylineRef.current = L.polyline(pts.length > 0 ? pts : [[startLat, startLng], [destLat, destLng]], {
        color: '#10b981',
        weight: 5,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);

      // Fit bounds
      const bounds = L.latLngBounds([
        [startLat, startLng],
        [destLat, destLng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });

      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, ride]);

  // Update moving driver marker whenever driverLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current || !driverLocation) return;

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker(driverLocation, { icon: createVehicleIcon() })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<strong>${ride?.driver?.name}</strong> (${ride?.vehicle?.model})`);
    } else {
      driverMarkerRef.current.setLatLng(driverLocation);
      mapInstanceRef.current.panTo(driverLocation, { animate: true, duration: 1.0 });
    }
  }, [driverLocation, ride]);

  // Broadcast driver position helper
  const emitLocation = (coordsLngLat, currentHeading = 0, currentSpeed = 35) => {
    if (!socket || !isDriver) return;
    socket.emit('location:update', {
      coordinates: coordsLngLat,
      heading: currentHeading,
      speed: currentSpeed,
    });
  };

  // 1. Simulation Step Function
  const stepSimulation = (targetIndex) => {
    if (!routeWaypoints || routeWaypoints.length === 0) return;
    const nextIdx = targetIndex % routeWaypoints.length;
    setSimIndex(nextIdx);

    const pt = routeWaypoints[nextIdx]; // [lng, lat]
    const nextPt = routeWaypoints[(nextIdx + 1) % routeWaypoints.length];

    let calculatedHeading = heading;
    if (nextPt) {
      const dLng = nextPt[0] - pt[0];
      const dLat = nextPt[1] - pt[1];
      calculatedHeading = Math.round((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
      setHeading(calculatedHeading);
    }

    const latLng = [pt[1], pt[0]];
    setDriverLocation(latLng);
    emitLocation(pt, calculatedHeading, 40);
  };

  // 2. Toggle Auto-Simulation (every 1.5 seconds)
  const toggleSimulation = () => {
    if (isSimulating) {
      clearInterval(simTimerRef.current);
      setIsSimulating(false);
    } else {
      setIsSimulating(true);
      simTimerRef.current = setInterval(() => {
        setSimIndex((prev) => {
          const next = (prev + 1) % routeWaypoints.length;
          const pt = routeWaypoints[next];
          const latLng = [pt[1], pt[0]];
          setDriverLocation(latLng);
          emitLocation(pt, 90, 42);
          return next;
        });
      }, 1500);
    }
  };

  useEffect(() => {
    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, []);

  // Status transition handler for Driver
  const handleStatusChange = async (newStatus, msg) => {
    try {
      await rideService.updateRideStatus(rideId, newStatus, msg);
      setRideStatus(newStatus);
      if (newStatus === 'COMPLETED') {
        setShowRateModal(true);
      }
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
        Connecting to live ride session...
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-red-400">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <h3 className="text-lg font-bold text-white">Live Tracking Error</h3>
        <p className="text-sm text-slate-400 mt-1">{error || 'Ride not found'}</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-slate-950 font-bold text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600 animate-ping" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                Live Commute Tracking & Chat
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {ride.startLocation?.address} → {ride.destination?.address}
            </p>
          </div>
        </div>

        {/* Status Pill Badge & Safety Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 shadow-2xs ${
              rideStatus === 'IN_PROGRESS'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 animate-pulse'
                : rideStatus === 'DRIVER_ARRIVING'
                ? 'bg-sunrise-50 text-sunrise-800 border-sunrise-300 animate-pulse'
                : rideStatus === 'COMPLETED'
                ? 'bg-blue-50 text-blue-800 border-blue-300'
                : 'bg-brand-50 text-brand-700 border-brand-300'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            {rideStatus.replace('_', ' ')}
          </span>
          <span className="text-xs text-slate-600 font-semibold px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
            {isDriver ? 'Driver View' : 'Passenger View'}
          </span>

          {/* Share Live Tracking Modal Button */}
          <ShareTrackingModal rideId={rideId} />

          {/* Emergency SOS Button */}
          <SosAlertModal
            rideId={rideId}
            socket={socket}
            isRideActive={rideStatus === 'DRIVER_ARRIVING' || rideStatus === 'IN_PROGRESS'}
            userRole={isDriver ? 'driver' : 'passenger'}
          />

          {rideStatus === 'COMPLETED' && (
            <button
              type="button"
              onClick={() => setShowRateModal(true)}
              className="px-3 py-1.5 rounded-xl bg-sunrise-50 hover:bg-sunrise-100 text-sunrise-800 border border-sunrise-200 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <Star className="w-3.5 h-3.5 fill-sunrise-500 text-sunrise-500" />
              <span>Rate ride</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-time Status Notification Toast */}
      {statusNotification && (
        <div className="p-3.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-800 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top duration-200">
          <CheckCircle className="w-4 h-4 text-brand-600 flex-shrink-0" />
          <span className="font-semibold">{statusNotification}</span>
        </div>
      )}

      {/* Main Grid: Live Map + HUD (Left) & Chat + Controls (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map & Live Telemetry Section (2 Columns) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          {/* Floating HUD Telemetry Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sunrise-50 text-sunrise-700 border border-sunrise-200 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Estimated ETA</span>
                <span className="text-lg font-black text-slate-900">
                  {etaMinutes !== null ? `${etaMinutes} mins` : 'Calculating...'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center flex-shrink-0">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Distance remaining</span>
                <span className="text-lg font-black text-slate-900">
                  {distanceRemaining !== null ? `${distanceRemaining} km` : 'En route'}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 flex items-center justify-center flex-shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 block">Speed / Vehicle</span>
                <span className="text-lg font-black text-slate-900">
                  {speed ? `${speed} km/h` : 'Moving'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Leaflet Live Map */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-[480px] shadow-sm bg-slate-100">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Map Watermark & Attribution */}
            <div className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur border border-slate-200 text-xs text-slate-700 font-medium flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
              Socket.IO GPS Telemetry Active
            </div>
          </div>

          {/* Driver Simulation & Lifecycle Action Panel (Only for Driver) */}
          {isDriver && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-brand-600" />
                  Driver live controls & GPS simulation
                </span>
                <span className="text-xs text-slate-500">Step {simIndex + 1} of {routeWaypoints.length}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                {/* Auto Simulation Button */}
                <button
                  type="button"
                  onClick={toggleSimulation}
                  className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition ${
                    isSimulating
                      ? 'bg-sunrise-50 text-sunrise-800 border border-sunrise-300'
                      : 'bg-brand-600 text-white font-semibold hover:bg-brand-700 shadow-sm'
                  }`}
                >
                  {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isSimulating ? 'Pause simulation' : 'Start simulation'}
                </button>

                {/* Step Forward Button */}
                <button
                  type="button"
                  onClick={() => stepSimulation(simIndex + 1)}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 transition border border-slate-200"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Step forward
                </button>

                {/* Mark Arriving Button */}
                <button
                  type="button"
                  onClick={() => handleStatusChange('DRIVER_ARRIVING', 'Driver is arriving at pickup location!')}
                  className="py-2 px-3 rounded-xl bg-sunrise-50 hover:bg-sunrise-100 text-sunrise-800 border border-sunrise-200 transition flex items-center justify-center gap-1"
                >
                  Mark arrived
                </button>

                {/* Complete Ride Button */}
                <button
                  type="button"
                  onClick={() => handleStatusChange('COMPLETED', 'Ride has finished safely.')}
                  className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition flex items-center justify-center gap-1"
                >
                  Complete ride
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: In-Ride Real-Time Chat */}
        <div className="space-y-4">
          <InRideChat
            rideId={rideId}
            currentUser={user}
            isDriver={isDriver}
            socket={socket}
          />

          {/* Ride Details Summary Card */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand-200">
                {ride.driver?.name?.charAt(0) || 'D'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{ride.driver?.name}</h4>
                <p className="text-slate-500 text-xs">
                  {ride.vehicle?.model} • {ride.vehicle?.registrationNumber}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Departure:</span>
                <span className="font-semibold text-slate-900">{ride.departureTime} ({ride.date})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Available seats:</span>
                <span className="font-semibold text-slate-900">{ride.availableSeats} of {ride.totalSeats}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contribution:</span>
                <span className="font-bold text-brand-700">₹{ride.estimatedCost} / seat</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Ride Mutual Rating Modal */}
      <RateRideModal
        isOpen={showRateModal}
        onClose={() => setShowRateModal(false)}
        rideId={rideId}
        targetUser={isDriver ? { name: 'Ride Passenger', role: 'passenger' } : ride?.driver}
        onSuccess={() => {}}
      />
    </div>
  );
};
