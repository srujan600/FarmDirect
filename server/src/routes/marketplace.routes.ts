/**
 * AgriDirect Marketplace Catalog Routes
 * /api/v1/marketplace
 */

import { Router } from 'express';
import { ListingsController } from '../controllers/listings.controller.js';

const router = Router();

// Public marketplace browsing & filtering
router.get('/listings', ListingsController.getMarketplaceListings);
router.get('/listings/:id', ListingsController.getListingById);

export default router;
