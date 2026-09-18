# AgriDirect — Sovereign Kisan-to-Grahak Infrastructure
> **Department of Consumer Affairs (DoCA) — Problem Statement 26033**  
> Direct Kisan-to-Grahak Disintermediation Grid with AI Logistics, Transparent Pricing & Cryptographic Provenance

---

## 1. Executive Summary & Core Mission

**AgriDirect** eliminates the multi-tier APMC middleman chain (where farmers traditionally capture only ~28% of the final consumer rupee) by connecting farmers directly to retail consumers and bulk institutional buyers through an electric cold-chain aggregation grid.

### The Sovereign Mathematical Pricing Identity
Every transaction on AgriDirect strictly satisfies the 3-component fair value formula (verified to 2 decimal places):
$$\text{Consumer Price (100\%)} = \text{Farmer Realization (76\%)} + \text{Cold Logistics (16\%)} + \text{Platform Fee (8\%) }$$

* **Farmer Realization (76%)**: Transferred directly to the farmer's UPI account with a T+0 instant settlement protocol upon doorstep delivery.
* **Cold Logistics (16%)**: Powers multi-stop milk runs using active temperature-controlled electric vehicles (Tata Ace EV Reefer, 4.2°C lock).
* **Platform & Quality Verification (8%)**: Covers multi-spectral AI vision quality assaying, escrow protection, and cloud ledger infrastructure.

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                       AgriDirect Client PWA (React 19)                         │
│  - Stitch Design Tokens (Plus Jakarta Sans, Inter, Material Symbols Outlined)  │
│  - Workbox PWA Service Worker Precaching (sw.js) & Web App Manifest            │
│  - IndexedDB Local Storage Vault (agridirect_offline_vault) for Offline Drafts │
└───────────────────────┬───────────────────────────────┬────────────────────────┘
                        │ HTTP / REST                   │ SSE Event Stream
                        ▼                               ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                   AgriDirect Express Gateway (/api/v1)                         │
│  - Helmet Security Headers & Strict CORS                                      │
│  - JWT Authentication & 5-Role Hierarchical RBAC Middleware                    │
│  - Server-Sent Events (SSE) Real-Time Pub/Sub Notification Engine              │
└───────┬───────────────┬───────────────┬───────────────┬───────────────┬────────┘
        │               │               │               │               │
        ▼               ▼               ▼               ▼               ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐┌──────────────┐
│  Auth & RBAC ││ Market & Lot ││ Price Engine ││ Logistics &  ││ Cryptographic│
│  Controllers ││  Catalog API ││ & Agmarknet  ││ CVRPTW Solver││  Provenance  │
└───────┬──────┘└───────┬──────┘└───────┬──────┘└───────┬──────┘└───────┬──────┘
        │               │               │               │               │
        └───────────────┴───────┬───────┴───────────────┴───────────────┘
                                ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│            Dual-Mode ACID Data Layer (server/src/db/index.ts)                  │
│  - Mode 1: Live PostgreSQL 16 + PostGIS cluster with transactional row locks   │
│  - Mode 2: Resilient In-Memory Datastore with deterministic seed data          │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The 5 Enterprise Persona Portals

AgriDirect unifies 5 stakeholder perspectives onto a single real-time ledger:

1. **Kisan (Farmer)**:
   - Vernacular step-by-step harvest listing wizard (English, Hindi, Marathi).
   - Real-time AI quality assay simulation (Grade A+, 96.4% score, Brix 12.8).
   - GPS farmgate geostamp and instant UPI payout estimate (76% net realization).
   - Offline IndexedDB persistence vault with automated background synchronization.
2. **Grahak (Retail Consumer)**:
   - 7-tier APMC middleman breakdown comparison showing savings.
   - Farmgate direct cart with itemized 76/16/8 audit ledger.
   - Doorstep delivery verification with cryptographic QR scanner.
3. **Bulk Institutional Buyer (HoReCa / Supermarkets)**:
   - Forward contract bookings with volume discount tiers.
   - Multi-quintal procurement with corporate credit line and escrow protection.
4. **Reefer Logistics Pilot**:
   - Capacitated Vehicle Routing Problem with Time Windows (CVRPTW) Clarke-Wright solver.
   - Multi-stop farmgate milk runs for 1.2-tonne Tata Ace EV Reefer fleets.
   - Active sensor telemetry (4.2°C temperature lock, strictly < 8°C).
   - Geofence waypoint check-in and weight verification.
5. **Government Nodal Admin (DoCA / APMC)**:
   - Live Mandi spot quote ticker (Onion Lasalgaon, Tomato Nashik, Alphonso Ratnagiri).
   - Regional 30-day demand vs supply predictive curves and urban deficit alerts.
   - Dispute arbitration console with automated 48-hour escrow freeze and resolution.

---

## 4. Cryptographic Provenance & Escrow Lifecycle

```
[ Farm Harvest ] ──(SHA-256)──> [ AI Quality Assay ] ──(SHA-256)──> [ Reefer Transit ]
(GPS 19.99° N, 73.78° E)       (96.4% Grade-A Sealed)             (4.2°C Active Lock)
                                                                            │
                                                                         (SHA-256)
                                                                            │
[ Doorstep Settlement ] <──(SHA-256)── [ Hub Docking / Advance ] <──────────┘
(70% Final Payout via UPI)             (30% Advance Payout via UPI)
```

1. **Split Advance Release**: When harvest lots dock at the aggregation hub, 30% advance payout is automatically released to the farmer (`SPLIT_ADVANCE_RELEASED`).
2. **Doorstep Final Settlement**: When the consumer scans the tamper-evident QR code at delivery, the remaining 70% payout is released instantly via UPI (`T+0_INSTANT_UPI`).
3. **Dispute Lock**: If a defect is reported, escrow is locked (`DISPUTE_LOCKED`), preventing fund disbursement until arbitrator review.

---

## 5. Getting Started

### Prerequisites
- **Node.js**: `>= 20.0.0`
- **npm**: `>= 10.0.0`
- **Python**: `>= 3.10` (optional, for standalone `ai-service`)

### Installation
```bash
# Clone the repository
git clone https://github.com/doca/agridirect.git
cd agridirect

# Install root dependencies
npm install

# Install client and server packages
npm --prefix server install
npm --prefix client install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your Supabase credentials in `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Supabase Database & Auth Setup
1. Create a project at [supabase.com](https://supabase.com).
2. Under **Project Settings -> API**, copy your **Project URL** and **`anon` public key** into `.env`.
3. In the **SQL Editor**, execute the migration scripts in order:
   - `supabase/migrations/001_initial_schema.sql` (Tables, Enums, Triggers)
   - `supabase/migrations/002_rls_policies.sql` (Row Level Security)
   - `supabase/migrations/003_indexes.sql` (Performance Indexes)
   - `supabase/seed.sql` (Hubs and Baseline Models)
4. Under **Authentication -> Providers -> Email**, enable Email OTP provider.

### Running Development Servers
```bash
# Concurrently start backend (port 5000) and frontend PWA (port 3000)
npm run dev
```
- Client PWA: `http://localhost:3000`
- Server API: `http://localhost:5000/api/v1`
- API Health: `http://localhost:5000/api/health`

---

## 6. Comprehensive Test Suite

AgriDirect includes **55 automated tests across 11 suites**:

```bash
# Execute the full multi-package test pipeline from root
npm test
```

### Test Suite Breakdown:
1. **Database & Concurrency Layer**: Row locks, ACID transactional scope, inventory reservation, and pricing formula identity.
2. **Authentication & RBAC**: Registration, phone login, JWT verification, and role-based endpoint guards (403 Forbidden).
3. **Marketplace & Pricing Catalog**: Paginated listing queries, category filters, Agmarknet spot benchmarks, and checkout reservation.
4. **AI Demand Forecasting**: 30-day predictive demand vs arrival curves, confidence intervals, and micro-climate IoT telemetry.
5. **Cold-Chain Logistics & CVRPTW**: Multi-stop route optimization, vehicle capacity constraints, CO2 reduction metrics, and telemetry patching.
6. **Real-time Notifications (SSE)**: Event streaming, 25-second keep-alive heartbeats, and targeted role dispatching.
7. **Cryptographic Provenance & Escrow**: SHA-256 chain verification, tamper detection, 30% advance release, doorstep delivery confirmation, and dispute arbitration.
8. **Vernacular Voice AI & Dialect Normalization**: 22 Eighth Schedule languages + English, Indic numerals (Devanagari, Gurmukhi, Gujarati, Telugu), and regional units (Quintal, Mann, Bori).
9. **End-to-End Persona Lifecycle**: Comprehensive 7-stage sequential integration simulating Kisan, AI, Grahak, Driver, and Admin.
10. **Client PWA IndexedDB Vault**: Offline harvest drafting, unsynced queue filtering, idempotency preservation, and offline spot price caching.
11. **Performance Benchmark & Concurrency Stress**: 50 parallel checkout requests preventing overselling, 100 randomized pricing calculations, PWA manifest compliance, and DoCA SLA latency audit.

---

## 7. Production Build

```bash
# Compiles both TypeScript server and Vite PWA production bundle
npm run build
```

Production output:
- `server/dist/`: Compiled NodeNext ES module server bundle.
- `client/dist/`: Production Vite PWA build with precached service worker (`sw.js`), Workbox runtime caching, and optimized assets.

---

## 8. REST API Reference

| Method | Endpoint | Description | Auth / Role |
|:-------|:---------|:------------|:------------|
| `POST` | `/api/v1/auth/register` | Register new user with phone & role | Public |
| `POST` | `/api/v1/auth/login` | Login with phone number & JWT issue | Public |
| `GET`  | `/api/v1/auth/me` | Current authenticated user profile | Authenticated |
| `GET`  | `/api/v1/marketplace/listings` | Paginated catalog with category filters | Public |
| `GET`  | `/api/v1/listings/:id` | Detailed listing assay & farmer info | Public |
| `POST` | `/api/v1/listings` | Publish new harvest listing | `FARMER`, `FPO_ADMIN` |
| `GET`  | `/api/v1/pricing/calculate` | Transparent 76/16/8 breakdown calculator | Public |
| `GET`  | `/api/v1/pricing/mandi-benchmark` | Agmarknet spot market quote ticker | Public |
| `POST` | `/api/v1/orders` | Place order with atomic escrow reservation | `BULK_BUYER`, `RETAIL_CONSUMER` |
| `POST` | `/api/v1/orders/:id/release-advance` | Release 30% advance payout on hub intake | `FPO_ADMIN`, `GOVT_ADMIN` |
| `POST` | `/api/v1/orders/:id/verify-delivery` | Release 70% final payout on QR delivery | `RETAIL_CONSUMER`, `BULK_BUYER` |
| `POST` | `/api/v1/orders/:id/dispute` | Freeze escrow and initiate dispute | `RETAIL_CONSUMER`, `BULK_BUYER` |
| `POST` | `/api/v1/orders/:id/resolve-dispute` | Arbitrate dispute (Refund or Release) | `GOVT_ADMIN`, `FPO_ADMIN` |
| `GET`  | `/api/v1/forecasts` | 30-day demand vs supply forecast | Public |
| `GET`  | `/api/v1/forecasts/telemetry` | Agro-climate & cold storage telemetry | Public |
| `GET`  | `/api/v1/logistics/trips` | Active & scheduled reefer milk runs | Public |
| `POST` | `/api/v1/logistics/optimize` | CVRPTW route optimization solver | Public |
| `PATCH`| `/api/v1/logistics/trips/:id/telemetry` | Update reefer temperature & waypoints | `LOGISTICS_DRIVER` |
| `GET`  | `/api/v1/notifications/stream` | Server-Sent Events real-time stream | Public / Authenticated |
| `POST` | `/api/v1/notifications/broadcast` | Targeted / broadcast alert dispatch | `GOVT_ADMIN` |
| `GET`  | `/api/v1/provenance/sample` | Sample 5-stage verified provenance batch | Public |
| `GET`  | `/api/v1/provenance/verify/:hash` | Cryptographically verify SHA-256 hash | Public |

---

## 9. License & Attribution

Built for the **Department of Consumer Affairs (DoCA)** under Problem Statement 26033.  
Licensed under the Apache License 2.0.
