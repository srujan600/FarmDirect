import { Request, Response } from 'express';
import { NotificationsService } from '../services/notifications.service.js';
import type { UserRole, NotificationEventType } from '@types';

export class NotificationsController {
  /**
   * GET /api/v1/notifications/stream
   * Persistent SSE connection for live notifications
   */
  static stream(req: Request, res: Response): void {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const userId = req.query.userId as string | undefined;
    const role = req.query.role as UserRole | undefined;

    NotificationsService.addClient(res, userId, role);
  }

  /**
   * POST /api/v1/notifications/broadcast
   * Broadcast or targeted notification trigger
   */
  static broadcast(req: Request, res: Response): void {
    const { type, title, message, target_role, target_user_id, payload } = req.body;

    if (!type || !title || !message) {
      res.status(400).json({
        error: {
          code: 'INVALID_NOTIFICATION',
          message: 'type, title, and message are required fields',
        },
      });
      return;
    }

    const count = NotificationsService.dispatch({
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: type as NotificationEventType,
      title,
      message,
      target_role: target_role as UserRole | undefined,
      target_user_id,
      payload: payload || {},
      created_at: new Date().toISOString(),
    });

    res.status(200).json({
      data: {
        dispatched: true,
        clients_reached: count,
      },
    });
  }
}
