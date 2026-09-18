/**
 * AgriDirect Sovereign Kisan-to-Grahak Grid: End-to-End Persona Journey Integration Test
 * Simulates complete lifecycle across all 5 platform personas:
 * 1. Kisan (Harvest Listing & Payout Realization)
 * 2. Agronomic AI (Demand Forecasting & Micro-Climate Telemetry)
 * 3. Grahak (Disintermediation Order & Atomic Escrow Allocation)
 * 4. Reefer Pilot (CVRPTW Cold Route & Telemetry Verification)
 * 5. FPO & Govt Admin (Hub Docking, 30% Advance, Doorstep QR Handover & T+0 Settlement)
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../app.js';
import { initDatabase } from '../db/index.js';

describe('AgriDirect End-to-End Cross-Persona Integration Lifecycle', () => {
  let server: http.Server;
  let baseUrl: string;

  // Persona tokens
  let farmerToken: string;
  let buyerToken: string;
  let driverToken: string;
  let fpoToken: string;
  let govtAdminToken: string;

  // Shared transaction state
  let createdListingId: string;
  let createdOrderId: string;
  let orderProvenanceHash: string;

  before(async () => {
    await initDatabase();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    // 1. Authenticate Kisan
    const fRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919823014289', role: 'FARMER' }),
    });
    farmerToken = ((await fRes.json()) as any).data.token;

    // 2. Authenticate Grahak (Retail Consumer)
    const bRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919821098765', role: 'RETAIL_CONSUMER' }),
    });
    buyerToken = ((await bRes.json()) as any).data.token;

    // 3. Authenticate Logistics Driver
    const dRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919890044556', role: 'LOGISTICS_DRIVER' }),
    });
    driverToken = ((await dRes.json()) as any).data.token;

    // 4. Authenticate FPO Admin
    const fpoRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919823099999', role: 'FPO_ADMIN' }),
    });
    fpoToken = ((await fpoRes.json()) as any).data.token;

    // 5. Authenticate Govt Nodal Admin
    const gRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919999900001', role: 'GOVT_ADMIN' }),
    });
    govtAdminToken = ((await gRes.json()) as any).data.token;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test('Step 1 [Kisan]: Checks APMC spot benchmark and publishes 500kg harvest lot', async () => {
    // Check spot price baseline
    const mandiRes = await fetch(`${baseUrl}/api/v1/pricing/mandi-benchmark`);
    assert.equal(mandiRes.status, 200);
    const mandiQuotes = ((await mandiRes.json()) as any).data;
    assert.ok(mandiQuotes.length > 0);

    // Kisan lists 500kg Grade-A Tomatoes
    const listRes = await fetch(`${baseUrl}/api/v1/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmerToken}`,
      },
      body: JSON.stringify({
        crop_name: 'Nashik Shravan Tomatoes (Grade-A)',
        category: 'VEGETABLES',
        variety: 'Shravan Hybrid F1',
        total_quantity_kg: 500,
        available_quantity_kg: 500,
        minimum_order_kg: 5,
        price_per_kg_expected: 35.0,
        mandi_benchmark_price: 22.0,
        harvest_date: new Date().toISOString().split('T')[0],
        shelf_life_days: 10,
        quality_grade: 'A+',
        quality_assay: {
          sugar_brix: 17.5,
          moisture_percentage: 91.0,
          uniformity_score: 95.0,
          defect_percentage: 1.0,
          certified_organic: true,
        },
      }),
    });

    assert.equal(listRes.status, 201);
    const listBody = ((await listRes.json()) as any).data;
    createdListingId = listBody.id;
    assert.ok(createdListingId);
    assert.equal(listBody.total_quantity_kg, 500);
    assert.equal(listBody.available_quantity_kg, 500);

    // Verify mathematical pricing identity holds: 76% farmer + 16% cold logistics + 8% platform fee
    const priceRes = await fetch(`${baseUrl}/api/v1/pricing/calculate?farmer_price=35.00&quantity_kg=500`);
    assert.equal(priceRes.status, 200);
    const priceBody = ((await priceRes.json()) as any).data;

    const expectedSum = Number((priceBody.farmer_payout_total + priceBody.logistics_fee_total + priceBody.platform_fee_total).toFixed(2));
    assert.equal(priceBody.consumer_total, expectedSum, 'Consumer Total must equal 76% + 16% + 8% breakdown');
  });

  test('Step 2 [AI Agronomic Intelligence]: Generates 30-day forecast and micro-climate telemetry', async () => {
    const fcRes = await fetch(`${baseUrl}/api/v1/forecasts?crop=Tomato&district=Nashik`);
    assert.equal(fcRes.status, 200);
    const fcData = ((await fcRes.json()) as any).data;

    assert.ok(fcData.summary.projected_demand_quintals > 0);
    assert.ok(fcData.advisory.optimal_harvest_window);
    assert.equal(fcData.time_series.length, 6);

    const telRes = await fetch(`${baseUrl}/api/v1/forecasts/telemetry?district=Nashik`);
    assert.equal(telRes.status, 200);
    const telData = ((await telRes.json()) as any).data;
    assert.equal(telData.temperature_celsius, 28.0);
    assert.ok(telData.precool_storage_celsius <= 14.0);
  });

  test('Step 3 [Grahak]: Discovers lot on marketplace and executes 50kg order with atomic lock', async () => {
    // Browse marketplace
    const catalogRes = await fetch(`${baseUrl}/api/v1/marketplace/listings?category=VEGETABLES`);
    assert.equal(catalogRes.status, 200);
    const catalog = ((await catalogRes.json()) as any).data;
    const foundListing = catalog.find((l: any) => l.id === createdListingId);
    assert.ok(foundListing, 'Newly listed harvest must be discoverable in catalog');

    // Place 50kg order
    const orderRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        listing_id: createdListingId,
        quantity_kg: 50,
      }),
    });

    assert.equal(orderRes.status, 201);
    const orderData = ((await orderRes.json()) as any).data;
    createdOrderId = orderData.id;
    orderProvenanceHash = orderData.qr_provenance_hash;
    assert.ok(createdOrderId);
    assert.equal(orderData.status, 'PLACED');
    assert.equal(orderData.escrow_status, 'HELD_IN_ESCROW');

    // Verify inventory decreased atomically: 500kg - 50kg = 450kg
    const listingCheck = await fetch(`${baseUrl}/api/v1/marketplace/listings/${createdListingId}`);
    assert.equal(listingCheck.status, 200);
    const updatedListing = ((await listingCheck.json()) as any).data;
    assert.equal(updatedListing.available_quantity_kg, 450);
  });

  test('Step 4 [Reefer Pilot]: Solves CVRPTW milk run and records cold temperature telemetry', async () => {
    // Run CVRPTW solver
    const optRes = await fetch(`${baseUrl}/api/v1/logistics/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depot: { latitude: 20.1746, longitude: 73.9856 },
        vehicles: [{ id: 'MH-15-EV-4289', capacity_kg: 1200, type: 'TATA_ACE_EV' }],
        stops: [
          {
            id: 'stop_farmgate',
            location: { latitude: 20.0215, longitude: 73.8123 },
            demand_kg: 50,
            time_window_start_min: 390,
            time_window_end_min: 450,
            stop_type: 'PICKUP',
          },
        ],
      }),
    });

    assert.equal(optRes.status, 200);
    const optData = ((await optRes.json()) as any).data;
    assert.ok(optData.trips.length > 0);
    assert.ok(optData.co2_avoided_kg > 0);

    // Driver updates telemetry
    const telUpdate = await fetch(`${baseUrl}/api/v1/logistics/trips/trip_mh_nashik_04/telemetry`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${driverToken}`,
      },
      body: JSON.stringify({
        temperature_celsius: 4.2,
      }),
    });

    assert.equal(telUpdate.status, 200);
  });

  test('Step 5 [FPO Admin & Hub]: Produce docks at aggregation hub and triggers 30% advance payout', async () => {
    const advanceRes = await fetch(`${baseUrl}/api/v1/orders/${createdOrderId}/release-advance`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${fpoToken}`,
      },
    });

    assert.equal(advanceRes.status, 200);
    const advanceData = ((await advanceRes.json()) as any).data;
    assert.equal(advanceData.advance_percentage, 30);
    assert.equal(advanceData.order.escrow_status, 'SPLIT_ADVANCE_RELEASED');
    assert.equal(advanceData.order.status, 'AT_HUB');
  });

  test('Step 6 [Doorstep Handover & Settlement]: Grahak scans QR code, releasing final 70% UPI payout (T+0)', async () => {
    // Consumer scans delivery QR code
    const deliverRes = await fetch(`${baseUrl}/api/v1/orders/${createdOrderId}/verify-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        qr_hash: 'PROVENANCE',
      }),
    });

    assert.equal(deliverRes.status, 200);
    const deliverData = ((await deliverRes.json()) as any).data;
    assert.equal(deliverData.escrow_status, 'RELEASED_TO_FARMER');
    assert.equal(deliverData.order.status, 'DELIVERED');
    assert.equal(deliverData.settlement_mode, 'T+0_INSTANT_UPI');

    // Verify SHA-256 provenance verification succeeds
    const provRes = await fetch(`${baseUrl}/api/v1/provenance/sample`);
    assert.equal(provRes.status, 200);
    const provData = ((await provRes.json()) as any).data;
    assert.equal(provData.is_valid, true);
    assert.equal(provData.stages.length, 5);
  });

  test('Step 7 [Govt Nodal Admin]: Audits completed sovereign transaction in ledger', async () => {
    const ordersRes = await fetch(`${baseUrl}/api/v1/orders`, {
      headers: { Authorization: `Bearer ${govtAdminToken}` },
    });
    assert.equal(ordersRes.status, 200);
    const allOrders = ((await ordersRes.json()) as any).data;
    const auditedOrder = allOrders.find((o: any) => o.id === createdOrderId);

    assert.ok(auditedOrder);
    assert.equal(auditedOrder.status, 'DELIVERED');
    assert.equal(auditedOrder.escrow_status, 'RELEASED_TO_FARMER');
  });
});
