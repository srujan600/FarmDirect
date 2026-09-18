import { Request, Response } from 'express';
import { LogisticsService } from '../services/logistics.service.js';

export class LogisticsController {
  /**
   * GET /api/v1/logistics/trips
   */
  static listTrips(req: Request, res: Response): void {
    const trips = LogisticsService.listTrips();
    res.status(200).json({
      data: trips,
    });
  }

  /**
   * GET /api/v1/logistics/trips/:id
   */
  static getTripById(req: Request, res: Response): void {
    const tripId = req.params.id as string;
    const trip = LogisticsService.getTripById(tripId);

    if (!trip) {
      res.status(404).json({
        error: {
          code: 'TRIP_NOT_FOUND',
          message: `Logistics trip ${tripId} not found`,
        },
      });
      return;
    }

    res.status(200).json({
      data: trip,
    });
  }

  /**
   * POST /api/v1/logistics/optimize
   * CVRPTW Solver Endpoint
   */
  static optimizeRoute(req: Request, res: Response): void {
    try {
      const { depot, vehicles, stops } = req.body;

      if (!depot || !stops || !Array.isArray(stops)) {
        res.status(400).json({
          error: {
            code: 'INVALID_REQUEST',
            message: 'Depot coordinates and stops array are required for CVRPTW optimization',
          },
        });
        return;
      }

      const result = LogisticsService.optimizeRoute({
        depot,
        vehicles: vehicles || [],
        stops,
      });

      res.status(200).json({
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'OPTIMIZATION_ERROR',
          message: err.message || 'Failed to solve route optimization problem',
        },
      });
    }
  }

  /**
   * PATCH /api/v1/logistics/trips/:id/telemetry
   */
  static updateTelemetry(req: Request, res: Response): void {
    try {
      const tripId = req.params.id as string;
      const { temperature_celsius, completed_stop_id, weight_verified_kg } = req.body;

      const updated = LogisticsService.updateTelemetry(tripId, {
        temperature_celsius,
        completed_stop_id,
        weight_verified_kg,
      });

      res.status(200).json({
        data: updated,
      });
    } catch (err: any) {
      res.status(404).json({
        error: {
          code: 'TRIP_NOT_FOUND',
          message: err.message,
        },
      });
    }
  }
}
