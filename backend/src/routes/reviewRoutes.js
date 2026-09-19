import express from 'express';
import { z } from 'zod';
import * as reviewController from '../controllers/reviewController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const reviewSchema = z.object({
  rideId: z.string().min(1, 'Ride ID is required'),
  toUserId: z.string().min(1, 'Target user ID is required'),
  overall: z.number().min(1).max(5),
  punctuality: z.number().min(1).max(5),
  safety: z.number().min(1).max(5),
  behaviour: z.number().min(1).max(5),
  cleanliness: z.number().min(1).max(5),
  comment: z.string().max(1000).optional().default(''),
});

router.post('/', requireAuth, validate(reviewSchema), reviewController.createReview);
router.get('/user/:userId', reviewController.getUserReviews);
router.get('/ride/:rideId', reviewController.getRideReviews);

export default router;
