import { z } from 'zod';
import * as vehicleService from '../services/vehicles/vehicleService.js';

export const createVehicleSchema = z.object({
  model: z.string().min(2, 'Vehicle model is required'),
  registrationNumber: z.string().min(2, 'Registration number is required'),
  type: z.enum(['sedan', 'hatchback', 'suv', 'bike', 'other']).default('sedan'),
  seats: z.number().int().min(1, 'At least 1 seat required').max(8, 'Maximum 8 seats allowed').default(4),
  image: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().url().optional()),
});

export const updateVehicleSchema = z.object({
  model: z.string().min(2).optional(),
  registrationNumber: z.string().min(2).optional(),
  type: z.enum(['sedan', 'hatchback', 'suv', 'bike', 'other']).optional(),
  seats: z.number().int().min(1).max(8).optional(),
  image: z.preprocess((val) => (val === '' || val === null ? undefined : val), z.string().url().optional()),
});

export const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await vehicleService.createVehicle({
      ownerId: req.user._id || req.user.id,
      ...req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Vehicle added successfully',
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await vehicleService.getVehiclesByOwner(req.user._id || req.user.id);
    return res.status(200).json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req, res, next) => {
  try {
    const updated = await vehicleService.updateVehicle(
      req.params.id,
      req.user._id || req.user.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteVehicle = async (req, res, next) => {
  try {
    const result = await vehicleService.deleteVehicle(
      req.params.id,
      req.user._id || req.user.id
    );
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
