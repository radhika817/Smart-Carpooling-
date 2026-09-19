import { z } from 'zod';
import * as bookingService from '../services/bookings/bookingService.js';

export const bookSeatSchema = z.object({
  seats: z.number().int().min(1, 'Must request at least 1 seat').max(8, 'Maximum 8 seats allowed').default(1),
  pickupPoint: z
    .object({
      address: z.string().min(1),
      coordinates: z.array(z.number()).optional(),
    })
    .optional(),
  dropPoint: z
    .object({
      address: z.string().min(1),
      coordinates: z.array(z.number()).optional(),
    })
    .optional(),
});

export const bookSeat = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking({
      rideId: req.params.id,
      passengerId: req.user._id || req.user.id,
      ...req.body,
    });
    return res.status(201).json({
      success: true,
      message: 'Seat booked successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getMyBookings(req.user._id || req.user.id);
    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.acceptBooking(req.params.id, req.user._id || req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Booking accepted',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.rejectBooking(req.params.id, req.user._id || req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Booking rejected and seats restored',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.user._id || req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Booking cancelled and seats restored',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};
