/**
 * AgriDirect Authentication & RBAC Middleware
 * Verifies JWT tokens and enforces role-based authorization guards
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../db/index.js';
import type { User, UserRole } from '@types';

const JWT_SECRET = process.env.JWT_SECRET || 'agridirect_super_secure_jwt_secret_key_2026_prod';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      phone_number: user.phone_number,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header. Bearer token required.',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: UserRole };
    const user = await UserRepository.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The user session is invalid or user has been removed.',
        },
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: unknown) {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'The provided authentication token is invalid or expired.',
      },
    });
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: UserRole };
    UserRepository.findById(decoded.id).then((user) => {
      if (user) req.user = user;
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before role verification.',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Role '${req.user.role}' lacks permission for this action. Required: [${allowedRoles.join(', ')}].`,
        },
      });
      return;
    }

    next();
  };
}
