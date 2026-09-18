import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../app.js';

describe('AgriDirect Real-Time Notifications & SSE Engine Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  test('GET /api/v1/notifications/stream establishes SSE stream and receives initial handshake', async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${baseUrl}/api/v1/notifications/stream?role=FARMER`, {
      signal: controller.signal,
    });

    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/event-stream'));

    const reader = res.body?.getReader();
    assert.ok(reader, 'SSE stream reader must exist');

    const { value } = await reader.read();
    clearTimeout(timeout);
    controller.abort();

    const text = new TextDecoder().decode(value);
    assert.ok(text.includes('event: PRICE_ALERT') || text.includes('Telemetry Stream Connected'));
  });

  test('POST /api/v1/notifications/broadcast delivers event to connected SSE listener', async () => {
    const controller = new AbortController();

    const streamRes = await fetch(`${baseUrl}/api/v1/notifications/stream?role=LOGISTICS_DRIVER`, {
      signal: controller.signal,
    });
    const reader = streamRes.body!.getReader();

    // Consume handshake
    await reader.read();

    // Trigger broadcast event
    const broadcastPayload = {
      type: 'TEMPERATURE_ALERT',
      title: 'Reefer Cold Lock Validated',
      message: 'Vehicle MH-15-EV-4289 temperature is 4.1°C',
      target_role: 'LOGISTICS_DRIVER',
    };

    const broadcastRes = await fetch(`${baseUrl}/api/v1/notifications/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(broadcastPayload),
    });

    assert.equal(broadcastRes.status, 200);
    const broadcastBody = (await broadcastRes.json()) as any;
    assert.equal(broadcastBody.data.dispatched, true);
    assert.ok(broadcastBody.data.clients_reached >= 1);

    // Read stream and verify event arrived
    const { value } = await reader.read();
    controller.abort();

    const eventText = new TextDecoder().decode(value);
    assert.ok(eventText.includes('event: TEMPERATURE_ALERT'));
    assert.ok(eventText.includes('Reefer Cold Lock Validated'));
  });

  test('POST /api/v1/notifications/broadcast validates required fields', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notifications/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'PRICE_ALERT',
        // missing title and message
      }),
    });

    assert.equal(res.status, 400);
    const body = (await res.json()) as any;
    assert.equal(body.error.code, 'INVALID_NOTIFICATION');
  });
});
