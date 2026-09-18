import { Router } from 'express';
import { ProvenanceController } from '../controllers/provenance.controller.js';

const router = Router();

router.get('/sample', ProvenanceController.getSample);
router.get('/verify/:hash', ProvenanceController.verify);

export default router;
