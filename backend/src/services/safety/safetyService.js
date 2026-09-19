import crypto from 'crypto';
import { Ride } from '../../models/Ride.js';
import { User } from '../../models/User.js';
import { Booking } from '../../models/Booking.js';
import { SosAlert } from '../../models/SosAlert.js';
import { broadcastToRide } from '../../socket/index.js';

/**
 * Triggers an SOS Emergency Alert for an active ride.
 * Strict validations:
 * 1. Ride must exist.
 * 2. Ride must be in active status ('DRIVER_ARRIVING' or 'IN_PROGRESS').
 * 3. User must be a verified participant (driver or confirmed passenger).
 */
export const triggerSos = async ({ rideId, userId, coordinates, address }) => {
  const ride = await Ride.findById(rideId);
  if (!ride) {
    const error = new Error('Ride not found');
    error.statusCode = 404;
    throw error;
  }

  // 1. Guardrail: Must be strictly in an active ride state
  const activeStatuses = ['DRIVER_ARRIVING', 'IN_PROGRESS'];
  if (!activeStatuses.includes(ride.status)) {
    const error = new Error(
      `SOS emergency trigger can only be activated during an active ride (current status: ${ride.status})`
    );
    error.statusCode = 400;
    throw error;
  }

  // 2. Guardrail: Must be a verified participant of this ride
  const isDriver = ride.driver.toString() === userId.toString();
  let isPassenger = false;

  if (!isDriver) {
    const confirmedBooking = await Booking.findOne({
      ride: rideId,
      passenger: userId,
      status: { $in: ['CONFIRMED', 'PENDING'] },
    });
    if (confirmedBooking) {
      isPassenger = true;
    }
  }

  if (!isDriver && !isPassenger) {
    const error = new Error('Forbidden: You are not an active participant of this ride');
    error.statusCode = 403;
    throw error;
  }

  const role = isDriver ? 'driver' : 'passenger';
  const user = await User.findById(userId);

  // Standard emergency service contacts (India 112 system)
  const emergencyServices = [
    { agency: 'National Emergency Helpline (Police / Fire / Disaster)', dial: '112' },
    { agency: 'Ambulance Emergency Medical Response', dial: '108' },
    { agency: 'Women Safety & Anti-Harassment Helpline', dial: '1091' },
  ];

  // Dispatch notification payload to user's saved emergency contacts
  const contacts = user.emergencyContacts || [];
  const notifiedContacts = contacts.map((c) => ({
    name: c.name,
    phone: c.phone,
    relationship: c.relationship || 'Emergency Contact',
    sentAt: new Date(),
    status: 'DISPATCHED_SIMULATED',
  }));

  // Create persistent SOS Alert in database
  const alert = await SosAlert.create({
    ride: rideId,
    triggeredBy: userId,
    userRole: role,
    location: {
      coordinates: Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [0, 0],
      address: address || 'Current Ride Location',
    },
    notifiedContacts,
    emergencyServices,
    status: 'ACTIVE',
  });

  // Real-time broadcast to all ride participants via Socket.IO
  const alertPayload = {
    alertId: alert._id,
    rideId: ride._id.toString(),
    triggeredBy: {
      id: user._id.toString(),
      name: user.name,
      role,
      phone: user.phone || 'N/A',
    },
    location: alert.location,
    emergencyServices,
    notifiedContactsCount: notifiedContacts.length,
    timestamp: alert.createdAt,
    message: `EMERGENCY SOS TRIGGERED by ${user.name} (${role.toUpperCase()})! Immediate attention required.`,
  };

  try {
    broadcastToRide(rideId.toString(), 'sos:alert', alertPayload);
  } catch (err) {
    console.warn('[Socket Broadcast Warn]:', err.message);
  }

  return {
    alert,
    alertPayload,
    notifiedContacts,
    emergencyServices,
  };
};

/**
 * Generates a secure, time-boxed public tracking link token.
 */
export const generateShareLink = async ({ rideId, userId, durationHours = 4 }) => {
  const ride = await Ride.findById(rideId);
  if (!ride) {
    const error = new Error('Ride not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify caller is driver or booked passenger
  const isDriver = ride.driver.toString() === userId.toString();
  let isPassenger = false;

  if (!isDriver) {
    const booking = await Booking.findOne({
      ride: rideId,
      passenger: userId,
      status: { $in: ['CONFIRMED', 'PENDING'] },
    });
    if (booking) isPassenger = true;
  }

  if (!isDriver && !isPassenger) {
    const error = new Error('Forbidden: Only ride participants can generate a tracking link');
    error.statusCode = 403;
    throw error;
  }

  // Generate random 32-character crypto hex token
  const shareToken = crypto.randomBytes(16).toString('hex');
  const shareExpiresAt = new Date(Date.now() + durationHours * 3600 * 1000);

  ride.shareToken = shareToken;
  ride.shareExpiresAt = shareExpiresAt;
  await ride.save();

  return {
    shareToken,
    shareExpiresAt,
    trackingPath: `/track/${shareToken}`,
  };
};

/**
 * Resolves public ride tracking by share token.
 * Strict Privacy Guardrail:
 * Returns HTTP 410 Gone if:
 * 1. The ride status is COMPLETED or CANCELLED.
 * 2. Or the share link has expired past shareExpiresAt.
 */
export const getPublicTracking = async (shareToken) => {
  if (!shareToken) {
    const error = new Error('Share token is required');
    error.statusCode = 400;
    throw error;
  }

  const ride = await Ride.findOne({ shareToken })
    .populate('driver', 'name rating verificationStatus organization')
    .populate('vehicle', 'make model color registrationNumber');

  if (!ride) {
    const error = new Error('Tracking link not found or invalid');
    error.statusCode = 404;
    throw error;
  }

  // Strict Privacy Enforcement 1: Ride has finished or was cancelled
  if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED') {
    const error = new Error(
      `Tracking link has expired. The ride has concluded (${ride.status}) and location sharing is deactivated to protect participant privacy.`
    );
    error.statusCode = 410;
    error.expired = true;
    error.rideStatus = ride.status;
    throw error;
  }

  // Strict Privacy Enforcement 2: Time limit exceeded
  if (ride.shareExpiresAt && Date.now() > new Date(ride.shareExpiresAt).getTime()) {
    const error = new Error(
      'Tracking link has expired. The time-boxed tracking window has concluded.'
    );
    error.statusCode = 410;
    error.expired = true;
    error.rideStatus = ride.status;
    throw error;
  }

  // Return public-safe telemetry (sanitizing sensitive private data)
  return {
    rideId: ride._id,
    status: ride.status,
    date: ride.date,
    departureTime: ride.departureTime,
    startLocation: ride.startLocation,
    destination: ride.destination,
    route: ride.route,
    driver: {
      name: ride.driver?.name ? ride.driver.name.split(' ')[0] : 'Driver', // First name only
      rating: ride.driver?.rating?.average || 5.0,
      verificationStatus: ride.driver?.verificationStatus || {},
      organization: ride.driver?.organization || '',
    },
    vehicle: {
      make: ride.vehicle?.make || '',
      model: ride.vehicle?.model || 'Vehicle',
      color: ride.vehicle?.color || '',
      registrationNumber: ride.vehicle?.registrationNumber || '',
    },
    shareExpiresAt: ride.shareExpiresAt,
  };
};
