import { Booking } from '../../models/Booking.js';
import { Ride } from '../../models/Ride.js';
import * as rideService from '../rides/rideService.js';

/**
 * Atomic seat booking flow (system.md §3.5)
 * Prevents race conditions and double-booking using atomic $gte check and $inc
 */
export const createBooking = async ({ rideId, passengerId, pickupPoint, dropPoint, seats }) => {
  const seatCount = seats ? parseInt(seats, 10) : 1;

  // 1. Verify ride details and ensure passenger != driver
  const ride = await rideService.getRideById(rideId);
  const driverIdStr = (ride.driver?._id || ride.driver).toString();
  const passengerIdStr = (passengerId?._id || passengerId).toString();
  if (driverIdStr === passengerIdStr) {
    const error = new Error('Drivers cannot book seats on their own rides.');
    error.statusCode = 400;
    throw error;
  }

  if (!['OPEN', 'BOOKING'].includes(ride.status)) {
    const error = new Error(`Cannot book seats on a ride with status ${ride.status}.`);
    error.statusCode = 400;
    throw error;
  }

  // Verify community / organization restriction
  if (ride.communityScope?.isRestricted) {
    const { User } = await import('../../models/User.js');
    const passengerUser = await User.findById(passengerId);
    const passOrg = passengerUser?.organization?.toLowerCase().trim();
    const rideOrg = ride.communityScope.organization?.toLowerCase().trim();
    if (!passOrg || passOrg !== rideOrg) {
      const error = new Error(`Forbidden: This ride is restricted to members of ${ride.communityScope.organization}.`);
      error.statusCode = 403;
      throw error;
    }
  }

  // Verify carpool group restriction
  if (ride.carpoolGroup) {
    const { CarpoolGroup } = await import('../../models/CarpoolGroup.js');
    const group = await CarpoolGroup.findById(ride.carpoolGroup);
    if (group) {
      const isMember = group.members.some(
        (m) => (m.user?._id || m.user).toString() === passengerIdStr
      );
      if (!isMember) {
        const error = new Error('Forbidden: This ride is restricted to members of this carpool group.');
        error.statusCode = 403;
        throw error;
      }
    }
  }

  // 2. Atomic seat decrement — prevents overbooking under concurrent requests
  // Uses a single conditional findOneAndUpdate with $gte guard and $inc
  await rideService.decrementSeatsAtomic(rideId, seatCount);

  try {
    const totalPrice = (ride.estimatedCost || 50) * seatCount;

    // 3. Create booking record with default paymentStatus: 'pending'
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
      paymentStatus: 'pending',
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

  if (booking.status === 'REJECTED' || booking.status === 'CANCELLED') {
    const error = new Error(`Booking is already ${booking.status.toLowerCase()}.`);
    error.statusCode = 400;
    throw error;
  }

  if (booking.status === 'COMPLETED') {
    const error = new Error('Cannot reject a completed booking.');
    error.statusCode = 400;
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
  const booking = await Booking.findById(bookingId).populate('ride');
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

  if (booking.status === 'REJECTED') {
    const error = new Error('Cannot cancel a booking that has already been rejected.');
    error.statusCode = 400;
    throw error;
  }

  if (booking.status === 'COMPLETED') {
    const error = new Error('Cannot cancel a completed booking.');
    error.statusCode = 400;
    throw error;
  }

  if (booking.ride && ['COMPLETED', 'CANCELLED'].includes(booking.ride.status)) {
    const error = new Error(`Cannot cancel booking on a ${booking.ride.status.toLowerCase()} ride.`);
    error.statusCode = 400;
    throw error;
  }

  // Restore seats atomically only if it was previously active (PENDING or CONFIRMED)
  if (['CONFIRMED', 'PENDING'].includes(booking.status)) {
    const rideId = booking.ride?._id || booking.ride;
    await rideService.restoreSeatsAtomic(rideId, booking.seats);
  }

  booking.status = 'CANCELLED';
  await booking.save();
  return booking;
};

/**
 * Mark a booking as paid by the ride's driver (system authorization check)
 */
export const markBookingAsPaid = async (bookingId, driverId) => {
  const booking = await Booking.findById(bookingId).populate('ride');
  if (!booking) {
    const error = new Error('Booking not found.');
    error.statusCode = 404;
    throw error;
  }

  if (['CANCELLED', 'REJECTED'].includes(booking.status)) {
    const error = new Error(`Cannot mark a ${booking.status.toLowerCase()} booking as paid.`);
    error.statusCode = 400;
    throw error;
  }

  const rideDriverId = booking.ride?.driver?._id
    ? booking.ride.driver._id.toString()
    : booking.ride?.driver?.toString();
  const callerDriverId = driverId?._id ? driverId._id.toString() : driverId.toString();

  if (!rideDriverId || rideDriverId !== callerDriverId) {
    const error = new Error('Forbidden: Only the driver of this ride can mark this booking as paid.');
    error.statusCode = 403;
    throw error;
  }

  booking.paymentStatus = 'paid';
  await booking.save();

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
};

/**
 * Get all passenger bookings for rides offered by a driver
 */
export const getDriverBookings = async (driverId) => {
  const callerDriverId = driverId?._id ? driverId._id.toString() : driverId.toString();
  const driverRides = await Ride.find({ driver: callerDriverId }).select('_id');
  const rideIds = driverRides.map((r) => r._id);

  return await Booking.find({ ride: { $in: rideIds } })
    .populate([
      { path: 'passenger', select: 'name email phone profileImage rating verificationStatus' },
      {
        path: 'ride',
        select: 'startLocation destination date departureTime status estimatedCost availableSeats totalSeats',
      },
    ])
    .sort({ createdAt: -1 });
};

