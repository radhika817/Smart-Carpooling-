import http from 'http';
import { app } from '../server.js';
import { connectDB, disconnectDB } from '../utils/db.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { Ride } from '../models/Ride.js';
import { Booking } from '../models/Booking.js';

let server;
let baseUrl;

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

async function runE2ETest() {
  console.log('🧪 Starting Phase 2 End-to-End REST API & Concurrency Test...\n');

  try {
    await connectDB();

    // Clean test records
    await Booking.deleteMany({});
    await Ride.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({
      email: { $in: ['e2e_driver@test.com', 'e2e_pass1@test.com', 'e2e_pass2@test.com'] },
    });

    // Start HTTP server on random free port
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`📡 Test server running at ${baseUrl}`);
        resolve();
      });
    });

    // 1. Register and Login Driver
    console.log('\n1️⃣ Registering Driver via POST /api/auth/register...');
    const driverReg = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Vikas Sharma',
        email: 'e2e_driver@test.com',
        password: 'driverPassword123',
        role: 'driver',
        organization: 'COEP Pune',
      },
    });
    if (driverReg.status !== 201) throw new Error(`Driver reg failed: ${JSON.stringify(driverReg)}`);
    const driverToken = driverReg.data.data.token;
    console.log('  ✅ Driver registered and JWT token acquired');

    // 2. Add Vehicle via POST /api/vehicles
    console.log('2️⃣ Adding Vehicle via POST /api/vehicles...');
    const vehicleRes = await request('/api/vehicles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        model: 'Maruti Brezza ZXi',
        registrationNumber: 'MH 14 CD 5678',
        type: 'suv',
        seats: 4,
      },
    });
    if (vehicleRes.status !== 201) throw new Error(`Vehicle add failed: ${JSON.stringify(vehicleRes)}`);
    const vehicleId = vehicleRes.data.data._id;
    console.log(`  ✅ Vehicle added: ${vehicleRes.data.data.model} (ID: ${vehicleId})`);

    // 3. Post Ride with 1 Seat via POST /api/rides
    console.log('3️⃣ Posting Ride via POST /api/rides with 1 SEAT...');
    const rideRes = await request('/api/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        vehicleId,
        startLocation: {
          address: 'Akurdi, PCMC',
          coordinates: [73.7785, 18.6492],
        },
        destination: {
          address: 'EON IT Park, Kharadi',
          coordinates: [73.9535, 18.5528],
        },
        date: '2026-10-20',
        departureTime: '08:45',
        totalSeats: 1, // EXACTLY 1 SEAT
        estimatedCost: 90,
      },
    });
    if (rideRes.status !== 201) throw new Error(`Ride creation failed: ${JSON.stringify(rideRes)}`);
    const rideId = rideRes.data.data._id;
    console.log(`  ✅ Ride created with availableSeats = ${rideRes.data.data.availableSeats}`);

    // 4. Test Search Endpoint GET /api/rides/search
    console.log('4️⃣ Testing Search via GET /api/rides/search...');
    const searchRes = await request('/api/rides/search?pickup=Akurdi&destination=Kharadi');
    if (searchRes.status !== 200 || searchRes.data.data.length === 0) {
      throw new Error(`Search failed: ${JSON.stringify(searchRes)}`);
    }
    console.log(`  ✅ Search returned ${searchRes.data.data.length} candidate ride(s)`);

    // 5. Register Two Competing Passengers
    console.log('5️⃣ Registering Passenger 1 and Passenger 2...');
    const p1Reg = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Passenger One',
        email: 'e2e_pass1@test.com',
        password: 'password123',
        role: 'passenger',
      },
    });
    const p2Reg = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Passenger Two',
        email: 'e2e_pass2@test.com',
        password: 'password123',
        role: 'passenger',
      },
    });
    const p1Token = p1Reg.data.data.token;
    const p2Token = p2Reg.data.data.token;
    console.log('  ✅ Both passenger accounts active with JWTs');

    // 6. ATOMIC CONCURRENCY OVER HTTP: Two simultaneous seat bookings on the last seat
    console.log('\n🔒 6️⃣ SIMULTANEOUS HTTP BOOKING REQUESTS ON LAST SEAT...');
    const [bookRes1, bookRes2] = await Promise.all([
      request(`/api/rides/${rideId}/book`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${p1Token}` },
        body: { seats: 1 },
      }),
      request(`/api/rides/${rideId}/book`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${p2Token}` },
        body: { seats: 1 },
      }),
    ]);

    console.log(`  Passenger 1 Status: ${bookRes1.status} | Response: ${bookRes1.data.message}`);
    console.log(`  Passenger 2 Status: ${bookRes2.status} | Response: ${bookRes2.data.message}`);

    const statuses = [bookRes1.status, bookRes2.status];
    const successes = statuses.filter((s) => s === 201);
    const conflicts = statuses.filter((s) => s === 409);

    if (successes.length !== 1 || conflicts.length !== 1) {
      throw new Error(
        `🚨 CONCURRENCY FAILED! Expected one 201 and one 409, got statuses: [${statuses.join(', ')}]`
      );
    }
    console.log('  ✅ Atomic Concurrency Verified over HTTP: exactly one 201 and one 409 Conflict!');

    // 7. Verify Ride availableSeats is 0
    const checkRide = await request(`/api/rides/${rideId}`);
    if (checkRide.data.data.availableSeats !== 0) {
      throw new Error(`Expected availableSeats 0, got ${checkRide.data.data.availableSeats}`);
    }
    console.log('  ✅ Ride seats = 0 in database. No double-booking occurred.');

    // 8. Winning passenger cancels booking -> seats restored atomically
    console.log('\n7️⃣ Testing Booking Cancellation & Atomic Seat Restoration...');
    const winningRes = bookRes1.status === 201 ? bookRes1 : bookRes2;
    const winningToken = bookRes1.status === 201 ? p1Token : p2Token;
    const bookingId = winningRes.data.data._id;

    const cancelRes = await request(`/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${winningToken}` },
    });
    if (cancelRes.status !== 200) throw new Error(`Cancel failed: ${JSON.stringify(cancelRes)}`);

    const restoredRide = await request(`/api/rides/${rideId}`);
    if (restoredRide.data.data.availableSeats !== 1) {
      throw new Error(`Expected availableSeats 1, got ${restoredRide.data.data.availableSeats}`);
    }
    console.log(`  ✅ Booking cancelled and availableSeats restored to ${restoredRide.data.data.availableSeats}`);

    // 9. Driver starts and completes ride
    console.log('\n8️⃣ Testing Ride Lifecycle Endpoints (Start → Complete)...');
    const startRes = await request(`/api/rides/${rideId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    if (startRes.status !== 200 || startRes.data.data.status !== 'IN_PROGRESS') {
      throw new Error(`Start ride failed: ${JSON.stringify(startRes)}`);
    }

    const completeRes = await request(`/api/rides/${rideId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });
    if (completeRes.status !== 200 || completeRes.data.data.status !== 'COMPLETED') {
      throw new Error(`Complete ride failed: ${JSON.stringify(completeRes)}`);
    }
    console.log('  ✅ Ride lifecycle verified: OPEN → IN_PROGRESS → COMPLETED');

    console.log('\n🎉 ALL PHASE 2 END-TO-END REST & CONCURRENCY TESTS PASSED!\n');

    server.close();
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ E2E Test Failed:', error);
    if (server) server.close();
    await disconnectDB();
    process.exit(1);
  }
}

runE2ETest();
