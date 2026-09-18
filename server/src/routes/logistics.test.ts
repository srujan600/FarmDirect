import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { app } from '../app.js';

describe('AgriDirect Cold-Chain Logistics & CVRPTW Test Suite', () => {
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

  test('GET /api/v1/logistics/trips returns active cold aggregation trips', async () => {
    const res = await fetch(`${baseUrl}/api/v1/logistics/trips`);
    assert.equal(res.status, 200);

    const body = (await res.json()) as any;
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);

    const trip = body.data[0];
    assert.equal(trip.vehicle_reg_number, 'MH-15-EV-4289');
    assert.equal(trip.destination_hub.district, 'Nashik');
    assert.ok(trip.stops.length >= 4);
    assert.equal(trip.stops[0].is_completed, true);
    assert.equal(trip.stops[0].stop_type, 'PICKUP');
  });

  test('GET /api/v1/logistics/trips/:id returns details or 404', async () => {
    const resFound = await fetch(`${baseUrl}/api/v1/logistics/trips/trip_mh_nashik_04`);
    assert.equal(resFound.status, 200);
    const bodyFound = (await resFound.json()) as any;
    assert.equal(bodyFound.data.id, 'trip_mh_nashik_04');

    const resNotFound = await fetch(`${baseUrl}/api/v1/logistics/trips/trip_nonexistent_999`);
    assert.equal(resNotFound.status, 404);
  });

  test('POST /api/v1/logistics/optimize solves CVRPTW with capacity constraints and CO2 metric', async () => {
    const payload = {
      depot: { latitude: 20.1746, longitude: 73.9856 }, // Pimpalgaon Central Hub
      vehicles: [
        { id: 'ev_reefer_01', capacity_kg: 1200, type: 'TATA_ACE_EV' },
      ],
      stops: [
        {
          id: 'farm_khed_01',
          location: { latitude: 20.0215, longitude: 73.8123 },
          demand_kg: 400,
          time_window_start_min: 390,
          time_window_end_min: 450,
          stop_type: 'PICKUP',
          farmer_name: 'Balasaheb Shinde',
          address_summary: 'Khed Farm Gate',
        },
        {
          id: 'farm_dindori_02',
          location: { latitude: 20.1142, longitude: 73.8421 },
          demand_kg: 350,
          time_window_start_min: 420,
          time_window_end_min: 480,
          stop_type: 'PICKUP',
          farmer_name: 'Dindori Cluster',
          address_summary: 'Survey 42 Dindori',
        },
        {
          id: 'farm_ozar_03',
          location: { latitude: 20.1512, longitude: 73.9102 },
          demand_kg: 250,
          time_window_start_min: 460,
          time_window_end_min: 520,
          stop_type: 'PICKUP',
          farmer_name: 'Ozar FPO Cold Lock',
          address_summary: 'Ozar Warehouse',
        },
      ],
    };

    const res = await fetch(`${baseUrl}/api/v1/logistics/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    const result = body.data;

    assert.ok(result.trips.length > 0);
    const trip = result.trips[0];
    assert.equal(trip.vehicle_id, 'ev_reefer_01');
    assert.equal(trip.stops.length, 3);
    assert.equal(trip.capacity_utilization_percentage, 83.3); // 1000kg / 1200kg
    assert.ok(trip.total_distance_km > 0);
    assert.ok(result.co2_avoided_kg > 0);
    assert.ok(result.computation_time_seconds < 1.0);
  });

  test('PATCH /api/v1/logistics/trips/:id/telemetry updates stop status and reefer temperature', async () => {
    const res = await fetch(`${baseUrl}/api/v1/logistics/trips/trip_mh_nashik_04/telemetry`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        completed_stop_id: 'stop_3',
        weight_verified_kg: 260,
        temperature_celsius: 4.1,
      }),
    });

    assert.equal(res.status, 200);
    const body = (await res.json()) as any;
    const stop3 = body.data.stops.find((s: any) => s.id === 'stop_3');
    assert.equal(stop3.is_completed, true);
    assert.equal(stop3.weight_verified_kg, 260);
    assert.equal(stop3.temperature_celsius, 4.1);
  });
});
