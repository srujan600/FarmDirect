/**
 * AgriDirect Auth Controller
 * Handles user registration, persona login, and session validation
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { UserRepository } from '../db/index.js';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.js';
import type { UserRole, PreferredLanguage } from '@types';

// Zod Validation Schemas
const RegisterSchema = z.object({
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum([
    'FARMER',
    'FPO_ADMIN',
    'BULK_BUYER',
    'RETAIL_CONSUMER',
    'LOGISTICS_DRIVER',
    'GOVT_ADMIN',
  ]),
  preferred_language: z.enum(['en', 'hi', 'mr', 'te', 'kn', 'pa']).default('hi'),
  aadhaar_hash: z.string().optional(),
  upi_id: z.string().optional(),
});

const LoginSchema = z.object({
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
  role: z
    .enum([
      'FARMER',
      'FPO_ADMIN',
      'BULK_BUYER',
      'RETAIL_CONSUMER',
      'LOGISTICS_DRIVER',
      'GOVT_ADMIN',
    ])
    .optional(),
});

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration input',
          details: parseResult.error.format(),
        },
      });
      return;
    }

    const { phone_number, full_name, role, preferred_language, aadhaar_hash, upi_id } =
      parseResult.data;

    const existingUser = await UserRepository.findByPhone(phone_number);
    if (existingUser) {
      res.status(409).json({
        error: {
          code: 'USER_ALREADY_EXISTS',
          message: `A user with phone number ${phone_number} is already registered.`,
        },
      });
      return;
    }

    const newUser = await UserRepository.create({
      phone_number,
      full_name,
      role: role as UserRole,
      preferred_language: preferred_language as PreferredLanguage,
      aadhaar_hash: aadhaar_hash || null,
      upi_id: upi_id || null,
    });

    const token = generateToken(newUser);

    res.status(201).json({
      data: {
        user: newUser,
        token,
      },
    });
  },

  async login(req: Request, res: Response): Promise<void> {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login parameters',
          details: parseResult.error.format(),
        },
      });
      return;
    }

    const { phone_number, role } = parseResult.data;

    let user = await UserRepository.findByPhone(phone_number);

    // If role is specified and user doesn't exist yet, create a default persona profile for the role
    if (!user && role) {
      const defaultNames: Record<UserRole, string> = {
        FARMER: 'Kisan Balasaheb',
        FPO_ADMIN: 'Sahyadri FPO Lead',
        BULK_BUYER: 'Procurement Director',
        RETAIL_CONSUMER: 'Fresh Grahak',
        LOGISTICS_DRIVER: 'Reefer Driver',
        GOVT_ADMIN: 'DoCA Market Officer',
      };

      user = await UserRepository.create({
        phone_number,
        full_name: defaultNames[role],
        role,
        preferred_language: 'mr',
      });
    }

    if (!user) {
      res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: `No account found with phone number ${phone_number}. Please register first.`,
        },
      });
      return;
    }

    const token = generateToken(user);

    res.json({
      data: {
        user,
        token,
      },
    });
  },

  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User session not found',
        },
      });
      return;
    }

    res.json({
      data: req.user,
    });
  },

  async listUsers(req: Request, res: Response): Promise<void> {
    const users = await UserRepository.getAll();
    res.json({
      data: users,
    });
  },
};
