/**
 * AgriDirect Auth Routes
 * /api/v1/auth
 */

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateJWT, requireRole } from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/me', authenticateJWT, AuthController.getMe);

// Admin-only user list inspection
router.get(
  '/users',
  authenticateJWT,
  requireRole('GOVT_ADMIN'),
  AuthController.listUsers
);

export default router;
