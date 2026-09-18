/**
 * AgriDirect Listing Service (Supabase Database Layer)
 * Handles CRUD operations for crop harvest listings with RLS protection
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { CropListing, ListingStatus, CropCategory } from '@types';

export class ListingService {
  /**
   * Fetch all available crop listings for the marketplace
   */
  static async getAvailableListings(
    category?: string,
    query?: string
  ): Promise<CropListing[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      let req = supabase
        .from('crop_listings')
        .select(`
          *,
          farmer:farmer_id (
            id,
            full_name,
            phone_number,
            role,
            preferred_language,
            upi_id
          )
        `)
        .eq('status', 'AVAILABLE')
        .order('created_at', { ascending: false });

      if (category && category !== 'ALL') {
        req = req.eq('category', category);
      }

      if (query && query.trim()) {
        req = req.ilike('crop_name', `%${query.trim()}%`);
      }

      const { data, error } = await req;

      if (error) {
        console.error('[ListingService] Failed to load listings:', error.message);
        return [];
      }

      return (data || []) as unknown as CropListing[];
    } catch (err) {
      console.error('[ListingService] getAvailableListings exception:', err);
      return [];
    }
  }

  /**
   * Fetch listing by ID
   */
  static async getListingById(id: string): Promise<CropListing | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const { data, error } = await supabase
        .from('crop_listings')
        .select(`
          *,
          farmer:farmer_id (
            id,
            full_name,
            phone_number,
            role,
            preferred_language,
            upi_id
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('[ListingService] Failed to fetch listing by id:', error.message);
        return null;
      }

      return data as unknown as CropListing;
    } catch (err) {
      console.error('[ListingService] getListingById exception:', err);
      return null;
    }
  }

  /**
   * Create a new crop listing as an authenticated farmer
   */
  static async createListing(
    listingData: Partial<CropListing>,
    farmerId: string
  ): Promise<CropListing> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet');
    }

    const payload = {
      farmer_id: farmerId,
      category: listingData.category as CropCategory,
      crop_name: listingData.crop_name,
      variety: listingData.variety || null,
      total_quantity_kg: listingData.total_quantity_kg,
      available_quantity_kg: listingData.available_quantity_kg ?? listingData.total_quantity_kg,
      minimum_order_kg: listingData.minimum_order_kg || 1.0,
      price_per_kg_expected: listingData.price_per_kg_expected,
      mandi_benchmark_price: listingData.mandi_benchmark_price || null,
      harvest_date: listingData.harvest_date || new Date().toISOString().split('T')[0],
      shelf_life_days: listingData.shelf_life_days || 7,
      quality_grade: listingData.quality_grade || 'A',
      quality_assay: listingData.quality_assay || {},
      images_urls: listingData.images_urls || [],
      status: (listingData.status || 'AVAILABLE') as ListingStatus,
      idempotency_key: listingData.idempotency_key || undefined,
    };

    const { data, error } = await supabase
      .from('crop_listings')
      .insert(payload)
      .select(`
        *,
        farmer:farmer_id (
          id,
          full_name,
          phone_number,
          role,
          preferred_language,
          upi_id
        )
      `)
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to publish harvest listing');
    }

    return data as unknown as CropListing;
  }

  /**
   * Update listing status (e.g. RESERVED, SOLD, CANCELLED)
   */
  static async updateStatus(
    id: string,
    status: ListingStatus
  ): Promise<CropListing | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('crop_listings')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ListingService] Failed to update listing status:', error.message);
      return null;
    }

    return data as unknown as CropListing;
  }
}
