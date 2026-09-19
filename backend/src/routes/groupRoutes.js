import express from 'express';
import * as groupController from '../controllers/groupController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', groupController.createGroup);
router.get('/', groupController.listGroups);
router.post('/join-by-code', groupController.joinByCode);

router.get('/:id', groupController.getGroup);
router.post('/:id/join', groupController.joinGroup);
router.post('/:id/leave', groupController.leaveGroup);
router.get('/:id/rides', groupController.getGroupRides);

export default router;
