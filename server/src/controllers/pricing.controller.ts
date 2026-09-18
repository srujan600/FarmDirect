/**
 * AgriDirect Pricing Controller
 * Exposes dynamic transparent pricing calculations and live Mandi benchmark ticker
 */

import { Request, Response } from 'express';
import { PricingEngine, mandiPriceProvider } from '../services/pricing.service.js';

export const PricingController = {
  calculateBreakdown(req: Request, res: Response): void {
    const farmerPriceStr = req.query.farmer_price as string | undefined;
    const consumerPriceStr = req.query.consumer_price as string | undefined;
    const quantityStr = req.query.quantity_kg as string | undefined;

    const quantity_kg = quantityStr ? parseFloat(quantityStr) : 1.0;

    if (farmerPriceStr) {
      const farmer_price = parseFloat(farmerPriceStr);
      if (isNaN(farmer_price) || farmer_price <= 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_PRICE',
            message: 'farmer_price must be a positive numeric value',
          },
        });
        return;
      }

      const breakdown = PricingEngine.calculateFromFarmerPrice(farmer_price, quantity_kg);
      res.json({ data: breakdown });
      return;
    }

    if (consumerPriceStr) {
      const consumer_price = parseFloat(consumerPriceStr);
      if (isNaN(consumer_price) || consumer_price <= 0) {
        res.status(400).json({
          error: {
            code: 'INVALID_PRICE',
            message: 'consumer_price must be a positive numeric value',
          },
        });
        return;
      }

      const breakdown = PricingEngine.calculateFromConsumerPrice(consumer_price, quantity_kg);
      res.json({ data: breakdown });
      return;
    }

    // Default simulation fallback (standard ₹50/kg Stitch anchor)
    const breakdown = PricingEngine.calculateFromConsumerPrice(50.0, quantity_kg);
    res.json({ data: breakdown });
  },

  async getMandiBenchmarks(req: Request, res: Response): Promise<void> {
    const quotes = await mandiPriceProvider.getQuotes();
    res.json({
      data: quotes,
    });
  },
};
