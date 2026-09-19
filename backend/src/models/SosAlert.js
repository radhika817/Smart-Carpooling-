import mongoose from 'mongoose';

const sosAlertSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'Ride reference is required for SOS alert'],
      index: true,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User who triggered SOS is required'],
      index: true,
    },
    userRole: {
      type: String,
      enum: ['driver', 'passenger'],
      required: true,
    },
    location: {
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      address: {
        type: String,
        default: '',
        trim: true,
      },
    },
    notifiedContacts: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        relationship: { type: String, default: 'Family' },
        sentAt: { type: Date, default: Date.now },
        status: { type: String, default: 'DELIVERED_SIMULATED' },
      },
    ],
    emergencyServices: [
      {
        agency: { type: String, required: true },
        dial: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'RESOLVED'],
      default: 'ACTIVE',
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const SosAlert = mongoose.model('SosAlert', sosAlertSchema);
