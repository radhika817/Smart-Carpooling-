import { z } from 'zod';
import * as rideService from '../services/rides/rideService.js';

export const createRideSchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  startLocation: z.object({
    address: z.string().min(2, 'Start location address is required'),
    coordinates: z.array(z.number()).length(2, 'Coordinates must be [lng, lat]'),
  }),
  destination: z.object({
    address: z.string().min(2, 'Destination address is required'),
    coordinates: z.array(z.number()).length(2, 'Coordinates must be [lng, lat]'),
  }),
  route: z.any().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:mm (24-hour format)'),
  totalSeats: z.number().int().min(1).max(8),
  estimatedCost: z.number().min(0),
  costBreakdown: z
    .object({
      fuel: z.number().optional(),
      toll: z.number().optional(),
      parking: z.number().optional(),
      other: z.number().optional(),
    })
    .optional(),
  preferences: z
    .object({
      music: z.boolean().optional(),
      smoking: z.boolean().optional(),
      petFriendly: z.boolean().optional(),
      ac: z.boolean().optional(),
    })
    .optional(),
  notes: z.string().max(500).optional(),
  recurrence: z
    .object({
      isRecurring: z.boolean().optional(),
      frequency: z.enum(['daily', 'weekly', 'weekdays']).optional(),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .optional(),
  communityScope: z
    .object({
      isRestricted: z.boolean().optional(),
      organization: z.string().optional(),
    })
    .optional(),
  carpoolGroup: z.string().optional().nullable(),
});

export const updateRideSchema = z.object({
  departureTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  estimatedCost: z.number().min(0).optional(),
  preferences: z
    .object({
      music: z.boolean().optional(),
      smoking: z.boolean().optional(),
      petFriendly: z.boolean().optional(),
      ac: z.boolean().optional(),
    })
    .optional(),
  notes: z.string().max(500).optional(),
});

export const createRide = async (req, res, next) => {
  try {
    const ride = await rideService.createRide({
      driverId: req.user._id || req.user.id,
      ...req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Ride posted successfully',
      data: ride,
    });
  } catch (error) {
    next(error);
  }
};

export const getRide = async (req, res, next) => {
  try {
    const ride = await rideService.getRideById(req.params.id);
    return res.status(200).json({
      success: true,
      data: ride,
    });
  } catch (error) {
    next(error);
  }
};

export const listRides = async (req, res, next) => {
  try {
    const rides = await rideService.listRides(req.query);
    return res.status(200).json({
      success: true,
      data: rides,
    });
  } catch (error) {
    next(error);
  }
};

import { calculateCostSplit } from '../services/matching/costSharing.js';
import { suggestPickupPoint } from '../services/matching/matchingService.js';

export const searchRides = async (req, res, next) => {
  try {
    const {
      pickup,
      destination,
      pickupLng,
      pickupLat,
      destLng,
      destLat,
      date,
      departureTime,
      seats,
      radiusKm,
      organization,
      communityOnly,
      carpoolGroup,
      excludeDriver,
    } = req.query;

    const excludeDriverId = req.user?._id || req.user?.id || excludeDriver;

    let pickupCoords = null;
    if (pickupLng !== undefined && pickupLat !== undefined && !isNaN(Number(pickupLng)) && !isNaN(Number(pickupLat))) {
      pickupCoords = [parseFloat(pickupLng), parseFloat(pickupLat)];
    }

    let destCoords = null;
    if (destLng !== undefined && destLat !== undefined && !isNaN(Number(destLng)) && !isNaN(Number(destLat))) {
      destCoords = [parseFloat(destLng), parseFloat(destLat)];
    }

    const rides = await rideService.searchRides({
      pickup,
      destination,
      pickupCoords,
      destCoords,
      date,
      departureTime,
      seats: seats ? parseInt(seats, 10) : 1,
      radiusKm: radiusKm ? parseFloat(radiusKm) : 15,
      organization,
      communityOnly: communityOnly === 'true' || communityOnly === true,
      carpoolGroup,
      excludeDriverId,
    });

    return res.status(200).json({
      success: true,
      data: rides,
    });
  } catch (error) {
    next(error);
  }
};

export const calculateCost = async (req, res, next) => {
  try {
    const calculation = calculateCostSplit(req.body);
    return res.status(200).json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    next(error);
  }
};

export const suggestPickup = async (req, res, next) => {
  try {
    const { passengerPickups, rideRoute } = req.body;
    let result;
    if (req.params.id) {
      result = await rideService.suggestPickupForRide(req.params.id, passengerPickups);
    } else {
      result = suggestPickupPoint(passengerPickups, rideRoute);
    }
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRide = async (req, res, next) => {
  try {
    const ride = await rideService.updateRide(
      req.params.id,
      req.user._id || req.user.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: 'Ride updated successfully',
      data: ride,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRide = async (req, res, next) => {
  try {
    const cancelSeries = req.query.cancelSeries === 'true';
    const result = await rideService.cancelRide(req.params.id, req.user._id || req.user.id, {
      cancelSeries,
    });
    return res.status(200).json({
      success: true,
      message: cancelSeries ? 'Recurring ride series cancelled successfully' : 'Ride cancelled successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

import { broadcastToRide } from '../socket/index.js';
import { getRideMessages } from '../services/chat/chatService.js';

export const startRide = async (req, res, next) => {
  try {
    const ride = await rideService.startRide(req.params.id, req.user._id || req.user.id);
    broadcastToRide(req.params.id, 'ride:status', {
      rideId: req.params.id,
      status: 'IN_PROGRESS',
      message: 'Ride has started! Real-time tracking is now active.',
      timestamp: Date.now(),
    });
    return res.status(200).json({
      success: true,
      message: 'Ride started',
      data: ride,
    });
  } catch (error) {
    next(error);
  }
};

export const completeRide = async (req, res, next) => {
  try {
    const ride = await rideService.completeRide(req.params.id, req.user._id || req.user.id);
    broadcastToRide(req.params.id, 'ride:status', {
      rideId: req.params.id,
      status: 'COMPLETED',
      message: 'Ride completed successfully. Thank you for carpooling!',
      timestamp: Date.now(),
    });
    return res.status(200).json({
      success: true,
      message: 'Ride completed',
      data: ride,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRideStatus = async (req, res, next) => {
  try {
    const { status, message } = req.body;
    const ride = await rideService.updateRideStatus(
      req.params.id,
      req.user._id || req.user.id,
      status
    );
    broadcastToRide(req.params.id, 'ride:status', {
      rideId: req.params.id,
      status,
      message: message || `Driver updated ride status to ${status}`,
      timestamp: Date.now(),
    });
    return res.status(200).json({
      success: true,
      message: `Ride status updated to ${status}`,
      data: ride,
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const messages = await getRideMessages(req.params.id, req.user._id || req.user.id);
    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};
