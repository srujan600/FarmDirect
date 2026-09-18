import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { initDatabase } from '../db/index.js';
import { app } from '../app.js';
import http from 'node:http';

describe('AgriDirect Authentication & RBAC Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    await initDatabase();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as { port: number };
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  test('POST /api/v1/auth/register creates a new user and returns JWT token', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: '+919876543210',
        full_name: 'Suresh Patil',
        role: 'FARMER',
        preferred_language: 'mr',
        upi_id: 'suresh@ybl',
      }),
    });

    assert.strictEqual(res.status, 201, 'Should respond with 201 Created');
    const json = await res.json();
    assert.ok(json.data.token, 'Should return a JWT token');
    assert.strictEqual(json.data.user.full_name, 'Suresh Patil');
    assert.strictEqual(json.data.user.role, 'FARMER');
  });

  test('POST /api/v1/auth/register returns 409 for duplicate phone number', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: '+919876543210',
        full_name: 'Duplicate Suresh',
        role: 'FARMER',
      }),
    });

    assert.strictEqual(res.status, 409, 'Should respond with 409 Conflict');
    const json = await res.json();
    assert.strictEqual(json.error.code, 'USER_ALREADY_EXISTS');
  });

  test('POST /api/v1/auth/login logs in seeded farmer and returns JWT', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: '+919823014289', // Balasaheb Shinde
      }),
    });

    assert.strictEqual(res.status, 200, 'Should respond with 200 OK');
    const json = await res.json();
    assert.ok(json.data.token, 'Should return a valid JWT token');
    assert.strictEqual(json.data.user.full_name, 'Balasaheb Shinde');
    assert.strictEqual(json.data.user.role, 'FARMER');
  });

  test('GET /api/v1/auth/me rejects unauthenticated request with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`);
    assert.strictEqual(res.status, 401, 'Should respond with 401 Unauthorized');
    const json = await res.json();
    assert.strictEqual(json.error.code, 'UNAUTHORIZED');
  });

  test('GET /api/v1/auth/me returns current user when valid token provided', async () => {
    // 1. Login
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919823014289' }),
    });
    const { data: { token } } = await loginRes.json();

    // 2. Request profile
    const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(meRes.status, 200);
    const meJson = await meRes.json();
    assert.strictEqual(meJson.data.phone_number, '+919823014289');
    assert.strictEqual(meJson.data.role, 'FARMER');
  });

  test('RBAC Guard: FARMER cannot access GOVT_ADMIN route (403 Forbidden)', async () => {
    // 1. Login as FARMER
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919823014289' }),
    });
    const { data: { token } } = await loginRes.json();

    // 2. Access Admin-only route
    const adminRes = await fetch(`${baseUrl}/api/v1/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(adminRes.status, 403, 'Farmer must be forbidden from Admin route');
    const json = await adminRes.json();
    assert.strictEqual(json.error.code, 'FORBIDDEN');
  });

  test('RBAC Guard: GOVT_ADMIN can access admin routes (200 OK)', async () => {
    // 1. Login as GOVT_ADMIN
    const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: '+919999900001' }),
    });
    const { data: { token } } = await loginRes.json();

    // 2. Access Admin route
    const adminRes = await fetch(`${baseUrl}/api/v1/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(adminRes.status, 200, 'Govt admin should have access');
    const json = await adminRes.json();
    assert.ok(Array.isArray(json.data), 'Should return user list');
    assert.ok(json.data.length >= 6);
  });

  after(async () => {
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
