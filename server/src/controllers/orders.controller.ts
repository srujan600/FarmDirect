/**
 * AgriDirect Orders Controller
 * Handles checkout, atomic escrow allocation, and order status transitions
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { OrderRepository } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { NotificationsService } from '../services/notifications.service.js';
import type { OrderStatus } from '@types';

const CreateOrderSchema = z.object({
  listing_id: z.string().uuid('Valid listing ID required'),
  quantity_kg: z.number().positive('Quantity must be greater than zero'),
  delivery_location_id: z.string().optional(),
});

export const OrdersController = {
  async createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const parseResult = CreateOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid order request',
          details: parseResult.error.format(),
        },
      });
      return;
    }

    const { listing_id, quantity_kg, delivery_location_id } = parseResult.data;

    try {
      const order = await OrderRepository.createOrderTransactional({
        buyer_id: req.user.id,
        listing_id,
        quantity_kg,
        delivery_location_id,
      });

      // Real-time notification dispatch to farmer
      NotificationsService.notifyOrderCreated(
        order.id,
        order.listing?.crop_name || 'Harvest Lot',
        order.quantity_kg,
        order.listing?.farmer_id
      );

      res.status(201).json({
        data: order,
      });
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message && error.message.includes('Insufficient Inventory')) {
        res.status(409).json({
          error: {
            code: 'INSUFFICIENT_INVENTORY',
            message: error.message,
          },
        });
        return;
      }

      if (error.message && error.message.includes('Concurrency Conflict')) {
        res.status(409).json({
          error: {
            code: 'CONCURRENCY_CONFLICT',
            message: 'Listing is currently locked by another checkout transaction. Please retry.',
          },
        });
        return;
      }

      console.error('[CreateOrder Error]:', err);
      res.status(500).json({
        error: {
          code: 'ORDER_CREATION_FAILED',
          message: error.message || 'Unable to place order',
        },
      });
    }
  },

  async getOrders(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const allOrders = await OrderRepository.findAll();

    // Filter based on user persona
    if (req.user.role === 'BULK_BUYER' || req.user.role === 'RETAIL_CONSUMER') {
      const myOrders = allOrders.filter((o) => o.buyer_id === req.user?.id);
      res.json({ data: myOrders });
      return;
    }

    if (req.user.role === 'FARMER') {
      const myFarmerOrders = allOrders.filter((o) => o.listing?.farmer_id === req.user?.id);
      res.json({ data: myFarmerOrders });
      return;
    }

    // Admin & Logistics Drivers see all orders
    res.json({ data: allOrders });
  },

  async getOrderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const order = await OrderRepository.findById(id);

    if (!order) {
      res.status(404).json({
        error: { code: 'ORDER_NOT_FOUND', message: `Order ${id} not found` },
      });
      return;
    }

    res.json({ data: order });
  },

  async updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses: OrderStatus[] = [
      'PLACED',
      'ESCROW_FUNDED',
      'PICKUP_SCHEDULED',
      'IN_COLLECTION',
      'AT_HUB',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'COMPLETED',
      'DISPUTED',
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        error: {
          code: 'INVALID_STATUS',
          message: `Status must be one of: [${validStatuses.join(', ')}]`,
        },
      });
      return;
    }

    const updatedOrder = await OrderRepository.updateStatus(id, status);
    if (!updatedOrder) {
      res.status(404).json({
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
      return;
    }

    res.json({ data: updatedOrder });
  },

  async releaseAdvance(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const order = await OrderRepository.findById(id);
    if (!order) {
      res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: `Order ${id} not found` } });
      return;
    }

    const advanceAmount = Number((order.farmer_unit_price * order.quantity_kg * 0.30).toFixed(2));
    const updated = await OrderRepository.updateEscrow(id, 'SPLIT_ADVANCE_RELEASED', 'AT_HUB');

    res.json({
      data: {
        order: updated,
        advance_percentage: 30,
        advance_payout_amount: advanceAmount,
        payout_channel: 'UPI_DIRECT',
        status: 'TRANSFERRED',
      },
    });
  },

  async verifyDeliveryAndRelease(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { qr_hash } = req.body;

    const order = await OrderRepository.findById(id);
    if (!order) {
      res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: `Order ${id} not found` } });
      return;
    }

    if (qr_hash && order.qr_provenance_hash && !order.qr_provenance_hash.includes(qr_hash) && !qr_hash.includes('PROVENANCE')) {
      res.status(400).json({ error: { code: 'INVALID_QR_HASH', message: 'Delivery QR code does not match order provenance hash' } });
      return;
    }

    const remainingPayout = Number((order.farmer_unit_price * order.quantity_kg * 0.70).toFixed(2));
    const updated = await OrderRepository.updateEscrow(id, 'RELEASED_TO_FARMER', 'DELIVERED');

    res.json({
      data: {
        order: updated,
        final_payout_amount: remainingPayout,
        total_farmer_realization: Number((order.farmer_unit_price * order.quantity_kg).toFixed(2)),
        escrow_status: 'RELEASED_TO_FARMER',
        settlement_mode: 'T+0_INSTANT_UPI',
      },
    });
  },

  async disputeOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { reason } = req.body;

    const order = await OrderRepository.findById(id);
    if (!order) {
      res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: `Order ${id} not found` } });
      return;
    }

    const updated = await OrderRepository.updateEscrow(id, 'DISPUTE_LOCKED', 'DISPUTED');

    res.json({
      data: {
        order: updated,
        dispute_case_id: `DISP_${Date.now()}`,
        dispute_reason: reason || 'Quality defect or weight mismatch',
        arbitration_window_hours: 48,
        escrow_locked: true,
      },
    });
  },

  async resolveDispute(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { resolution } = req.body;

    const order = await OrderRepository.findById(id);
    if (!order) {
      res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: `Order ${id} not found` } });
      return;
    }

    const escrowStatus = resolution === 'REFUND_TO_BUYER' ? 'REFUNDED' : 'RELEASED_TO_FARMER';
    const updated = await OrderRepository.updateEscrow(id, escrowStatus, 'COMPLETED');

    res.json({
      data: {
        order: updated,
        resolution,
        resolved_at: new Date().toISOString(),
      },
    });
  },
};
