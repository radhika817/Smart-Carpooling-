import { Ride } from '../../models/Ride.js';
import { Booking } from '../../models/Booking.js';
import { User } from '../../models/User.js';
import { haversineDistanceKm } from '../matching/matchingService.js';

const CO2_KG_PER_KM = 0.150; // 150 grams of CO2 per km for average combustion passenger car
const TREE_ABSORPTION_KG_YEAR = 21; // 1 mature tree absorbs ~21 kg CO2/year
const SOLO_CAB_RATE_PER_KM = 15; // Baseline solo auto/cab fare in urban areas (₹15/km)

/**
 * Calculates road distance in kilometers for a ride.
 */
export const getRideDistanceKm = (ride) => {
  if (ride.route?.distance && !isNaN(Number(ride.route.distance))) {
    return Math.round((Number(ride.route.distance) / 1000) * 10) / 10;
  }
  if (ride.startLocation?.coordinates && ride.destination?.coordinates) {
    const raw = haversineDistanceKm(ride.startLocation.coordinates, ride.destination.coordinates);
    // Standard city road tortuosity factor ~1.25x
    return Math.round(raw * 1.25 * 10) / 10;
  }
  return 15.0; // fallback reasonable default
};

/**
 * Computes personal analytics for an individual commuter strictly from COMPLETED trips.
 */
export const getPersonalAnalytics = async (userId) => {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // 1. DRIVER METRICS: Only rides where status === 'COMPLETED'
  const completedDriverRides = await Ride.find({
    driver: userId,
    status: 'COMPLETED',
  }).lean();

  let driverDistanceKm = 0;
  let driverMoneyRecovered = 0;
  let driverCo2SavedKg = 0;
  const driverMonthlyMap = new Map();

  for (const ride of completedDriverRides) {
    const dist = getRideDistanceKm(ride);
    driverDistanceKm += dist;

    // Fetch passenger bookings for this completed ride
    const bookings = await Booking.find({
      ride: ride._id,
      status: { $in: ['CONFIRMED', 'COMPLETED'] },
    }).lean();

    const passengerCount = bookings.reduce((sum, b) => sum + (b.seats || 1), 0);
    const faresCollected = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    driverMoneyRecovered += faresCollected;
    // Each passenger who joined avoided taking a solo vehicle
    const co2 = dist * passengerCount * CO2_KG_PER_KM;
    driverCo2SavedKg += co2;

    // Monthly bucket
    const dateObj = new Date(ride.date || ride.createdAt);
    const monthKey = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const current = driverMonthlyMap.get(monthKey) || { distanceKm: 0, moneySaved: 0, co2SavedKg: 0, trips: 0 };
    current.distanceKm += dist;
    current.moneySaved += faresCollected;
    current.co2SavedKg += co2;
    current.trips += 1;
    driverMonthlyMap.set(monthKey, current);
  }

  // 2. PASSENGER METRICS: Only bookings where ride.status === 'COMPLETED'
  const passengerBookings = await Booking.find({
    passenger: userId,
    status: { $in: ['CONFIRMED', 'COMPLETED'] },
  }).populate('ride').lean();

  // Strict Filter: Only count if the associated ride actually completed
  const completedBookings = passengerBookings.filter(
    (b) => b.ride && b.ride.status === 'COMPLETED'
  );

  let passengerDistanceKm = 0;
  let passengerMoneySaved = 0;
  let passengerCo2SavedKg = 0;
  const passengerMonthlyMap = new Map();

  for (const b of completedBookings) {
    const dist = getRideDistanceKm(b.ride);
    passengerDistanceKm += dist;

    const seats = b.seats || 1;
    const soloCabCost = Math.round(dist * SOLO_CAB_RATE_PER_KM * seats);
    const farePaid = b.totalPrice || 0;
    const saved = Math.max(0, soloCabCost - farePaid);
    passengerMoneySaved += saved;

    const co2 = dist * seats * CO2_KG_PER_KM;
    passengerCo2SavedKg += co2;

    const dateObj = new Date(b.ride.date || b.createdAt);
    const monthKey = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const current = passengerMonthlyMap.get(monthKey) || { distanceKm: 0, moneySaved: 0, co2SavedKg: 0, trips: 0 };
    current.distanceKm += dist;
    current.moneySaved += saved;
    current.co2SavedKg += co2;
    current.trips += 1;
    passengerMonthlyMap.set(monthKey, current);
  }

  // Merge Monthly Trends for Recharts
  const allMonths = Array.from(
    new Set([...driverMonthlyMap.keys(), ...passengerMonthlyMap.keys()])
  );

  const monthlyTrends = allMonths.map((month) => {
    const d = driverMonthlyMap.get(month) || { distanceKm: 0, moneySaved: 0, co2SavedKg: 0, trips: 0 };
    const p = passengerMonthlyMap.get(month) || { distanceKm: 0, moneySaved: 0, co2SavedKg: 0, trips: 0 };

    return {
      month,
      distanceKm: Math.round((d.distanceKm + p.distanceKm) * 10) / 10,
      moneySaved: Math.round(d.moneySaved + p.moneySaved),
      co2SavedKg: Math.round((d.co2SavedKg + p.co2SavedKg) * 10) / 10,
      trips: d.trips + p.trips,
    };
  });

  // If no monthly trends yet, provide a baseline entry for current month
  if (monthlyTrends.length === 0) {
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthlyTrends.push({
      month: currentMonth,
      distanceKm: 0,
      moneySaved: 0,
      co2SavedKg: 0,
      trips: 0,
    });
  }

  const totalDistanceKm = Math.round((driverDistanceKm + passengerDistanceKm) * 10) / 10;
  const totalMoneySaved = Math.round(driverMoneyRecovered + passengerMoneySaved);
  const totalCo2SavedKg = Math.round((driverCo2SavedKg + passengerCo2SavedKg) * 10) / 10;
  const treesEquivalent = Math.round((totalCo2SavedKg / TREE_ABSORPTION_KG_YEAR) * 10) / 10;
  const completedTrips = completedDriverRides.length + completedBookings.length;

  return {
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      organization: user.organization,
      rating: user.rating,
      verificationStatus: user.verificationStatus,
    },
    metrics: {
      completedTrips,
      driverTrips: completedDriverRides.length,
      passengerTrips: completedBookings.length,
      totalDistanceKm,
      totalMoneySaved, // ₹ saved vs solo cab or recovered fuel costs
      totalCo2SavedKg,
      treesEquivalent,
    },
    ratingsBreakdown: user.ratingsBreakdown || {
      punctuality: { average: 5.0, count: 0 },
      safety: { average: 5.0, count: 0 },
      behaviour: { average: 5.0, count: 0 },
      cleanliness: { average: 5.0, count: 0 },
    },
    monthlyTrends,
  };
};

/**
 * Computes platform-wide aggregated analytics for administrators and overall impact reporting.
 */
export const getAdminAnalytics = async () => {
  // 1. User demographics
  const totalUsers = await User.countDocuments();
  const driverUsers = await User.countDocuments({ role: 'driver' });
  const passengerUsers = await User.countDocuments({ role: 'passenger' });
  const verifiedOrgUsers = await User.countDocuments({ 'verificationStatus.organization': true });

  // 2. Ride statistics
  const totalRides = await Ride.countDocuments();
  const completedRides = await Ride.countDocuments({ status: 'COMPLETED' });
  const cancelledRides = await Ride.countDocuments({ status: 'CANCELLED' });
  const activeRides = await Ride.countDocuments({
    status: { $in: ['OPEN', 'BOOKING', 'DRIVER_ARRIVING', 'IN_PROGRESS'] },
  });

  const completionRate = totalRides > 0 ? Math.round((completedRides / totalRides) * 100) : 100;

  // 3. Platform Cumulative Impact (ONLY COMPLETED RIDES)
  const completedRideDocs = await Ride.find({ status: 'COMPLETED' }).lean();

  let platformTotalDistanceKm = 0;
  let platformTotalSavings = 0;
  let platformTotalCo2Kg = 0;
  const corridorMap = new Map();
  const monthlyVolumeMap = new Map();

  for (const ride of completedRideDocs) {
    const dist = getRideDistanceKm(ride);

    const bookings = await Booking.find({
      ride: ride._id,
      status: { $in: ['CONFIRMED', 'COMPLETED'] },
    }).lean();

    const passengerCount = bookings.reduce((sum, b) => sum + (b.seats || 1), 0);
    const fares = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // Each carpool ride with N passengers shares (dist * N) commute km
    const effectiveSharedKm = dist * Math.max(1, passengerCount);
    platformTotalDistanceKm += effectiveSharedKm;

    // Cumulative economic benefit
    const soloCabEquivalent = dist * SOLO_CAB_RATE_PER_KM * Math.max(1, passengerCount);
    const netSavings = Math.max(0, soloCabEquivalent - fares) + fares; // passenger savings + driver recovery
    platformTotalSavings += netSavings;

    const co2 = effectiveSharedKm * CO2_KG_PER_KM;
    platformTotalCo2Kg += co2;

    // Corridor tracking (e.g. Start City/Area -> Destination City/Area)
    const cleanAddr = (addr) => {
      if (!addr) return 'City Hub';
      const parts = addr.split(',');
      return parts[0].trim();
    };
    const corridorKey = `${cleanAddr(ride.startLocation?.address)} → ${cleanAddr(ride.destination?.address)}`;
    const corr = corridorMap.get(corridorKey) || { corridor: corridorKey, rides: 0, passengers: 0, distanceKm: 0 };
    corr.rides += 1;
    corr.passengers += passengerCount;
    corr.distanceKm += dist;
    corridorMap.set(corridorKey, corr);

    // Monthly volume
    const dateObj = new Date(ride.date || ride.createdAt);
    const monthKey = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const current = monthlyVolumeMap.get(monthKey) || { month: monthKey, rides: 0, sharedKm: 0, co2Kg: 0 };
    current.rides += 1;
    current.sharedKm += dist;
    current.co2Kg += co2;
    monthlyVolumeMap.set(monthKey, current);
  }

  // Top Corridors sorted by trip frequency
  const topCorridors = Array.from(corridorMap.values())
    .sort((a, b) => b.rides - a.rides)
    .slice(0, 5)
    .map((c) => ({
      ...c,
      distanceKm: Math.round(c.distanceKm * 10) / 10,
    }));

  // Monthly trends sorted chronologically
  const monthlyTrends = Array.from(monthlyVolumeMap.values()).map((m) => ({
    ...m,
    sharedKm: Math.round(m.sharedKm * 10) / 10,
    co2Kg: Math.round(m.co2Kg * 10) / 10,
  }));

  if (monthlyTrends.length === 0) {
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthlyTrends.push({
      month: currentMonth,
      rides: 0,
      sharedKm: 0,
      co2Kg: 0,
    });
  }

  return {
    overview: {
      totalUsers,
      driverUsers,
      passengerUsers,
      verifiedOrgUsers,
      totalRides,
      completedRides,
      cancelledRides,
      activeRides,
      completionRate,
      platformTotalDistanceKm: Math.round(platformTotalDistanceKm * 10) / 10,
      platformTotalSavings: Math.round(platformTotalSavings),
      platformTotalCo2Kg: Math.round(platformTotalCo2Kg * 10) / 10,
      platformTreesSaved: Math.round(platformTotalCo2Kg / TREE_ABSORPTION_KG_YEAR),
    },
    topCorridors,
    monthlyTrends,
    statusDistribution: [
      { name: 'Completed', value: completedRides, color: '#10b981' },
      { name: 'Active / Open', value: activeRides, color: '#3b82f6' },
      { name: 'Cancelled', value: cancelledRides, color: '#ef4444' },
    ],
  };
};
