import assert from 'assert';
import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../utils/db.js';
import { User } from '../models/User.js';
import { Ride } from '../models/Ride.js';
import { Vehicle } from '../models/Vehicle.js';
import { Booking } from '../models/Booking.js';
import { CarpoolGroup } from '../models/CarpoolGroup.js';
import { SosAlert } from '../models/SosAlert.js';
import { runAdminSeed } from '../utils/seedAdmin.js';

import authRoutes from '../routes/authRoutes.js';
import rideRoutes from '../routes/rideRoutes.js';
import vehicleRoutes from '../routes/vehicleRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import groupRoutes from '../routes/groupRoutes.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ success: false, message: err.message });
});

let server;
let baseUrl;

const request = async (endpoint, { method = 'GET', body, token } = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data };
};

const runTestSuite = async () => {
  console.log('🧪 Starting Phase 8 Advanced Features Test Suite...\n');
  await connectDB();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`📡 Phase 8 Test Server running at ${baseUrl}\n`);

  try {
    // ----------------------------------------------------
    // Test 1: Admin Bootstrapping & Security Guardrails
    // ----------------------------------------------------
    console.log('--- Test 1: Admin Bootstrapping & Security Guardrails ---');
    const seededAdmin = await runAdminSeed();
    assert(seededAdmin, 'Admin user should be seeded or verified');

    // Login as Admin
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: seededAdmin.email, password: process.env.ADMIN_PASSWORD || 'Admin@123456' },
    });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin login must succeed');
    const adminToken = adminLoginRes.data.data.token;
    const adminUser = adminLoginRes.data.data.user;
    assert.strictEqual(adminUser.role, 'admin', 'Seeded user must have admin role');

    // Register a standard user
    const testUserEmail = `driver.adv.${Date.now()}@techcorp.com`;
    const regDriverRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Advance Driver',
        email: testUserEmail,
        password: 'Password@123',
        phone: '+919876543299',
        organization: 'TechCorp',
        role: 'driver',
      },
    });
    assert.strictEqual(regDriverRes.status, 201);
    const driverToken = regDriverRes.data.data.token;
    const driverUser = regDriverRes.data.data.user;

    // Guardrail: Non-admin hitting admin endpoint MUST be 403 Forbidden
    const unauthAdminRes = await request('/api/admin/overview', { token: driverToken });
    assert.strictEqual(unauthAdminRes.status, 403, 'Non-admin must receive 403 Forbidden on admin routes');
    console.log('  ✅ Security Guardrail: Non-admin rejected (403) from admin console');

    // Admin overview query
    const adminOverviewRes = await request('/api/admin/overview', { token: adminToken });
    assert.strictEqual(adminOverviewRes.status, 200);
    assert(adminOverviewRes.data.data.totalUsers >= 2, 'Overview metrics must include platform users');
    console.log('  ✅ Admin Console Overview metrics retrieved successfully');

    // Admin suspends user
    const suspendRes = await request(`/api/admin/users/${driverUser.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { isSuspended: true, reason: 'Temporary verification audit' },
    });
    assert.strictEqual(suspendRes.status, 200);
    assert.strictEqual(suspendRes.data.data.isSuspended, true);

    // Suspended user attempting to log in MUST be 403
    const suspendedLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: testUserEmail, password: 'Password@123' },
    });
    assert.strictEqual(suspendedLoginRes.status, 403, 'Suspended user must be blocked on login');
    console.log('  ✅ Account Suspension: Suspended user strictly rejected (403) at login');

    // Admin unsuspend user
    const unsuspendRes = await request(`/api/admin/users/${driverUser.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { isSuspended: false },
    });
    assert.strictEqual(unsuspendRes.status, 200);
    assert.strictEqual(unsuspendRes.data.data.isSuspended, false);

    // Admin self-suspension suicide prevention guardrail
    const selfSuspendRes = await request(`/api/admin/users/${adminUser.id}/status`, {
      method: 'PATCH',
      token: adminToken,
      body: { isSuspended: true },
    });
    assert.strictEqual(selfSuspendRes.status, 400, 'Admin must not be able to suspend their own account');
    console.log('  ✅ Suicide Prevention Guardrail: Admin self-suspension blocked (400)');

    // ----------------------------------------------------
    // Test 2: Recurring Rides (Instance Generation & Series Lifecycle)
    // ----------------------------------------------------
    console.log('\n--- Test 2: Recurring Rides (Instance Generation & Series Lifecycle) ---');

    // Register vehicle for driver
    const vehicleRes = await request('/api/vehicles', {
      method: 'POST',
      token: driverToken,
      body: {
        model: 'Honda City EV',
        registrationNumber: `MH12RE${Date.now().toString().slice(-4)}`,
        type: 'sedan',
        seats: 4,
      },
    });
    assert.strictEqual(vehicleRes.status, 201);
    const vehicleId = vehicleRes.data.data._id;

    // Create a 2-week recurring ride for Mon, Wed, Fri (e.g. days 1, 3, 5)
    const today = new Date();
    const startDateStr = today.toISOString().split('T')[0];
    const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const endDateStr = twoWeeksLater.toISOString().split('T')[0];

    const recurringCreateRes = await request('/api/rides', {
      method: 'POST',
      token: driverToken,
      body: {
        vehicleId,
        startLocation: { address: 'Kothrud, Pune', coordinates: [73.805, 18.507] },
        destination: { address: 'Hinjewadi Phase 2, Pune', coordinates: [73.722, 18.598] },
        date: startDateStr,
        departureTime: '08:30',
        totalSeats: 3,
        estimatedCost: 80,
        recurrence: {
          isRecurring: true,
          frequency: 'weekly',
          daysOfWeek: [1, 3, 5],
          startDate: startDateStr,
          endDate: endDateStr,
        },
      },
    });

    assert.strictEqual(recurringCreateRes.status, 201);
    assert(recurringCreateRes.data.data.isRecurringSeries === true, 'Response must indicate recurring series');
    const recurringGroupId = recurringCreateRes.data.data.recurringGroupId;
    const occurrencesCount = recurringCreateRes.data.data.occurrencesCount;
    assert(occurrencesCount >= 3, `Expected at least 3 occurrences in 2-week window, got ${occurrencesCount}`);
    console.log(`  ✅ Batch Generation: Generated ${occurrencesCount} instances with recurringGroupId: ${recurringGroupId.slice(0, 8)}...`);

    // Verify independent instances exist in MongoDB
    const instances = await Ride.find({ 'recurrence.recurringGroupId': recurringGroupId }).sort({ date: 1 });
    assert.strictEqual(instances.length, occurrencesCount);
    const ride1 = instances[0];
    const ride2 = instances[1];
    assert.notStrictEqual(ride1._id.toString(), ride2._id.toString(), 'Instances must have distinct ObjectIDs');

    // Register a passenger
    const regPassRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Recurring Commuter',
        email: `passenger.recur.${Date.now()}@techcorp.com`,
        password: 'Password@123',
        phone: '+919876543288',
        organization: 'TechCorp',
        role: 'passenger',
      },
    });
    const passToken = regPassRes.data.data.token;

    // Book seat on Ride 1
    const bookRes = await request(`/api/rides/${ride1._id}/book`, {
      method: 'POST',
      token: passToken,
      body: { seats: 1 },
    });
    assert.strictEqual(bookRes.status, 201);

    // Verify seat decremented ONLY on Ride 1, Ride 2 remains unchanged!
    const freshRide1 = await Ride.findById(ride1._id);
    const freshRide2 = await Ride.findById(ride2._id);
    assert.strictEqual(freshRide1.availableSeats, 2, 'Ride 1 must have 2 seats left');
    assert.strictEqual(freshRide2.availableSeats, 3, 'Ride 2 must retain all 3 available seats');
    console.log('  ✅ Independent Seat Isolation: Booking occurrence #1 did not affect occurrence #2');

    // Single occurrence cancellation
    const cancelSingleRes = await request(`/api/rides/${ride1._id}`, {
      method: 'DELETE',
      token: driverToken,
    });
    assert.strictEqual(cancelSingleRes.status, 200);
    const cancelledRide1 = await Ride.findById(ride1._id);
    const unchangedRide2 = await Ride.findById(ride2._id);
    assert.strictEqual(cancelledRide1.status, 'CANCELLED');
    assert.strictEqual(unchangedRide2.status, 'OPEN');
    console.log('  ✅ Granular Cancellation: Cancelled occurrence #1 while occurrence #2 remains OPEN');

    // Cancel entire remaining series
    const cancelSeriesRes = await request(`/api/rides/${ride2._id}?cancelSeries=true`, {
      method: 'DELETE',
      token: driverToken,
    });
    assert.strictEqual(cancelSeriesRes.status, 200);
    assert.strictEqual(cancelSeriesRes.data.data.seriesCancelled, true);

    const remainingOpen = await Ride.countDocuments({
      'recurrence.recurringGroupId': recurringGroupId,
      status: 'OPEN',
    });
    assert.strictEqual(remainingOpen, 0, 'All future rides in series must now be CANCELLED');
    console.log('  ✅ Series Cancellation: Atomically cancelled all remaining future instances');

    // ----------------------------------------------------
    // Test 3: Carpool Groups (Dedicated Model & Scoped Rides)
    // ----------------------------------------------------
    console.log('\n--- Test 3: Carpool Groups (Dedicated Model & Scoped Rides) ---');

    // Create Carpool Group
    const groupCreateRes = await request('/api/groups', {
      method: 'POST',
      token: driverToken,
      body: {
        name: 'Hinjewadi Tech Corridor',
        description: 'Daily IT commuters from Kothrud to Hinjewadi Phase 2',
        organization: 'TechCorp',
        origin: { address: 'Kothrud Stand, Pune', coordinates: [73.805, 18.507] },
        destination: { address: 'TechCorp Campus, Hinjewadi', coordinates: [73.722, 18.598] },
        scheduleDescription: 'Mon-Fri 08:30 AM',
        isPrivate: true,
      },
    });
    assert.strictEqual(groupCreateRes.status, 201);
    const group = groupCreateRes.data.data;
    assert(group.inviteCode, 'Private carpool group must generate unique inviteCode');
    console.log(`  ✅ Group Created: "${group.name}" with Invite Code: ${group.inviteCode}`);

    // Passenger joins via invite code
    const joinCodeRes = await request('/api/groups/join-by-code', {
      method: 'POST',
      token: passToken,
      body: { inviteCode: group.inviteCode },
    });
    assert.strictEqual(joinCodeRes.status, 200);
    assert.strictEqual(joinCodeRes.data.data.members.length, 2, 'Group must have 2 members after passenger joins');

    // Duplicate join rejected
    const dupJoinRes = await request('/api/groups/join-by-code', {
      method: 'POST',
      token: passToken,
      body: { inviteCode: group.inviteCode },
    });
    assert.strictEqual(dupJoinRes.status, 409, 'Duplicate join must return 409 Conflict');
    console.log('  ✅ Membership & Invite Code: Passenger joined via code, duplicate join prevented');

    // Driver posts a ride scoped to this Carpool Group
    const groupRideRes = await request('/api/rides', {
      method: 'POST',
      token: driverToken,
      body: {
        vehicleId,
        startLocation: { address: 'Kothrud Stand, Pune', coordinates: [73.805, 18.507] },
        destination: { address: 'TechCorp Campus, Hinjewadi', coordinates: [73.722, 18.598] },
        date: startDateStr,
        departureTime: '08:30',
        totalSeats: 3,
        estimatedCost: 60,
        carpoolGroup: group._id,
      },
    });
    assert.strictEqual(groupRideRes.status, 201);
    const groupRideId = groupRideRes.data.data._id;

    // Fetch rides for group
    const listGroupRidesRes = await request(`/api/groups/${group._id}/rides`, {
      token: passToken,
    });
    assert.strictEqual(listGroupRidesRes.status, 200);
    assert(listGroupRidesRes.data.data.some((r) => r._id === groupRideId), 'Group feed must list the scoped ride');
    console.log('  ✅ Scoped Group Ride: Ride published and retrieved directly from group feed');

    // ----------------------------------------------------
    // Test 4: Community Scoping & Restricted Rides
    // ----------------------------------------------------
    console.log('\n--- Test 4: Community Scoping & Restricted Rides ---');

    // Driver creates a ride restricted to TechCorp community
    const restrictedRideRes = await request('/api/rides', {
      method: 'POST',
      token: driverToken,
      body: {
        vehicleId,
        startLocation: { address: 'Shivajinagar, Pune', coordinates: [73.852, 18.531] },
        destination: { address: 'TechCorp HQ, Pune', coordinates: [73.722, 18.598] },
        date: startDateStr,
        departureTime: '09:00',
        totalSeats: 2,
        estimatedCost: 75,
        communityScope: {
          isRestricted: true,
          organization: 'TechCorp',
        },
      },
    });
    assert.strictEqual(restrictedRideRes.status, 201);
    const restrictedRideId = restrictedRideRes.data.data._id;

    // TechCorp passenger searches: must find it
    const searchTechCorpRes = await request(
      `/api/rides/search?date=${startDateStr}&organization=TechCorp&communityOnly=true`
    );
    assert.strictEqual(searchTechCorpRes.status, 200);
    assert(
      searchTechCorpRes.data.data.some((r) => r._id === restrictedRideId),
      'TechCorp member must be able to discover TechCorp restricted ride'
    );

    // Outsider (e.g. University passenger) searches: must NOT see the restricted ride
    const searchOutsiderRes = await request(
      `/api/rides/search?date=${startDateStr}&organization=ExternalCampus&communityOnly=true`
    );
    assert.strictEqual(searchOutsiderRes.status, 200);
    assert(
      !searchOutsiderRes.data.data.some((r) => r._id === restrictedRideId),
      'Outsider must not be able to view community restricted ride'
    );
    console.log('  ✅ Community Scoping: Verified community discovery isolation between organizations');

    // ----------------------------------------------------
    // Test 5: Admin SOS Incident Oversight & Resolution
    // ----------------------------------------------------
    console.log('\n--- Test 5: Admin SOS Incident Oversight & Resolution ---');

    // Create an active ride & trigger SOS
    const sosRideRes = await request('/api/rides', {
      method: 'POST',
      token: driverToken,
      body: {
        vehicleId,
        startLocation: { address: 'Aundh, Pune', coordinates: [73.807, 18.558] },
        destination: { address: 'Baner, Pune', coordinates: [73.789, 18.559] },
        date: startDateStr,
        departureTime: '10:00',
        totalSeats: 3,
        estimatedCost: 50,
      },
    });
    const sosRideId = sosRideRes.data.data._id;
    await request(`/api/rides/${sosRideId}/start`, { method: 'POST', token: driverToken });

    // Trigger SOS as driver
    const sosTriggerRes = await request(`/api/rides/${sosRideId}/sos`, {
      method: 'POST',
      token: driverToken,
      body: { location: { coordinates: [73.8, 18.5], address: 'Near Baner Bridge' } },
    });
    assert.strictEqual(sosTriggerRes.status, 201);
    const alertId = sosTriggerRes.data.data.alert?._id || sosTriggerRes.data.data.alertPayload?.alertId;
    assert(alertId, 'alertId must be defined');

    // Admin lists SOS alerts
    const adminAlertsRes = await request('/api/admin/sos-alerts?status=ACTIVE', { token: adminToken });
    assert.strictEqual(adminAlertsRes.status, 200);
    assert(
      adminAlertsRes.data.data.some((a) => a._id.toString() === alertId.toString()),
      'Active SOS must appear in admin safety queue'
    );

    // Admin resolves SOS alert
    const resolveRes = await request(`/api/admin/sos-alerts/${alertId}/resolve`, {
      method: 'PATCH',
      token: adminToken,
      body: { resolutionNotes: 'Contacted driver, local police dispatched. Commuter safe.' },
    });
    assert.strictEqual(resolveRes.status, 200);
    assert.strictEqual(resolveRes.data.data.status, 'RESOLVED');
    console.log('  ✅ SOS Incident Console: Real-time incident verified and resolved by administrator');

    console.log('\n🎉 ALL PHASE 8 ADVANCED FEATURES TESTS PASSED PERFECTLY!');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
};

runTestSuite().catch((err) => {
  console.error('❌ Phase 8 Test Suite Failed:', err);
  process.exit(1);
});
