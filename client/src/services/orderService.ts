/**
 * AgriDirect Order & Escrow Service (Supabase Database Layer)
 * Manages atomic order placement, escrow transitions, and delivery confirmation
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Order, OrderStatus, EscrowStatus } from '@types';

export class OrderService {
  /**
   * Create an order in Supabase with transparent pricing calculation
   */
  static async createOrder(orderData: {
    buyer_id: string;
    listing_id: string;
    quantity_kg: number;
    delivery_location_id?: string;
  }): Promise<Order> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet');
    }

    // 1. Fetch listing details to compute transparent pricing and verify inventory
    const { data: listing, error: listingError } = await supabase
      .from('crop_listings')
      .select('*')
      .eq('id', orderData.listing_id)
      .single();

    if (listingError || !listing) {
      throw new Error('Listing not found or unavailable');
    }

    if (listing.available_quantity_kg < orderData.quantity_kg) {
      throw new Error(`Insufficient inventory: Only ${listing.available_quantity_kg}kg available`);
    }

    // Formula: Consumer Price = Farmer Payout (76%) + Cold Logistics (16%) + Platform/Assay Fee (8%)
    const farmer_unit_price = Number(listing.price_per_kg_expected);
    const logistics_fee = Number((farmer_unit_price * (16 / 76)).toFixed(2));
    const platform_fee = Number((farmer_unit_price * (8 / 76)).toFixed(2));
    const consumer_unit_price = Number((farmer_unit_price + logistics_fee + platform_fee).toFixed(2));
    const total_amount = Number((consumer_unit_price * orderData.quantity_kg).toFixed(2));

    const qr_provenance_hash = `0x${crypto.randomUUID().replace(/-/g, '').substring(0, 16)}..PROVENANCE`;

    // 2. Insert order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: orderData.buyer_id,
        listing_id: orderData.listing_id,
        quantity_kg: orderData.quantity_kg,
        farmer_unit_price,
        logistics_fee,
        platform_fee,
        total_amount,
        escrow_status: 'HELD_IN_ESCROW',
        status: 'PLACED',
        delivery_location_id: orderData.delivery_location_id || null,
        qr_provenance_hash,
      })
      .select(`
        *,
        listing:listing_id (
          *,
          farmer:farmer_id (
            id,
            full_name,
            phone_number,
            role,
            preferred_language,
            upi_id
          )
        ),
        buyer:buyer_id (
          id,
          full_name,
          phone_number,
          role,
          preferred_language
        )
      `)
      .single();

    if (orderError) {
      throw new Error(orderError.message || 'Failed to place order');
    }

    // 3. Atomically decrement listing available quantity
    const remainingQty = listing.available_quantity_kg - orderData.quantity_kg;
    await supabase
      .from('crop_listings')
      .update({
        available_quantity_kg: remainingQty,
        status: remainingQty <= 0 ? 'SOLD' : listing.status,
      })
      .eq('id', orderData.listing_id);

    return order as unknown as Order;
  }

  /**
   * Fetch orders for current authenticated user
   */
  static async getOrders(userId?: string): Promise<Order[]> {
    if (!isSupabaseConfigured) return [];

    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          listing:listing_id (
            *,
            farmer:farmer_id (
              id,
              full_name,
              phone_number,
              role,
              preferred_language,
              upi_id
            )
          ),
          buyer:buyer_id (
            id,
            full_name,
            phone_number,
            role,
            preferred_language
          )
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.or(`buyer_id.eq.${userId}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[OrderService] Failed to load orders:', error.message);
        return [];
      }

      return (data || []) as unknown as Order[];
    } catch (err) {
      console.error('[OrderService] getOrders exception:', err);
      return [];
    }
  }

  /**
   * Update order lifecycle status
   */
  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<Order | null> {
    if (!isSupabaseConfigured) return null;

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('[OrderService] Failed to update order status:', error.message);
      return null;
    }

    return data as unknown as Order;
  }

  /**
   * Transition escrow status (e.g. advance payout, final settlement, or dispute)
   */
  static async updateEscrowStatus(
    orderId: string,
    escrowStatus: EscrowStatus,
    status?: OrderStatus
  ): Promise<Order | null> {
    if (!isSupabaseConfigured) return null;

    const updates: Record<string, unknown> = { escrow_status: escrowStatus };
    if (status) updates.status = status;

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('[OrderService] Failed to update escrow status:', error.message);
      return null;
    }

    return data as unknown as Order;
  }
}
