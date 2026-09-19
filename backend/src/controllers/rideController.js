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

export const searchRides = async (req, res, next) => {
  try {
    const rides = await rideService.searchRides(req.query);
    return res.status(200).json({
      success: true,
      data: rides,
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
    const ride = await rideService.cancelRide(req.params.id, req.user._id || req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      data: ride,
    });
  } catch (error) {
    next(error);
  }
};

export const startRide = async (req, res, next) => {
  try {
    const ride = await rideService.startRide(req.params.id, req.user._id || req.user.id);
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
    return res.status(200).json({
      success: true,
      message: 'Ride completed',
      data: ride,
    });
  } catch (error) {
    next(error);
  }
};
