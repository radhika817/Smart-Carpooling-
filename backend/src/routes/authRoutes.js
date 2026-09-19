import express from 'express';
import { z } from 'zod';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please provide a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
  phone: z.string().trim().optional().or(z.literal('')),
  organization: z.string().trim().optional().or(z.literal('')),
  role: z.enum(['passenger', 'driver', 'admin']).optional().default('passenger'),
  preferences: z
    .object({
      smoking: z.boolean().optional(),
      music: z.boolean().optional(),
      petFriendly: z.boolean().optional(),
      quietRide: z.boolean().optional(),
    })
    .optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.getMe);

export default router;
