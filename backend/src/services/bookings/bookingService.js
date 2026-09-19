import { Booking } from '../../models/Booking.js';
import * as rideService from '../rides/rideService.js';

/**
 * Atomic seat booking flow (system.md §3.5)
 * Prevents race conditions and double-booking using atomic $gte check and $inc
 */
export const createBooking = async ({ rideId, passengerId, pickupPoint, dropPoint, seats }) => {
  const seatCount = seats ? parseInt(seats, 10) : 1;

  // 1. Verify ride details and ensure passenger != driver
  const ride = await rideService.getRideById(rideId);
  if (ride.driver._id.toString() === passengerId.toString()) {
    const error = new Error('Drivers cannot book seats on their own rides.');
    error.statusCode = 400;
    throw error;
  }

  // 2. Atomic seat decrement — prevents overbooking under concurrent requests
  // Uses a single conditional findOneAndUpdate with $gte guard and $inc
  await rideService.decrementSeatsAtomic(rideId, seatCount);

  try {
    const totalPrice = (ride.estimatedCost || 50) * seatCount;

    // 3. Create booking record
    const booking = await Booking.create({
      ride: rideId,
      passenger: passengerId,
      pickupPoint: pickupPoint || {
        address: ride.startLocation.address,
        coordinates: ride.startLocation.coordinates,
      },
      dropPoint: dropPoint || {
        address: ride.destination.address,
        coordinates: ride.destination.coordinates,
      },
      seats: seatCount,
      totalPrice,
      status: 'CONFIRMED',
    });

    return await booking.populate([
      { path: 'passenger', select: 'name email phone profileImage rating verificationStatus' },
      {
        path: 'ride',
        populate: [
          { path: 'driver', select: 'name email phone profileImage rating' },
          { path: 'vehicle', select: 'model registrationNumber' },
        ],
      },
    ]);
  } catch (error) {
    // Rollback seat reservation if booking creation errors
    await rideService.restoreSeatsAtomic(rideId, seatCount);
    throw error;
  }
};

/**
 * Get all bookings for passenger
 */
export const getMyBookings = async (userId) => {
  return await Booking.find({ passenger: userId })
    .populate([
      { path: 'passenger', select: 'name email phone profileImage rating verificationStatus' },
      {
        path: 'ride',
        populate: [
          { path: 'driver', select: 'name email phone profileImage rating' },
          { path: 'vehicle', select: 'model registrationNumber type' },
        ],
      },
    ])
    .sort({ createdAt: -1 });
};

/**
 * Get all bookings for a given ride (driver inspection)
 */
export const getBookingsByRide = async (rideId, driverId) => {
  const ride = await rideService.getRideById(rideId);
  if (ride.driver._id.toString() !== driverId.toString()) {
    const error = new Error('Forbidden: You can only view bookings for your own rides.');
    error.statusCode = 403;
    throw error;
  }

  return await Booking.find({ ride: rideId })
    .populate({ path: 'passenger', select: 'name email phone profileImage rating verificationStatus' })
    .sort({ createdAt: -1 });
};

/**
 * Accept a booking
 */
export const acceptBooking = async (bookingId, driverId) => {
  const booking = await Booking.findById(bookingId).populate('ride');
  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.ride.driver.toString() !== driverId.toString()) {
    const error = new Error('Forbidden: Only the driver can accept this booking.');
    error.statusCode = 403;
    throw error;
  }

  booking.status = 'CONFIRMED';
  await booking.save();
  return booking;
};

/**
 * Reject a booking and restore reserved seats atomically
 */
export const rejectBooking = async (bookingId, driverId) => {
  const booking = await Booking.findById(bookingId).populate('ride');
  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.ride.driver.toString() !== driverId.toString()) {
    const error = new Error('Forbidden: Only the driver can reject this booking.');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === 'CONFIRMED' || booking.status === 'PENDING') {
    // Restore seats atomically
    await rideService.restoreSeatsAtomic(booking.ride._id, booking.seats);
  }

  booking.status = 'REJECTED';
  await booking.save();
  return booking;
};

/**
 * Cancel a booking and restore reserved seats atomically
 */
export const cancelBooking = async (bookingId, passengerId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (booking.passenger.toString() !== passengerId.toString()) {
    const error = new Error('Forbidden: You can only cancel your own bookings.');
    error.statusCode = 403;
    throw error;
  }

  if (booking.status === 'CANCELLED') {
    const error = new Error('Booking is already cancelled.');
    error.statusCode = 400;
    throw error;
  }

  // Restore seats atomically
  await rideService.restoreSeatsAtomic(booking.ride, booking.seats);

  booking.status = 'CANCELLED';
  await booking.save();
  return booking;
};
