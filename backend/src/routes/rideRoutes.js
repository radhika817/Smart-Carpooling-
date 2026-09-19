import { Router } from 'express';
import * as rideController from '../controllers/rideController.js';
import * as bookingController from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Search endpoint (open for public/passenger discovery)
router.get('/search', rideController.searchRides);

// List rides
router.get('/', rideController.listRides);

// Specific ride details
router.get('/:id', rideController.getRide);

// Ride creation & mutations (require driver authentication)
router.post('/', requireAuth, validate(rideController.createRideSchema), rideController.createRide);
router.put('/:id', requireAuth, validate(rideController.updateRideSchema), rideController.updateRide);
router.delete('/:id', requireAuth, rideController.deleteRide);
router.post('/:id/start', requireAuth, rideController.startRide);
router.post('/:id/complete', requireAuth, rideController.completeRide);

// Booking a seat on a ride (/api/rides/:id/book per §6 API contract)
router.post('/:id/book', requireAuth, validate(bookingController.bookSeatSchema), bookingController.bookSeat);

export default router;
