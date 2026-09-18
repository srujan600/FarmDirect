/**
 * AgriDirect Listings Controller
 * Handles farmer crop listing creation, idempotency, updates, and marketplace catalog
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { ListingRepository, LocationRepository } from '../db/index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import type { CropCategory, ListingStatus } from '@types';

const CreateListingSchema = z.object({
  category: z.enum(['GRAINS', 'PULSES', 'VEGETABLES', 'FRUITS', 'OILSEEDS', 'SPICES']),
  crop_name: z.string().min(2, 'Crop name is required'),
  variety: z.string().optional(),
  total_quantity_kg: z.number().positive('Quantity must be greater than zero'),
  available_quantity_kg: z.number().nonnegative().optional(),
  minimum_order_kg: z.number().positive().default(1.0),
  price_per_kg_expected: z.number().positive('Price must be greater than zero'),
  mandi_benchmark_price: z.number().optional(),
  harvest_date: z.string(),
  shelf_life_days: z.number().int().positive(),
  quality_grade: z.enum(['A+', 'A', 'B', 'C', 'ORGANIC']).default('A'),
  quality_assay: z.object({
    sugar_brix: z.number().optional(),
    moisture_percentage: z.number().optional(),
    uniformity_score: z.number().optional(),
    defect_percentage: z.number().optional(),
    certified_organic: z.boolean().default(false),
    assay_notes: z.string().optional(),
  }).optional(),
  images_urls: z.array(z.string()).default([]),
  pickup_location_id: z.string().optional(),
  idempotency_key: z.string().optional(),
});

export const ListingsController = {
  async createListing(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const parseResult = CreateListingSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid crop harvest parameters',
          details: parseResult.error.format(),
        },
      });
      return;
    }

    const data = parseResult.data;

    // Check or default pickup location
    let pickupLocationId = data.pickup_location_id;
    if (!pickupLocationId) {
      const userLocations = await LocationRepository.findByUserId(req.user.id);
      if (userLocations.length > 0) {
        pickupLocationId = userLocations[0].id;
      } else {
        const defaultLoc = await LocationRepository.create({
          user_id: req.user.id,
          address_line: 'Farm Gate Field Plot',
          district: 'Nashik',
          state: 'Maharashtra',
          pincode: '422001',
          geo_point: { latitude: 20.0, longitude: 73.8 },
          is_primary: true,
        });
        pickupLocationId = defaultLoc.id;
      }
    }

    const totalQty = data.total_quantity_kg;
    const availableQty = data.available_quantity_kg !== undefined ? data.available_quantity_kg : totalQty;

    const newListing = await ListingRepository.create({
      farmer_id: req.user.id,
      category: data.category as CropCategory,
      crop_name: data.crop_name,
      variety: data.variety || null,
      total_quantity_kg: totalQty,
      available_quantity_kg: availableQty,
      minimum_order_kg: data.minimum_order_kg,
      price_per_kg_expected: data.price_per_kg_expected,
      mandi_benchmark_price: data.mandi_benchmark_price || null,
      harvest_date: data.harvest_date,
      shelf_life_days: data.shelf_life_days,
      quality_grade: data.quality_grade,
      quality_assay: data.quality_assay,
      images_urls: data.images_urls,
      status: 'AVAILABLE',
      pickup_location_id: pickupLocationId!,
      idempotency_key: data.idempotency_key,
    });

    res.status(201).json({
      data: newListing,
    });
  },

  async getListingById(req: Request, res: Response): Promise<void> {
    const id = req.params.id as string;
    const listing = await ListingRepository.findById(id);

    if (!listing) {
      res.status(404).json({
        error: {
          code: 'LISTING_NOT_FOUND',
          message: `Crop harvest lot with ID ${id} was not found`,
        },
      });
      return;
    }

    res.json({
      data: listing,
    });
  },

  async getMyListings(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const listings = await ListingRepository.findByFarmerId(req.user.id);
    res.json({
      data: listings,
    });
  },

  async updateListingStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    const id = req.params.id as string;
    const { status } = req.body;

    const validStatuses: ListingStatus[] = [
      'DRAFT',
      'AVAILABLE',
      'RESERVED',
      'IN_TRANSIT',
      'SOLD',
      'CANCELLED',
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

    const listing = await ListingRepository.findById(id);
    if (!listing) {
      res.status(404).json({
        error: { code: 'LISTING_NOT_FOUND', message: 'Listing not found' },
      });
      return;
    }

    // Must be owner or admin
    if (req.user && req.user.id !== listing.farmer_id && req.user.role !== 'GOVT_ADMIN') {
      res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You do not own this harvest listing' },
      });
      return;
    }

    const updated = await ListingRepository.updateStatus(id, status);
    res.json({
      data: updated,
    });
  },

  async getMarketplaceListings(req: Request, res: Response): Promise<void> {
    const category = req.query.category as string | undefined;
    const query = req.query.q as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const allAvailable = await ListingRepository.findAvailable(category, query);

    // Apply pagination
    const total = allAvailable.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedItems = allAvailable.slice(startIndex, startIndex + limit);

    res.json({
      data: paginatedItems,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  },
};
