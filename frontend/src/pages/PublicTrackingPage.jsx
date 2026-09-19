import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Shield,
  ShieldCheck,
  MapPin,
  Car,
  Clock,
  Radio,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { safetyService } from '../services/safetyService';
import { io } from 'socket.io-client';

export const PublicTrackingPage = () => {
  const { shareToken } = useParams();
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [liveLocation, setLiveLocation] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);

  useEffect(() => {
    loadTracking();
  }, [shareToken]);

  const loadTracking = async () => {
    try {
      setLoading(true);
      const res = await safetyService.getPublicTracking(shareToken);
      setTelemetry(res?.data || res);
    } catch (err) {
      if (err.response?.status === 410 || err.message?.includes('expired') || err.message?.includes('concluded')) {
        setIsExpired(true);
      }
      setErrorMessage(err.response?.data?.message || err.message || 'Tracking link is unavailable.');
    } finally {
      setLoading(false);
    }
  };

  // Socket connection to live ride namespace if telemetry exists
  useEffect(() => {
    if (!telemetry?.rideId || isExpired) return;

    const socketUrl = 'http://localhost:5000';
    const nsp = io(`${socketUrl}/rides/${telemetry.rideId}`, {
      auth: { token: shareToken },
      transports: ['websocket', 'polling'],
    });

    nsp.on('location:broadcast', (loc) => {
      setLiveLocation(loc);
      if (driverMarkerRef.current && loc.coordinates) {
        driverMarkerRef.current.setLatLng([loc.coordinates[1], loc.coordinates[0]]);
      }
    });

    nsp.on('ride:status', (data) => {
      if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
        setIsExpired(true);
      }
    });

    return () => {
      nsp.disconnect();
    };
  }, [telemetry, isExpired, shareToken]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current || isExpired || !telemetry) return;

    const startCoords = telemetry.startLocation?.coordinates || [73.8567, 18.5204];
    const destCoords = telemetry.destination?.coordinates || [73.728, 18.5913];

    const map = L.map(mapContainerRef.current, {
      center: [startCoords[1], startCoords[0]],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Start Pin
    L.circleMarker([startCoords[1], startCoords[0]], {
      radius: 8,
      fillColor: '#10b981',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map).bindPopup(`<b>Pickup:</b> ${telemetry.startLocation?.address}`);

    // Destination Pin
    L.circleMarker([destCoords[1], destCoords[0]], {
      radius: 8,
      fillColor: '#ef4444',
      color: '#ffffff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(map).bindPopup(`<b>Destination:</b> ${telemetry.destination?.address}`);

    // Driver Marker (Car icon)
    const carHtml = `<div style="background:#10b981; border:2px solid white; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px rgba(16,185,129,0.7); font-size:14px;">🚗</div>`;
    const carIcon = L.divIcon({
      html: carHtml,
      className: 'driver-car-pin',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const driverMarker = L.marker([startCoords[1], startCoords[0]], { icon: carIcon }).addTo(map);
    driverMarkerRef.current = driverMarker;
    mapInstanceRef.current = map;

    // Fit map bounds to start and destination
    const bounds = L.latLngBounds(
      [startCoords[1], startCoords[0]],
      [destCoords[1], destCoords[0]]
    );
    map.fitBounds(bounds, { padding: [50, 50] });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [telemetry, isExpired]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center font-black">
              SR
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white">
                SmartRide Live Commute Tracker
              </h1>
              <p className="text-xs text-slate-400">Public secure live location stream</p>
            </div>
          </div>
          <Link
            to="/"
            className="text-xs text-brand-400 font-bold hover:underline"
          >
            Learn about SmartRide
          </Link>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="glass-card p-12 rounded-3xl text-center space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400">Resolving secure tracking link...</p>
          </div>
        ) : isExpired ? (
          /* Privacy Expired State (HTTP 410 Guardrail) */
          <div className="glass-card p-8 sm:p-12 rounded-3xl border border-slate-800 text-center space-y-5 animate-fade-in shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-2xl font-black text-white">Live Tracking Expired</h2>
              <p className="text-sm text-slate-300 font-medium">
                This ride has safely concluded or the allotted sharing window has ended.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed pt-2">
                For passenger and driver safety, live GPS sharing is permanently deactivated immediately after a trip finishes to protect personal location privacy.
              </p>
            </div>
            <div className="pt-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
              >
                Back to Homepage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : telemetry ? (
          /* Active Live Tracking */
          <div className="space-y-6">
            {/* Status & Driver Pill */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Status</span>
                <span className="inline-flex items-center gap-1.5 text-sm font-black text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {telemetry.status}
                </span>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Driver</span>
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-brand-400" />
                  {telemetry.driver?.name} ({telemetry.vehicle?.model})
                </span>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">ETA Remaining</span>
                <span className="text-sm font-black text-amber-400">
                  {liveLocation?.etaMinutes ? `~${liveLocation.etaMinutes} mins` : 'Calculating...'}
                </span>
              </div>
            </div>

            {/* Live Leaflet Map */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800 h-[450px] shadow-2xl bg-slate-950">
              <div ref={mapContainerRef} className="w-full h-full" />
              <div className="absolute bottom-3 left-3 z-[1000] px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur border border-slate-800 text-xs text-slate-300 font-semibold flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Live Telemetry Active
              </div>
            </div>

            {/* Commute Route Summary */}
            <div className="glass-card p-5 rounded-3xl border border-slate-800 space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Pickup Location</span>
                  <span className="font-semibold text-white">{telemetry.startLocation?.address}</span>
                </div>
              </div>
              <div className="border-l-2 border-dashed border-slate-800 ml-2 h-4" />
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Destination</span>
                  <span className="font-semibold text-white">{telemetry.destination?.address}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-sm text-slate-400">
            {errorMessage || 'Ride tracking information is unavailable.'}
          </div>
        )}
      </div>
    </div>
  );
};
