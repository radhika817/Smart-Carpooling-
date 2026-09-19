import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { fixLeafletMarkerIcons, createColoredIcon, fetchDrivingRoute } from '../../utils/geo';
import { Navigation, Clock, Loader2, Maximize2 } from 'lucide-react';

export const RouteMap = ({
  startLocation,
  destination,
  height = '320px',
  className = '',
  interactive = true,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineLayerRef = useRef(null);
  const markersGroupRef = useRef(null);

  const [routeStats, setRouteStats] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  useEffect(() => {
    fixLeafletMarkerIcons();
  }, []);

  // Initialize Map and Render Route
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [18.5204, 73.8567], // Pune default
        zoom: 12,
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.featureGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    // Clear previous layers
    markersGroup.clearLayers();
    if (polylineLayerRef.current) {
      map.removeLayer(polylineLayerRef.current);
      polylineLayerRef.current = null;
    }

    const hasStart = startLocation?.coordinates && startLocation.coordinates.length === 2;
    const hasDest = destination?.coordinates && destination.coordinates.length === 2;

    if (!hasStart && !hasDest) {
      setRouteStats(null);
      return;
    }

    // Add Start Marker
    if (hasStart) {
      const [startLng, startLat] = startLocation.coordinates;
      const startMarker = L.marker([startLat, startLng], {
        icon: createColoredIcon('#10b981', 'Pickup'),
      }).bindPopup(`<strong>Pickup:</strong><br/>${startLocation.address || 'Start Location'}`);
      markersGroup.addLayer(startMarker);
    }

    // Add Destination Marker
    if (hasDest) {
      const [destLng, destLat] = destination.coordinates;
      const destMarker = L.marker([destLat, destLng], {
        icon: createColoredIcon('#0284c7', 'Drop-off'),
      }).bindPopup(`<strong>Drop-off:</strong><br/>${destination.address || 'Destination'}`);
      markersGroup.addLayer(destMarker);
    }

    // Fetch and Draw Driving Route Polyline
    if (hasStart && hasDest) {
      setLoadingRoute(true);

      fetchDrivingRoute(startLocation.coordinates, destination.coordinates)
        .then((routeData) => {
          if (!routeData || !mapInstanceRef.current) return;

          setRouteStats({
            distanceKm: routeData.distanceKm,
            durationMin: routeData.durationMin,
            source: routeData.source,
          });

          // Draw Glowing Outer Line
          const glowLine = L.polyline(routeData.coordinates, {
            color: '#10b981',
            weight: 8,
            opacity: 0.35,
            lineCap: 'round',
          });

          // Draw Core Route Line
          const mainLine = L.polyline(routeData.coordinates, {
            color: '#059669',
            weight: 4,
            opacity: 0.95,
            lineCap: 'round',
          });

          const routeGroup = L.featureGroup([glowLine, mainLine]).addTo(map);
          polylineLayerRef.current = routeGroup;

          // Fit viewport bounds to encompass entire route with margin
          const allBounds = markersGroup.getBounds().extend(routeGroup.getBounds());
          map.fitBounds(allBounds, { padding: [40, 40], maxZoom: 16 });
        })
        .finally(() => {
          setLoadingRoute(false);
        });
    } else {
      map.fitBounds(markersGroup.getBounds(), { padding: [50, 50], maxZoom: 14 });
    }
  }, [startLocation, destination, interactive]);

  // Adjust size when parent container resizes
  const handleRecenter = () => {
    if (mapInstanceRef.current && markersGroupRef.current) {
      mapInstanceRef.current.invalidateSize();
      const bounds = markersGroupRef.current.getBounds();
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 ${className}`}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-10" />

      {/* Recenter / Invalidate control button */}
      <button
        type="button"
        onClick={handleRecenter}
        className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg backdrop-blur-md transition"
        title="Fit map to route"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* Route Distance & Travel Time Floating Badge */}
      {routeStats && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-20 px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur-md flex items-center gap-4 text-xs text-white">
          <div className="flex items-center gap-1.5 font-bold">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span>{routeStats.distanceKm} km</span>
            <span className="text-[10px] text-slate-400 font-normal">driving</span>
          </div>

          <div className="h-3 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <Clock className="w-4 h-4 text-brand-400" />
            <span>~{routeStats.durationMin} mins</span>
          </div>

          {loadingRoute && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400 ml-auto" />}
        </div>
      )}
    </div>
  );
};
