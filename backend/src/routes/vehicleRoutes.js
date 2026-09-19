import { Router } from 'express';
import * as vehicleController from '../controllers/vehicleController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.post('/', validate(vehicleController.createVehicleSchema), vehicleController.createVehicle);
router.get('/', vehicleController.getMyVehicles);
router.put('/:id', validate(vehicleController.updateVehicleSchema), vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

export default router;
