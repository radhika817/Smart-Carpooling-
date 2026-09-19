import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/personal', analyticsController.getPersonalAnalytics);
router.get('/admin', analyticsController.getAdminAnalytics);

export default router;
