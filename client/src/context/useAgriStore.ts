/**
 * AgriDirect Global Application State (Zustand)
 * Manages Supabase Auth Session, Persona Role, Vernacular Language, Cart, Network Status, and Offline Drafts
 */

import { create } from 'zustand';
import type { User, UserRole, PreferredLanguage, CropListing } from '@types';
import { api } from '../services/api';
import { AuthService } from '../services/authService';
import { ProfileService } from '../services/profileService';
import { isSupabaseConfigured } from '../lib/supabase';
import { getUnsyncedListings, saveOfflineListing, markListingSynced } from '../services/db';

export interface CartItem {
  listing: CropListing;
  quantity_kg: number;
}

interface AgriStore {
  // Authentication & Persona
  currentUser: User | null;
  currentRole: UserRole;
  language: PreferredLanguage;
  token: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  setRole: (role: UserRole) => Promise<void>;
  setLanguage: (lang: PreferredLanguage) => void;
  setAuthenticatedUser: (user: User, token?: string) => void;
  logout: () => Promise<void>;
  initSupabaseAuth: () => Promise<void>;

  // Cart & Checkout
  cart: CartItem[];
  addToCart: (listing: CropListing, quantity_kg?: number) => void;
  removeFromCart: (listingId: string) => void;
  clearCart: () => void;

  // Network & PWA Offline Sync
  isOnline: boolean;
  unsyncedDraftCount: number;
  syncLog: string[];
  setOnlineStatus: (status: boolean) => void;
  refreshOfflineDrafts: () => Promise<void>;
  flushOfflineQueue: () => Promise<void>;
  submitHarvestListing: (listingData: Partial<CropListing>) => Promise<CropListing>;

  // Notification Toast
  toast: { message: string; type: 'success' | 'info' | 'warning' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  clearToast: () => void;
}

const DEFAULT_PERSONA_USER: User = {
  id: 'f1111111-1111-1111-1111-111111111111',
  phone_number: '+919823014289',
  full_name: 'Balasaheb Shinde (Kisan)',
  role: 'FARMER',
  preferred_language: 'mr',
  upi_id: 'shinde.kisan@sbi',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const buildUserFromSession = (supabaseUser: any): User => {
  const meta = supabaseUser.user_metadata || {};
  const email = supabaseUser.email || '';
  const fullName =
    meta.full_name ||
    meta.name ||
    meta.user_name ||
    (email ? email.split('@')[0] : 'Verified User');

  return {
    id: supabaseUser.id,
    phone_number: meta.phone_number || '',
    full_name: fullName,
    role: (meta.role as UserRole) || 'RETAIL_CONSUMER',
    preferred_language: (meta.preferred_language as PreferredLanguage) || 'hi',
    aadhaar_hash: meta.aadhaar_hash,
    upi_id: meta.upi_id,
    created_at: supabaseUser.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('agridirect_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialStoredUser = getStoredUser();
const initialStoredToken = typeof window !== 'undefined' ? localStorage.getItem('agridirect_token') : null;

export const useAgriStore = create<AgriStore>((set, get) => ({
  currentUser: initialStoredUser || DEFAULT_PERSONA_USER,
  currentRole: initialStoredUser?.role || 'FARMER',
  language: initialStoredUser?.preferred_language || 'mr',
  token: initialStoredToken,
  isAuthenticated: Boolean(initialStoredUser && initialStoredToken),
  isAuthLoading: true,

  initSupabaseAuth: async () => {
    if (!isSupabaseConfigured) {
      set({ isAuthLoading: false });
      return;
    }

    try {
      const session = await AuthService.getSession();
      if (session?.user) {
        let profile: User | null = null;
        try {
          profile = await ProfileService.getProfile(session.user.id);
          if (!profile) {
            profile = await ProfileService.upsertProfile({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              role: (session.user.user_metadata?.role as UserRole) || 'RETAIL_CONSUMER',
              phone_number: session.user.user_metadata?.phone_number,
              preferred_language: 'hi',
            });
          }
        } catch (err) {
          console.warn('[useAgriStore] ProfileService lookup/upsert error, fallback to session metadata:', err);
        }

        // Guaranteed fallback: If database tables or RLS failed, use session.user metadata
        if (!profile) {
          profile = buildUserFromSession(session.user);
        }

        api.setToken(session.access_token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('agridirect_token', session.access_token);
          localStorage.setItem('agridirect_user', JSON.stringify(profile));
        }
        set({
          currentUser: profile,
          currentRole: profile.role,
          token: session.access_token,
          isAuthenticated: true,
          language: profile.preferred_language || 'hi',
          isAuthLoading: false,
        });
        return;
      } else {
        // No active session in Supabase: clear stale localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('agridirect_token');
          localStorage.removeItem('agridirect_user');
        }
        set({
          isAuthenticated: false,
          token: null,
          currentUser: DEFAULT_PERSONA_USER,
          isAuthLoading: false,
        });
      }
    } catch (err) {
      console.warn('[useAgriStore] Auth initialization skipped:', err);
      set({ isAuthLoading: false });
    }

    // Subscribe to auth state changes (sign in, sign out, token refresh)
    AuthService.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        let profile: User | null = null;
        try {
          profile = await ProfileService.getProfile(session.user.id);
          if (!profile) {
            profile = await ProfileService.upsertProfile({
              id: session.user.id,
              email: session.user.email || '',
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
              role: (session.user.user_metadata?.role as UserRole) || 'RETAIL_CONSUMER',
              phone_number: session.user.user_metadata?.phone_number,
              preferred_language: 'hi',
            });
          }
        } catch (err) {
          console.warn('[onAuthStateChange] ProfileService error, fallback to session metadata:', err);
        }

        if (!profile) {
          profile = buildUserFromSession(session.user);
        }

        api.setToken(session.access_token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('agridirect_token', session.access_token);
          localStorage.setItem('agridirect_user', JSON.stringify(profile));
        }
        set({
          currentUser: profile,
          currentRole: profile.role,
          token: session.access_token,
          isAuthenticated: true,
          isAuthLoading: false,
        });
      } else if (!session) {
        api.setToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('agridirect_token');
          localStorage.removeItem('agridirect_user');
        }
        set({
          currentUser: DEFAULT_PERSONA_USER,
          currentRole: 'FARMER',
          token: null,
          isAuthenticated: false,
          isAuthLoading: false,
        });
      }
    });
  },

  setAuthenticatedUser: (user: User, token?: string) => {
    if (token) {
      api.setToken(token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('agridirect_token', token);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('agridirect_user', JSON.stringify(user));
    }
    set({
      currentUser: user,
      currentRole: user.role,
      token: token || null,
      isAuthenticated: true,
      language: user.preferred_language || get().language,
      isAuthLoading: false,
    });
  },

  logout: async () => {
    await AuthService.signOut();
    api.setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agridirect_token');
      localStorage.removeItem('agridirect_user');
    }
    set({
      currentUser: DEFAULT_PERSONA_USER,
      currentRole: 'FARMER',
      token: null,
      isAuthenticated: false,
      cart: [],
      isAuthLoading: false,
    });
    get().showToast('Signed out successfully. Switched to visitor mode.', 'info');
  },

  setRole: async (role: UserRole) => {
    const rolePhoneMap: Record<UserRole, string> = {
      FARMER: '+919823014289',
      FPO_ADMIN: '+919823025678',
      RETAIL_CONSUMER: '+919821098765',
      BULK_BUYER: '+919820011223',
      LOGISTICS_DRIVER: '+919890044556',
      GOVT_ADMIN: '+919999900001',
    };

    const phone = rolePhoneMap[role];
    try {
      const res = await api.login(phone, role);
      api.setToken(res.data.token);
      set({
        currentUser: res.data.user,
        currentRole: role,
        token: res.data.token,
      });
      get().showToast(`Switched persona to ${res.data.user.full_name} (${role})`, 'info');
    } catch {
      // Fallback local role update
      set((state) => ({
        currentRole: role,
        currentUser: state.currentUser ? { ...state.currentUser, role } : null,
      }));
    }
  },

  setLanguage: (lang: PreferredLanguage) => {
    set({ language: lang });
    get().showToast(`Language updated to ${lang.toUpperCase()}`, 'info');
  },

  cart: [],
  addToCart: (listing: CropListing, quantity_kg: number = 5) => {
    const currentCart = get().cart;
    const existingIndex = currentCart.findIndex((item) => item.listing.id === listing.id);

    if (existingIndex > -1) {
      const updated = [...currentCart];
      updated[existingIndex].quantity_kg += quantity_kg;
      set({ cart: updated });
    } else {
      set({ cart: [...currentCart, { listing, quantity_kg }] });
    }

    get().showToast(`Added ${quantity_kg}kg ${listing.crop_name} to cart`, 'success');
  },

  removeFromCart: (listingId: string) => {
    set({ cart: get().cart.filter((item) => item.listing.id !== listingId) });
  },

  clearCart: () => set({ cart: [] }),

  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  unsyncedDraftCount: 0,
  syncLog: [
    '[ServiceWorker] Registration: active (scope: /grid/)',
    '[Supabase DB] PostgreSQL engine: initialized',
    '[IndexedDB] Vault initialized: ready for offline harvests',
    '[Telemetry] Geolocation lock acquired: 20.1972° N (Nashik Hub)',
  ],

  setOnlineStatus: (status: boolean) => {
    set({ isOnline: status });
    const log = status
      ? `[SyncEngine] Network reconnected: Ready to flush offline mutation queue.`
      : `[IndexedDB] Network disconnected. Buffering mutations into local encrypted storage.`;
    set((state) => ({ syncLog: [log, ...state.syncLog.slice(0, 15)] }));
    get().showToast(status ? 'Back online! Connected to cloud database' : 'You are offline. Changes saved locally to IndexedDB', status ? 'success' : 'warning');
    if (status) {
      get().flushOfflineQueue();
    }
  },

  refreshOfflineDrafts: async () => {
    try {
      const unsynced = await getUnsyncedListings();
      set({ unsyncedDraftCount: unsynced.length });
    } catch {
      // Ignore if IndexedDB is not ready in test environments
    }
  },

  flushOfflineQueue: async () => {
    const unsynced = await getUnsyncedListings();
    if (unsynced.length === 0) {
      set((state) => ({
        syncLog: ['[SyncEngine] Queue check: 0 pending items. All manifests synchronized.', ...state.syncLog.slice(0, 15)],
      }));
      return;
    }

    let syncedCount = 0;
    for (const record of unsynced) {
      try {
        await api.createListing({
          ...record.listing,
          idempotency_key: record.id,
        }, get().currentUser?.id);
        await markListingSynced(record.id);
        syncedCount++;
      } catch (err: unknown) {
        console.error('Failed to sync offline item:', err);
      }
    }

    await get().refreshOfflineDrafts();
    set((state) => ({
      syncLog: [
        `[SyncEngine] Successfully synced ${syncedCount} offline harvests to Central Ledger.`,
        ...state.syncLog.slice(0, 15),
      ],
    }));
    get().showToast(`Synchronized ${syncedCount} offline harvest listings to cloud!`, 'success');
  },

  submitHarvestListing: async (listingData: Partial<CropListing>) => {
    const isOnline = get().isOnline;
    const user = get().currentUser;

    if (!isOnline) {
      // Save locally to IndexedDB
      const record = await saveOfflineListing({
        ...listingData,
        farmer_id: user?.id || 'f1111111-1111-1111-1111-111111111111',
      });
      await get().refreshOfflineDrafts();
      set((state) => ({
        syncLog: [
          `[IndexedDB] Saved draft #${record.id.substring(0, 8)} to device storage.`,
          ...state.syncLog.slice(0, 15),
        ],
      }));
      get().showToast('Saved offline to device. Will auto-sync when network returns.', 'info');
      return record.listing as CropListing;
    }

    // Submit online to Supabase / Central Ledger
    const res = await api.createListing(listingData, user?.id);
    set((state) => ({
      syncLog: [
        `[Central Ledger] Created listing #${res.data.id.substring(0, 8)} (${res.data.crop_name}).`,
        ...state.syncLog.slice(0, 15),
      ],
    }));
    get().showToast(`Harvest ${res.data.crop_name} published successfully!`, 'success');
    return res.data;
  },

  toast: null,
  showToast: (message: string, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      if (get().toast?.message === message) {
        set({ toast: null });
      }
    }, 4000);
  },
  clearToast: () => set({ toast: null }),
}));
