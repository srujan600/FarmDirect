/**
 * AgriDirect Client API Service
 * Bridges Supabase database operations with REST fallbacks for microservices
 */

import type {
  APISuccessResponse,
  APIErrorResponse,
  CropListing,
  Order,
  PriceBreakdown,
  DemandForecast,
  LogisticsTrip,
  MandiPriceQuote,
  User,
  RouteOptimizationRequest,
  RouteOptimizationResult,
  ProvenanceBatch
} from '@types';
import { isSupabaseConfigured } from '../lib/supabase';
import { ListingService } from './listingService';
import { OrderService } from './orderService';

const BASE_URL = '/api/v1';

class APIClient {
  private token: string | null = null;

  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('agridirect_token') : null;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('agridirect_token', token);
      } else {
        localStorage.removeItem('agridirect_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APISuccessResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const json = await response.json();

      if (!response.ok) {
        const errorResponse = json as APIErrorResponse;
        throw new Error(errorResponse.error?.message || `API Request Failed with status ${response.status}`);
      }

      return json as APISuccessResponse<T>;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown network error occurred');
    }
  }

  // Auth
  async login(phone_number: string, role: string) {
    return this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone_number, role }),
    });
  }

  async getCurrentUser() {
    return this.request<User>('/auth/me');
  }

  // Marketplace & Listings
  async getMarketplaceListings(category?: string, query?: string) {
    if (isSupabaseConfigured) {
      try {
        const listings = await ListingService.getAvailableListings(category, query);
        if (listings && listings.length > 0) {
          return { data: listings };
        }
      } catch (err) {
        console.warn('[APIClient] Supabase listing fetch fallback:', err);
      }
    }

    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (query) params.append('q', query);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return this.request<CropListing[]>(`/marketplace/listings${queryString}`);
  }

  async getListingById(id: string) {
    if (isSupabaseConfigured) {
      try {
        const listing = await ListingService.getListingById(id);
        if (listing) return { data: listing };
      } catch (err) {
        console.warn('[APIClient] Supabase getListingById fallback:', err);
      }
    }
    return this.request<CropListing>(`/listings/${id}`);
  }

  async createListing(listingData: Partial<CropListing>, farmerId?: string) {
    if (isSupabaseConfigured && farmerId) {
      try {
        const listing = await ListingService.createListing(listingData, farmerId);
        return { data: listing };
      } catch (err) {
        console.warn('[APIClient] Supabase createListing fallback:', err);
      }
    }
    return this.request<CropListing>('/listings', {
      method: 'POST',
      body: JSON.stringify(listingData),
    });
  }

  // Orders & Pricing
  async calculatePriceBreakdown(farmer_price: number, quantity_kg: number = 1): Promise<APISuccessResponse<PriceBreakdown>> {
    const logistics_fee_per_kg = Number((farmer_price * (16 / 76)).toFixed(2));
    const platform_fee_per_kg = Number((farmer_price * (8 / 76)).toFixed(2));
    const consumer_unit_price = Number((farmer_price + logistics_fee_per_kg + platform_fee_per_kg).toFixed(2));
    const farmer_payout_total = Number((farmer_price * quantity_kg).toFixed(2));
    const logistics_fee_total = Number((logistics_fee_per_kg * quantity_kg).toFixed(2));
    const platform_fee_total = Number((platform_fee_per_kg * quantity_kg).toFixed(2));
    const consumer_total = Number((consumer_unit_price * quantity_kg).toFixed(2));

    return {
      data: {
        farmer_unit_price: farmer_price,
        logistics_fee_per_kg,
        platform_fee_per_kg,
        consumer_unit_price,
        quantity_kg,
        farmer_payout_total,
        logistics_fee_total,
        platform_fee_total,
        consumer_total,
        savings_vs_mandi_percentage: 24.5,
      },
    };
  }

  async createOrder(orderData: { listing_id: string; quantity_kg: number; delivery_location_id?: string; buyer_id?: string }) {
    if (isSupabaseConfigured && orderData.buyer_id) {
      try {
        const order = await OrderService.createOrder({
          buyer_id: orderData.buyer_id,
          listing_id: orderData.listing_id,
          quantity_kg: orderData.quantity_kg,
          delivery_location_id: orderData.delivery_location_id,
        });
        return { data: order };
      } catch (err) {
        console.warn('[APIClient] Supabase createOrder fallback:', err);
      }
    }
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrders(role?: string, userId?: string) {
    if (isSupabaseConfigured) {
      try {
        const orders = await OrderService.getOrders(userId);
        if (orders && orders.length > 0) return { data: orders };
      } catch (err) {
        console.warn('[APIClient] Supabase getOrders fallback:', err);
      }
    }
    const query = role ? `?role=${role}` : '';
    return this.request<Order[]>(`/orders${query}`);
  }

  // AI & Forecasting
  async getForecast(crop: string = 'Tomato', district: string = 'Nashik') {
    return this.request<{
      summary: DemandForecast;
      time_series: {
        date: string;
        arrival_quintals: number;
        demand_quintals: number;
        arrival_pct: string;
        demand_pct: string;
        surge: boolean;
        label?: string;
        projected_modal_price: number;
      }[];
      advisory: {
        optimal_harvest_window: string;
        recommendation: string;
        deficit_alert: boolean;
        deficit_surge_percentage?: number;
      };
    }>(`/forecasts?crop=${encodeURIComponent(crop)}&district=${encodeURIComponent(district)}`);
  }

  async getTelemetry(district: string = 'Nashik') {
    return this.request<{
      district: string;
      temperature_celsius: number;
      condition: string;
      relative_humidity_pct: number;
      soil_moisture_index: number;
      precipitation_radar_mm: number;
      precipitation_forecast_summary: string;
      precool_storage_celsius: number;
      timestamp: string;
    }>(`/forecasts/telemetry?district=${encodeURIComponent(district)}`);
  }

  async getLogisticsTrips() {
    return this.request<LogisticsTrip[]>('/logistics/trips');
  }

  async getLogisticsTripById(id: string) {
    return this.request<LogisticsTrip>(`/logistics/trips/${id}`);
  }

  async optimizeRoute(payload: RouteOptimizationRequest) {
    return this.request<RouteOptimizationResult>('/logistics/optimize', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTripTelemetry(
    id: string,
    updates: {
      temperature_celsius?: number;
      completed_stop_id?: string;
      weight_verified_kg?: number;
    }
  ) {
    return this.request<LogisticsTrip>(`/logistics/trips/${id}/telemetry`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Mandi Benchmarks
  async getMandiBenchmarks() {
    return this.request<MandiPriceQuote[]>('/pricing/mandi-benchmark');
  }

  // Cryptographic Provenance
  async getProvenanceSample() {
    return this.request<ProvenanceBatch>('/provenance/sample');
  }

  async verifyProvenanceHash(hash: string) {
    return this.request<{ is_valid: boolean; batch?: ProvenanceBatch }>(`/provenance/verify/${encodeURIComponent(hash)}`);
  }

  // Escrow & Dispute Lifecycle
  async releaseOrderAdvance(orderId: string) {
    return this.request<Order>(`/orders/${orderId}/release-advance`, { method: 'POST' });
  }

  async verifyOrderDelivery(orderId: string, qr_hash: string = 'PROVENANCE') {
    return this.request<Order>(`/orders/${orderId}/verify-delivery`, {
      method: 'POST',
      body: JSON.stringify({ qr_hash }),
    });
  }

  async disputeOrder(orderId: string, reason: string) {
    return this.request<Order>(`/orders/${orderId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async resolveOrderDispute(orderId: string, resolution: 'RELEASE_TO_FARMER' | 'REFUND_TO_BUYER') {
    return this.request<Order>(`/orders/${orderId}/resolve-dispute`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    });
  }
}

export const api = new APIClient();
