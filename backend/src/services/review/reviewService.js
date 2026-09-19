import { Review } from '../../models/Review.js';
import { Ride } from '../../models/Ride.js';
import { User } from '../../models/User.js';
import { Booking } from '../../models/Booking.js';

/**
 * Creates a post-ride rating with 5-category breakdown and recalculates the recipient's profile score.
 */
export const createReview = async ({
  rideId,
  fromUserId,
  toUserId,
  overall,
  punctuality,
  safety,
  behaviour,
  cleanliness,
  comment = '',
}) => {
  // 1. Guardrail: Cannot rate oneself
  if (fromUserId.toString() === toUserId.toString()) {
    const error = new Error('You cannot review yourself');
    error.statusCode = 400;
    throw error;
  }

  // 2. Guardrail: Ride must exist and be COMPLETED
  const ride = await Ride.findById(rideId);
  if (!ride) {
    const error = new Error('Ride not found');
    error.statusCode = 404;
    throw error;
  }

  if (ride.status !== 'COMPLETED') {
    const error = new Error(
      `Ratings can only be submitted for completed rides (current status: ${ride.status})`
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Guardrail: Both users must have been confirmed participants in the ride
  const isFromDriver = ride.driver.toString() === fromUserId.toString();
  const isToDriver = ride.driver.toString() === toUserId.toString();

  let isFromPassenger = false;
  let isToPassenger = false;

  if (!isFromDriver) {
    const b = await Booking.findOne({ ride: rideId, passenger: fromUserId });
    if (b) isFromPassenger = true;
  }

  if (!isToDriver) {
    const b = await Booking.findOne({ ride: rideId, passenger: toUserId });
    if (b) isToPassenger = true;
  }

  const validReview =
    (isFromDriver && isToPassenger) || (isFromPassenger && isToDriver);

  if (!validReview) {
    const error = new Error(
      'Forbidden: Ratings can only be exchanged between the driver and a passenger of this ride'
    );
    error.statusCode = 403;
    throw error;
  }

  const role = isFromDriver ? 'driver_to_passenger' : 'passenger_to_driver';

  // 4. Guardrail: Check for existing duplicate review
  const existingReview = await Review.findOne({
    ride: rideId,
    fromUser: fromUserId,
    toUser: toUserId,
  });

  if (existingReview) {
    const error = new Error('You have already submitted a review for this participant on this ride');
    error.statusCode = 409;
    throw error;
  }

  // 5. Create Review
  const review = await Review.create({
    ride: rideId,
    fromUser: fromUserId,
    toUser: toUserId,
    role,
    overall: Number(overall),
    punctuality: Number(punctuality),
    safety: Number(safety),
    behaviour: Number(behaviour),
    cleanliness: Number(cleanliness),
    comment: comment.trim(),
  });

  // 6. Recalculate recipient's aggregate profile ratings across all reviews received
  const recipientReviews = await Review.find({ toUser: toUserId });
  const count = recipientReviews.length;

  const round1 = (num) => Math.round(num * 10) / 10;

  const avgOverall = round1(
    recipientReviews.reduce((acc, r) => acc + r.overall, 0) / count
  );
  const avgPunctuality = round1(
    recipientReviews.reduce((acc, r) => acc + r.punctuality, 0) / count
  );
  const avgSafety = round1(
    recipientReviews.reduce((acc, r) => acc + r.safety, 0) / count
  );
  const avgBehaviour = round1(
    recipientReviews.reduce((acc, r) => acc + r.behaviour, 0) / count
  );
  const avgCleanliness = round1(
    recipientReviews.reduce((acc, r) => acc + r.cleanliness, 0) / count
  );

  const updatedRecipient = await User.findByIdAndUpdate(
    toUserId,
    {
      rating: {
        average: avgOverall,
        count,
      },
      ratingsBreakdown: {
        punctuality: { average: avgPunctuality, count },
        safety: { average: avgSafety, count },
        behaviour: { average: avgBehaviour, count },
        cleanliness: { average: avgCleanliness, count },
      },
    },
    { new: true }
  ).select('name email rating ratingsBreakdown');

  return {
    review,
    recipientRating: {
      userId: toUserId,
      average: avgOverall,
      count,
      breakdown: updatedRecipient?.ratingsBreakdown,
    },
  };
};

/**
 * Fetches all reviews and ratings received by a specific user.
 */
export const getUserReviews = async (userId) => {
  const reviews = await Review.find({ toUser: userId })
    .populate('fromUser', 'name role profileImage')
    .populate('ride', 'date startLocation destination')
    .sort({ createdAt: -1 });

  return reviews;
};

/**
 * Fetches all reviews submitted for a specific ride.
 */
export const getRideReviews = async (rideId) => {
  const reviews = await Review.find({ ride: rideId })
    .populate('fromUser', 'name role')
    .populate('toUser', 'name role')
    .sort({ createdAt: -1 });

  return reviews;
};
