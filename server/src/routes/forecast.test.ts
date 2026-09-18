import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../app.js';

describe('AgriDirect AI Demand Forecasting & Telemetry Test Suite', () => {
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

  test('GET /api/v1/forecasts returns 30-day projection, time series, and harvest advisory', async () => {
    const res = await fetch(`${baseUrl}/api/v1/forecasts`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    assert.ok(body.data, 'Should return data payload');
    assert.ok(body.data.summary, 'Should return forecast summary');
    assert.ok(body.data.time_series, 'Should return time series points');
    assert.ok(body.data.advisory, 'Should return harvest advisory');

    const summary = body.data.summary;
    assert.equal(summary.crop_name, 'Tomato');
    assert.equal(summary.district, 'Nashik');
    assert.ok(summary.projected_demand_quintals > 0);
    assert.ok(summary.confidence_interval_low < summary.confidence_interval_high);
    assert.ok(summary.suggested_price_min <= summary.suggested_price_max);
    assert.ok(summary.optimal_harvest_window_start);
    assert.ok(summary.optimal_harvest_window_end);

    // Verify time series structure
    assert.equal(body.data.time_series.length, 6);
    const firstPoint = body.data.time_series[0];
    assert.ok(firstPoint.date);
    assert.ok(firstPoint.arrival_pct.includes('%'));
    assert.ok(firstPoint.demand_pct.includes('%'));
    assert.ok(firstPoint.projected_modal_price > 0);
  });

  test('GET /api/v1/forecasts supports custom crop and district filtering', async () => {
    const res = await fetch(`${baseUrl}/api/v1/forecasts?crop=Onion&district=Lasalgaon`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    assert.equal(body.data.summary.crop_name, 'Onion');
    assert.equal(body.data.summary.district, 'Lasalgaon');
    assert.ok(body.data.summary.projected_demand_quintals >= 8000, 'Onion demand baseline should be higher');
  });

  test('GET /api/v1/forecasts/telemetry returns micro-climate and IoT radar indicators', async () => {
    const res = await fetch(`${baseUrl}/api/v1/forecasts/telemetry?district=Nashik`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    const telemetry = body.data;
    assert.equal(telemetry.district, 'Nashik');
    assert.equal(typeof telemetry.temperature_celsius, 'number');
    assert.equal(typeof telemetry.relative_humidity_pct, 'number');
    assert.equal(typeof telemetry.soil_moisture_index, 'number');
    assert.ok(telemetry.precipitation_forecast_summary);
    assert.ok(telemetry.precool_storage_celsius > 0);
  });
});
