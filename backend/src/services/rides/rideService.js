import { Ride } from '../../models/Ride.js';
import * as vehicleService from '../vehicles/vehicleService.js';

/**
 * Atomic seat decrement (system.md §3.5)
 * Single conditional update with $gte guard and $inc, preventing double-booking race conditions.
 */
export const decrementSeatsAtomic = async (rideId, requestedSeats) => {
  const ride = await Ride.findOneAndUpdate(
    { _id: rideId, availableSeats: { $gte: requestedSeats } },
    { $inc: { availableSeats: -requestedSeats } },
    { new: true }
  );

  if (!ride) {
    const error = new Error('Not enough seats available');
    error.statusCode = 409;
    throw error;
  }

  return ride;
};

/**
 * Atomic seat restoration (upon booking rejection or cancellation)
 */
export const restoreSeatsAtomic = async (rideId, seatsToRestore) => {
  const ride = await Ride.findByIdAndUpdate(
    rideId,
    { $inc: { availableSeats: seatsToRestore } },
    { new: true }
  );
  return ride;
};

/**
 * Create a new offered ride
 */
export const createRide = async ({
  driverId,
  vehicleId,
  startLocation,
  destination,
  route,
  date,
  departureTime,
  totalSeats,
  estimatedCost,
  costBreakdown,
  preferences,
  notes,
}) => {
  // Verify vehicle ownership through vehicleService
  const vehicle = await vehicleService.getVehicleById(vehicleId);
  if (vehicle.owner.toString() !== driverId.toString()) {
    const error = new Error('Forbidden: You can only create rides using your own vehicle.');
    error.statusCode = 403;
    throw error;
  }

  const ride = await Ride.create({
    driver: driverId,
    vehicle: vehicleId,
    startLocation,
    destination,
    route: route || null,
    date,
    departureTime,
    totalSeats,
    availableSeats: totalSeats,
    estimatedCost,
    costBreakdown: costBreakdown || {},
    preferences: preferences || {},
    notes: notes || '',
    status: 'OPEN',
  });

  return await ride.populate([
    { path: 'driver', select: 'name email phone profileImage organization rating verificationStatus' },
    { path: 'vehicle', select: 'model registrationNumber type seats image' },
  ]);
};

/**
 * Fetch a ride by ID
 */
export const getRideById = async (rideId) => {
  const ride = await Ride.findById(rideId).populate([
    { path: 'driver', select: 'name email phone profileImage organization rating verificationStatus' },
    { path: 'vehicle', select: 'model registrationNumber type seats image' },
  ]);

  if (!ride) {
    const error = new Error('Ride not found.');
    error.statusCode = 404;
    throw error;
  }

  return ride;
};

/**
 * List rides with query filter
 */
export const listRides = async (query = {}) => {
  const filter = {};
  if (query.driver) filter.driver = query.driver;
  if (query.status) filter.status = query.status;
  if (query.date) filter.date = query.date;

  return await Ride.find(filter)
    .populate([
      { path: 'driver', select: 'name email phone profileImage organization rating verificationStatus' },
      { path: 'vehicle', select: 'model registrationNumber type seats image' },
    ])
    .sort({ date: 1, departureTime: 1 });
};

/**
 * Plain ride search endpoint for Phase 2
 */
export const searchRides = async ({ pickup, destination, date, seats }) => {
  const filter = {
    status: { $in: ['OPEN', 'BOOKING'] },
    availableSeats: { $gte: seats ? parseInt(seats, 10) : 1 },
  };

  if (date) {
    filter.date = date;
  }

  let rides = await Ride.find(filter)
    .populate([
      { path: 'driver', select: 'name email phone profileImage organization rating verificationStatus' },
      { path: 'vehicle', select: 'model registrationNumber type seats image' },
    ])
    .sort({ date: 1, departureTime: 1 });

  if (pickup) {
    const p = pickup.toLowerCase();
    rides = rides.filter((r) => r.startLocation?.address?.toLowerCase().includes(p));
  }
  if (destination) {
    const d = destination.toLowerCase();
    rides = rides.filter((r) => r.destination?.address?.toLowerCase().includes(d));
  }

  return rides;
};

/**
 * Update ride details
 */
export const updateRide = async (rideId, driverId, updateData) => {
  const ride = await getRideById(rideId);
  if (ride.driver._id.toString() !== driverId.toString()) {
    const error = new Error('Forbidden: You can only edit your own rides.');
    error.statusCode = 403;
    throw error;
  }

  if (['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(ride.status)) {
    const error = new Error(`Cannot modify ride in status ${ride.status}.`);
    error.statusCode = 400;
    throw error;
  }

  Object.assign(ride, updateData);
  await ride.save();
  return ride;
};

/**
 * Cancel ride
 */
export const cancelRide = async (rideId, driverId) => {
  const ride = await getRideById(rideId);
  if (ride.driver._id.toString() !== driverId.toString()) {
    const error = new Error('Forbidden: You can only cancel your own rides.');
    error.statusCode = 403;
    throw error;
  }

  ride.status = 'CANCELLED';
  await ride.save();
  return ride;
};

/**
 * Start ride
 */
export const startRide = async (rideId, driverId) => {
  const ride = await getRideById(rideId);
  if (ride.driver._id.toString() !== driverId.toString()) {
    const error = new Error('Forbidden: Only the driver can start this ride.');
    error.statusCode = 403;
    throw error;
  }

  ride.status = 'IN_PROGRESS';
  await ride.save();
  return ride;
};

/**
 * Complete ride
 */
export const completeRide = async (rideId, driverId) => {
  const ride = await getRideById(rideId);
  if (ride.driver._id.toString() !== driverId.toString()) {
    const error = new Error('Forbidden: Only the driver can complete this ride.');
    error.statusCode = 403;
    throw error;
  }

  ride.status = 'COMPLETED';
  await ride.save();
  return ride;
};
