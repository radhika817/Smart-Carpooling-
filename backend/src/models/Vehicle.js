import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vehicle owner is required'],
      index: true,
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['sedan', 'hatchback', 'suv', 'bike', 'other'],
      default: 'sedan',
    },
    seats: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: [1, 'Must have at least 1 seat'],
      max: [8, 'Cannot exceed 8 seats'],
      default: 4,
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80',
    },
  },
  {
    timestamps: true,
  }
);

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
