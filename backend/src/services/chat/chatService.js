import { Message } from '../../models/Message.js';
import { Ride } from '../../models/Ride.js';
import { Booking } from '../../models/Booking.js';
import { User } from '../../models/User.js';

/**
 * Check if a user is an active participant in the ride (driver or confirmed/pending passenger)
 */
export const verifyParticipant = async (rideId, userId) => {
  const ride = await Ride.findById(rideId);
  if (!ride) {
    const error = new Error('Ride not found');
    error.statusCode = 404;
    throw error;
  }

  if (ride.driver.toString() === userId.toString()) {
    return { isParticipant: true, role: 'driver', ride };
  }

  const booking = await Booking.findOne({
    ride: rideId,
    passenger: userId,
    status: { $in: ['CONFIRMED', 'PENDING'] },
  });

  if (booking) {
    return { isParticipant: true, role: 'passenger', ride, booking };
  }

  return { isParticipant: false, role: null, ride };
};

/**
 * Retrieve chronological chat history for a ride
 */
export const getRideMessages = async (rideId, userId) => {
  const { isParticipant } = await verifyParticipant(rideId, userId);
  if (!isParticipant) {
    const error = new Error('Forbidden: You are not a participant in this ride.');
    error.statusCode = 403;
    throw error;
  }

  return await Message.find({ ride: rideId }).sort({ createdAt: 1 }).lean();
};

/**
 * Persist a chat message to MongoDB
 */
export const saveMessage = async ({ rideId, senderId, senderName, senderRole, text }) => {
  if (!text || !text.trim()) {
    throw new Error('Message text cannot be empty');
  }

  const message = await Message.create({
    ride: rideId,
    sender: senderId,
    senderName: senderName || 'User',
    senderRole: senderRole || 'passenger',
    text: text.trim(),
  });

  return message;
};
