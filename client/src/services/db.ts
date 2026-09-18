/**
 * AgriDirect Client IndexedDB Offline Persistence Vault
 * Enables offline farmer listings drafting, local mutation buffering, and BackgroundSync replay
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { CropListing } from '@types';

interface AgriDirectDBSchema extends DBSchema {
  'offline_listings': {
    key: string;
    value: {
      id: string;
      listing: Partial<CropListing>;
      created_at: string;
      synced: boolean;
      sync_error?: string | null;
    };
    indexes: { 'by-synced': number };
  };
  'cached_market_prices': {
    key: string;
    value: {
      commodity: string;
      modal_price: number;
      updated_at: string;
    };
  };
}

const DB_NAME = 'agridirect_offline_vault';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AgriDirectDBSchema>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AgriDirectDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('offline_listings')) {
          const listingStore = db.createObjectStore('offline_listings', {
            keyPath: 'id',
          });
          // indexed by sync status (0 = unsynced, 1 = synced)
          listingStore.createIndex('by-synced', 'synced');
        }

        if (!db.objectStoreNames.contains('cached_market_prices')) {
          db.createObjectStore('cached_market_prices', {
            keyPath: 'commodity',
          });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveOfflineListing(listing: Partial<CropListing>) {
  const db = await getDB();
  const id = listing.id || `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const record = {
    id,
    listing: { ...listing, id },
    created_at: new Date().toISOString(),
    synced: false,
  };
  await db.put('offline_listings', record);
  return record;
}

export async function getUnsyncedListings() {
  const db = await getDB();
  const all = await db.getAll('offline_listings');
  return all.filter((item) => !item.synced);
}

export async function markListingSynced(id: string) {
  const db = await getDB();
  const item = await db.get('offline_listings', id);
  if (item) {
    item.synced = true;
    await db.put('offline_listings', item);
  }
}

export async function clearSyncedListings() {
  const db = await getDB();
  const all = await db.getAll('offline_listings');
  const synced = all.filter((item) => item.synced);
  const tx = db.transaction('offline_listings', 'readwrite');
  for (const item of synced) {
    await tx.store.delete(item.id);
  }
  await tx.done;
  return synced.length;
}

export async function cacheMarketPrice(commodity: string, modal_price: number) {
  const db = await getDB();
  const record = {
    commodity,
    modal_price,
    updated_at: new Date().toISOString(),
  };
  await db.put('cached_market_prices', record);
  return record;
}

export async function getCachedMarketPrices() {
  const db = await getDB();
  return db.getAll('cached_market_prices');
}
