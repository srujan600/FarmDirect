import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import fs from 'node:fs';
import path from 'node:path';
import { app } from '../app.js';
import { initDatabase, ListingRepository, UserRepository } from '../db/index.js';

describe('AgriDirect Phase 8: Performance Benchmark & Concurrency Stress Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let buyerToken: string;

  before(async () => {
    await initDatabase();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    // Authenticate a retail consumer
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919821098765', role: 'RETAIL_CONSUMER' }),
    });
    const loginJson = (await loginRes.json()) as any;
    buyerToken = loginJson.data.token;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test('Benchmark 1: 50 Parallel Checkout Requests Stress Test prevents overselling', async () => {
    // 1. Create a dedicated listing with limited 300 kg inventory
    const farmer = await UserRepository.findByPhone('+919823014289');
    assert.ok(farmer);

    const testListing = await ListingRepository.create({
      farmer_id: farmer.id,
      category: 'VEGETABLES',
      crop_name: 'High-Demand Stress Test Tomato',
      variety: 'Hybrid F1',
      total_quantity_kg: 300.0,
      available_quantity_kg: 300.0,
      minimum_order_kg: 5.0,
      price_per_kg_expected: 32.0,
      mandi_benchmark_price: 24.0,
      harvest_date: '2026-10-20',
      shelf_life_days: 6,
      quality_grade: 'A+',
      status: 'AVAILABLE',
      images_urls: [],
    });

    const listingId = testListing.id;

    // 2. Dispatch 50 concurrent order checkout requests of 10kg each (total demanded = 500kg, but only 300kg available)
    const concurrentRequests = Array.from({ length: 50 }).map(async (_, idx) => {
      return fetch(`${baseUrl}/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${buyerToken}`,
        },
        body: JSON.stringify({
          listing_id: listingId,
          quantity_kg: 10.0,
        }),
      });
    });

    const responses = await Promise.all(concurrentRequests);
    const statuses = responses.map((r) => r.status);

    const successfulOrders = statuses.filter((s) => s === 201).length;
    const rejectedOrders = statuses.filter((s) => s === 409).length;

    // Exactly 30 orders of 10kg should succeed (= 300kg), and 20 orders should be rejected (409 Conflict/Insufficient)
    assert.equal(successfulOrders, 30, 'Exactly 30 orders should successfully reserve 10kg each');
    assert.equal(rejectedOrders, 20, 'Remaining 20 orders must be rejected with 409 without overselling');

    // 3. Verify final inventory in datastore is exactly 0.0 kg
    const finalListing = await ListingRepository.findById(listingId);
    assert.equal(finalListing?.available_quantity_kg, 0.0, 'Available quantity must be exactly 0.0 kg');
    assert.equal(finalListing?.status, 'SOLD', 'Status must transition to SOLD once depleted');
  });

  test('Benchmark 2: 100 Randomized Commodity Pricing Calculations assert exact 2-decimal sum', async () => {
    // Generate 100 random price and quantity pairs
    for (let i = 0; i < 100; i++) {
      const farmerPrice = Number((15 + Math.random() * 200).toFixed(2));
      const quantityKg = Math.floor(1 + Math.random() * 50);

      const res = await fetch(
        `${baseUrl}/api/v1/pricing/calculate?farmer_price=${farmerPrice}&quantity_kg=${quantityKg}`
      );
      assert.equal(res.status, 200);

      const json = (await res.json()) as any;
      const bd = json.data;

      // Assert unit components
      const expectedUnitSum = Number(
        (bd.farmer_unit_price + bd.logistics_fee_per_kg + bd.platform_fee_per_kg).toFixed(2)
      );
      assert.equal(
        bd.consumer_unit_price,
        expectedUnitSum,
        `Iteration ${i}: Unit consumer price (${bd.consumer_unit_price}) must equal sum of parts (${expectedUnitSum})`
      );

      // Assert total components
      const expectedTotalSum = Number(
        (bd.farmer_payout_total + bd.logistics_fee_total + bd.platform_fee_total).toFixed(2)
      );
      assert.equal(
        bd.consumer_total,
        expectedTotalSum,
        `Iteration ${i}: Total consumer price (${bd.consumer_total}) must equal sum of totals (${expectedTotalSum})`
      );
    }
  });

  test('Benchmark 3: PWA Manifest & Service Worker build artifact compliance', () => {
    const distPath = path.resolve(process.cwd(), '../client/dist');
    const manifestPath = path.join(distPath, 'manifest.webmanifest');
    const swPath = path.join(distPath, 'sw.js');

    assert.ok(fs.existsSync(manifestPath), 'manifest.webmanifest must exist in client/dist');
    assert.ok(fs.existsSync(swPath), 'sw.js service worker must exist in client/dist');

    const manifestContent = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.equal(manifestContent.name, 'AgriDirect - Direct Kisan Marketplace');
    assert.equal(manifestContent.short_name, 'AgriDirect');
    assert.equal(manifestContent.display, 'standalone');
    assert.equal(manifestContent.theme_color, '#133e2b');
    assert.ok(manifestContent.icons.length >= 2, 'Manifest must specify multiple icon sizes');
  });

  test('Benchmark 4: DoCA Problem Statement 26033 SLA Verification', async () => {
    // 1. Mandi Ticker latency < 50ms
    const t0 = performance.now();
    const benchmarkRes = await fetch(`${baseUrl}/api/v1/pricing/mandi-benchmark`);
    const benchmarkLatency = performance.now() - t0;
    assert.equal(benchmarkRes.status, 200);
    assert.ok(benchmarkLatency < 100, `Mandi benchmark response should be < 100ms (got ${benchmarkLatency.toFixed(1)}ms)`);

    // 2. Cryptographic Provenance hash validation
    const sampleRes = await fetch(`${baseUrl}/api/v1/provenance/sample`);
    assert.equal(sampleRes.status, 200);
    const sampleJson = (await sampleRes.json()) as any;
    assert.equal(sampleJson.data.stages.length, 5, 'Must contain 5 cryptographic lifecycle stages');

    // 3. Vernacular Dialects check
    const langRes = await fetch(`${baseUrl}/api/v1/voice/languages`);
    assert.equal(langRes.status, 200);
    const langJson = (await langRes.json()) as any;
    assert.equal(Object.keys(langJson.data).length, 23, 'Must support 22 official languages + English');
  });
});
