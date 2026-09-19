import http from 'http';
import assert from 'node:assert';
import { app } from '../server.js';
import { connectDB, disconnectDB } from '../utils/db.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { Ride } from '../models/Ride.js';
import { Booking } from '../models/Booking.js';

let server;
let baseUrl;
let driverToken;
let driverUser;
let passengerToken;
let passengerUser;
let vehicleId;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runPhase7AnalyticsTests() {
  console.log('🧪 Starting Phase 7 Analytics Comprehensive Test Suite...\n');

  try {
    await connectDB();

    // Clean test records
    await Booking.deleteMany({});
    await Ride.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({
      email: { $in: ['driver.p7@test.com', 'passenger.p7@test.com'] },
    });

    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`📡 Phase 7 Analytics Test Server running at ${baseUrl}\n`);
        resolve();
      });
    });

    // 1. Auth Protection check
    console.log('Test 1: Analytics endpoints require authentication');
    const unauthPersonal = await request('/api/analytics/personal');
    assert.strictEqual(unauthPersonal.status, 401, 'Unauthenticated access to personal analytics must return 401');
    const unauthAdmin = await request('/api/analytics/admin');
    assert.strictEqual(unauthAdmin.status, 401, 'Unauthenticated access to admin analytics must return 401');
    console.log('  ✅ 401 Unauthorized enforced for both personal and admin endpoints\n');

    // 2. Register Driver & Passenger
    console.log('Test 2: Register test accounts');
    const regDriver = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Phase7 Driver',
        email: 'driver.p7@test.com',
        password: 'Password@123',
        phone: '9876543210',
        role: 'driver',
        organization: 'Tech Park Corp',
      },
    });
    assert.strictEqual(regDriver.status, 201);
    driverToken = regDriver.data.data.token;
    driverUser = regDriver.data.data.user;

    const regPassenger = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Phase7 Passenger',
        email: 'passenger.p7@test.com',
        password: 'Password@123',
        phone: '9876543211',
        role: 'passenger',
        organization: 'Tech Park Corp',
      },
    });
    assert.strictEqual(regPassenger.status, 201);
    passengerToken = regPassenger.data.data.token;
    passengerUser = regPassenger.data.data.user;

    // Create a vehicle for the driver
    const vehicleRes = await request('/api/vehicles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        model: 'Hyundai Ioniq 5',
        registrationNumber: 'KA-01-AN-7777',
        type: 'suv',
        seats: 4,
      },
    });
    assert.strictEqual(vehicleRes.status, 201);
    vehicleId = vehicleRes.data.data._id;
    console.log('  ✅ Driver, Passenger, and Vehicle created\n');

    // 3. Baseline Analytics Check: 0 completed rides = 0 metrics
    console.log('Test 3: Baseline personal analytics with 0 completed trips');
    const baselineRes = await request('/api/analytics/personal', {
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    assert.strictEqual(baselineRes.status, 200);
    assert.strictEqual(baselineRes.data.data.metrics.completedTrips, 0);
    assert.strictEqual(baselineRes.data.data.metrics.totalDistanceKm, 0);
    assert.strictEqual(baselineRes.data.data.metrics.totalMoneySaved, 0);
    assert.strictEqual(baselineRes.data.data.metrics.totalCo2SavedKg, 0);
    assert.strictEqual(baselineRes.data.data.metrics.treesEquivalent, 0);
    console.log('  ✅ Baseline metrics are strictly 0 for zero completed trips\n');

    // 4. Critical User Verification Rule: OPEN and CANCELLED rides must NOT count
    console.log('Test 4: Non-completed rides (OPEN, CANCELLED) MUST contribute 0 to metrics');
    const openRide = await Ride.create({
      driver: driverUser.id,
      vehicle: vehicleId,
      startLocation: {
        address: 'Koramangala, Bangalore',
        coordinates: [77.6271, 12.9352],
      },
      destination: {
        address: 'Whitefield, Bangalore',
        coordinates: [77.7499, 12.9698],
      },
      route: {
        distance: 20000, // 20 km in meters
        duration: 2400,
      },
      date: '2026-09-19',
      departureTime: '10:00',
      totalSeats: 3,
      availableSeats: 2,
      pricePerSeat: 100,
      estimatedCost: 300,
      status: 'OPEN',
    });

    const openBooking = await Booking.create({
      ride: openRide._id,
      passenger: passengerUser.id,
      pickupPoint: {
        address: 'Koramangala, Bangalore',
        coordinates: [77.6271, 12.9352],
      },
      dropPoint: {
        address: 'Whitefield, Bangalore',
        coordinates: [77.7499, 12.9698],
      },
      seats: 1,
      totalPrice: 100,
      status: 'CONFIRMED',
    });

    // Check passenger analytics while ride is OPEN
    const duringOpenRes = await request('/api/analytics/personal', {
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    assert.strictEqual(duringOpenRes.data.data.metrics.completedTrips, 0, 'OPEN ride must not count towards completed trips');
    assert.strictEqual(duringOpenRes.data.data.metrics.totalDistanceKm, 0, 'OPEN ride must contribute 0 km');
    assert.strictEqual(duringOpenRes.data.data.metrics.totalMoneySaved, 0, 'OPEN ride must contribute ₹0 savings');

    // Check driver analytics while ride is OPEN
    const driverOpenRes = await request('/api/analytics/personal', {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    assert.strictEqual(driverOpenRes.data.data.metrics.completedTrips, 0, 'Driver OPEN ride must not count');
    assert.strictEqual(driverOpenRes.data.data.metrics.totalMoneySaved, 0, 'Driver OPEN ride must contribute ₹0 recovery');

    // Now mark as CANCELLED
    openRide.status = 'CANCELLED';
    await openRide.save();
    openBooking.status = 'CANCELLED';
    await openBooking.save();

    const duringCancelledRes = await request('/api/analytics/personal', {
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    assert.strictEqual(duringCancelledRes.data.data.metrics.completedTrips, 0, 'CANCELLED ride must not count towards trips');
    assert.strictEqual(duringCancelledRes.data.data.metrics.totalDistanceKm, 0, 'CANCELLED ride must contribute 0 km');
    assert.strictEqual(duringCancelledRes.data.data.metrics.totalMoneySaved, 0, 'CANCELLED ride must contribute ₹0');
    console.log('  ✅ Verified: OPEN and CANCELLED rides contribute exactly 0 to all personal metrics\n');

    // 5. Test Hand-Calculated Math on Completed Trip
    console.log('Test 5: Hand-calculated math verification on COMPLETED ride');
    // Ride Distance = 20 km (20000 m)
    // Passenger books 2 seats @ ₹75/seat = ₹150 total paid
    // Status = COMPLETED
    const completedRide = await Ride.create({
      driver: driverUser.id,
      vehicle: vehicleId,
      startLocation: {
        address: 'Indiranagar, Bangalore',
        coordinates: [77.6412, 12.9784],
      },
      destination: {
        address: 'Electronic City, Bangalore',
        coordinates: [77.6766, 12.8452],
      },
      route: {
        distance: 20000, // 20 km
        duration: 2700,
      },
      date: '2026-09-19',
      departureTime: '11:00',
      totalSeats: 4,
      availableSeats: 2,
      pricePerSeat: 75,
      estimatedCost: 300,
      status: 'COMPLETED',
    });

    const completedBooking = await Booking.create({
      ride: completedRide._id,
      passenger: passengerUser.id,
      pickupPoint: {
        address: 'Indiranagar, Bangalore',
        coordinates: [77.6412, 12.9784],
      },
      dropPoint: {
        address: 'Electronic City, Bangalore',
        coordinates: [77.6766, 12.8452],
      },
      seats: 2,
      totalPrice: 150,
      status: 'COMPLETED',
    });

    // Check Passenger Math:
    // Distance = 20.0 km
    // Solo cab baseline = 20 km * ₹15/km * 2 seats = ₹600
    // Fare paid = ₹150
    // Money saved = ₹600 - ₹150 = ₹450
    // CO2 avoided = 20 km * 2 seats * 0.150 kg/km = 6.0 kg
    // Trees equivalent = 6.0 / 21 = 0.3 trees
    const passengerAnalytics = await request('/api/analytics/personal', {
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    assert.strictEqual(passengerAnalytics.status, 200);
    const pMetrics = passengerAnalytics.data.data.metrics;
    assert.strictEqual(pMetrics.completedTrips, 1, 'Passenger should have 1 completed trip');
    assert.strictEqual(pMetrics.totalDistanceKm, 20, 'Passenger distance should be exactly 20 km');
    assert.strictEqual(pMetrics.totalMoneySaved, 450, 'Passenger money saved should be ₹450 (600 - 150)');
    assert.strictEqual(pMetrics.totalCo2SavedKg, 6, 'Passenger CO2 saved should be exactly 6.0 kg');
    assert.strictEqual(pMetrics.treesEquivalent, 0.3, 'Trees equivalent should be 0.3');
    console.log('  ✅ Passenger math verified: 20km, ₹450 saved (₹600 solo cab - ₹150 paid), 6.0 kg CO₂');

    // Check Driver Math:
    // Distance = 20.0 km
    // Fares collected = ₹150
    // CO2 avoided for the 2 passengers = 20 * 2 * 0.150 = 6.0 kg
    const driverAnalytics = await request('/api/analytics/personal', {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    assert.strictEqual(driverAnalytics.status, 200);
    const dMetrics = driverAnalytics.data.data.metrics;
    assert.strictEqual(dMetrics.completedTrips, 1, 'Driver should have 1 completed trip');
    assert.strictEqual(dMetrics.totalDistanceKm, 20, 'Driver distance should be 20 km');
    assert.strictEqual(dMetrics.totalMoneySaved, 150, 'Driver money recovered should be ₹150');
    assert.strictEqual(dMetrics.totalCo2SavedKg, 6, 'Driver CO2 avoided should be 6.0 kg');
    console.log('  ✅ Driver math verified: 20km, ₹150 fuel offset recovered, 6.0 kg CO₂\n');

    // 6. Test Monthly Trend formatting
    console.log('Test 6: Monthly trends array formatting for Recharts');
    assert(Array.isArray(passengerAnalytics.data.data.monthlyTrends), 'monthlyTrends should be an array');
    assert(passengerAnalytics.data.data.monthlyTrends.length >= 1, 'Should have at least 1 month entry');
    const trend = passengerAnalytics.data.data.monthlyTrends[0];
    assert(trend.month, 'Monthly trend must have a month string label');
    assert.strictEqual(trend.distanceKm, 20);
    assert.strictEqual(trend.moneySaved, 450);
    assert.strictEqual(trend.co2SavedKg, 6);
    assert.strictEqual(trend.trips, 1);
    console.log('  ✅ Monthly trend entry matches Recharts requirements\n');

    // 7. Test Admin Analytics
    console.log('Test 7: Admin Analytics aggregation and corridor metrics');
    const adminAnalytics = await request('/api/analytics/admin', {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    assert.strictEqual(adminAnalytics.status, 200);
    const adminData = adminAnalytics.data.data;

    // Users overview
    assert(adminData.overview.totalUsers >= 2, 'Should count test users');
    assert(adminData.overview.driverUsers >= 1, 'Should count driver users');
    assert(adminData.overview.passengerUsers >= 1, 'Should count passenger users');

    // Rides count: 1 cancelled + 1 completed = 2 total
    assert.strictEqual(adminData.overview.completedRides, 1);
    assert.strictEqual(adminData.overview.cancelledRides, 1);
    assert.strictEqual(adminData.overview.completionRate, 50, '1 of 2 rides completed = 50%');

    // Platform impact
    // 1 completed ride with 2 passengers: shared km = 20 * 2 = 40 km
    assert.strictEqual(adminData.overview.platformTotalDistanceKm, 40);
    assert.strictEqual(adminData.overview.platformTotalCo2Kg, 6);

    // Top corridors
    assert(Array.isArray(adminData.topCorridors), 'topCorridors must be an array');
    assert(adminData.topCorridors.length >= 1, 'Must contain top corridor');
    assert.strictEqual(adminData.topCorridors[0].corridor, 'Indiranagar → Electronic City');
    assert.strictEqual(adminData.topCorridors[0].rides, 1);
    assert.strictEqual(adminData.topCorridors[0].passengers, 2);

    // Status distribution
    assert.strictEqual(adminData.statusDistribution.length, 3);
    const completedStatus = adminData.statusDistribution.find((s) => s.name === 'Completed');
    assert.strictEqual(completedStatus.value, 1);
    console.log('  ✅ Admin Analytics verified: platform metrics, corridor breakdown, status distribution\n');

    console.log('🎉 ALL PHASE 7 ANALYTICS TESTS PASSED SUCCESSFULLY!');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
}

runPhase7AnalyticsTests().catch((err) => {
  console.error('❌ Phase 7 Test Failure:', err);
  process.exit(1);
});
