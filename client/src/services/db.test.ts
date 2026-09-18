import 'fake-indexeddb/auto';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  saveOfflineListing,
  getUnsyncedListings,
  markListingSynced,
  clearSyncedListings,
  cacheMarketPrice,
  getCachedMarketPrices,
} from './db.js';

describe('AgriDirect PWA Offline Persistence & IndexedDB Engine', () => {
  test('Save offline harvest draft stores record with synced: false and timestamp', async () => {
    const draft = {
      farmer_id: 'f1111111-1111-1111-1111-111111111111',
      crop_name: 'Nashik Red Onion (Garwa)',
      category: 'VEGETABLES' as const,
      total_quantity_kg: 500,
      available_quantity_kg: 500,
      price_per_kg_expected: 32.5,
      harvest_date: '2026-03-15',
    };

    const record = await saveOfflineListing(draft);

    assert.ok(record.id, 'Draft should have an ID assigned');
    assert.equal(record.synced, false, 'Draft should start as unsynced');
    assert.equal(record.listing.crop_name, 'Nashik Red Onion (Garwa)');
    assert.ok(record.created_at, 'Timestamp must be recorded');
  });

  test('getUnsyncedListings filters out synced items and returns only pending drafts', async () => {
    const draft1 = await saveOfflineListing({
      crop_name: 'Pimpalgaon Tomato (Hybrid)',
      available_quantity_kg: 300,
    });

    const draft2 = await saveOfflineListing({
      crop_name: 'Ratnagiri Alphonso Mango',
      available_quantity_kg: 150,
    });

    let pending = await getUnsyncedListings();
    const pendingIds = pending.map((p) => p.id);
    assert.ok(pendingIds.includes(draft1.id));
    assert.ok(pendingIds.includes(draft2.id));

    // Mark draft1 as synced
    await markListingSynced(draft1.id);

    pending = await getUnsyncedListings();
    const updatedPendingIds = pending.map((p) => p.id);
    assert.equal(updatedPendingIds.includes(draft1.id), false, 'Synced item must not appear in unsynced list');
    assert.ok(updatedPendingIds.includes(draft2.id), 'Unsynced item must remain in pending list');
  });

  test('Idempotency preservation: offline draft maintains unique key across network boundary', async () => {
    const customKey = 'offline_draft_uuid_987654321';
    const draft = await saveOfflineListing({
      id: customKey,
      crop_name: 'Sharbati Wheat (Sehore)',
      price_per_kg_expected: 44.0,
      available_quantity_kg: 1000,
    });

    assert.equal(draft.id, customKey, 'Provided idempotency key must be preserved verbatim');
    const pending = await getUnsyncedListings();
    const found = pending.find((p) => p.id === customKey);
    assert.ok(found, 'Should find listing by preserved idempotency key');
    assert.equal(found?.listing.price_per_kg_expected, 44.0);
  });

  test('clearSyncedListings purges synced records while keeping active unsynced drafts safe', async () => {
    const unsyncedDraft = await saveOfflineListing({
      crop_name: 'Nagpur Mandarin Oranges',
      available_quantity_kg: 200,
    });

    const syncedDraft = await saveOfflineListing({
      crop_name: 'Jalgaon Banana (Grand Naine)',
      available_quantity_kg: 400,
    });
    await markListingSynced(syncedDraft.id);

    const clearedCount = await clearSyncedListings();
    assert.ok(clearedCount >= 1, 'Should have deleted at least 1 synced item');

    const pending = await getUnsyncedListings();
    assert.ok(pending.some((p) => p.id === unsyncedDraft.id), 'Unsynced draft must survive cleanup');
  });

  test('Local Mandi benchmark spot price cache persists offline for rural disconnectivity', async () => {
    await cacheMarketPrice('Onion (Lasalgaon)', 2850.0);
    await cacheMarketPrice('Tomato (Nashik)', 1650.0);

    const cached = await getCachedMarketPrices();
    assert.ok(cached.length >= 2, 'Should retrieve stored offline commodity prices');

    const onion = cached.find((c) => c.commodity === 'Onion (Lasalgaon)');
    assert.ok(onion);
    assert.equal(onion?.modal_price, 2850.0);
    assert.ok(onion?.updated_at);
  });
});
