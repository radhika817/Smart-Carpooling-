import { connectDB, disconnectDB } from '../utils/db.js';
import * as authService from '../services/auth/authService.js';
import * as vehicleService from '../services/vehicles/vehicleService.js';
import * as rideService from '../services/rides/rideService.js';
import * as bookingService from '../services/bookings/bookingService.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { Ride } from '../models/Ride.js';
import { Booking } from '../models/Booking.js';

async function runConcurrencyTest() {
  console.log('🧪 Starting Phase 2 Atomic Booking Concurrency Test...\n');

  try {
    await connectDB();

    // Clean up test data
    await Booking.deleteMany({});
    await Ride.deleteMany({});
    await Vehicle.deleteMany({});
    await User.deleteMany({
      email: { $in: ['driver_race@test.com', 'passenger_a@test.com', 'passenger_b@test.com'] },
    });

    // 1. Create Driver and Vehicle
    console.log('1️⃣ Setting up Driver and Vehicle...');
    const driver = await authService.registerUser({
      name: 'Rohan Driver',
      email: 'driver_race@test.com',
      password: 'driverPassword123',
      role: 'driver',
      organization: 'Pune Tech Park',
    });

    const vehicle = await vehicleService.createVehicle({
      ownerId: driver.user._id,
      model: 'Honda City',
      registrationNumber: 'MH 12 CR 9999',
      type: 'sedan',
      seats: 4,
    });
    console.log(`  ✅ Driver and vehicle created: ${vehicle.model}`);

    // 2. Create Ride with EXACTLY 1 available seat
    console.log('2️⃣ Posting Ride with exactly 1 available seat...');
    const ride = await rideService.createRide({
      driverId: driver.user._id,
      vehicleId: vehicle._id,
      startLocation: {
        address: 'Chinchwad Station, Pune',
        coordinates: [73.7915, 18.6279], // [lng, lat]
      },
      destination: {
        address: 'Hinjewadi Phase 1, Pune',
        coordinates: [73.7389, 18.5913], // [lng, lat]
      },
      date: '2026-10-15',
      departureTime: '09:00',
      totalSeats: 1, // Only 1 seat offered!
      estimatedCost: 75,
    });

    if (ride.availableSeats !== 1) {
      throw new Error(`Expected availableSeats to be 1, got ${ride.availableSeats}`);
    }
    console.log(`  ✅ Ride created with availableSeats = ${ride.availableSeats}`);

    // 3. Create Two Distinct Passengers
    console.log('3️⃣ Registering Passenger A and Passenger B...');
    const passengerA = await authService.registerUser({
      name: 'Passenger A',
      email: 'passenger_a@test.com',
      password: 'password123',
      role: 'passenger',
    });

    const passengerB = await authService.registerUser({
      name: 'Passenger B',
      email: 'passenger_b@test.com',
      password: 'password123',
      role: 'passenger',
    });
    console.log('  ✅ Two competing passengers ready');

    // 4. ATOMIC CONCURRENCY TEST: Two simultaneous booking requests for the last remaining seat
    console.log('\n🔒 4️⃣ FIRING TWO CONCURRENT REQUESTS FOR THE LAST SEAT SIMULTANEOUSLY...');
    const [resultA, resultB] = await Promise.allSettled([
      bookingService.createBooking({
        rideId: ride._id,
        passengerId: passengerA.user._id,
        seats: 1,
      }),
      bookingService.createBooking({
        rideId: ride._id,
        passengerId: passengerB.user._id,
        seats: 1,
      }),
    ]);

    const successes = [resultA, resultB].filter((r) => r.status === 'fulfilled');
    const failures = [resultA, resultB].filter((r) => r.status === 'rejected');

    console.log(`  📊 Outcome: ${successes.length} request(s) succeeded, ${failures.length} request(s) rejected`);

    if (successes.length !== 1 || failures.length !== 1) {
      throw new Error(
        `🚨 RACE CONDITION FAILURE! Expected exactly 1 success and 1 rejection, but got: ${successes.length} successes and ${failures.length} failures.`
      );
    }

    const rejectionError = failures[0].reason;
    console.log(`  🛡️ Rejection correctly caught with 409 Conflict: "${rejectionError.message}" (statusCode: ${rejectionError.statusCode})`);

    // Verify the ride state in DB
    const freshRide = await rideService.getRideById(ride._id);
    if (freshRide.availableSeats !== 0) {
      throw new Error(`Expected availableSeats to be 0, but got ${freshRide.availableSeats}`);
    }
    console.log('  ✅ Ride availableSeats = 0 (never negative, zero double-booking!)');

    // 5. Test Cancellation & Atomic Seat Restoration
    console.log('\n5️⃣ Testing Booking Cancellation & Atomic Seat Restoration...');
    const winningBooking = successes[0].value;
    await bookingService.cancelBooking(winningBooking._id, winningBooking.passenger._id);

    const restoredRide = await rideService.getRideById(ride._id);
    if (restoredRide.availableSeats !== 1) {
      throw new Error(`Expected availableSeats to restore to 1, got ${restoredRide.availableSeats}`);
    }
    console.log(`  ✅ Seats restored atomically: availableSeats = ${restoredRide.availableSeats}`);

    // 6. Test Ride Lifecycle Progression
    console.log('\n6️⃣ Testing Ride Lifecycle Progression (Start → Complete)...');
    const inProgressRide = await rideService.startRide(ride._id, driver.user._id);
    if (inProgressRide.status !== 'IN_PROGRESS') {
      throw new Error(`Expected status IN_PROGRESS, got ${inProgressRide.status}`);
    }
    const completedRide = await rideService.completeRide(ride._id, driver.user._id);
    if (completedRide.status !== 'COMPLETED') {
      throw new Error(`Expected status COMPLETED, got ${completedRide.status}`);
    }
    console.log('  ✅ Ride status successfully updated: OPEN → IN_PROGRESS → COMPLETED');

    console.log('\n🎉 ALL PHASE 2 ATOMIC CONCURRENCY & CORE RIDE TESTS PASSED!\n');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Concurrency Test Failed:', error);
    await disconnectDB();
    process.exit(1);
  }
}

runConcurrencyTest();
