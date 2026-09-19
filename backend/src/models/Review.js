import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'Ride reference is required for review'],
      index: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer user reference is required'],
      index: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient user reference is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['driver_to_passenger', 'passenger_to_driver'],
      required: true,
    },
    overall: {
      type: Number,
      required: [true, 'Overall rating (1-5) is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    punctuality: {
      type: Number,
      required: [true, 'Punctuality rating (1-5) is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    safety: {
      type: Number,
      required: [true, 'Safety rating (1-5) is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    behaviour: {
      type: Number,
      required: [true, 'Behaviour rating (1-5) is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    cleanliness: {
      type: Number,
      required: [true, 'Cleanliness rating (1-5) is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate review for the same ride from the same reviewer to the same recipient
reviewSchema.index({ ride: 1, fromUser: 1, toUser: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
