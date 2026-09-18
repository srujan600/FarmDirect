import { Request, Response } from 'express';
import { ForecastService } from '../services/forecast.service.js';

export class ForecastController {
  /**
   * GET /api/v1/forecasts
   * Query: crop (optional), district (optional)
   */
  static getForecast(req: Request, res: Response): void {
    const crop = (req.query.crop as string) || 'Tomato';
    const district = (req.query.district as string) || 'Nashik';

    const forecast = ForecastService.getForecast(crop, district);
    res.status(200).json({
      data: forecast,
    });
  }

  /**
   * GET /api/v1/forecasts/telemetry
   * Query: district (optional)
   */
  static getTelemetry(req: Request, res: Response): void {
    const district = (req.query.district as string) || 'Nashik';

    const telemetry = ForecastService.getTelemetry(district);
    res.status(200).json({
      data: telemetry,
    });
  }
}
