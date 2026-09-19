import * as reviewService from '../services/review/reviewService.js';

export const createReview = async (req, res, next) => {
  try {
    const fromUserId = req.user._id || req.user.id;
    const {
      rideId,
      toUserId,
      overall,
      punctuality,
      safety,
      behaviour,
      cleanliness,
      comment,
    } = req.body;

    const result = await reviewService.createReview({
      rideId,
      fromUserId,
      toUserId,
      overall,
      punctuality,
      safety,
      behaviour,
      cleanliness,
      comment,
    });

    return res.status(201).json({
      success: true,
      message: 'Post-ride rating and review submitted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const reviews = await reviewService.getUserReviews(userId);

    return res.status(200).json({
      success: true,
      data: { reviews },
    });
  } catch (error) {
    next(error);
  }
};

export const getRideReviews = async (req, res, next) => {
  try {
    const { rideId } = req.params;
    const reviews = await reviewService.getRideReviews(rideId);

    return res.status(200).json({
      success: true,
      data: { reviews },
    });
  } catch (error) {
    next(error);
  }
};
