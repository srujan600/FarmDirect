-- =========================================================================
-- AgriDirect Schema Migration 001: Initial Relational & PostGIS DDL
-- Problem Statement 26033: Direct Kisan-to-Grahak Disintermediation Grid
-- =========================================================================

-- Enable PostGIS & UUID Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. USERS & ROLES
-- =========================================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'FARMER',
        'FPO_ADMIN',
        'BULK_BUYER',
        'RETAIL_CONSUMER',
        'LOGISTICS_DRIVER',
        'GOVT_ADMIN'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'hi',
    aadhaar_hash VARCHAR(64),
    upi_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =========================================================================
-- 2. GEOSPATIAL LOCATIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    address_line TEXT NOT NULL,
    village_or_locality VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    geo_point GEOMETRY(Point, 4326) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_geo ON locations USING GIST(geo_point);
CREATE INDEX IF NOT EXISTS idx_locations_district ON locations(district);

-- =========================================================================
-- 3. CROP CATALOG & HARVEST LISTINGS
-- =========================================================================
DO $$ BEGIN
    CREATE TYPE crop_category AS ENUM (
        'GRAINS',
        'PULSES',
        'VEGETABLES',
        'FRUITS',
        'OILSEEDS',
        'SPICES'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE listing_status AS ENUM (
        'DRAFT',
        'AVAILABLE',
        'RESERVED',
        'IN_TRANSIT',
        'SOLD',
        'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS crop_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    category crop_category NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    total_quantity_kg NUMERIC(12, 2) NOT NULL CHECK (total_quantity_kg > 0),
    available_quantity_kg NUMERIC(12, 2) NOT NULL CHECK (available_quantity_kg >= 0),
    minimum_order_kg NUMERIC(10, 2) DEFAULT 1.0 CHECK (minimum_order_kg > 0),
    price_per_kg_expected NUMERIC(10, 2) NOT NULL CHECK (price_per_kg_expected > 0),
    mandi_benchmark_price NUMERIC(10, 2),
    harvest_date DATE NOT NULL,
    shelf_life_days INT NOT NULL CHECK (shelf_life_days > 0),
    quality_grade VARCHAR(10) DEFAULT 'A',
    quality_assay JSONB DEFAULT '{}'::jsonb,
    images_urls TEXT[] DEFAULT '{}',
    status listing_status DEFAULT 'AVAILABLE',
    pickup_location_id UUID REFERENCES locations(id),
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_farmer ON crop_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON crop_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON crop_listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_crop ON crop_listings(crop_name);
CREATE INDEX IF NOT EXISTS idx_listings_harvest ON crop_listings(harvest_date);

-- =========================================================================
-- 4. ORDERS & DISINTERMEDIATION PRICING
-- =========================================================================
DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'PLACED',
        'ESCROW_FUNDED',
        'PICKUP_SCHEDULED',
        'IN_COLLECTION',
        'AT_HUB',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'COMPLETED',
        'DISPUTED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    listing_id UUID REFERENCES crop_listings(id) ON DELETE RESTRICT,
    quantity_kg NUMERIC(12, 2) NOT NULL CHECK (quantity_kg > 0),
    farmer_unit_price NUMERIC(10, 2) NOT NULL CHECK (farmer_unit_price >= 0),
    logistics_fee NUMERIC(10, 2) NOT NULL CHECK (logistics_fee >= 0),
    platform_fee NUMERIC(10, 2) NOT NULL CHECK (platform_fee >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    escrow_status VARCHAR(30) DEFAULT 'HELD_IN_ESCROW',
    status order_status DEFAULT 'PLACED',
    delivery_location_id UUID REFERENCES locations(id),
    scheduled_delivery_slot TSRANGE,
    qr_provenance_hash VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing ON orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- =========================================================================
-- 5. AGGREGATION HUBS & LOGISTICS FLEET
-- =========================================================================
CREATE TABLE IF NOT EXISTS aggregation_hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_name VARCHAR(150) NOT NULL,
    hub_location GEOMETRY(Point, 4326) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    capacity_metric_tons NUMERIC(10, 2) NOT NULL,
    cold_storage_available BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_hubs_geo ON aggregation_hubs USING GIST(hub_location);
CREATE INDEX IF NOT EXISTS idx_hubs_district ON aggregation_hubs(district);

CREATE TABLE IF NOT EXISTS logistics_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    vehicle_reg_number VARCHAR(50) NOT NULL,
    max_payload_kg NUMERIC(10, 2) NOT NULL,
    destination_hub_id UUID REFERENCES aggregation_hubs(id),
    optimized_polyline TEXT,
    total_distance_km NUMERIC(8, 2),
    estimated_duration_minutes INT,
    capacity_utilized_kg NUMERIC(10, 2) DEFAULT 0.0,
    trip_status VARCHAR(30) DEFAULT 'PLANNED',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_trips_driver ON logistics_trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON logistics_trips(trip_status);

CREATE TABLE IF NOT EXISTS trip_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES logistics_trips(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    stop_sequence INT NOT NULL,
    stop_type VARCHAR(20) NOT NULL, -- 'PICKUP' or 'DROPOFF'
    waypoint_point GEOMETRY(Point, 4326) NOT NULL,
    expected_arrival_time TIMESTAMP WITH TIME ZONE,
    actual_arrival_time TIMESTAMP WITH TIME ZONE,
    weight_verified_kg NUMERIC(10, 2),
    is_completed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_stops_trip ON trip_stops(trip_id);
CREATE INDEX IF NOT EXISTS idx_stops_geo ON trip_stops USING GIST(waypoint_point);

-- =========================================================================
-- 6. AI DEMAND FORECAST STORAGE
-- =========================================================================
CREATE TABLE IF NOT EXISTS ai_demand_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    forecast_date DATE NOT NULL,
    projected_demand_quintals NUMERIC(12, 2) NOT NULL,
    confidence_interval_low NUMERIC(12, 2),
    confidence_interval_high NUMERIC(12, 2),
    suggested_retail_price_range NUMSRANGE,
    demand_classification VARCHAR(30) DEFAULT 'EQUILIBRIUM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forecasts_crop_district ON ai_demand_forecasts(crop_name, district);
CREATE INDEX IF NOT EXISTS idx_forecasts_date ON ai_demand_forecasts(forecast_date);
