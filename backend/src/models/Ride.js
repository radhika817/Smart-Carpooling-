import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Geo coordinates [longitude, latitude] are required'],
    },
    address: {
      type: String,
      required: [true, 'Location address is required'],
      trim: true,
    },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver is required'],
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    startLocation: {
      type: pointSchema,
      required: [true, 'Start location is required'],
    },
    destination: {
      type: pointSchema,
      required: [true, 'Destination is required'],
    },
    route: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Ride date is required'],
      index: true,
    },
    departureTime: {
      type: String, // HH:mm
      required: [true, 'Departure time is required'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total offered seats is required'],
      min: [1, 'Must offer at least 1 seat'],
      max: [8, 'Cannot exceed 8 seats'],
    },
    availableSeats: {
      type: Number,
      required: true,
      min: [0, 'Available seats cannot be negative'],
    },
    estimatedCost: {
      type: Number,
      required: [true, 'Estimated cost is required'],
      min: [0, 'Estimated cost cannot be negative'],
    },
    costBreakdown: {
      fuel: { type: Number, default: 0 },
      toll: { type: Number, default: 0 },
      parking: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: [
        'OPEN',
        'BOOKING',
        'CONFIRMED',
        'DRIVER_ARRIVING',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
      ],
      default: 'OPEN',
      index: true,
    },
    preferences: {
      music: { type: Boolean, default: true },
      smoking: { type: Boolean, default: false },
      petFriendly: { type: Boolean, default: false },
      ac: { type: Boolean, default: true },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
    shareToken: {
      type: String,
      default: null,
      index: true,
    },
    shareExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 2dsphere indexes for geospatial route similarity and proximity matching
rideSchema.index({ 'startLocation.coordinates': '2dsphere' });
rideSchema.index({ 'destination.coordinates': '2dsphere' });

// Compound indexes for searching and dashboard lookups
rideSchema.index({ date: 1, status: 1 });
rideSchema.index({ driver: 1, status: 1 });

export const Ride = mongoose.model('Ride', rideSchema);
