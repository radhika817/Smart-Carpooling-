import http from 'http';
import assert from 'node:assert';
import { io as ioClient } from 'socket.io-client';
import { app } from '../server.js';
import { initSocket } from '../socket/index.js';
import { connectDB, disconnectDB } from '../utils/db.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { Ride } from '../models/Ride.js';
import { Booking } from '../models/Booking.js';
import { Message } from '../models/Message.js';

let server;
let baseUrl;
let driverToken;
let passengerToken;
let outsiderToken;
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

async function runPhase5SocketTests() {
  console.log('🧪 Starting Phase 5 Socket.IO Real-Time Tracking & Chat Test Suite...\n');

  try {
    await connectDB();

    // Clean test records
    await Message.deleteMany({});
    await Booking.deleteMany({});
    await Ride.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({
      email: { $in: ['driver.phase5@test.com', 'passenger.phase5@test.com', 'outsider.phase5@test.com'] },
    });

    // Start HTTP server and bind Socket.IO
    server = http.createServer(app);
    initSocket(server);

    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`📡 Test Server with Socket.IO running at ${baseUrl}`);
        resolve();
      });
    });

    // 1. Setup Users: Driver, Passenger, Outsider
    console.log('\n1️⃣ Creating Driver, Passenger, and Outsider accounts...');
    const dRes = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Driver Dev', email: 'driver.phase5@test.com', password: 'Password123!', phone: '9876543201', role: 'driver' },
    });
    driverToken = dRes.data.data.token;
    const driverId = dRes.data.data.user.id;

    const pRes = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Passenger Priya', email: 'passenger.phase5@test.com', password: 'Password123!', phone: '9876543202', role: 'passenger' },
    });
    passengerToken = pRes.data.data.token;

    const oRes = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Outsider Om', email: 'outsider.phase5@test.com', password: 'Password123!', phone: '9876543203', role: 'passenger' },
    });
    outsiderToken = oRes.data.data.token;

    // 2. Add vehicle and post ride
    console.log('2️⃣ Registering Vehicle and Posting Ride...');
    const vRes = await request('/api/vehicles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { model: 'Swift ZXi', registrationNumber: 'MH 14 AB 9999', type: 'hatchback', seats: 4 },
    });
    const vehicleId = vRes.data.data._id;

    const rRes = await request('/api/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        vehicleId,
        startLocation: { address: 'Pune Station', coordinates: [73.8744, 18.5284] },
        destination: { address: 'Hinjewadi Phase 1', coordinates: [73.7389, 18.5913] },
        date: '2026-09-25',
        departureTime: '09:00',
        totalSeats: 3,
        estimatedCost: 65,
      },
    });
    rideId = rRes.data.data._id;

    // 3. Passenger books a seat
    console.log('3️⃣ Booking seat for Passenger...');
    const bRes = await request(`/api/rides/${rideId}/book`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${passengerToken}` },
      body: { seats: 1 },
    });
    assert.strictEqual(bRes.status, 201);
    console.log('  ✅ Booking confirmed for Passenger on ride', rideId);

    // 4. Test Socket Connection Authorization
    console.log('\n4️⃣ Testing Socket.IO Room Authorization Security...');
    const namespaceUrl = `${baseUrl}/rides/${rideId}`;

    // Test A: Outsider should be rejected with 403 / Forbidden error
    await new Promise((resolve, reject) => {
      const outsiderSocket = ioClient(namespaceUrl, {
        auth: { token: outsiderToken },
        transports: ['websocket'],
        reconnection: false,
      });

      outsiderSocket.on('connect', () => {
        outsiderSocket.disconnect();
        reject(new Error('Outsider was improperly allowed to connect!'));
      });

      outsiderSocket.on('connect_error', (err) => {
        console.log('  🛡️ Security verified: Outsider rejected with:', err.message);
        assert.ok(err.message.includes('Forbidden') || err.message.includes('not an active participant'));
        outsiderSocket.disconnect();
        resolve();
      });
    });

    // Test B: Driver connects cleanly
    const driverSocket = ioClient(namespaceUrl, {
      auth: { token: driverToken },
      transports: ['websocket'],
      reconnection: false,
    });
    await new Promise((resolve) => driverSocket.on('connect', resolve));
    console.log('  ✅ Driver connected to namespace /rides/' + rideId);

    // Test C: Passenger connects cleanly
    const passengerSocket = ioClient(namespaceUrl, {
      auth: { token: passengerToken },
      transports: ['websocket'],
      reconnection: false,
    });
    await new Promise((resolve) => passengerSocket.on('connect', resolve));
    console.log('  ✅ Passenger connected to namespace /rides/' + rideId);

    // 5. Test Real-Time In-Ride Chat
    console.log('\n5️⃣ Testing Real-Time In-Ride Chat Messaging...');
    const chatReceivedPromise = new Promise((resolve) => {
      const handler = (msg) => {
        if (msg.senderRole === 'passenger') {
          console.log('  📩 Driver received chat message from passenger:', msg.text);
          assert.strictEqual(msg.text, 'Hello driver, I am waiting near Pune Station gate 2');
          driverSocket.off('chat:message', handler);
          resolve();
        }
      };
      driverSocket.on('chat:message', handler);
    });

    passengerSocket.emit('chat:message', {
      text: 'Hello driver, I am waiting near Pune Station gate 2',
    });

    await chatReceivedPromise;

    // Driver replies back
    const replyReceivedPromise = new Promise((resolve) => {
      const handler = (msg) => {
        if (msg.senderRole === 'driver') {
          console.log('  📩 Passenger received reply from driver:', msg.text);
          assert.strictEqual(msg.text, 'Got it! I am 2 minutes away in a white Swift.');
          passengerSocket.off('chat:message', handler);
          resolve();
        }
      };
      passengerSocket.on('chat:message', handler);
    });

    driverSocket.emit('chat:message', {
      text: 'Got it! I am 2 minutes away in a white Swift.',
    });

    await replyReceivedPromise;

    // Verify messages persisted in MongoDB
    const persistedMessages = await Message.find({ ride: rideId });
    assert.strictEqual(persistedMessages.length, 2, 'Both chat messages should be stored in MongoDB');
    console.log('  ✅ Verified 2 chat messages persisted to MongoDB');

    // 6. Test Live Driver Location Broadcast & ETA
    console.log('\n6️⃣ Testing Live Driver Location Broadcast, ETA & Distance Calculation...');
    const locationPromise = new Promise((resolve) => {
      passengerSocket.on('location:broadcast', (loc) => {
        console.log('  📍 Passenger received driver location broadcast:');
        console.log('     Coordinates:', loc.coordinates);
        console.log('     Heading:', loc.heading + '°');
        console.log('     Speed:', loc.speed + ' km/h');
        console.log('     Distance Remaining:', loc.distanceRemainingKm + ' km');
        console.log('     Calculated ETA:', loc.etaMinutes + ' mins');
        assert.deepStrictEqual(loc.coordinates, [73.8500, 18.5300]);
        assert.strictEqual(loc.heading, 95);
        assert.strictEqual(loc.speed, 35);
        assert.ok(loc.distanceRemainingKm > 0);
        assert.ok(loc.etaMinutes > 0);
        resolve();
      });
    });

    driverSocket.emit('location:update', {
      coordinates: [73.8500, 18.5300],
      heading: 95,
      speed: 35,
    });

    await locationPromise;
    console.log('  ✅ Location broadcast with live ETA and distance verified!');

    // 7. Test Real-Time Ride Status Transitions
    console.log('\n7️⃣ Testing Real-Time Ride Status Updates...');

    // Status 1: Driver Arriving
    const arrivingStatusPromise = new Promise((resolve) => {
      passengerSocket.on('ride:status', (statusData) => {
        if (statusData.status === 'DRIVER_ARRIVING') {
          console.log('  🚗 Passenger received live status update:', statusData.status);
          assert.strictEqual(statusData.status, 'DRIVER_ARRIVING');
          resolve();
        }
      });
    });

    await request(`/api/rides/${rideId}/status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: { status: 'DRIVER_ARRIVING', message: 'Driver has arrived at Pune Station' },
    });

    await arrivingStatusPromise;

    // Status 2: Ride Started (IN_PROGRESS)
    const startedStatusPromise = new Promise((resolve) => {
      passengerSocket.on('ride:status', (statusData) => {
        if (statusData.status === 'IN_PROGRESS') {
          console.log('  🚀 Passenger received live status update:', statusData.status);
          assert.strictEqual(statusData.status, 'IN_PROGRESS');
          resolve();
        }
      });
    });

    await request(`/api/rides/${rideId}/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });

    await startedStatusPromise;

    // Status 3: Ride Completed
    const completedStatusPromise = new Promise((resolve) => {
      passengerSocket.on('ride:status', (statusData) => {
        if (statusData.status === 'COMPLETED') {
          console.log('  🏁 Passenger received live status update:', statusData.status);
          assert.strictEqual(statusData.status, 'COMPLETED');
          resolve();
        }
      });
    });

    await request(`/api/rides/${rideId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
    });

    await completedStatusPromise;

    // 8. Test REST Chat History Endpoint
    console.log('\n8️⃣ Testing GET /api/rides/:id/messages...');
    const msgRes = await request(`/api/rides/${rideId}/messages`, {
      headers: { Authorization: `Bearer ${passengerToken}` },
    });
    assert.strictEqual(msgRes.status, 200);
    assert.strictEqual(msgRes.data.data.length, 2);
    console.log('  ✅ Chat history retrieved via REST: 2 messages');

    // Disconnect sockets cleanly
    driverSocket.disconnect();
    passengerSocket.disconnect();

    console.log('\n🎉 ALL PHASE 5 REAL-TIME SOCKET.IO & TRACKING TESTS PASSED WITH 100% SUCCESS!\n');
  } catch (err) {
    console.error('❌ Phase 5 Test Failed:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await Message.deleteMany({});
    await Booking.deleteMany({});
    await Ride.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({
      email: { $in: ['driver.phase5@test.com', 'passenger.phase5@test.com', 'outsider.phase5@test.com'] },
    });
    await disconnectDB();
    process.exit(0);
  }
}

runPhase5SocketTests();
