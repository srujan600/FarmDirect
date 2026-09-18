# Product Requirement Document (PRD) & Engineering Specification

**Project Name:** AgriDirect (Kisan-to-Grahak direct PWA)  
**Problem Statement ID:** 26033  
**Title:** Multiple intermediaries reduce farmers' earnings and increase consumer prices  
**Target Ministry:** Ministry of Consumer Affairs, Food & Public Distribution (DoCA)  
**Theme:** Agriculture, FoodTech & Rural Development  
**Version:** 1.0.0-PROD  

---

## 1. Executive Summary & Problem Analysis

### 1.1 The Core Problem
In traditional agricultural supply chains in India, produce passes through 4 to 7 intermediaries (Local Aggregator $\to$ APMC Commission Agent (Arhatiya) $\to$ Wholesaler $\to$ Sub-Wholesaler $\to$ Retailer $\to$ Street Vendor). 
* **Farmer's Share:** Farmers often receive as little as $25\% - 35\%$ of the final consumer retail price.
* **Wastage & Post-Harvest Losses:** Inefficient handling, prolonged transit times, and lack of temperature-controlled aggregated logistics lead to $15\% - 25\%$ perishable spoilage.
* **Consumer Inflation:** End consumers pay high markups driven by intermediary margins and transit inefficiencies rather than quality.

### 1.2 The Solution: AgriDirect PWA
A unified, lightweight Progressive Web App (PWA) operating under a single responsive codebase:
1. **Direct Disintermediation:** Farmers and Farmer Producer Organizations (FPOs) list produce directly for retail consumers and institutional bulk buyers (hotels, restaurants, supermarkets, hostel canteens).
2. **Integrated Logistics & Micro-Hub Pooling:** Aggregates farm pickups into optimal clusters to minimize cold-chain/transport costs.
3. **AI Demand Forecasting Engine:** Employs temporal forecasting models (e.g., LightGBM / Prophet / DeepAR) against mandi pricing trends (Agmarknet datasets), seasonality, and consumption patterns to guide planting/harvesting decisions and prevent distress sales.
4. **AI Route Optimization Engine:** Solves Capacitated Vehicle Routing Problems with Time Windows (CVRPTW) to dynamically cluster rural farm pickups and urban hub drop-offs.
5. **Hyper-Accessible PWA Architecture:** Works offline in low-connectivity rural belts with service worker caching, background sync, vernacular multi-lingual UI, and audio-guided entry.

---

## 2. Personas & Use Case Matrix

| Persona | Environment & Constraints | Core Workflows | Key UX Requirements |
| :--- | :--- | :--- | :--- |
| **Farmer / FPO Lead** | Low-tier Android devices, 2G/3G/intermittent 4G, varied digital literacy. | List crop yield, review MSP vs. Market Price, accept aggregated pickups, receive direct UPI/Escrow payments. | Voice-assisted input, vernacular support (Hindi, Marathi, Telugu, etc.), image capture with AI quality grading, offline draft persistence. |
| **Bulk Buyer (B2B)** | Desktop / Tablet, reliable broadband. | Bulk requisition, forward contract booking, auction/bidding on FPO lots, aggregated invoice generation. | Tabular lot inspection, certificate verification, automated GST invoicing, recurring scheduled delivery. |
| **Retail Consumer (B2C)** | Smartphone (Mobile Safari / Chrome), high expectations for quick e-commerce UX. | Explore farm-fresh produce, price transparency breakdown (Farmer share vs. Logistics vs. System fee), group buying (community buying club). | Transparent price breakdown meter, scheduled drop-off alerts, UPI checkout. |
| **Logistics Driver / Aggregator** | Smartphone on vehicle mount, field transit. | Run scheduled pickup route, verify lot weights via digital scale/OCR, transfer produce to city micro-hub. | Step-by-step turn-by-turn waypoint routing, offline check-in, dynamic route re-calculation. |
| **DoCA / Admin Officer** | Desktop terminal. | Monitor regional inflation, trace food miles, trigger price stabilization interventions when hoarding/shortages emerge. | Real-time geospatial heatmaps, supply/demand predictive charts, anomaly alerts. |

---

## 3. System Architecture & High-Level Design

```
+-----------------------------------------------------------------------------------+
|                                  Client Tier                                      |
|  +-----------------------------------------------------------------------------+  |
|  |             AgriDirect Progressive Web App (React 19 / Vite / PWA)          |  |
|  |  +---------------------+  +--------------------+  +----------------------+  |  |
|  |  |   Farmer Portal     |  |  Bulk & B2C Store  |  |  Logistics Dispatch  |  |  |
|  |  | (Voice/Offline-1st) |  | (Cart / Contracts) |  | (Leaflet Map CVRPTW) |  |  |
|  |  +---------------------+  +--------------------+  +----------------------+  |  |
|  |                 Service Worker Engine (Workbox v7 / CacheStorage)           |  |
|  |         [Offline IndexedDB Sync] <---> [Background Sync Queue API]          |  |
|  +-----------------------------------------------------------------------------+  |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / WSS / gRPC-Web
+------------------------------------------v----------------------------------------+
|                               API Gateway & Ingress                               |
|        Cloudflare / Reverse Proxy + Rate Limiting + Auth Middleware (JWT/OTP)     |
+------------------------------------------+----------------------------------------+
                                           |
    +--------------------------------------+---------------------------------+
    |                                                                        |
+---v--------------------------------------+      +--------------------------v------+
|       Core Application Services (Node/Go)        |   AI & Mathematical Engine (Python)     |
| - Identity & RBAC Service (Farmers, Buyers)      | - Demand Forecasting (Prophet/LightGBM)|
| - Catalog & Inventory Lifecycle Engine           | - Route Optimizer (OR-Tools CVRPTW)    |
| - Order, Escrow & Payment Settlement (UPI/e-RUPI)| - Price Recommendation Engine (Agmark) |
| - Logistics Dispatch & Micro-hub Allocation      | - Computer Vision Produce Grader       |
+-------------------+----------------------+      +--------------------+------------+
                    |                                                   |
+-------------------v---------------------------------------------------v-----------+
|                                   Data Persistence Tier                           |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
|  |   PostgreSQL (PostGIS)|  | Redis Cache & Pub/Sub |  | S3 / MinIO Object St. |  |
|  | Core Tables + GeoJSON |  | Real-time driver GPS  |  | Produce Images, QC    |  |
|  | spatial coordinates   |  | locks, short-term req |  | inspection certificates|
|  +-----------------------+  +-----------------------+  +-----------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 4. Key Functional Modules

### 4.1 Module 1: The Transparent Marketplace & Pricing Engine
* **Price Disaggregation Component:** Every SKU item displays a dynamic breakdown:
  $$\text{Consumer Price} = \text{Farmer Realization } (75\%) + \text{Aggregated Transport } (15\%) + \text{QC \& Tech Fee } (10\%)$$
  *Versus traditional supply chain where Farmer Realization is $\le 30\%$.*
* **MSP Sentinel:** Automatically syncs with Agmarknet/APMC benchmark prices. If a farmer enters a rate below MSP or prevailing mandi floor, the system triggers a warning indicating fair market value.
* **Dual-Market Tiers:**
  * **Retail (B2C):** Minimum order $2\text{ kg} - 10\text{ kg}$; batch-delivered to neighborhood collection points or doorsteps.
  * **Bulk (B2B):** Minimum order $50\text{ kg} - 10\text{ metric tons}$; features escrow-backed split milestones ($30\%$ advance, $70\%$ post-inspection release).

### 4.2 Module 2: AI Demand Forecasting Engine
* **Objective:** Prevent gluts (which lead to price crashes) and shortages (which cause consumer inflation).
* **Input Features:**
  * Historical consumption rates per pin code / city tier.
  * Daily Agmarknet mandi arrivals & historical wholesale price indices.
  * Meteorological forecasts (IMD rain alerts, heatwave warnings affecting shelf-life).
  * Upcoming socio-cultural events (festivals, wedding seasons).
* **Execution:**
  * Microservices run inference using an ensemble model:
    $$\hat{y}_{t} = \alpha \cdot \text{LightGBM}(X_t) + (1-\alpha) \cdot \text{Prophet}(X_t)$$
  * Generates a 7-day and 30-day forecast across clusters, signaling farmers on when to harvest and alerting institutional buyers to pre-book.

### 4.3 Module 3: AI Route Optimization & Micro-Hub Dispatch
* **Problem Formulation:** Capacitated Vehicle Routing Problem with Time Windows (CVRPTW).
* **Inputs:**
  * $N$ farm pickup locations with ready harvest weights $w_i$, perishable time-windows $[e_i, l_i]$.
  * Fleet of $K$ aggregation vehicles with capacity $C_k$ (ambient vs. refrigerated).
  * Target drop-off: Urban Distribution Micro-Hub (sorting & pack house).
* **Solver:** Google OR-Tools in Python computing minimum distance/time routes:
  $$\min \sum_{i} \sum_{j} c_{ij} x_{ij}$$
  subject to vehicle load $\le C_k$ and arrival time $t_i \in [e_i, l_i]$.
* **Logistics Dynamic:** A farmer receives an SMS / voice push: *"Logistics Van #KA-04-1234 will pick up your 5 quintals of tomatoes at 09:30 AM tomorrow."*

### 4.4 Module 4: PWA Offline-First & Vernacular Engine
* **PWA Web Manifest & Service Workers:**
  * Native app shell cached via Cache-First strategy.
  * Data caching using IndexedDB via `Dexie.js` or `idb`.
  * Form inputs (e.g., "Add New Crop Harvest") persist offline if connection drops in the field; background sync registers a `sync` event that broadcasts when connectivity resumes.
* **Accessibility:**
  * Web Speech API integration (`webkitSpeechRecognition`) permitting vernacular speech-to-text for crop type, expected weight, and village name.
  * High-contrast, icon-heavy UI cards with minimal text jargon.

---

## 5. Complete Relational Database Schema (PostgreSQL + PostGIS)

```sql
-- Enable PostGIS for geospatial route and polygon calculations
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USER & ROLE MANAGEMENT
CREATE TYPE user_role AS ENUM ('FARMER', 'FPO_ADMIN', 'BULK_BUYER', 'RETAIL_CONSUMER', 'LOGISTICS_DRIVER', 'GOVT_ADMIN');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'hi',
    aadhaar_hash VARCHAR(64), -- Zero-Knowledge or hashed identifier for verification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    address_line TEXT NOT NULL,
    village_or_locality VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    geo_point GEOMETRY(Point, 4326) NOT NULL, -- Latitude & Longitude stored as WGS84 point
    is_primary BOOLEAN DEFAULT TRUE
);

-- CROPS & HARVEST LISTINGS
CREATE TYPE crop_category AS ENUM ('GRAINS', 'PULSES', 'VEGETABLES', 'FRUITS', 'OILSEEDS', 'SPICES');
CREATE TYPE listing_status AS ENUM ('DRAFT', 'AVAILABLE', 'RESERVED', 'IN_TRANSIT', 'SOLD', 'CANCELLED');

CREATE TABLE crop_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    category crop_category NOT NULL,
    crop_name VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    total_quantity_kg NUMERIC(12, 2) NOT NULL,
    available_quantity_kg NUMERIC(12, 2) NOT NULL,
    minimum_order_kg NUMERIC(10, 2) DEFAULT 1.0,
    price_per_kg_expected NUMERIC(10, 2) NOT NULL,
    mandi_benchmark_price NUMERIC(10, 2), -- Computed baseline from Agmarknet
    harvest_date DATE NOT NULL,
    shelf_life_days INT NOT NULL,
    quality_grade VARCHAR(5) DEFAULT 'A', -- A, B, C or organic certified
    images_urls TEXT[] DEFAULT '{}',
    status listing_status DEFAULT 'AVAILABLE',
    pickup_location_id UUID REFERENCES locations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ORDERS & DISINTERMEDIATION PRICING AUDIT
CREATE TYPE order_status AS ENUM ('PLACED', 'ESCROW_FUNDED', 'PICKUP_SCHEDULED', 'IN_COLLECTION', 'AT_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'DISPUTED');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    listing_id UUID REFERENCES crop_listings(id) ON DELETE RESTRICT,
    quantity_kg NUMERIC(12, 2) NOT NULL,
    farmer_unit_price NUMERIC(10, 2) NOT NULL,
    logistics_fee NUMERIC(10, 2) NOT NULL,
    platform_fee NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    escrow_status VARCHAR(30) DEFAULT 'HELD_IN_ESCROW',
    status order_status DEFAULT 'PLACED',
    delivery_location_id UUID REFERENCES locations(id),
    scheduled_delivery_slot TSRANGE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LOGISTICS DISPATCH & OPTIMIZED ROUTING
CREATE TABLE aggregation_hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_name VARCHAR(150) NOT NULL,
    hub_location GEOMETRY(Point, 4326) NOT NULL,
    capacity_metric_tons NUMERIC(10, 2) NOT NULL,
    cold_storage_available BOOLEAN DEFAULT FALSE
);

CREATE TABLE logistics_trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    vehicle_reg_number VARCHAR(50) NOT NULL,
    max_payload_kg NUMERIC(10, 2) NOT NULL,
    destination_hub_id UUID REFERENCES aggregation_hubs(id),
    optimized_polyline TEXT, -- Encoded route line from OR-Tools
    total_distance_km NUMERIC(8, 2),
    estimated_duration_minutes INT,
    trip_status VARCHAR(30) DEFAULT 'PLANNED',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE trip_stops (
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

-- AI DEMAND FORECAST STORAGE
CREATE TABLE ai_demand_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_name VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    forecast_date DATE NOT NULL,
    projected_demand_quintals NUMERIC(12, 2) NOT NULL,
    confidence_interval_low NUMERIC(12, 2),
    confidence_interval_high NUMERIC(12, 2),
    suggested_retail_price_range NUMSRANGE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 6. AI Algorithms & Routing Logic

### 6.1 Capacitated Vehicle Routing with Time Windows (CVRPTW)
Google OR-Tools Python microservice excerpt executing cluster routing:

```python
"""
AgriDirect AI Logistics Router: Dispatches pickup trucks across rural farm nodes.
Minimizes total logistics carbon and transit duration for fresh perishables.
"""
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np

def create_data_model(distance_matrix, demands, vehicle_capacities, time_windows):
    data = {}
    data['distance_matrix'] = distance_matrix
    data['time_matrix'] = distance_matrix # or speed-adjusted travel time
    data['demands'] = demands
    data['vehicle_capacities'] = vehicle_capacities
    data['time_windows'] = time_windows
    data['num_vehicles'] = len(vehicle_capacities)
    data['depot'] = 0 # Urban Aggregation Micro-Hub
    return data

def solve_cvrptw(distance_matrix, demands, vehicle_capacities, time_windows):
    data = create_data_model(distance_matrix, demands, vehicle_capacities, time_windows)
    manager = pywrapcp.RoutingIndexManager(len(data['distance_matrix']), data['num_vehicles'], data['depot'])
    routing = pywrapcp.RoutingModel(manager)

    # 1. Distance Callback
    def distance_callback(from_index, to_index):
        return data['distance_matrix'][manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # 2. Capacity Constraint
    def demand_callback(from_index):
        return data['demands'][manager.IndexToNode(from_index)]
    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0, # slack
        data['vehicle_capacities'],
        True, # start at zero
        'Capacity'
    )

    # 3. Time Window Constraint
    def time_callback(from_index, to_index):
        return data['time_matrix'][manager.IndexToNode(from_index)][manager.IndexToNode(to_index)]
    time_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.AddDimension(
        time_callback_index,
        30, # allow up to 30 mins waiting time at farm gate
        1440, # max transit 24 hours
        False,
        'Time'
    )
    time_dimension = routing.GetDimensionOrDie('Time')
    for location_idx, time_window in enumerate(data['time_windows']):
        index = manager.NodeToIndex(location_idx)
        time_dimension.CumulVar(index).SetRange(time_window[0], time_window[1])

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = 5

    solution = routing.SolveWithParameters(search_parameters)
    return solution, routing, manager
```

---

## 7. PWA Offline Service Worker & IndexedDB Architecture

### 7.1 Service Worker Strategy (`sw.js` via Workbox)
* **Static Assets (JS/CSS/Webfonts):** `CacheFirst` with 30-day expiration.
* **API Mandi Baseline Pricing:** `StaleWhileRevalidate` – displays cached price floors immediately, updates silently in the background.
* **Farmer Crop Creation (`POST /api/listings`):**
  * Handled via **Workbox Background Sync** (`BackgroundSyncPlugin`).
  * If the device is offline in fields, requests queue inside IndexedDB `offline-listing-queue`.
  * As soon as an HTTP `window.online` event or background sync pulse triggers, the queue replays idempotently with unique UUID client keys.

### 7.2 Web App Manifest Configuration (`public/manifest.json`)
```json
{
  "name": "AgriDirect - Direct Kisan Marketplace",
  "short_name": "AgriDirect",
  "description": "Direct Farmer to Consumer and Bulk Buyer Marketplace with Fair Value and AI Logistics",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#064e3b",
  "theme_color": "#10b981",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Sell Harvest",
      "url": "/farmer/new-listing",
      "icons": [{ "src": "/icons/sell.png", "sizes": "96x96" }]
    },
    {
      "name": "Market Demand",
      "url": "/analytics/demand",
      "icons": [{ "src": "/icons/demand.png", "sizes": "96x96" }]
    }
  ]
}
```

---

## 8. Verification & Test Strategy

1. **Simulated Rural Network Degradation:**
   * Test listings submission under Chrome DevTools "Slow 3G" and "Offline" presets.
   * Verify zero data loss with transactions queued in IndexedDB and resolved upon reconnection.
2. **OR-Tools Routing Benchmarks:**
   * Evaluate a cluster of 50 farm pickups with 3 aggregation trucks; solution must converge in $<3$ seconds with 0 capacity violations.
3. **Price Disaggregation Mathematical Verification:**
   * Assert $\text{Consumer Total} \equiv \text{Farmer Payout} + \text{Logistics} + \text{Platform Fee}$ down to 2 decimal places to avoid split-penny discrepancies.
4. **Lighthouse PWA Audit:**
   * Target: 100/100 PWA score, First Contentful Paint (FCP) $< 1.2\text{s}$, Time to Interactive (TTI) $< 2.2\text{s}$ on mid-tier Android emulation.

---

## 9. Comprehensive AI Agent / Developer Prompt

Copy and paste the prompt below into an LLM or AI-assisted IDE (e.g., Claude Code, Cursor, Copilot) to scaffold and run the full stack prototype.

```text
PROMPT: Build a production-grade Progressive Web App (PWA) for Problem Statement 26033: "Direct Agri Marketplace Connecting Farmers, Bulk Buyers, and Consumers with Logistics Support and AI Route/Demand Optimization".

TECHNICAL STACK:
- Frontend: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Leaflet & React-Leaflet (for spatial routing visualizer), Recharts (for demand forecasting graphs).
- PWA: Workbox / Vite PWA plugin with full offline caching, manifest.json, and BackgroundSync simulation.
- Mock Backend / State: Zustand with persistent storage + mock Agmarknet price-ticker service.

CORE SCREENS & USER JOURNEYS TO IMPLEMENT:
1. Universal Navbar & Role Switcher:
   - Switch between: [👨‍🌾 Farmer View], [🏢 Bulk Buyer (B2B)], [🛒 Retail Consumer (B2C)], and [🚚 Logistics & AI Command Center].
   - Multi-language switcher (English, हिन्दी, मराठी) and Offline status badge (online/offline indicator).

2. Farmer Portal (Mobile-First, Offline-Capable):
   - "Sell My Harvest" wizard with Vernacular speech-to-text simulation button.
   - Real-time Agmarknet MSP Benchmark comparison card showing whether the farmer's price is competitive or below fair floor.
   - Offline submission test: allow filling details while offline, showing an "Unsynced Drafts (Saved to Device)" indicator that auto-resolves when toggled online.

3. Consumer & Bulk Buyer Marketplace:
   - Dynamic catalog of fresh listings with harvest date, shelf-life tracker, and organic/grade badge.
   - Transparent Price Breakdown Meter on each card:
     * Farmer Gets: 76% (e.g. ₹38/kg)
     * Direct Logistics: 16% (₹8/kg)
     * Platform & QC: 8% (₹4/kg)
     * Consumer Pays: ₹50/kg (vs Traditional Mandi Retail: ₹75/kg - 33% saved!).
   - B2B Bulk Purchasing mode with quantity discounts and forward escrow contract booking.

4. AI Command Center (Demand Forecasting & Route Optimization):
   - AI Demand Forecasting Graph: 14-day projection for key staples (Tomatoes, Onions, Potatoes) highlighting glut/shortage zones.
   - Dynamic CVRPTW Logistics Map: Visualizes an aggregation hub with 4-5 rural farm pickup waypoints, showing optimized truck sequence numbers (Stop #1 -> Stop #2 -> Hub), fuel/cost savings, and capacity utilization meters.

DESIGN PRINCIPLES:
- Earthy, trustworthy palette: Emerald green (#047857), Warm amber (#d97706), Slate grays, clean accessible cards.
- High contrast, large tactile touch targets for mobile screens.
- Zero external backend setup required to run demo; provide self-contained mock engines and instant interactive controls.
```