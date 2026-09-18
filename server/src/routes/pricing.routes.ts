/**
 * AgriDirect Pricing Routes
 * /api/v1/pricing
 */

import { Router } from 'express';
import { PricingController } from '../controllers/pricing.controller.js';

const router = Router();

// Dynamic Price Breakdown calculation
router.get('/calculate', PricingController.calculateBreakdown);

// Mandi & APMC benchmark spot prices
router.get('/mandi-benchmark', PricingController.getMandiBenchmarks);

export default router;
