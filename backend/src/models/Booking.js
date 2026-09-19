import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      type: [Number], // [lng, lat]
      default: [0, 0],
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'Ride reference is required'],
      index: true,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Passenger reference is required'],
      index: true,
    },
    pickupPoint: {
      type: locationSchema,
      required: [true, 'Pickup point is required'],
    },
    dropPoint: {
      type: locationSchema,
      required: [true, 'Drop-off point is required'],
    },
    seats: {
      type: Number,
      required: [true, 'Number of seats is required'],
      min: [1, 'Must book at least 1 seat'],
      max: [8, 'Cannot book more than 8 seats'],
      default: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'],
      default: 'CONFIRMED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
bookingSchema.index({ ride: 1, passenger: 1 });
bookingSchema.index({ passenger: 1, status: 1 });
bookingSchema.index({ ride: 1, status: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
