import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../app.js';
import { initDatabase } from '../db/index.js';

describe('AgriDirect Cryptographic Provenance & Escrow Protection Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let fpoToken: string;
  let buyerToken: string;
  let govtToken: string;
  let testOrderId: string;

  before(async () => {
    await initDatabase();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    // Login FPO Admin
    const fpoRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919823099999', role: 'FPO_ADMIN' }),
    });
    const fpoBody = (await fpoRes.json()) as any;
    fpoToken = fpoBody.data.token;

    // Login Retail Consumer / Buyer
    const buyerRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919821098765', role: 'RETAIL_CONSUMER' }),
    });
    const buyerBody = (await buyerRes.json()) as any;
    buyerToken = buyerBody.data.token;

    // Login Govt Admin
    const govtRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919999900001', role: 'GOVT_ADMIN' }),
    });
    const govtBody = (await govtRes.json()) as any;
    govtToken = govtBody.data.token;

    // Place a test order
    const orderRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        listing_id: 'c1111111-1111-1111-1111-111111111111',
        quantity_kg: 20,
      }),
    });
    const orderBody = (await orderRes.json()) as any;
    testOrderId = orderBody.data.id;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test('GET /api/v1/provenance/sample returns 5-stage cryptographic batch', async () => {
    const res = await fetch(`${baseUrl}/api/v1/provenance/sample`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    assert.ok(body.data);
    assert.equal(body.data.batch_id, 'B-NASHIK-99');
    assert.equal(body.data.stages.length, 5);
    assert.equal(body.data.is_valid, true);

    // Verify SHA-256 chain links
    const stages = body.data.stages;
    for (let i = 1; i < stages.length; i++) {
      assert.equal(stages[i].previous_hash, stages[i - 1].stage_hash, `Stage ${i + 1} must link to stage ${i} hash`);
    }
  });

  test('GET /api/v1/provenance/verify/:hash verifies valid hash and rejects tamper', async () => {
    // Valid batch lookup
    const sampleRes = await fetch(`${baseUrl}/api/v1/provenance/sample`);
    const sampleBody = (await sampleRes.json()) as any;
    const validHash = sampleBody.data.final_qr_hash;

    const verifyRes = await fetch(`${baseUrl}/api/v1/provenance/verify/${validHash}`);
    assert.equal(verifyRes.status, 200);
    const verifyBody = (await verifyRes.json()) as any;
    assert.equal(verifyBody.data.is_valid, true);

    // Corrupted hash
    const fakeRes = await fetch(`${baseUrl}/api/v1/provenance/verify/0xdeadbeef_invalid_tampered_hash`);
    assert.equal(fakeRes.status, 404);
    const fakeBody = (await fakeRes.json()) as any;
    assert.equal(fakeBody.data.is_valid, false);
  });

  test('POST /api/v1/orders/:id/release-advance releases 30% advance to farmer upon hub arrival', async () => {
    const res = await fetch(`${baseUrl}/api/v1/orders/${testOrderId}/release-advance`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${fpoToken}`,
      },
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.data.advance_percentage, 30);
    assert.ok(body.data.advance_payout_amount > 0);
    assert.equal(body.data.order.escrow_status, 'SPLIT_ADVANCE_RELEASED');
    assert.equal(body.data.order.status, 'AT_HUB');
  });

  test('POST /api/v1/orders/:id/verify-delivery releases remaining 70% payout on QR confirmation', async () => {
    const res = await fetch(`${baseUrl}/api/v1/orders/${testOrderId}/verify-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        qr_hash: 'PROVENANCE',
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    assert.equal(body.data.escrow_status, 'RELEASED_TO_FARMER');
    assert.equal(body.data.order.status, 'DELIVERED');
    assert.ok(body.data.final_payout_amount > 0);
    assert.equal(body.data.settlement_mode, 'T+0_INSTANT_UPI');
  });

  test('Escrow dispute flow: dispute locks escrow and admin resolution unfreezes', async () => {
    // Create new order for dispute test
    const newOrderRes = await fetch(`${baseUrl}/api/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        listing_id: 'c2222222-2222-2222-2222-222222222222',
        quantity_kg: 10,
      }),
    });
    const newOrder = (await newOrderRes.json()) as any;
    const orderId = newOrder.data.id;

    // 1. Buyer files dispute
    const disputeRes = await fetch(`${baseUrl}/api/v1/orders/${orderId}/dispute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        reason: 'Severe bruising observed during crate inspection',
      }),
    });

    assert.equal(disputeRes.status, 200);
    const disputeBody = (await disputeRes.json()) as any;
    assert.equal(disputeBody.data.escrow_locked, true);
    assert.equal(disputeBody.data.order.escrow_status, 'DISPUTE_LOCKED');
    assert.equal(disputeBody.data.order.status, 'DISPUTED');

    // 2. Govt Admin resolves dispute with refund to buyer
    const resolveRes = await fetch(`${baseUrl}/api/v1/orders/${orderId}/resolve-dispute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${govtToken}`,
      },
      body: JSON.stringify({
        resolution: 'REFUND_TO_BUYER',
      }),
    });

    assert.equal(resolveRes.status, 200);
    const resolveBody = (await resolveRes.json()) as any;
    assert.equal(resolveBody.data.resolution, 'REFUND_TO_BUYER');
    assert.equal(resolveBody.data.order.escrow_status, 'REFUNDED');
  });
});
