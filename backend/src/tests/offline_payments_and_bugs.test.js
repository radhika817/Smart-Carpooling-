process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_12345';

import assert from 'assert';
import http from 'http';
import { app } from '../server.js';
import { connectDB, disconnectDB } from '../utils/db.js';
import { User } from '../models/User.js';
import { Ride } from '../models/Ride.js';
import { Vehicle } from '../models/Vehicle.js';
import { Booking } from '../models/Booking.js';

let server;
let baseUrl;

async function request(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runTests() {
  console.log('🧪 Starting Offline Payments & Bug Fixes Test Suite...\n');

  await connectDB();
  await User.deleteMany({});
  await Ride.deleteMany({});
  await Vehicle.deleteMany({});
  await Booking.deleteMany({});

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  try {
    // 1. Register Driver
    const driverRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Test Driver',
        email: 'driver_offline@test.com',
        password: 'Password123!',
        phone: '9876543210',
        role: 'driver',
        organization: 'COEP Tech',
      },
    });
    assert.strictEqual(driverRes.status, 201);
    const driverToken = driverRes.data.data.token;
    const driverId = driverRes.data.data.user.id;

    // 2. Register Passenger 1
    const passRes1 = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Passenger One',
        email: 'passenger1_offline@test.com',
        password: 'Password123!',
        phone: '9876543211',
        role: 'passenger',
        organization: 'COEP Tech',
      },
    });
    assert.strictEqual(passRes1.status, 201);
    const passToken1 = passRes1.data.data.token;
    const passengerId1 = passRes1.data.data.user.id;

    // 3. Register Passenger 2 (unauthorized outsider for payment marking)
    const passRes2 = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Passenger Two',
        email: 'passenger2_offline@test.com',
        password: 'Password123!',
        phone: '9876543212',
        role: 'passenger',
        organization: 'COEP Tech',
      },
    });
    assert.strictEqual(passRes2.status, 201);
    const passToken2 = passRes2.data.data.token;

    // 4. Create vehicle for driver
    const vehicle = await Vehicle.create({
      owner: driverId,
      model: 'Honda City Hybrid',
      registrationNumber: 'MH 12 AB 9999',
      seats: 4,
      type: 'sedan',
    });

    // 5. Driver creates a ride
    const rideRes = await request('/api/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        vehicleId: vehicle._id.toString(),
        startLocation: {
          address: 'Pune Station, Pune',
          coordinates: [73.8744, 18.5284],
        },
        destination: {
          address: 'Hinjewadi Phase 1, Pune',
          coordinates: [73.7389, 18.5913],
        },
        date: '2026-10-15',
        departureTime: '09:00',
        totalSeats: 3,
        estimatedCost: 120,
      },
    });
    assert.strictEqual(rideRes.status, 201);
    const rideId = rideRes.data.data._id;
    console.log('✅ 1. Driver registered, vehicle registered, and ride created');

    // 6. Test Bug (b): Self-Booking Block
    const selfBookRes = await request(`/api/rides/${rideId}/book`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { seats: 1 },
    });
    assert.strictEqual(selfBookRes.status, 400, 'Driver self-booking must return 400');
    assert.match(selfBookRes.data.message, /Drivers cannot book seats on their own rides/i);
    console.log('✅ 2. Driver self-booking blocked on backend with 400 Bad Request');

    // 7. Test Bug (b): Driver's own ride excluded from search
    // Search with excludeDriver set to driverId
    const searchRes = await request(`/api/rides/search?excludeDriver=${driverId}`, {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    assert.strictEqual(searchRes.status, 200);
    const foundRides = searchRes.data.data;
    const ownRideFound = foundRides.some((r) => (r.driver?._id || r.driver).toString() === driverId.toString());
    assert.strictEqual(ownRideFound, false, 'Driver own ride must be excluded from search');
    console.log('✅ 3. Driver own ride successfully excluded from search results');

    // 8. Passenger 1 books a seat
    const bookRes = await request(`/api/rides/${rideId}/book`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${passToken1}` },
      body: { seats: 1 },
    });
    assert.strictEqual(bookRes.status, 201);
    const booking = bookRes.data.data;
    const bookingId = booking._id;
    assert.strictEqual(booking.paymentStatus, 'pending', 'New booking paymentStatus must default to pending');
    assert.strictEqual(booking.totalPrice, 120);
    console.log('✅ 4. Passenger successfully booked seat with default paymentStatus: pending');

    // 9. Unauthorized attempt: Passenger 1 attempts to mark own booking as paid
    const passMarkRes = await request(`/api/bookings/${bookingId}/mark-paid`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${passToken1}` },
    });
    assert.strictEqual(passMarkRes.status, 403, 'Passenger must NOT be allowed to mark own booking as paid');
    console.log('✅ 5. Unauthorized mark-paid by passenger returned 403 Forbidden');

    // 10. Unauthorized attempt: Other passenger attempts to mark as paid
    const pass2MarkRes = await request(`/api/bookings/${bookingId}/mark-paid`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${passToken2}` },
    });
    assert.strictEqual(pass2MarkRes.status, 403, 'Other user must NOT be allowed to mark booking as paid');
    console.log('✅ 6. Unauthorized mark-paid by random user returned 403 Forbidden');

    // 11. Authorized: Driver marks booking as paid
    const driverMarkRes = await request(`/api/bookings/${bookingId}/mark-paid`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    assert.strictEqual(driverMarkRes.status, 200);
    assert.strictEqual(driverMarkRes.data.data.paymentStatus, 'paid');
    console.log('✅ 7. Driver successfully marked booking as paid (paymentStatus flipped to paid)');

    // 12. Driver queries driver bookings roster
    const driverBookingsRes = await request('/api/bookings/driver', {
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    assert.strictEqual(driverBookingsRes.status, 200);
    assert.strictEqual(driverBookingsRes.data.data.length, 1);
    assert.strictEqual(driverBookingsRes.data.data[0].paymentStatus, 'paid');
    assert.strictEqual(driverBookingsRes.data.data[0].passenger.name, 'Passenger One');
    console.log('✅ 8. Driver roster endpoint /api/bookings/driver verified with passenger details and payment status');

    console.log('\n🎉 ALL OFFLINE PAYMENTS & BUG FIX TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    server.close();
    await disconnectDB();
  }
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
