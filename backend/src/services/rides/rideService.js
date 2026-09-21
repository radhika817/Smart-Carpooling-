import crypto from 'crypto';
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
 * Create a new offered ride (or recurring ride series)
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
  recurrence,
  communityScope,
  carpoolGroup,
}) => {
  // Verify vehicle ownership through vehicleService
  const vehicle = await vehicleService.getVehicleById(vehicleId);
  if (vehicle.owner.toString() !== driverId.toString()) {
    const error = new Error('Forbidden: You can only create rides using your own vehicle.');
    error.statusCode = 403;
    throw error;
  }

  // Handle Recurring Ride Series Generation (Phase 8)
  if (recurrence && recurrence.isRecurring) {
    const startDateStr = recurrence.startDate || date;
    const daysOfWeek = Array.isArray(recurrence.daysOfWeek) && recurrence.daysOfWeek.length > 0
      ? recurrence.daysOfWeek
      : [1, 2, 3, 4, 5]; // Default: weekdays

    const startDate = new Date(startDateStr + 'T00:00:00.000Z');
    let endDate;
    if (recurrence.endDate) {
      endDate = new Date(recurrence.endDate + 'T00:00:00.000Z');
    } else {
      // Default to 4 weeks (28 days)
      endDate = new Date(startDate.getTime() + 28 * 24 * 60 * 60 * 1000);
    }

    // Cap at max 8 weeks (56 days) to prevent unbounded generation
    const maxAllowedDate = new Date(startDate.getTime() + 56 * 24 * 60 * 60 * 1000);
    if (endDate > maxAllowedDate) {
      endDate = maxAllowedDate;
    }

    const occurrenceDates = [];
    const curr = new Date(startDate);
    while (curr <= endDate) {
      const day = curr.getUTCDay();
      if (daysOfWeek.includes(day)) {
        occurrenceDates.push(curr.toISOString().split('T')[0]);
      }
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    if (occurrenceDates.length === 0) {
      occurrenceDates.push(startDateStr);
    }

    const recurringGroupId = crypto.randomUUID();

    const rideDocuments = occurrenceDates.map((d) => ({
      driver: driverId,
      vehicle: vehicleId,
      startLocation,
      destination,
      route: route || null,
      date: d,
      departureTime,
      totalSeats,
      availableSeats: totalSeats,
      estimatedCost,
      costBreakdown: costBreakdown || {},
      preferences: preferences || {},
      notes: notes || '',
      status: 'OPEN',
      communityScope: communityScope || { isRestricted: false, organization: '' },
      carpoolGroup: carpoolGroup || null,
      recurrence: {
        isRecurring: true,
        frequency: recurrence.frequency || 'weekly',
        daysOfWeek,
        startDate: startDateStr,
        endDate: occurrenceDates[occurrenceDates.length - 1],
        recurringGroupId,
      },
    }));

    const createdRides = await Ride.insertMany(rideDocuments);

    const firstRide = await Ride.findById(createdRides[0]._id).populate([
      { path: 'driver', select: 'name email phone profileImage organization rating verificationStatus' },
      { path: 'vehicle', select: 'model registrationNumber type seats image' },
      { path: 'carpoolGroup', select: 'name organization' },
    ]);

    const result = firstRide.toJSON();
    result.isRecurringSeries = true;
    result.recurringGroupId = recurringGroupId;
    result.occurrencesCount = createdRides.length;
    result.occurrenceDates = occurrenceDates;
    return result;
  }

  // Single standard ride
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
    communityScope: communityScope || { isRestricted: false, organization: '' },
    carpoolGroup: carpoolGroup || null,
    recurrence: {
      isRecurring: false,
      frequency: 'weekly',
      daysOfWeek: [],
      startDate: null,
      endDate: null,
      recurringGroupId: null,
    },
  });

  return await ride.populate([
    { path: 'driver', select: 'name email phone profileImage organization rating verificationStatus' },
    { path: 'vehicle', select: 'model registrationNumber type seats image' },
    { path: 'carpoolGroup', select: 'name organization' },
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

import { scoreRide, suggestPickupPoint } from '../matching/matchingService.js';

/**
 * Two-step ride search (system.md §3.4)
 * Step 1: MongoDB 2dsphere geo filter narrows candidate rides within proximity radius
 * Step 2: Pure function scoreRide() scores candidates (Route 40%, Time 25%, Pickup 20%, Dest 15%)
 *         and ranks them descending by match score.
 */
export const searchRides = async ({
  pickup,
  destination,
  pickupCoords,
  destCoords,
  date,
  departureTime,
  seats,
  radiusKm = 15,
  organization,
  communityOnly,
  carpoolGroup,
  excludeDriverId,
}) => {
  const filter = {
    status: { $in: ['OPEN', 'BOOKING'] },
    availableSeats: { $gte: seats ? parseInt(seats, 10) : 1 },
  };

  if (excludeDriverId) {
    filter.driver = { $ne: excludeDriverId };
  }

  if (date) {
    filter.date = date;
  }

  if (carpoolGroup) {
    filter.carpoolGroup = carpoolGroup;
  }

  // Step 1: MongoDB 2dsphere Geospatial Filtering
  // If passenger provides pickup coordinates, filter using MongoDB $centerSphere index
  if (pickupCoords && Array.isArray(pickupCoords) && pickupCoords.length === 2) {
    const radiusInRadians = (Number(radiusKm) || 15) / 6371;
    filter['startLocation.coordinates'] = {
      $geoWithin: {
        $centerSphere: [pickupCoords, radiusInRadians],
      },
    };
  }

  // Fetch narrowed candidates from MongoDB with populated driver, vehicle, and group
  let rides = await Ride.find(filter)
    .populate([
      { path: 'driver', select: 'name email phone profileImage organization rating verificationStatus' },
      { path: 'vehicle', select: 'model registrationNumber type seats image' },
      { path: 'carpoolGroup', select: 'name organization' },
    ])
    .lean();

  // Exclude user's own posted rides if excludeDriverId is provided
  if (excludeDriverId) {
    const excludeStr = excludeDriverId.toString();
    rides = rides.filter((r) => {
      const dId = (r.driver?._id || r.driver)?.toString();
      return dId !== excludeStr;
    });
  }

  // Community Scope Filtering (Phase 8)
  const normalizedUserOrg = organization ? organization.toLowerCase().trim() : '';

  rides = rides.filter((r) => {
    // If ride is restricted to a community, searcher must match
    if (r.communityScope?.isRestricted) {
      const rideOrg = r.communityScope.organization?.toLowerCase().trim();
      if (!normalizedUserOrg || normalizedUserOrg !== rideOrg) {
        return false;
      }
    }

    // If user specifically requested community-only rides
    if (communityOnly && normalizedUserOrg) {
      const rideOrg = r.communityScope?.organization?.toLowerCase().trim();
      const driverOrg = r.driver?.organization?.toLowerCase().trim();
      if (rideOrg !== normalizedUserOrg && driverOrg !== normalizedUserOrg) {
        return false;
      }
    }

    return true;
  });

  // If text query provided without coordinates, apply fallback text filter
  if (pickup && (!pickupCoords || pickupCoords.length !== 2)) {
    const p = pickup.toLowerCase();
    rides = rides.filter((r) => r.startLocation?.address?.toLowerCase().includes(p));
  }
  if (destination && (!destCoords || destCoords.length !== 2)) {
    const d = destination.toLowerCase();
    rides = rides.filter((r) => r.destination?.address?.toLowerCase().includes(d));
  }

  // Step 2: Pure Function Scoring & Ranking on narrowed candidates
  const scoredRides = rides.map((ride) => {
    const match = scoreRide(ride, {
      pickupCoords,
      destCoords,
      departureTime,
    });
    return {
      ...ride,
      match,
    };
  });

  // Sort descending by match score
  scoredRides.sort((a, b) => b.match.score - a.match.score);

  return scoredRides;
};

/**
 * Suggest optimal pickup point for a ride given passenger pickup locations
 */
export const suggestPickupForRide = async (rideId, passengerPickups = []) => {
  const ride = await getRideById(rideId);
  const routePoints = ride.route?.coordinates || [];
  return suggestPickupPoint(passengerPickups, routePoints);
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
 * Cancel ride (supports single occurrence or recurring series cancellation)
 */
export const cancelRide = async (rideId, driverId, options = {}) => {
  const ride = await getRideById(rideId);
  if (ride.driver._id.toString() !== driverId.toString()) {
    const error = new Error('Forbidden: You can only cancel your own rides.');
    error.statusCode = 403;
    throw error;
  }

  const cancelSeries = options.cancelSeries === true || options.cancelSeries === 'true';

  if (cancelSeries && ride.recurrence?.recurringGroupId) {
    const updateResult = await Ride.updateMany(
      {
        driver: driverId,
        'recurrence.recurringGroupId': ride.recurrence.recurringGroupId,
        date: { $gte: ride.date },
        status: { $in: ['OPEN', 'BOOKING'] },
      },
      { $set: { status: 'CANCELLED' } }
    );

    ride.status = 'CANCELLED';
    await ride.save();

    const json = ride.toJSON();
    json.seriesCancelled = true;
    json.cancelledOccurrencesCount = updateResult.modifiedCount || 1;
    return json;
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

/**
 * Update ride lifecycle status (e.g. DRIVER_ARRIVING, IN_PROGRESS, COMPLETED)
 */
export const updateRideStatus = async (rideId, driverId, newStatus) => {
  const ride = await getRideById(rideId);
  if (ride.driver._id.toString() !== driverId.toString()) {
    const error = new Error('Forbidden: Only the driver can update the ride status.');
    error.statusCode = 403;
    throw error;
  }

  const validStatuses = [
    'OPEN',
    'BOOKING',
    'CONFIRMED',
    'DRIVER_ARRIVING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_SHOW',
  ];
  if (!validStatuses.includes(newStatus)) {
    const error = new Error(`Invalid ride status: ${newStatus}`);
    error.statusCode = 400;
    throw error;
  }

  ride.status = newStatus;
  await ride.save();
  return ride;
};
