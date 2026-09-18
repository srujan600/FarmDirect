import { Router } from 'express';
import { ForecastController } from '../controllers/forecast.controller.js';

const router = Router();

router.get('/', ForecastController.getForecast);
router.get('/telemetry', ForecastController.getTelemetry);

export default router;
