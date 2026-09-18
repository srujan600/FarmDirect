/**
 * AgriDirect Orders Routes
 * /api/v1/orders
 */

import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';

const router = Router();

// Create order (Buyers only)
router.post(
  '/',
  authenticateJWT,
  requireRole('BULK_BUYER', 'RETAIL_CONSUMER'),
  OrdersController.createOrder
);

// View orders (Role-filtered)
router.get('/', authenticateJWT, OrdersController.getOrders);
router.get('/:id', authenticateJWT, OrdersController.getOrderById);

// Update order status (Logistics drivers & Admins)
router.patch(
  '/:id/status',
  authenticateJWT,
  requireRole('LOGISTICS_DRIVER', 'GOVT_ADMIN'),
  OrdersController.updateOrderStatus
);

// Escrow Protection & Split Payouts
router.post(
  '/:id/release-advance',
  authenticateJWT,
  requireRole('FPO_ADMIN', 'GOVT_ADMIN'),
  OrdersController.releaseAdvance
);

router.post(
  '/:id/verify-delivery',
  authenticateJWT,
  requireRole('RETAIL_CONSUMER', 'BULK_BUYER', 'LOGISTICS_DRIVER', 'GOVT_ADMIN'),
  OrdersController.verifyDeliveryAndRelease
);

router.post(
  '/:id/dispute',
  authenticateJWT,
  requireRole('RETAIL_CONSUMER', 'BULK_BUYER'),
  OrdersController.disputeOrder
);

router.post(
  '/:id/resolve-dispute',
  authenticateJWT,
  requireRole('GOVT_ADMIN', 'FPO_ADMIN'),
  OrdersController.resolveDispute
);

export default router;
