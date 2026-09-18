/**
 * AgriDirect Real-Time Notifications & Server-Sent Events (SSE) Engine
 * Manages persistent client event streams, heartbeats, and persona-targeted event dispatching
 */

import { Response } from 'express';
import type { AppNotification, NotificationEventType, UserRole } from '../../../types/index.js';

interface ClientConnection {
  id: string;
  res: Response;
  userId?: string;
  role?: UserRole;
  connectedAt: string;
}

export class NotificationsService {
  private static clients: Map<string, ClientConnection> = new Map();
  private static heartbeatInterval: NodeJS.Timeout | null = null;

  static {
    // Keep-alive heartbeat ping every 25 seconds
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 25000);

    // Prevent interval from keeping the process alive in tests
    if (this.heartbeatInterval.unref) {
      this.heartbeatInterval.unref();
    }
  }

  /**
   * Register a new SSE stream client
   */
  static addClient(res: Response, userId?: string, role?: UserRole): string {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const connection: ClientConnection = {
      id: clientId,
      res,
      userId,
      role,
      connectedAt: new Date().toISOString(),
    };

    this.clients.set(clientId, connection);

    // Send initial handshake event
    this.sendToClient(connection, {
      id: `handshake_${Date.now()}`,
      type: 'PRICE_ALERT',
      title: 'AgriDirect Telemetry Stream Connected',
      message: `Real-time channel active (Role: ${role || 'ANONYMOUS'})`,
      target_user_id: userId,
      target_role: role,
      created_at: new Date().toISOString(),
    });

    res.on('close', () => {
      this.clients.delete(clientId);
    });

    return clientId;
  }

  /**
   * Dispatches an event to all matching connections
   */
  static dispatch(notification: AppNotification): number {
    let sentCount = 0;

    for (const client of this.clients.values()) {
      // If target user specified, match user
      if (notification.target_user_id && client.userId !== notification.target_user_id) {
        continue;
      }

      // If target role specified, match role
      if (notification.target_role && client.role !== notification.target_role) {
        continue;
      }

      this.sendToClient(client, notification);
      sentCount++;
    }

    return sentCount;
  }

  /**
   * Helper: order created event
   */
  static notifyOrderCreated(orderId: string, cropName: string, quantityKg: number, farmerId?: string) {
    return this.dispatch({
      id: `notif_order_${Date.now()}`,
      type: 'ORDER_CREATED',
      title: 'New Harvest Order Placed!',
      message: `Direct order placed for ${quantityKg}kg ${cropName}. Escrow funded via UPI.`,
      target_user_id: farmerId,
      payload: { order_id: orderId, crop_name: cropName, quantity_kg: quantityKg },
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Helper: reefer temperature alert
   */
  static notifyTemperatureAlert(vehicleReg: string, tempCelsius: number) {
    return this.dispatch({
      id: `notif_temp_${Date.now()}`,
      type: 'TEMPERATURE_ALERT',
      title: 'Cold-Chain Telemetry Alert',
      message: `Vehicle ${vehicleReg} temperature is ${tempCelsius}°C. Active cooling lock verified.`,
      target_role: 'LOGISTICS_DRIVER',
      payload: { vehicle_reg: vehicleReg, temperature_celsius: tempCelsius },
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Helper: regional price spike / deficit surge
   */
  static notifyPriceSpike(cropName: string, district: string, surgePct: number) {
    return this.dispatch({
      id: `notif_surge_${Date.now()}`,
      type: 'PRICE_ALERT',
      title: `Surge Alert: +${surgePct}% for ${cropName}`,
      message: `Urban demand deficit detected in ${district}. Direct dispatch priority enabled.`,
      target_role: 'FARMER',
      payload: { crop_name: cropName, district, surge_percentage: surgePct },
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Internal: write SSE formatted message
   */
  private static sendToClient(client: ClientConnection, notification: AppNotification) {
    try {
      client.res.write(`event: ${notification.type}\n`);
      client.res.write(`data: ${JSON.stringify(notification)}\n\n`);
    } catch {
      this.clients.delete(client.id);
    }
  }

  /**
   * Internal: send keep-alive comment
   */
  private static sendHeartbeat() {
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(`: heartbeat ${new Date().toISOString()}\n\n`);
      } catch {
        this.clients.delete(id);
      }
    }
  }

  static getActiveClientCount(): number {
    return this.clients.size;
  }
}
