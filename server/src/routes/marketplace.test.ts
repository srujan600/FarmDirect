import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { initDatabase, ListingRepository } from '../db/index.js';
import { app } from '../app.js';
import http from 'node:http';

describe('AgriDirect Core Marketplace & Pricing API Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let farmerToken: string;
  let buyerToken: string;

  before(async () => {
    await initDatabase();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as { port: number };
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });

    // Login as Farmer
    const fRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919823014289' }),
    });
    const fJson = await fRes.json();
    farmerToken = fJson.data.token;

    // Login as Buyer
    const bRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919821098765' }),
    });
    const bJson = await bRes.json();
    buyerToken = bJson.data.token;
  });

  test('GET /api/v1/marketplace/listings returns paginated listings', async () => {
    const res = await fetch(`${baseUrl}/api/v1/marketplace/listings?page=1&limit=10`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data), 'Data must be an array');
    assert.ok(json.meta, 'Meta pagination must exist');
    assert.strictEqual(json.meta.page, 1);
    assert.ok(json.data.length >= 4, 'Should contain at least 4 seeded listings');
  });

  test('GET /api/v1/marketplace/listings filters by category and search query', async () => {
    // 1. Filter by category VEGETABLES
    const vegRes = await fetch(`${baseUrl}/api/v1/marketplace/listings?category=VEGETABLES`);
    assert.strictEqual(vegRes.status, 200);
    const vegJson = await vegRes.json();
    assert.ok(vegJson.data.every((item: any) => item.category === 'VEGETABLES'));

    // 2. Query search 'Alphonso'
    const searchRes = await fetch(`${baseUrl}/api/v1/marketplace/listings?q=Alphonso`);
    assert.strictEqual(searchRes.status, 200);
    const searchJson = await searchRes.json();
    assert.strictEqual(searchJson.data.length, 1);
    assert.ok(searchJson.data[0].crop_name.includes('Alphonso Hapus'));
  });

  test('GET /api/v1/pricing/calculate validates exact 2-decimal component sum', async () => {
    const res = await fetch(`${baseUrl}/api/v1/pricing/calculate?farmer_price=38.00&quantity_kg=25`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    const bd = json.data;

    assert.strictEqual(bd.farmer_unit_price, 38.0);
    assert.strictEqual(bd.quantity_kg, 25);

    // Assert exact unit component sum down to 2 decimal places
    const unitSum = Number(
      (bd.farmer_unit_price + bd.logistics_fee_per_kg + bd.platform_fee_per_kg).toFixed(2)
    );
    assert.strictEqual(
      bd.consumer_unit_price,
      unitSum,
      'Consumer unit price must exactly equal sum of components'
    );

    // Assert total sum matches components
    const totalSum = Number(
      (bd.farmer_payout_total + bd.logistics_fee_total + bd.platform_fee_total).toFixed(2)
    );
    assert.strictEqual(bd.consumer_total, totalSum);
  });

  test('GET /api/v1/pricing/mandi-benchmark returns APMC benchmark spot quotes', async () => {
    const res = await fetch(`${baseUrl}/api/v1/pricing/mandi-benchmark`);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(Array.isArray(json.data));
    assert.ok(json.data.length >= 4);

    const tomatoQuote = json.data.find((q: any) => q.commodity.includes('Tomato'));
    assert.ok(tomatoQuote, 'Tomato quote should exist');
    assert.strictEqual(tomatoQuote.source, 'AGMARKNET');
  });

  test('POST /api/v1/listings allows farmer to list crop and respects idempotency', async () => {
    const idempotencyKey = `idemp_test_${Date.now()}`;

    const listingPayload = {
      category: 'VEGETABLES',
      crop_name: 'Organic Cauliflower',
      variety: 'Snowball White',
      total_quantity_kg: 800.0,
      price_per_kg_expected: 28.0,
      harvest_date: '2026-10-15',
      shelf_life_days: 7,
      quality_grade: 'A+',
      idempotency_key: idempotencyKey,
    };

    // First call: creates listing
    const res1 = await fetch(`${baseUrl}/api/v1/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify(listingPayload),
    });

    assert.strictEqual(res1.status, 201);
    const json1 = await res1.json();
    assert.ok(json1.data.id);
    assert.strictEqual(json1.data.crop_name, 'Organic Cauliflower');

    // Second call with same idempotency key: returns existing without duplicating
    const res2 = await fetch(`${baseUrl}/api/v1/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify(listingPayload),
    });

    assert.strictEqual(res2.status, 201);
    const json2 = await res2.json();
    assert.strictEqual(json2.data.id, json1.data.id, 'Idempotent key must return same listing ID');
  });

  test('POST /api/v1/orders allows buyer to place order with atomic reservation', async () => {
    const listings = await ListingRepository.findAvailable();
    const listing = listings[0];
    const initialQty = listing.available_quantity_kg;

    const res = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        listing_id: listing.id,
        quantity_kg: 20.0,
      }),
    });

    assert.strictEqual(res.status, 201);
    const json = await res.json();
    assert.strictEqual(json.data.status, 'PLACED');
    assert.strictEqual(json.data.escrow_status, 'HELD_IN_ESCROW');
    assert.ok(json.data.qr_provenance_hash, 'Must generate provenance QR hash');

    // Verify inventory reduced
    const updated = await ListingRepository.findById(listing.id);
    assert.strictEqual(updated?.available_quantity_kg, initialQty - 20.0);
  });

  after(async () => {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
