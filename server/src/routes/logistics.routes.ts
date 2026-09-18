import { Router } from 'express';
import { LogisticsController } from '../controllers/logistics.controller.js';

const router = Router();

router.get('/trips', LogisticsController.listTrips);
router.get('/trips/:id', LogisticsController.getTripById);
router.post('/optimize', LogisticsController.optimizeRoute);
router.patch('/trips/:id/telemetry', LogisticsController.updateTelemetry);

export default router;
