-- =========================================================================
-- AgriDirect Supabase Master Seed Data
-- Only initializes sovereign aggregation hubs and baseline forecast reference data
-- No fake production users, fake orders, or fake transactions are created.
-- =========================================================================

-- Reference Regional Aggregation Hubs (Maharashtra / Nashik Agro Corridor)
INSERT INTO public.aggregation_hubs (
    id,
    hub_name,
    latitude,
    longitude,
    district,
    state,
    capacity_metric_tons,
    cold_storage_available
) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Nashik Central Aggregation Hub', 20.0063, 73.7900, 'Nashik', 'Maharashtra', 500.00, true),
    ('a2000000-0000-0000-0000-000000000002', 'Dindori Pre-Cooling & Assay Terminal', 20.2030, 73.8340, 'Nashik', 'Maharashtra', 250.00, true),
    ('a3000000-0000-0000-0000-000000000003', 'Pimpalgaon APMC Cold Chain Ingress', 20.1685, 73.9870, 'Nashik', 'Maharashtra', 400.00, true)
ON CONFLICT (id) DO NOTHING;

-- Initial Baseline Reference Forecast (Tomato / Nashik)
INSERT INTO public.ai_demand_forecasts (
    id,
    crop_name,
    district,
    forecast_date,
    projected_demand_quintals,
    confidence_interval_low,
    confidence_interval_high,
    suggested_price_min,
    suggested_price_max,
    demand_classification
) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'Tomato', 'Nashik', CURRENT_DATE, 1420.00, 1310.00, 1540.00, 32.00, 38.00, 'EQUILIBRIUM')
ON CONFLICT (id) DO NOTHING;
