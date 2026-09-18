import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import {
  initDatabase,
  ListingRepository,
  OrderRepository,
  UserRepository,
  TransactionScope,
} from './index.js';

describe('AgriDirect Database & Concurrency Layer Tests', () => {
  before(async () => {
    await initDatabase();
  });

  test('Database seeded with deterministic users and listings matching Stitch', async () => {
    const users = await UserRepository.getAll();
    assert.ok(users.length >= 6, 'Should have at least 6 deterministic users');

    const farmer = await UserRepository.findByPhone('+919823014289');
    assert.ok(farmer, 'Farmer Balasaheb Shinde should exist');
    assert.strictEqual(farmer.full_name, 'Balasaheb Shinde');
    assert.strictEqual(farmer.role, 'FARMER');

    const availableListings = await ListingRepository.findAvailable();
    assert.ok(availableListings.length >= 4, 'Should have 4 available listings');

    const tomatoListing = availableListings.find((l) => l.crop_name.includes('Tomatoes'));
    assert.ok(tomatoListing, 'Tomato listing should exist');
    assert.strictEqual(tomatoListing.quality_grade, 'A+');
    assert.strictEqual(tomatoListing.price_per_kg_expected, 34.0);
  });

  test('Prevent overselling: quantity reservation respects available inventory', async () => {
    const listings = await ListingRepository.findAvailable();
    const listing = listings[0];
    const initialAvailable = listing.available_quantity_kg;

    const buyer = await UserRepository.findByPhone('+919821098765');
    assert.ok(buyer, 'Buyer should exist');

    // 1. Valid order within quantity limits
    const validOrder = await OrderRepository.createOrderTransactional({
      buyer_id: buyer.id,
      listing_id: listing.id,
      quantity_kg: 50.0,
    });

    assert.ok(validOrder.id, 'Order should be assigned an ID');
    assert.strictEqual(validOrder.status, 'PLACED');

    const updatedListing = await ListingRepository.findById(listing.id);
    assert.ok(updatedListing, 'Listing must exist');
    assert.strictEqual(
      updatedListing.available_quantity_kg,
      initialAvailable - 50.0,
      'Available quantity must be decremented by exactly 50kg'
    );

    // 2. Overselling attempt (requesting more than available)
    const excessiveQuantity = updatedListing.available_quantity_kg + 1000.0;
    await assert.rejects(
      async () => {
        await OrderRepository.createOrderTransactional({
          buyer_id: buyer.id,
          listing_id: listing.id,
          quantity_kg: excessiveQuantity,
        });
      },
      {
        message: /Insufficient Inventory/,
      },
      'Must reject order exceeding available inventory'
    );

    // Assert quantity remained untouched after rejection
    const listingAfterRejection = await ListingRepository.findById(listing.id);
    assert.strictEqual(
      listingAfterRejection?.available_quantity_kg,
      initialAvailable - 50.0,
      'Inventory must not change on failed transaction'
    );
  });

  test('Pricing identity holds: Consumer Total == Farmer Payout + Logistics + Platform Fee (2 decimal places)', async () => {
    const buyer = await UserRepository.findByPhone('+919821098765');
    const listings = await ListingRepository.findAvailable();
    const listing = listings[0];

    const order = await OrderRepository.createOrderTransactional({
      buyer_id: buyer!.id,
      listing_id: listing.id,
      quantity_kg: 10.0,
    });

    const calculatedTotal = Number(
      (
        (order.farmer_unit_price + order.logistics_fee + order.platform_fee) *
        order.quantity_kg
      ).toFixed(2)
    );

    assert.strictEqual(
      order.total_amount,
      calculatedTotal,
      'Order total must strictly equal sum of farmer payout, logistics, and platform fee'
    );
  });
});
