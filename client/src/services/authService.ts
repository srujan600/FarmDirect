/**
 * AgriDirect Authentication Service (Supabase Auth + Email OTP)
 * Handles Email OTP issuance, verification, session tracking, and sign out
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserRole, PreferredLanguage } from '@types';
import type { Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface RegisterMetadata {
  full_name: string;
  role: UserRole;
  phone_number?: string;
  preferred_language?: PreferredLanguage;
  upi_id?: string;
}

export interface AuthErrorResult {
  code: string;
  message: string;
}

export class AuthService {
  /**
   * Sign in using Email and Password
   */
  static async signInWithPassword(
    email: string,
    password: string
  ): Promise<{ session: Session | null; error: AuthErrorResult | null }> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return {
        session: null,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please provide a valid email address.',
        },
      };
    }

    if (!password || password.length < 6) {
      return {
        session: null,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Password must be at least 6 characters long.',
        },
      };
    }

    if (!isSupabaseConfigured) {
      console.warn('ℹ️ [AuthService] Supabase not configured. Simulating successful password login.');
      return { session: null, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        return { session: null, error: AuthService.formatAuthError(error) };
      }

      return { session: data.session, error: null };
    } catch (err: unknown) {
      return {
        session: null,
        error: {
          code: 'AUTH_FAILED',
          message: err instanceof Error ? err.message : 'Login failed. Please check your credentials.',
        },
      };
    }
  }

  /**
   * Register a new user with Email and Password
   */
  static async signUpWithPassword(
    email: string,
    password: string,
    metadata: RegisterMetadata
  ): Promise<{ session: Session | null; user: unknown | null; error: AuthErrorResult | null }> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return {
        session: null,
        user: null,
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please provide a valid email address.',
        },
      };
    }

    if (!password || password.length < 6) {
      return {
        session: null,
        user: null,
        error: {
          code: 'WEAK_PASSWORD',
          message: 'Password must be at least 6 characters long.',
        },
      };
    }

    if (!isSupabaseConfigured) {
      console.warn('ℹ️ [AuthService] Supabase not configured. Simulating successful registration.');
      return { session: null, user: null, error: null };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: metadata.full_name,
            role: metadata.role,
            phone_number: metadata.phone_number,
            preferred_language: metadata.preferred_language || 'hi',
            upi_id: metadata.upi_id,
          },
        },
      });

      if (error) {
        return { session: null, user: null, error: AuthService.formatAuthError(error) };
      }

      return { session: data.session, user: data.user, error: null };
    } catch (err: unknown) {
      return {
        session: null,
        user: null,
        error: {
          code: 'REGISTRATION_FAILED',
          message: err instanceof Error ? err.message : 'Registration failed. Please try again.',
        },
      };
    }
  }

  /**
   * Request Email OTP for login or registration
   */
  static async sendOtp(
    email: string,
    metadata?: RegisterMetadata
  ): Promise<{ error: AuthErrorResult | null }> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return {
        error: {
          code: 'INVALID_EMAIL',
          message: 'Please provide a valid email address.',
        },
      };
    }

    if (!isSupabaseConfigured) {
      // In unconfigured development/offline mode, return simulated success
      console.warn('ℹ️ [AuthService] Supabase credentials not set. Simulated OTP sent to', trimmedEmail);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          data: metadata
            ? {
                full_name: metadata.full_name,
                role: metadata.role,
                phone_number: metadata.phone_number,
                preferred_language: metadata.preferred_language || 'hi',
                upi_id: metadata.upi_id,
              }
            : undefined,
          shouldCreateUser: Boolean(metadata), // true for registration, false for login if desired
        },
      });

      if (error) {
        return { error: AuthService.formatAuthError(error) };
      }

      return { error: null };
    } catch (err: unknown) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message: err instanceof Error ? err.message : 'Unable to connect to authentication service.',
        },
      };
    }
  }

  /**
   * Verify the 6-digit email OTP
   */
  static async verifyOtp(
    email: string,
    token: string
  ): Promise<{ session: Session | null; error: AuthErrorResult | null }> {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
      return {
        session: null,
        error: {
          code: 'INVALID_OTP_FORMAT',
          message: 'OTP must be a 6-digit numeric code.',
        },
      };
    }

    if (!isSupabaseConfigured) {
      console.warn('ℹ️ [AuthService] Supabase not configured. Simulating successful OTP verification for development.');
      return { session: null, error: null };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: cleanToken,
        type: 'email',
      });

      if (error) {
        return { session: null, error: AuthService.formatAuthError(error) };
      }

      return { session: data.session, error: null };
    } catch (err: unknown) {
      return {
        session: null,
        error: {
          code: 'VERIFICATION_FAILED',
          message: err instanceof Error ? err.message : 'Failed to verify OTP code.',
        },
      };
    }
  }

  /**
   * Resend the OTP code
   */
  static async resendOtp(
    email: string,
    metadata?: RegisterMetadata
  ): Promise<{ error: AuthErrorResult | null }> {
    return AuthService.sendOtp(email, metadata);
  }

  /**
   * Sign out current user and terminate Supabase session
   */
  static async signOut(): Promise<{ error: AuthErrorResult | null }> {
    if (!isSupabaseConfigured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: AuthService.formatAuthError(error) };
      }
      return { error: null };
    } catch (err: unknown) {
      return {
        error: {
          code: 'SIGNOUT_ERROR',
          message: err instanceof Error ? err.message : 'Error while signing out.',
        },
      };
    }
  }

  /**
   * Retrieve current Supabase session
   */
  static async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const { data } = await supabase.auth.getSession();
      return data.session;
    } catch {
      return null;
    }
  }

  /**
   * Listen to Supabase Auth state changes
   */
  static onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    if (!isSupabaseConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Translate raw Supabase auth errors to friendly user-facing messages
   */
  private static formatAuthError(error: { message: string; status?: number }): AuthErrorResult {
    const rawMsg = error.message.toLowerCase();

    if (rawMsg.includes('invalid login credentials') || rawMsg.includes('invalid credentials')) {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Incorrect email or password. Please try again or use Email OTP.',
      };
    }

    if (rawMsg.includes('already registered') || rawMsg.includes('already exists')) {
      return {
        code: 'USER_ALREADY_EXISTS',
        message: 'An account with this email already exists. Please sign in instead.',
      };
    }

    if (rawMsg.includes('password should be at least')) {
      return {
        code: 'WEAK_PASSWORD',
        message: 'Password must be at least 6 characters long.',
      };
    }

    if (rawMsg.includes('invalid') || rawMsg.includes('expired') || rawMsg.includes('token has expired')) {
      return {
        code: 'OTP_EXPIRED_OR_INVALID',
        message: 'The 6-digit OTP code entered is invalid or has expired. Please request a new one.',
      };
    }

    if (rawMsg.includes('rate limit') || rawMsg.includes('over_email_send_rate_limit')) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Email rate limit reached. Please wait 60 seconds before requesting another code.',
      };
    }

    if (rawMsg.includes('user not found')) {
      return {
        code: 'USER_NOT_FOUND',
        message: 'No registered user found with this email. Please create an account first.',
      };
    }

    if (rawMsg.includes('network') || rawMsg.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your internet connection and try again.',
      };
    }

    return {
      code: 'AUTH_ERROR',
      message: error.message || 'An unexpected authentication error occurred.',
    };
  }
}
