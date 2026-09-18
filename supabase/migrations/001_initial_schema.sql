-- =========================================================================
-- AgriDirect Supabase Migration 001: Initial Relational PostgreSQL DDL
-- Problem Statement 26033: Direct Kisan-to-Grahak Disintermediation Grid
-- =========================================================================

-- Enable UUID & Crypto Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. ENUM TYPES
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

-- =========================================================================
-- 2. USER PROFILES (Linked to Supabase Auth auth.users)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    phone_number VARCHAR(15),
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'RETAIL_CONSUMER',
    preferred_language VARCHAR(10) DEFAULT 'hi',
    aadhaar_hash VARCHAR(64),
    upi_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function & Trigger: Automatically create public profile on Supabase auth.users signup/OTP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        phone_number,
        preferred_language,
        upi_id
    ) VALUES (
        new.id,
        coalesce(new.email, ''),
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        coalesce((new.raw_user_meta_data->>'role')::user_role, 'RETAIL_CONSUMER'::user_role),
        new.raw_user_meta_data->>'phone_number',
        coalesce(new.raw_user_meta_data->>'preferred_language', 'hi'),
        new.raw_user_meta_data->>'upi_id'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = excluded.email,
        updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Prevent client-controlled privilege/role escalation on profiles
CREATE OR REPLACE FUNCTION public.prevent_profile_role_update()
RETURNS trigger AS $$
BEGIN
    IF new.role IS DISTINCT FROM old.role AND current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
        RAISE EXCEPTION 'Users are not permitted to change their own role.';
    END IF;
    new.updated_at = NOW();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_profile_role_protection ON public.profiles;
CREATE TRIGGER enforce_profile_role_protection
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_update();

-- =========================================================================
-- 3. GEOSPATIAL & PHYSICAL LOCATIONS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    address_line TEXT NOT NULL,
    village_or_locality VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL DEFAULT 0.0,
    longitude NUMERIC(10, 6) NOT NULL DEFAULT 0.0,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 4. CROP CATALOG & HARVEST LISTINGS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.crop_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
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
    pickup_location_id UUID REFERENCES public.locations(id),
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 5. ORDERS & DISINTERMEDIATION ESCROW PRICING
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    listing_id UUID NOT NULL REFERENCES public.crop_listings(id) ON DELETE RESTRICT,
    quantity_kg NUMERIC(12, 2) NOT NULL CHECK (quantity_kg > 0),
    farmer_unit_price NUMERIC(10, 2) NOT NULL CHECK (farmer_unit_price >= 0),
    logistics_fee NUMERIC(10, 2) NOT NULL CHECK (logistics_fee >= 0),
    platform_fee NUMERIC(10, 2) NOT NULL CHECK (platform_fee >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    escrow_status VARCHAR(30) DEFAULT 'HELD_IN_ESCROW',
    status order_status DEFAULT 'PLACED',
    delivery_location_id UUID REFERENCES public.locations(id),
    scheduled_delivery_slot TEXT,
    qr_provenance_hash VARCHAR(128),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 6. AGGREGATION HUBS & LOGISTICS FLEET
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.aggregation_hubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hub_name VARCHAR(150) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    capacity_metric_tons NUMERIC(10, 2) NOT NULL,
    cold_storage_available BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.logistics_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    vehicle_reg_number VARCHAR(50) NOT NULL,
    max_payload_kg NUMERIC(10, 2) NOT NULL,
    destination_hub_id UUID REFERENCES public.aggregation_hubs(id),
    optimized_polyline TEXT,
    total_distance_km NUMERIC(8, 2),
    estimated_duration_minutes INT,
    capacity_utilized_kg NUMERIC(10, 2) DEFAULT 0.0,
    trip_status VARCHAR(30) DEFAULT 'PLANNED',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.trip_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.logistics_trips(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id),
    stop_sequence INT NOT NULL,
    stop_type VARCHAR(20) NOT NULL, -- 'PICKUP' or 'DROPOFF'
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    expected_arrival_time TIMESTAMPTZ,
    actual_arrival_time TIMESTAMPTZ,
    weight_verified_kg NUMERIC(10, 2),
    is_completed BOOLEAN DEFAULT FALSE
);

-- =========================================================================
-- 7. AI DEMAND FORECAST STORAGE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.ai_demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    forecast_date DATE NOT NULL,
    projected_demand_quintals NUMERIC(12, 2) NOT NULL,
    confidence_interval_low NUMERIC(12, 2),
    confidence_interval_high NUMERIC(12, 2),
    suggested_price_min NUMERIC(10, 2),
    suggested_price_max NUMERIC(10, 2),
    demand_classification VARCHAR(30) DEFAULT 'EQUILIBRIUM',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
