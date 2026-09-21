import { Router } from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', bookingController.getMyBookings);
router.get('/driver', bookingController.getDriverBookings);
router.post('/:id/accept', bookingController.acceptBooking);
router.post('/:id/reject', bookingController.rejectBooking);
router.post('/:id/cancel', bookingController.cancelBooking);
router.patch('/:id/mark-paid', bookingController.markPaid);

export default router;
