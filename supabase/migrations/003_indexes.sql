-- =========================================================================
-- AgriDirect Supabase Migration 003: Performance Indexes
-- =========================================================================

-- Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Locations Indexes
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON public.locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_district ON public.locations(district);
CREATE INDEX IF NOT EXISTS idx_locations_state ON public.locations(state);
CREATE INDEX IF NOT EXISTS idx_locations_lat_long ON public.locations(latitude, longitude);

-- Crop Listings Indexes
CREATE INDEX IF NOT EXISTS idx_listings_farmer_id ON public.crop_listings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.crop_listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.crop_listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_crop_name ON public.crop_listings(crop_name);
CREATE INDEX IF NOT EXISTS idx_listings_harvest_date ON public.crop_listings(harvest_date);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.crop_listings(created_at DESC);

-- Orders Indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_listing_id ON public.orders(listing_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_escrow_status ON public.orders(escrow_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Aggregation Hubs Indexes
CREATE INDEX IF NOT EXISTS idx_hubs_district ON public.aggregation_hubs(district);
CREATE INDEX IF NOT EXISTS idx_hubs_state ON public.aggregation_hubs(state);

-- Logistics Trips & Stops Indexes
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.logistics_trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.logistics_trips(trip_status);
CREATE INDEX IF NOT EXISTS idx_trips_hub_id ON public.logistics_trips(destination_hub_id);
CREATE INDEX IF NOT EXISTS idx_stops_trip_id ON public.trip_stops(trip_id);
CREATE INDEX IF NOT EXISTS idx_stops_order_id ON public.trip_stops(order_id);

-- AI Demand Forecasts Indexes
CREATE INDEX IF NOT EXISTS idx_forecasts_crop_district ON public.ai_demand_forecasts(crop_name, district);
CREATE INDEX IF NOT EXISTS idx_forecasts_date ON public.ai_demand_forecasts(forecast_date);
