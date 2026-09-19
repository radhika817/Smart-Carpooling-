import http from 'http';
import assert from 'node:assert';
import { app } from '../server.js';
import { initSocket } from '../socket/index.js';
import { connectDB, disconnectDB } from '../utils/db.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { Ride } from '../models/Ride.js';
import { Booking } from '../models/Booking.js';
import { SosAlert } from '../models/SosAlert.js';
import { Review } from '../models/Review.js';

let server;
let baseUrl;
let driverToken;
let driverUser;
let passengerToken;
let passengerUser;
let outsiderToken;
let outsiderUser;
let vehicleId;
let rideId;

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

async function runPhase6SafetyTests() {
  console.log('🧪 Starting Phase 6 Safety Features Comprehensive Test Suite...\n');

  try {
    await connectDB();

    // Clean test records
    await SosAlert.deleteMany({});
    await Review.deleteMany({});
    await Booking.deleteMany({});
    await Ride.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({
      email: { $in: ['driver.p6@test.com', 'passenger.p6@test.com', 'outsider.p6@test.com'] },
    });

    // Start HTTP server with Socket.IO
    server = http.createServer(app);
    initSocket(server);

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`📡 Phase 6 Safety Test Server running at ${baseUrl}\n`);
        resolve();
      });
    });

    // --- SETUP: Register Users & Add Vehicle & Schedule Ride ---
    console.log('--- Setting up test accounts and ride ---');

    // 1. Register Driver
    const dRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Suresh Patil',
        email: 'driver.p6@test.com',
        password: 'SafetyPass123!',
        phone: '+919876543210',
        role: 'driver',
        organization: 'Pune Tech Park',
      },
    });
    assert.strictEqual(dRes.status, 201);
    driverToken = dRes.data.data.token;
    driverUser = dRes.data.data.user;

    // 2. Register Passenger
    const pRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Ananya Deshmukh',
        email: 'passenger.p6@test.com',
        password: 'SafetyPass123!',
        phone: '+919876543211',
        role: 'passenger',
        organization: 'COEP Technological University',
      },
    });
    assert.strictEqual(pRes.status, 201);
    passengerToken = pRes.data.data.token;
    passengerUser = pRes.data.data.user;

    // 3. Register Outsider
    const oRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Outsider User',
        email: 'outsider.p6@test.com',
        password: 'SafetyPass123!',
        phone: '+919876543212',
        role: 'passenger',
      },
    });
    assert.strictEqual(oRes.status, 201);
    outsiderToken = oRes.data.data.token;
    outsiderUser = oRes.data.data.user;

    // 4. Create Vehicle for Driver
    const vRes = await request('/api/vehicles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        model: 'Honda City',
        registrationNumber: 'MH12AB9999',
        type: 'sedan',
        seats: 4,
      },
    });
    assert.strictEqual(vRes.status, 201);
    vehicleId = vRes.data.data.id || vRes.data.data._id;

    // 5. Create Ride (OPEN status)
    const rRes = await request('/api/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        vehicleId,
        startLocation: {
          address: 'Shivaji Nagar, Pune',
          coordinates: [73.8567, 18.5204],
        },
        destination: {
          address: 'Hinjewadi Phase 1, Pune',
          coordinates: [73.728, 18.5913],
        },
        date: '2026-09-25',
        departureTime: '09:00',
        totalSeats: 3,
        estimatedCost: 150,
      },
    });
    assert.strictEqual(rRes.status, 201);
    rideId = rRes.data.data.id || rRes.data.data._id;

    // 6. Passenger books seat
    const bRes = await request(`/api/rides/${rideId}/book`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        seats: 1,
        pickupPoint: { address: 'Shivaji Nagar', coordinates: [73.8567, 18.5204] },
        dropPoint: { address: 'Hinjewadi', coordinates: [73.728, 18.5913] },
      },
    });
    assert.strictEqual(bRes.status, 201);
    console.log('✅ Setup complete: Driver, Passenger, Vehicle, Ride, and Booking initialized.\n');

    // =========================================================================
    // TEST SUITE 1: Emergency Contacts & User Verification Badges
    // =========================================================================
    console.log('Test 1: Emergency Contacts Management');
    // Add contact 1
    const addContactRes = await request('/api/users/emergency-contacts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        name: 'Rajesh Deshmukh',
        phone: '+919988776655',
        relationship: 'Father',
      },
    });
    assert.strictEqual(addContactRes.status, 201);
    assert.strictEqual(addContactRes.data.data.contacts.length, 1);
    const contactId = addContactRes.data.data.contacts[0]._id;
    console.log('  ✓ Emergency contact added successfully');

    // Add contact 2
    await request('/api/users/emergency-contacts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        name: 'Priya Deshmukh',
        phone: '+919988776654',
        relationship: 'Sister',
      },
    });

    // List contacts
    const listContactsRes = await request('/api/users/emergency-contacts', {
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    assert.strictEqual(listContactsRes.status, 200);
    assert.strictEqual(listContactsRes.data.data.contacts.length, 2);
    console.log('  ✓ Emergency contacts listed correctly (count = 2)');

    // Delete contact 1
    const delContactRes = await request(`/api/users/emergency-contacts/${contactId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    assert.strictEqual(delContactRes.status, 200);
    assert.strictEqual(delContactRes.data.data.contacts.length, 1);
    console.log('  ✓ Emergency contact deleted successfully (count = 1)');

    // Update Verification Status
    const verifyRes = await request('/api/users/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        email: true,
        phone: true,
        organization: true,
        govtId: true,
      },
    });
    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.data.data.verificationStatus.govtId, true);
    assert.strictEqual(verifyRes.data.data.verificationStatus.organization, true);
    console.log('✅ Emergency Contacts & Verification Badges passed\n');

    // =========================================================================
    // TEST SUITE 2: SOS Emergency Trigger Guardrails
    // =========================================================================
    console.log('Test 2: SOS Emergency Trigger Guardrails');

    // Guardrail A: SOS must NOT fire randomly while ride is in OPEN status
    const sosOpenRes = await request(`/api/rides/${rideId}/sos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: { coordinates: [73.8567, 18.5204], address: 'Shivaji Nagar Bus Stop' },
    });
    assert.strictEqual(
      sosOpenRes.status,
      400,
      `Expected 400 when triggering SOS on OPEN ride, got ${sosOpenRes.status}`
    );
    assert.ok(
      sosOpenRes.data.message.includes('active ride'),
      'Message must explain SOS is only for active rides'
    );
    console.log('  ✓ Guardrail A Passed: SOS rejected (400) when ride is not in an active state');

    // Transition ride to active: IN_PROGRESS
    await request(`/api/rides/${rideId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });

    // Guardrail B: Outsider cannot trigger SOS for a ride they are not part of
    const sosOutsiderRes = await request(`/api/rides/${rideId}/sos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${outsiderToken}` },
      body: { coordinates: [73.8567, 18.5204] },
    });
    assert.strictEqual(
      sosOutsiderRes.status,
      403,
      `Expected 403 when outsider triggers SOS, got ${sosOutsiderRes.status}`
    );
    console.log('  ✓ Guardrail B Passed: SOS rejected (403) for non-participant user');

    // Valid SOS Trigger: Passenger in active ride triggers SOS
    const sosValidRes = await request(`/api/rides/${rideId}/sos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        coordinates: [73.82, 18.54],
        address: 'Near Aundh Bridge, Pune',
      },
    });
    assert.strictEqual(sosValidRes.status, 201);
    assert.strictEqual(sosValidRes.data.success, true);
    assert.strictEqual(sosValidRes.data.data.alert.userRole, 'passenger');
    assert.strictEqual(sosValidRes.data.data.emergencyServices.length, 3);
    assert.ok(sosValidRes.data.data.notifiedContacts.length >= 1);
    console.log('  ✓ Valid SOS Trigger Passed: Dispatched alert & simulated notifications to contacts');

    // Verify record in MongoDB
    const alertInDb = await SosAlert.findOne({ ride: rideId, triggeredBy: passengerUser._id });
    assert.ok(alertInDb, 'SosAlert must be stored in database');
    assert.strictEqual(alertInDb.status, 'ACTIVE');
    assert.strictEqual(alertInDb.location.coordinates[0], 73.82);
    console.log('  ✓ SosAlert verified in MongoDB database');
    console.log('✅ SOS Emergency Trigger tests passed\n');

    // =========================================================================
    // TEST SUITE 3: Time-Boxed Expiring Tracking Links & Privacy Protection
    // =========================================================================
    console.log('Test 3: Time-Boxed Share Tracking Links & Privacy Protection');

    // Generate Share Link
    const shareLinkRes = await request(`/api/rides/${rideId}/share-link`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: { durationHours: 2 },
    });
    assert.strictEqual(shareLinkRes.status, 200);
    const { shareToken, shareExpiresAt } = shareLinkRes.data.data;
    assert.ok(shareToken && shareToken.length >= 32, 'Must generate crypto token');
    console.log(`  ✓ Public share token generated: ${shareToken.slice(0, 10)}... (valid until ${shareExpiresAt})`);

    // Public user accesses live tracking via share token (no auth header needed)
    const publicTrackRes = await request(`/api/rides/track/${shareToken}`);
    assert.strictEqual(publicTrackRes.status, 200);
    assert.strictEqual(publicTrackRes.data.data.status, 'IN_PROGRESS');
    assert.strictEqual(publicTrackRes.data.data.driver.name, 'Suresh'); // First name only for privacy
    assert.strictEqual(publicTrackRes.data.data.vehicle.model, 'Honda City');
    console.log('  ✓ Public live telemetry returned while ride is IN_PROGRESS');

    // Complete the ride
    const completeRideRes = await request(`/api/rides/${rideId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    assert.strictEqual(completeRideRes.status, 200);
    console.log('  ✓ Driver completed ride (status = COMPLETED)');

    // PRIVACY VERIFICATION: After ride ends, does the share link expire or stay valid forever?
    const expiredTrackRes = await request(`/api/rides/track/${shareToken}`);
    assert.strictEqual(
      expiredTrackRes.status,
      410,
      `Expected 410 Gone after ride ends, got ${expiredTrackRes.status}`
    );
    assert.strictEqual(expiredTrackRes.data.success, false);
    assert.ok(
      expiredTrackRes.data.message.includes('expired'),
      'Response must declare tracking link expired to protect participant privacy'
    );
    console.log('  ✓ Privacy Guardrail Passed: Public tracking link immediately expired (410 Gone) after ride concluded');

    // SOS Guardrail C: SOS must NOT fire after ride is COMPLETED
    const sosCompletedRes = await request(`/api/rides/${rideId}/sos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: { coordinates: [73.728, 18.5913] },
    });
    assert.strictEqual(
      sosCompletedRes.status,
      400,
      `Expected 400 when triggering SOS on COMPLETED ride, got ${sosCompletedRes.status}`
    );
    console.log('  ✓ Guardrail C Passed: SOS rejected (400) once ride is completed');
    console.log('✅ Tracking Link Expiration & Privacy Protection passed\n');

    // =========================================================================
    // TEST SUITE 4: Mutual 5-Category Post-Ride Rating System
    // =========================================================================
    console.log('Test 4: Mutual 5-Category Post-Ride Rating System');

    // Review 1: Passenger reviews Driver
    const pReviewRes = await request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        rideId,
        toUserId: driverUser._id,
        overall: 5,
        punctuality: 5,
        safety: 5,
        behaviour: 5,
        cleanliness: 4,
        comment: 'Suresh was on time, very courteous, and drove safely!',
      },
    });
    assert.strictEqual(pReviewRes.status, 201);
    assert.strictEqual(pReviewRes.data.data.review.role, 'passenger_to_driver');
    assert.strictEqual(pReviewRes.data.data.review.overall, 5);
    assert.strictEqual(pReviewRes.data.data.review.cleanliness, 4);
    console.log('  ✓ Review 1 Passed: Passenger successfully rated Driver across all 5 categories');

    // Verify Driver's profile reflects the new ratings
    const dProfile = await User.findById(driverUser._id);
    assert.strictEqual(dProfile.rating.average, 5);
    assert.strictEqual(dProfile.rating.count, 1);
    assert.strictEqual(dProfile.ratingsBreakdown.cleanliness.average, 4);
    assert.strictEqual(dProfile.ratingsBreakdown.safety.average, 5);
    console.log('  ✓ Driver profile rating updated in MongoDB: average=5.0, cleanliness=4.0, safety=5.0');

    // Review 2: Driver reviews Passenger (Mutual Rating)
    const dReviewRes = await request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        rideId,
        toUserId: passengerUser._id,
        overall: 5,
        punctuality: 4,
        safety: 5,
        behaviour: 5,
        cleanliness: 5,
        comment: 'Great passenger, reached pickup spot promptly.',
      },
    });
    assert.strictEqual(dReviewRes.status, 201);
    assert.strictEqual(dReviewRes.data.data.review.role, 'driver_to_passenger');
    console.log('  ✓ Review 2 Passed: Driver successfully rated Passenger across all 5 categories');

    // Verify Passenger's profile reflects the new ratings
    const pProfile = await User.findById(passengerUser._id);
    assert.strictEqual(pProfile.rating.average, 5);
    assert.strictEqual(pProfile.rating.count, 1);
    assert.strictEqual(pProfile.ratingsBreakdown.punctuality.average, 4);
    assert.strictEqual(pProfile.ratingsBreakdown.safety.average, 5);
    console.log('  ✓ Passenger profile rating updated in MongoDB: average=5.0, punctuality=4.0, safety=5.0');

    // Rating Guardrail A: Duplicate rating rejection
    const dupReviewRes = await request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        rideId,
        toUserId: driverUser._id,
        overall: 4,
        punctuality: 4,
        safety: 4,
        behaviour: 4,
        cleanliness: 4,
      },
    });
    assert.strictEqual(
      dupReviewRes.status,
      409,
      `Expected 409 Conflict on duplicate review, got ${dupReviewRes.status}`
    );
    console.log('  ✓ Rating Guardrail A Passed: Duplicate review blocked (409)');

    // Rating Guardrail B: Self-rating rejection
    const selfReviewRes = await request('/api/reviews', {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: {
        rideId,
        toUserId: passengerUser._id,
        overall: 5,
        punctuality: 5,
        safety: 5,
        behaviour: 5,
        cleanliness: 5,
      },
    });
    assert.strictEqual(
      selfReviewRes.status,
      400,
      `Expected 400 on self review, got ${selfReviewRes.status}`
    );
    console.log('  ✓ Rating Guardrail B Passed: Self-review blocked (400)');

    // List reviews for driver
    const listReviewsRes = await request(`/api/reviews/user/${driverUser._id}`);
    assert.strictEqual(listReviewsRes.status, 200);
    assert.strictEqual(listReviewsRes.data.data.reviews.length, 1);
    assert.strictEqual(listReviewsRes.data.data.reviews[0].comment, 'Suresh was on time, very courteous, and drove safely!');
    console.log('  ✓ Driver reviews listed successfully with reviewer details and comment');

    console.log('\n🎉 ALL PHASE 6 SAFETY & RATING TESTS PASSED PERFECTLY!');
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
}

runPhase6SafetyTests().catch((err) => {
  console.error('\n❌ Phase 6 Test Suite Failed:\n', err);
  process.exit(1);
});
