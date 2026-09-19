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

async function runPhase4E2E() {
  console.log('🧪 Starting Phase 4 Two-Step Search & Matching E2E Test...\n');

  try {
    await connectDB();

    // Clean test records
    await Booking.deleteMany({});
    await Ride.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({ email: 'suresh.phase4@campus.edu' });

    // Start HTTP server on free port
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        console.log(`📡 Phase 4 Test server running at ${baseUrl}`);
        resolve();
      });
    });

    // 1. Register a driver
    console.log('\n1️⃣ Registering Driver via POST /api/auth/register...');
    const driverRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Suresh Patil',
        email: 'suresh.phase4@campus.edu',
        password: 'Password123!',
        phone: '9876543210',
        organization: 'COEP Tech',
      },
    });
    assert.strictEqual(driverRes.status, 201);
    const driverToken = driverRes.data.data.token;

    // 2. Register vehicle
    console.log('2️⃣ Registering Vehicle via POST /api/vehicles...');
    const vehicleRes = await request('/api/vehicles', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        model: 'Maruti Suzuki Swift',
        registrationNumber: 'MH 12 AB 4321',
        type: 'hatchback',
        seats: 4,
      },
    });
    assert.strictEqual(vehicleRes.status, 201);
    const vehicleId = vehicleRes.data.data._id;

    // 3. Create Ride 1: Pune Station -> Hinjewadi Phase 1 at 08:30 (Target commute corridor)
    console.log('3️⃣ Creating Ride 1: Pune Station -> Hinjewadi (08:30)...');
    const ride1Res = await request('/api/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        vehicleId,
        startLocation: {
          address: 'Pune Railway Station, Pune',
          coordinates: [73.8744, 18.5284],
        },
        destination: {
          address: 'Hinjewadi Phase 1, Pune',
          coordinates: [73.7389, 18.5913],
        },
        date: '2026-09-25',
        departureTime: '08:30',
        totalSeats: 3,
        estimatedCost: 65,
        costBreakdown: { fuel: 200, toll: 0, parking: 0, other: 0 },
      },
    });
    assert.strictEqual(ride1Res.status, 201);
    const hinjewadiRideId = ride1Res.data.data._id;

    // 4. Create Ride 2: Pune Station -> Katraj (Opposite South direction) at 18:00
    console.log('4️⃣ Creating Ride 2: Pune Station -> Katraj (Opposite direction, 18:00)...');
    const ride2Res = await request('/api/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        vehicleId,
        startLocation: {
          address: 'Pune Railway Station, Pune',
          coordinates: [73.8744, 18.5284],
        },
        destination: {
          address: 'Katraj Snake Park, Pune',
          coordinates: [73.8550, 18.4500],
        },
        date: '2026-09-25',
        departureTime: '18:00',
        totalSeats: 3,
        estimatedCost: 50,
      },
    });
    assert.strictEqual(ride2Res.status, 201);

    // 5. Create Ride 3: Mumbai Dadar -> Thane (~130 km away in Mumbai)
    console.log('5️⃣ Creating Ride 3: Dadar -> Thane (~130km away in Mumbai)...');
    const ride3Res = await request('/api/rides', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` },
      body: {
        vehicleId,
        startLocation: {
          address: 'Dadar Station, Mumbai',
          coordinates: [72.8430, 19.0178],
        },
        destination: {
          address: 'Thane West, Mumbai',
          coordinates: [72.9781, 19.2183],
        },
        date: '2026-09-25',
        departureTime: '08:30',
        totalSeats: 3,
        estimatedCost: 150,
      },
    });
    assert.strictEqual(ride3Res.status, 201);

    // 6. Test Two-Step Search:
    // Passenger near Shivajinagar [73.8630, 18.5300] (~1.2 km from Pune Station)
    // going to Hinjewadi [73.7330, 18.5950] at 08:40
    console.log('\n6️⃣ Performing Two-Step Search (MongoDB 2dsphere filter + pure scoring)...');
    const searchUrl = `/api/rides/search?pickupLng=73.8630&pickupLat=18.5300&destLng=73.7330&destLat=18.5950&date=2026-09-25&departureTime=08:40&radiusKm=15`;
    const searchRes = await request(searchUrl);
    assert.strictEqual(searchRes.status, 200);
    const rides = searchRes.data.data;

    // Step 1 Check: Mumbai ride (130km away) was filtered out by 15km 2dsphere index!
    console.log(`Candidate rides passing 15km geo-filter: ${rides.length} (Mumbai ride excluded)`);
    assert.strictEqual(rides.length, 2, 'Only Pune rides within 15km radius should be returned');

    // Step 2 Check: Top ranked ride must be the Hinjewadi corridor ride
    const topRide = rides[0];
    assert.strictEqual(topRide._id.toString(), hinjewadiRideId.toString());

    console.log('\n🎯 --- Real Search Result Score Breakdown ---');
    console.log('Top Match Percentage:', topRide.match.matchPercentage + '%');
    console.log('Match Summary:', topRide.match.summary);
    console.log('Breakdown:', JSON.stringify(topRide.match.breakdown, null, 2));
    console.log('--------------------------------------------\n');

    assert.ok(topRide.match.score >= 80, `Expected score >= 80, got ${topRide.match.score}`);
    assert.strictEqual(topRide.match.breakdown.routeSimilarity.weight, 40);
    assert.strictEqual(topRide.match.breakdown.timeCompatibility.weight, 25);
    assert.strictEqual(topRide.match.breakdown.pickupProximity.weight, 20);
    assert.strictEqual(topRide.match.breakdown.destinationProximity.weight, 15);
    assert.strictEqual(topRide.match.breakdown.timeCompatibility.diffMinutes, 10);
    assert.strictEqual(topRide.match.breakdown.pickupProximity.distanceKm, 1.2);
    assert.strictEqual(topRide.match.breakdown.destinationProximity.distanceKm, 0.7);

    // 7. Test Cost Sharing API (e.g. ₹200 fuel split with 2 passengers)
    console.log('7️⃣ Testing Cost Sharing Calculation Endpoint POST /api/rides/cost-split...');
    const costRes = await request('/api/rides/cost-split', {
      method: 'POST',
      body: {
        fuel: 200,
        toll: 0,
        parking: 0,
        other: 0,
        seatsOffered: 2,
        passengerCount: 2,
      },
    });
    assert.strictEqual(costRes.status, 200);
    const costData = costRes.data.data;

    console.log('\n💰 --- Cost Sharing Math Output ---');
    console.log(`Total Expense: ₹${costData.totalCost}`);
    console.log(`Total Occupants: ${costData.totalOccupants} (1 driver + 2 passengers)`);
    console.log(`Cost Per Passenger: ₹${costData.costPerPassenger}`);
    console.log(`Total Passenger Contribution: ₹${costData.totalPassengerContribution}`);
    console.log(`Driver Share: ₹${costData.driverShare}`);
    console.log(`Formula: ${costData.formula}`);
    console.log('----------------------------------\n');

    assert.strictEqual(costData.totalCost, 200);
    assert.strictEqual(costData.totalOccupants, 3);
    assert.strictEqual(costData.costPerPassenger, 67);
    assert.strictEqual(costData.totalPassengerContribution, 134);
    assert.strictEqual(costData.driverShare, 66);
    assert.strictEqual(costData.totalPassengerContribution + costData.driverShare, 200);

    // 8. Test Smart Pickup Point API
    console.log('8️⃣ Testing Smart Pickup Point Suggestion POST /api/rides/suggest-pickup...');
    const pickupRes = await request('/api/rides/suggest-pickup', {
      method: 'POST',
      body: {
        passengerPickups: [
          [73.8500, 18.5200],
          [73.8540, 18.5220],
          [73.8520, 18.5250],
        ],
        rideRoute: [
          [73.8490, 18.5190],
          [73.8520, 18.5220],
          [73.8550, 18.5260],
        ],
      },
    });
    assert.strictEqual(pickupRes.status, 200);
    const pickupData = pickupRes.data.data;

    console.log('Suggested Rendezvous Point:', pickupData.suggestedCoordinates);
    console.log('Average Walking Distance:', pickupData.averageWalkingKm, 'km');
    console.log('Reasoning:', pickupData.reasoning);

    assert.strictEqual(pickupData.passengerCount, 3);
    assert.ok(pickupData.suggestedCoordinates);
    assert.ok(pickupData.averageWalkingKm < 1.0);

    console.log('\n🎉 ALL PHASE 4 E2E TESTS PASSED WITH 100% PRECISION!\n');
  } catch (err) {
    console.error('❌ E2E Test Failed:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await Booking.deleteMany({});
    await Ride.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({ email: 'suresh.phase4@campus.edu' });
    await disconnectDB();
    process.exit(0);
  }
}

runPhase4E2E();
