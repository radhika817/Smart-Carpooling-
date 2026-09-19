import L from 'leaflet';

/**
 * Configure Leaflet default marker icons for Vite bundler
 */
export const fixLeafletMarkerIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
};

/**
 * Custom SVG Marker Icons for Start (Emerald) and Destination (Rose/Brand)
 */
export const createColoredIcon = (color = '#10b981', label = '') => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10.8 14.4 26.4 15.2 27.2a1.2 1.2 0 0 0 1.6 0C17.6 42.4 32 26.8 32 16 32 7.163 24.837 0 16 0z" fill="${color}" filter="url(#shadow)"/>
      <circle cx="16" cy="15" r="7" fill="#ffffff"/>
      <circle cx="16" cy="15" r="4" fill="${color}"/>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-map-pin',
    html: svg,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -40],
  });
};

/**
 * Haversine formula to compute great-circle distance between two GPS coordinates in kilometers
 */
export const calculateDistanceKm = (coord1, coord2) => {
  if (!coord1 || !coord2) return 0;
  // coords are [longitude, latitude]
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// In-memory cache for Nominatim to be polite to OSM servers
const nominatimCache = new Map();

/**
 * Forward geocoding with OpenStreetMap Nominatim
 */
export const searchAddressNominatim = async (query) => {
  if (!query || query.trim().length < 3) return [];

  const trimmed = query.trim().toLowerCase();
  if (nominatimCache.has(trimmed)) {
    return nominatimCache.get(trimmed);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&addressdetails=1&limit=5`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const results = data.map((item) => ({
      address: item.display_name,
      shortName: item.name || item.display_name.split(',')[0],
      coordinates: [parseFloat(item.lon), parseFloat(item.lat)], // [lng, lat]
    }));

    nominatimCache.set(trimmed, results);
    return results;
  } catch (err) {
    console.warn('Nominatim geocode request failed:', err.message);
    return [];
  }
};

/**
 * Reverse geocoding with OpenStreetMap Nominatim
 */
export const reverseGeocodeNominatim = async (lng, lat) => {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (nominatimCache.has(cacheKey)) {
    return nominatimCache.get(cacheKey);
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const data = await res.json();
    const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    nominatimCache.set(cacheKey, address);
    return address;
  } catch (err) {
    console.warn('Nominatim reverse geocode failed:', err.message);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

/**
 * Fetch real road route geometry from Open Source Routing Machine (OSRM)
 * Falls back gracefully to straight line geodesic coordinates if OSRM is slow or offline
 */
export const fetchDrivingRoute = async (startCoords, destCoords) => {
  if (!startCoords || !destCoords) return null;

  const [startLng, startLat] = startCoords;
  const [destLng, destLat] = destCoords;

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Leaflet expects [lat, lng] array for polylines, whereas GeoJSON provides [lng, lat]
        const polylineCoords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMin = Math.round(route.duration / 60);

        return {
          coordinates: polylineCoords,
          distanceKm,
          durationMin,
          source: 'osrm',
        };
      }
    }
  } catch (err) {
    console.warn('OSRM routing unavailable, using direct geodesic path fallback:', err.message);
  }

  // Fallback: direct line between coordinates with Haversine distance
  const distanceKm = calculateDistanceKm(startCoords, destCoords);
  const estimatedMin = Math.round(distanceKm * 2.5); // Estimate 2.5 mins per km in city driving

  return {
    coordinates: [
      [startLat, startLng],
      [destLat, destLng],
    ],
    distanceKm,
    durationMin: Math.max(5, estimatedMin),
    source: 'haversine_fallback',
  };
};
