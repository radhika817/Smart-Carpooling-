import express from 'express';
import * as userController from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', requireAuth, userController.getProfile);
router.get('/emergency-contacts', requireAuth, userController.getEmergencyContacts);
router.post('/emergency-contacts', requireAuth, userController.addEmergencyContact);
router.delete('/emergency-contacts/:contactId', requireAuth, userController.deleteEmergencyContact);
router.post('/verify', requireAuth, userController.updateVerification);
router.get('/:id', userController.getProfile);

export default router;
