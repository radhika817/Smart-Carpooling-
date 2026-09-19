import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
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
  { _id: false }
);

const carpoolGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
      index: true,
    },
    organization: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'member'],
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    origin: {
      type: pointSchema,
      default: () => ({ address: '', coordinates: [0, 0] }),
    },
    destination: {
      type: pointSchema,
      default: () => ({ address: '', coordinates: [0, 0] }),
    },
    scheduleDescription: {
      type: String,
      trim: true,
      default: '',
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    inviteCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

carpoolGroupSchema.index({ 'members.user': 1 });

export const CarpoolGroup = mongoose.model('CarpoolGroup', carpoolGroupSchema);
