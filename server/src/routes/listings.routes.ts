/**
 * AgriDirect Farmer Listings Routes
 * /api/v1/listings
 */

import { Router } from 'express';
import { ListingsController } from '../controllers/listings.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';

const router = Router();

// Farmer & FPO authenticated endpoints
router.post(
  '/',
  authenticateJWT,
  requireRole('FARMER', 'FPO_ADMIN'),
  ListingsController.createListing
);

router.get(
  '/my-listings',
  authenticateJWT,
  requireRole('FARMER', 'FPO_ADMIN'),
  ListingsController.getMyListings
);

// Public / detail lookup
router.get('/:id', ListingsController.getListingById);

// Owner / Admin status update
router.patch(
  '/:id/status',
  authenticateJWT,
  requireRole('FARMER', 'FPO_ADMIN', 'GOVT_ADMIN'),
  ListingsController.updateListingStatus
);

export default router;
