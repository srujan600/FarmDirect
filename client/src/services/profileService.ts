/**
 * AgriDirect Profile Service
 * Manages user profile persistence in Supabase PostgreSQL `profiles` table
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, UserRole, PreferredLanguage } from '@types';

export class ProfileService {
  /**
   * Retrieve user profile by Supabase auth UUID
   */
  static async getProfile(userId: string): Promise<User | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.warn('[ProfileService] Failed to load profile:', error?.message);
        return null;
      }

      return {
        id: data.id,
        phone_number: data.phone_number || '',
        full_name: data.full_name,
        role: data.role as UserRole,
        preferred_language: (data.preferred_language || 'hi') as PreferredLanguage,
        aadhaar_hash: data.aadhaar_hash,
        upi_id: data.upi_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (err) {
      console.error('[ProfileService] getProfile exception:', err);
      return null;
    }
  }

  /**
   * Create or update profile record (called upon verification)
   */
  static async upsertProfile(profile: {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
    phone_number?: string;
    preferred_language?: PreferredLanguage;
    upi_id?: string;
  }): Promise<User | null> {
    if (!isSupabaseConfigured) {
      return {
        id: profile.id,
        phone_number: profile.phone_number || '',
        full_name: profile.full_name,
        role: profile.role,
        preferred_language: profile.preferred_language || 'hi',
        upi_id: profile.upi_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          phone_number: profile.phone_number,
          preferred_language: profile.preferred_language || 'hi',
          upi_id: profile.upi_id,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[ProfileService] Failed to upsert profile:', error.message);
        return null;
      }

      return {
        id: data.id,
        phone_number: data.phone_number || '',
        full_name: data.full_name,
        role: data.role as UserRole,
        preferred_language: (data.preferred_language || 'hi') as PreferredLanguage,
        aadhaar_hash: data.aadhaar_hash,
        upi_id: data.upi_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    } catch (err) {
      console.error('[ProfileService] upsertProfile exception:', err);
      return null;
    }
  }

  /**
   * Update non-role user profile fields (role cannot be changed directly)
   */
  static async updateProfile(
    userId: string,
    updates: Partial<Omit<User, 'id' | 'role' | 'created_at'>>
  ): Promise<User | null> {
    if (!isSupabaseConfigured) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          phone_number: updates.phone_number,
          preferred_language: updates.preferred_language,
          upi_id: updates.upi_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[ProfileService] Failed to update profile:', error.message);
        return null;
      }

      return data as User;
    } catch (err) {
      console.error('[ProfileService] updateProfile exception:', err);
      return null;
    }
  }
}
