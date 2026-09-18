import { Router } from 'express';
import { NotificationsController } from '../controllers/notifications.controller.js';

const router = Router();

router.get('/stream', NotificationsController.stream);
router.post('/broadcast', NotificationsController.broadcast);

export default router;
