import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Never return password in queries by default
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    organization: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['passenger', 'driver', 'admin'],
      default: 'passenger',
    },
    rating: {
      average: {
        type: Number,
        default: 5.0,
        min: 1.0,
        max: 5.0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    ratingsBreakdown: {
      punctuality: {
        average: { type: Number, default: 5.0, min: 1.0, max: 5.0 },
        count: { type: Number, default: 0 },
      },
      safety: {
        average: { type: Number, default: 5.0, min: 1.0, max: 5.0 },
        count: { type: Number, default: 0 },
      },
      behaviour: {
        average: { type: Number, default: 5.0, min: 1.0, max: 5.0 },
        count: { type: Number, default: 0 },
      },
      cleanliness: {
        average: { type: Number, default: 5.0, min: 1.0, max: 5.0 },
        count: { type: Number, default: 0 },
      },
    },
    verificationStatus: {
      email: {
        type: Boolean,
        default: false,
      },
      phone: {
        type: Boolean,
        default: false,
      },
      organization: {
        type: Boolean,
        default: false,
      },
      govtId: {
        type: Boolean,
        default: false,
      },
    },
    govtIdDocument: {
      publicId: { type: String, default: '' },
      storageType: {
        type: String,
        enum: ['cloudinary', 'local', 'simulated_private'],
        default: 'local',
      },
      url: { type: String, default: '' },
      originalName: { type: String, default: '' },
      fileType: { type: String, default: '' },
      fileSize: { type: Number, default: 0 },
      uploadedAt: { type: Date, default: null },
    },
    emergencyContacts: [
      {
        name: {
          type: String,
          required: [true, 'Contact name is required'],
          trim: true,
        },
        phone: {
          type: String,
          required: [true, 'Contact phone is required'],
          trim: true,
        },
        relationship: {
          type: String,
          trim: true,
          default: 'Family',
        },
      },
    ],
    preferences: {
      smoking: {
        type: Boolean,
        default: false,
      },
      music: {
        type: Boolean,
        default: true,
      },
      petFriendly: {
        type: Boolean,
        default: false,
      },
      quietRide: {
        type: Boolean,
        default: false,
      },
    },
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspendedReason: {
      type: String,
      default: '',
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        ret.id = ret._id;
        ret.verificationStatus = {
          email: Boolean(ret.verificationStatus?.email),
          phone: Boolean(ret.verificationStatus?.phone),
          organization: Boolean(ret.verificationStatus?.organization),
          govtId: Boolean(ret.verificationStatus?.govtId),
        };
        return ret;
      },
    },
  }
);

userSchema.post('init', function (doc) {
  if (!doc.verificationStatus) {
    doc.verificationStatus = { email: false, phone: false, organization: false, govtId: false };
  } else {
    if (doc.verificationStatus.email === undefined) doc.verificationStatus.email = false;
    if (doc.verificationStatus.phone === undefined) doc.verificationStatus.phone = false;
    if (doc.verificationStatus.organization === undefined) doc.verificationStatus.organization = false;
    if (doc.verificationStatus.govtId === undefined) doc.verificationStatus.govtId = false;
  }
});

export const User = mongoose.model('User', userSchema);
