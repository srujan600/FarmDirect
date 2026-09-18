-- =========================================================================
-- AgriDirect Supabase Migration 002: Row Level Security (RLS) Policies
-- Security Boundaries: Defense in depth with role-based policies
-- =========================================================================

-- Helper function: Fast role lookup for current authenticated user
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =========================================================================
-- 1. PROFILES RLS
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view user profiles (needed for farmer details, listings, reviews)
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Also allow public read of profiles for marketplace listing display
CREATE POLICY "Public profiles viewable for marketplace"
    ON public.profiles FOR SELECT
    TO anon
    USING (role IN ('FARMER', 'FPO_ADMIN'));

-- Users can insert their own initial profile (if trigger didn't catch it)
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Users can update only their own profile (trigger prevents changing 'role')
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =========================================================================
-- 2. LOCATIONS RLS
-- =========================================================================
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own locations"
    ON public.locations FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.crop_listings cl
            WHERE cl.pickup_location_id = locations.id AND cl.status = 'AVAILABLE'
        )
    );

CREATE POLICY "Users can insert their own locations"
    ON public.locations FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own locations"
    ON public.locations FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own locations"
    ON public.locations FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- =========================================================================
-- 3. CROP LISTINGS RLS
-- =========================================================================
ALTER TABLE public.crop_listings ENABLE ROW LEVEL SECURITY;

-- Anyone (public or authenticated) can view AVAILABLE listings
CREATE POLICY "Available crop listings are viewable by everyone"
    ON public.crop_listings FOR SELECT
    USING (
        status = 'AVAILABLE' OR
        farmer_id = auth.uid() OR
        public.get_auth_user_role() = 'GOVT_ADMIN'
    );

-- Only verified FARMER or FPO_ADMIN accounts can create listings
CREATE POLICY "Farmers can insert their own listings"
    ON public.crop_listings FOR INSERT
    TO authenticated
    WITH CHECK (
        farmer_id = auth.uid() AND
        public.get_auth_user_role() IN ('FARMER', 'FPO_ADMIN')
    );

-- Farmers can update their own listings; Admins can moderate
CREATE POLICY "Farmers can update own listings"
    ON public.crop_listings FOR UPDATE
    TO authenticated
    USING (
        farmer_id = auth.uid() OR
        public.get_auth_user_role() = 'GOVT_ADMIN'
    )
    WITH CHECK (
        farmer_id = auth.uid() OR
        public.get_auth_user_role() = 'GOVT_ADMIN'
    );

-- Farmers can delete draft/cancelled listings
CREATE POLICY "Farmers can delete own listings"
    ON public.crop_listings FOR DELETE
    TO authenticated
    USING (farmer_id = auth.uid() AND status IN ('DRAFT', 'CANCELLED'));

-- =========================================================================
-- 4. ORDERS RLS
-- =========================================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order visibility: Buyer, Farmer selling the lot, Assigned Driver, or Govt Admin
CREATE POLICY "Authorized parties can view orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (
        buyer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.crop_listings cl
            WHERE cl.id = orders.listing_id AND cl.farmer_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.trip_stops ts
            JOIN public.logistics_trips lt ON ts.trip_id = lt.id
            WHERE ts.order_id = orders.id AND lt.driver_id = auth.uid()
        ) OR
        public.get_auth_user_role() = 'GOVT_ADMIN'
    );

-- Buyers can place orders
CREATE POLICY "Buyers can create orders"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (
        buyer_id = auth.uid() AND
        public.get_auth_user_role() IN ('RETAIL_CONSUMER', 'BULK_BUYER')
    );

-- Authorized parties can update order status according to workflow
CREATE POLICY "Authorized parties can update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (
        buyer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.crop_listings cl
            WHERE cl.id = orders.listing_id AND cl.farmer_id = auth.uid()
        ) OR
        public.get_auth_user_role() IN ('LOGISTICS_DRIVER', 'GOVT_ADMIN')
    );

-- =========================================================================
-- 5. AGGREGATION HUBS RLS
-- =========================================================================
ALTER TABLE public.aggregation_hubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hubs are viewable by all users"
    ON public.aggregation_hubs FOR SELECT
    USING (true);

CREATE POLICY "Only admins can manage aggregation hubs"
    ON public.aggregation_hubs FOR ALL
    TO authenticated
    USING (public.get_auth_user_role() = 'GOVT_ADMIN')
    WITH CHECK (public.get_auth_user_role() = 'GOVT_ADMIN');

-- =========================================================================
-- 6. LOGISTICS TRIPS & STOPS RLS
-- =========================================================================
ALTER TABLE public.logistics_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logistics trips viewable by driver and admins"
    ON public.logistics_trips FOR SELECT
    TO authenticated
    USING (
        driver_id = auth.uid() OR
        public.get_auth_user_role() IN ('GOVT_ADMIN', 'FPO_ADMIN')
    );

CREATE POLICY "Drivers can update their own trips"
    ON public.logistics_trips FOR UPDATE
    TO authenticated
    USING (driver_id = auth.uid() OR public.get_auth_user_role() = 'GOVT_ADMIN')
    WITH CHECK (driver_id = auth.uid() OR public.get_auth_user_role() = 'GOVT_ADMIN');

ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trip stops viewable by trip driver or admins"
    ON public.trip_stops FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.logistics_trips lt
            WHERE lt.id = trip_stops.trip_id AND (lt.driver_id = auth.uid() OR public.get_auth_user_role() = 'GOVT_ADMIN')
        )
    );

CREATE POLICY "Drivers can update assigned trip stops"
    ON public.trip_stops FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.logistics_trips lt
            WHERE lt.id = trip_stops.trip_id AND lt.driver_id = auth.uid()
        )
    );

-- =========================================================================
-- 7. AI DEMAND FORECASTS RLS
-- =========================================================================
ALTER TABLE public.ai_demand_forecasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Forecasts are viewable by everyone"
    ON public.ai_demand_forecasts FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage forecasts"
    ON public.ai_demand_forecasts FOR ALL
    TO authenticated
    USING (public.get_auth_user_role() = 'GOVT_ADMIN')
    WITH CHECK (public.get_auth_user_role() = 'GOVT_ADMIN');
