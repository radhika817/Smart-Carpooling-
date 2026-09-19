import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Strict security: all admin routes require authentication and role === 'admin'
router.use(requireAuth, requireRole('admin'));

router.get('/overview', adminController.getOverview);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/verification', adminController.updateUserVerification);

router.get('/rides', adminController.getRides);
router.post('/rides/:id/cancel', adminController.cancelRide);

router.get('/sos-alerts', adminController.getSosAlerts);
router.patch('/sos-alerts/:id/resolve', adminController.resolveSosAlert);

export default router;
