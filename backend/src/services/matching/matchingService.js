/**
 * PURE FUNCTION BOUNDARY: Matching Engine (system.md §3.4)
 * 
 * scoreRide(ride, searchCriteria) -> { score, matchPercentage, breakdown, summary }
 * 
 * Weighted scoring model:
 * - Route Similarity:      40%
 * - Time Compatibility:    25%
 * - Pickup Proximity:      20%
 * - Destination Proximity: 15%
 * 
 * This module has NO knowledge of Express, HTTP, Mongoose, or database queries.
 * It receives already-fetched ride documents and search criteria.
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Normalizes input coordinates into standard GeoJSON [longitude, latitude]
 */
export const normalizeLngLat = (coord) => {
  if (!coord) return null;
  if (Array.isArray(coord)) {
    if (coord.length < 2) return null;
    // Auto-detect [lat, lng] reversal for South Asia / India (lat ~8..38, lng ~68..98)
    if (coord[0] < 40 && coord[1] > 40) {
      return [coord[1], coord[0]];
    }
    return [Number(coord[0]), Number(coord[1])];
  }
  if (typeof coord === 'object') {
    const lng = coord.lng ?? coord.lon ?? coord.longitude ?? coord.coordinates?.[0];
    const lat = coord.lat ?? coord.latitude ?? coord.coordinates?.[1];
    if (lng !== undefined && lat !== undefined) {
      return [Number(lng), Number(lat)];
    }
  }
  return null;
};

/**
 * Pure Haversine distance in kilometers
 */
export const haversineDistanceKm = (c1, c2) => {
  const coord1 = normalizeLngLat(c1);
  const coord2 = normalizeLngLat(c2);
  if (!coord1 || !coord2) return 999;
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
};

/**
 * Compute compass bearing between two points in degrees (0 - 360)
 */
export const calculateBearing = (c1, c2) => {
  const coord1 = normalizeLngLat(c1);
  const coord2 = normalizeLngLat(c2);
  if (!coord1 || !coord2) return 0;
  const [lon1, lat1] = coord1.map((deg) => (deg * Math.PI) / 180);
  const [lon2, lat2] = coord2.map((deg) => (deg * Math.PI) / 180);

  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);

  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
};

/**
 * Parse time string "HH:mm" into total minutes from midnight
 */
export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

/**
 * PURE FUNCTION: scoreRide
 *
 * @param {Object} ride - Ride document with startLocation, destination, departureTime
 * @param {Object} searchCriteria - { pickupCoords, destCoords, departureTime, maxDetourKm }
 * @returns {Object} { score, matchPercentage, breakdown, summary }
 */
export const scoreRide = (ride, searchCriteria = {}) => {
  const rideStart = ride.startLocation?.coordinates;
  const rideDest = ride.destination?.coordinates;
  const passengerPickup = searchCriteria.pickupCoords;
  const passengerDest = searchCriteria.destCoords;

  // 1. Pickup Proximity (20% Weight)
  let pickupDistKm = 0;
  let pickupScore = 1.0; // Default perfect if no passenger coords given
  if (passengerPickup && rideStart) {
    pickupDistKm = haversineDistanceKm(rideStart, passengerPickup);
    // <= 0.5 km is 100%, drops linearly to 0 at 5.0 km
    if (pickupDistKm <= 0.5) {
      pickupScore = 1.0;
    } else if (pickupDistKm >= 5.0) {
      pickupScore = 0.05;
    } else {
      pickupScore = 1.0 - (pickupDistKm - 0.5) / 4.5;
    }
  }
  const pickupPoints = Math.round(pickupScore * 20 * 10) / 10;

  // 2. Destination Proximity (15% Weight)
  let destDistKm = 0;
  let destScore = 1.0;
  if (passengerDest && rideDest) {
    destDistKm = haversineDistanceKm(rideDest, passengerDest);
    // <= 0.5 km is 100%, drops linearly to 0 at 5.0 km
    if (destDistKm <= 0.5) {
      destScore = 1.0;
    } else if (destDistKm >= 5.0) {
      destScore = 0.05;
    } else {
      destScore = 1.0 - (destDistKm - 0.5) / 4.5;
    }
  }
  const destPoints = Math.round(destScore * 15 * 10) / 10;

  // 3. Time Compatibility (25% Weight)
  let timeDiffMins = 0;
  let timeScore = 1.0;
  if (searchCriteria.departureTime && ride.departureTime) {
    const passengerTime = parseTimeToMinutes(searchCriteria.departureTime);
    const driverTime = parseTimeToMinutes(ride.departureTime);
    timeDiffMins = Math.abs(driverTime - passengerTime);

    // Exact time = 100%, drops linearly to 0 at 60 mins diff
    if (timeDiffMins === 0) {
      timeScore = 1.0;
    } else if (timeDiffMins >= 60) {
      timeScore = 0.05;
    } else {
      timeScore = Math.max(0.05, 1.0 - timeDiffMins / 60);
    }
  }
  const timePoints = Math.round(timeScore * 25 * 10) / 10;

  // 4. Route Similarity (40% Weight)
  // Combines trajectory directional alignment + corridor detour efficiency
  let routeSimilarityScore = 0.85; // baseline reasonable route overlap
  let routeOverlapPct = 85;

  if (rideStart && rideDest && passengerPickup && passengerDest) {
    // A. Directional Bearing Alignment (cos of angular difference)
    const rideBearing = calculateBearing(rideStart, rideDest);
    const passengerBearing = calculateBearing(passengerPickup, passengerDest);
    let angleDiff = Math.abs(rideBearing - passengerBearing);
    if (angleDiff > 180) angleDiff = 360 - angleDiff;
    const directionFactor = Math.max(0, Math.cos((angleDiff * Math.PI) / 180));

    // B. Direct vs Detour distance ratio
    const directRideDist = haversineDistanceKm(rideStart, rideDest);
    const detourDist =
      pickupDistKm +
      haversineDistanceKm(passengerPickup, passengerDest) +
      destDistKm;

    const detourFactor = directRideDist > 0 ? Math.min(1.0, directRideDist / Math.max(directRideDist, detourDist)) : 1.0;

    routeSimilarityScore = Math.min(1.0, 0.5 * directionFactor + 0.5 * detourFactor);
    routeOverlapPct = Math.max(10, Math.round(routeSimilarityScore * 100));
  }
  const routePoints = Math.round(routeSimilarityScore * 40 * 10) / 10;

  // Total Score Calculation (Sum of 4 weighted components out of 100)
  const totalScore = Math.min(100, Math.max(5, Math.round((routePoints + timePoints + pickupPoints + destPoints) * 10) / 10));
  const matchPercentage = Math.round(totalScore);

  // Human-readable summary and structured breakdown
  const summaryParts = [];
  if (routeOverlapPct) summaryParts.push(`${routeOverlapPct}% route overlap`);
  if (timeDiffMins !== undefined && searchCriteria.departureTime) summaryParts.push(`${timeDiffMins} min time diff`);
  if (pickupDistKm !== undefined && passengerPickup) summaryParts.push(`${pickupDistKm}km pickup distance`);
  if (destDistKm !== undefined && passengerDest) summaryParts.push(`${destDistKm}km dest distance`);

  const summaryText = summaryParts.length > 0
    ? `${matchPercentage}% match — ${summaryParts.join(', ')}`
    : `${matchPercentage}% match — Direct corridor route`;

  return {
    score: totalScore,
    matchPercentage,
    breakdown: {
      routeSimilarity: {
        weight: 40,
        points: routePoints,
        percentage: routeOverlapPct,
        label: `${routeOverlapPct}% route overlap`,
      },
      timeCompatibility: {
        weight: 25,
        points: timePoints,
        diffMinutes: timeDiffMins,
        label: timeDiffMins === 0 ? 'Same departure time' : `${timeDiffMins} min time diff`,
      },
      pickupProximity: {
        weight: 20,
        points: pickupPoints,
        distanceKm: pickupDistKm,
        label: `${pickupDistKm}km pickup distance`,
      },
      destinationProximity: {
        weight: 15,
        points: destPoints,
        distanceKm: destDistKm,
        label: `${destDistKm}km dest distance`,
      },
    },
    summary: summaryText,
  };
};

/**
 * Smart Pickup Point Suggestion (Centroid / Geometric Clustering)
 *
 * Given an array of passenger pickup points, calculates the optimal common pickup location
 * that minimizes total walking distance.
 */
export const suggestPickupPoint = (passengerPickups = [], rideRoute = []) => {
  if (!passengerPickups || passengerPickups.length === 0) return null;

  // 1. Calculate centroid (arithmetic mean of latitudes & longitudes)
  const normalizedPickups = passengerPickups
    .map((p) => normalizeLngLat(p.coordinates || p))
    .filter(Boolean);

  if (normalizedPickups.length === 0) return null;

  const count = normalizedPickups.length;
  const sumLng = normalizedPickups.reduce((acc, p) => acc + p[0], 0);
  const sumLat = normalizedPickups.reduce((acc, p) => acc + p[1], 0);

  const centroid = [
    Math.round((sumLng / count) * 10000) / 10000,
    Math.round((sumLat / count) * 10000) / 10000,
  ];

  // 2. If ride route polyline is provided, snap to closest route point
  let suggestedCoords = centroid;
  if (rideRoute && rideRoute.length > 0) {
    let minDistance = Infinity;
    for (const pt of rideRoute) {
      const routePt = normalizeLngLat(pt.coordinates || pt);
      if (!routePt) continue;
      const dist = haversineDistanceKm(centroid, routePt);
      if (dist < minDistance) {
        minDistance = dist;
        suggestedCoords = routePt;
      }
    }
  }

  // 3. Compute passenger walking distances to the suggested cluster point
  const passengerDistances = normalizedPickups.map((coords, idx) => {
    const walkDistKm = haversineDistanceKm(coords, suggestedCoords);
    return {
      passengerIndex: idx,
      pickupCoordinates: coords,
      walkingDistanceKm: walkDistKm,
      walkingTimeMinutes: Math.round(walkDistKm * 12), // Average 12 mins per km walking
    };
  });

  const avgWalkKm =
    Math.round(
      (passengerDistances.reduce((a, b) => a + b.walkingDistanceKm, 0) / count) * 10
    ) / 10;

  return {
    suggestedCoordinates: suggestedCoords,
    passengerCount: count,
    averageWalkingKm: avgWalkKm,
    passengerDistances,
    reasoning: `Cluster point on driver corridor keeps passenger average walking distance to ${avgWalkKm} km.`,
  };
};
