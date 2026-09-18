/**
 * AgriDirect Shared TypeScript Domain Contracts
 * Sovereign Kisan-to-Grahak Disintermediation Grid
 */

// ==========================================
// 1. IDENTITY & RBAC
// ==========================================

export type UserRole =
  | 'FARMER'
  | 'FPO_ADMIN'
  | 'BULK_BUYER'
  | 'RETAIL_CONSUMER'
  | 'LOGISTICS_DRIVER'
  | 'GOVT_ADMIN';

export type PreferredLanguage =
  | 'en'
  | 'hi'
  | 'mr'
  | 'te'
  | 'ta'
  | 'kn'
  | 'bn'
  | 'gu'
  | 'pa'
  | 'or'
  | 'ml'
  | 'as'
  | 'mai'
  | 'sat'
  | 'ur'
  | 'ks'
  | 'ne'
  | 'kok'
  | 'sd'
  | 'doi'
  | 'mni'
  | 'brx'
  | 'sa';


export interface User {
  id: string;
  phone_number: string;
  full_name: string;
  role: UserRole;
  preferred_language: PreferredLanguage;
  aadhaar_hash?: string | null;
  upi_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FarmerProfile extends User {
  role: 'FARMER';
  fpo_id?: string | null;
  land_area_acres?: number;
  primary_crops?: string[];
  bank_account_verified: boolean;
}

export interface FPOProfile extends User {
  role: 'FPO_ADMIN';
  fpo_name: string;
  registration_number: string;
  total_member_farmers: number;
  operating_district: string;
}

export interface BuyerProfile extends User {
  role: 'BULK_BUYER' | 'RETAIL_CONSUMER';
  business_name?: string;
  gstin?: string;
  credit_limit?: number;
}

export interface DriverProfile extends User {
  role: 'LOGISTICS_DRIVER';
  vehicle_reg_number: string;
  vehicle_type: 'TATA_ACE_EV' | 'BOLERO_MAXI' | 'EICHER_REEFER' | 'STANDARD_REEFER';
  max_payload_kg: number;
  current_lat?: number;
  current_lng?: number;
}

// ==========================================
// 2. GEOSPATIAL & LOCATIONS
// ==========================================

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Location {
  id: string;
  user_id: string;
  address_line: string;
  village_or_locality?: string | null;
  district: string;
  state: string;
  pincode: string;
  geo_point: GeoPoint;
  is_primary: boolean;
  created_at?: string;
}

// ==========================================
// 3. CROP CATALOG & LISTINGS
// ==========================================

export type CropCategory =
  | 'GRAINS'
  | 'PULSES'
  | 'VEGETABLES'
  | 'FRUITS'
  | 'OILSEEDS'
  | 'SPICES';

export type ListingStatus =
  | 'DRAFT'
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_TRANSIT'
  | 'SOLD'
  | 'CANCELLED';

export interface QualityAssay {
  sugar_brix?: number;
  moisture_percentage?: number;
  uniformity_score?: number;
  defect_percentage?: number;
  certified_organic: boolean;
  assay_notes?: string;
}

export interface CropListing {
  id: string;
  farmer_id: string;
  farmer?: User;
  category: CropCategory;
  crop_name: string;
  variety?: string | null;
  total_quantity_kg: number;
  available_quantity_kg: number;
  minimum_order_kg: number;
  price_per_kg_expected: number; // Farmer realization
  mandi_benchmark_price?: number | null; // Computed baseline from Agmarknet
  harvest_date: string; // ISO date string (YYYY-MM-DD)
  shelf_life_days: number;
  quality_grade: 'A+' | 'A' | 'B' | 'C' | 'ORGANIC';
  quality_assay?: QualityAssay;
  images_urls: string[];
  status: ListingStatus;
  pickup_location_id: string;
  pickup_location?: Location;
  idempotency_key?: string;
  created_at: string;
}

// ==========================================
// 4. TRANSPARENT PRICING BREAKDOWN
// ==========================================

export interface PriceBreakdown {
  farmer_unit_price: number; // 76% default target
  logistics_fee_per_kg: number; // 16% cold chain & transit
  platform_fee_per_kg: number; // 8% assay, escrow, tech
  consumer_unit_price: number; // farmer + logistics + platform
  quantity_kg: number;
  farmer_payout_total: number;
  logistics_fee_total: number;
  platform_fee_total: number;
  consumer_total: number;
  savings_vs_mandi_percentage?: number;
}

// ==========================================
// 5. ORDERS & ESCROW LIFECYCLE
// ==========================================

export type OrderStatus =
  | 'PLACED'
  | 'ESCROW_FUNDED'
  | 'PICKUP_SCHEDULED'
  | 'IN_COLLECTION'
  | 'AT_HUB'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'DISPUTED';

export type EscrowStatus =
  | 'PENDING_FUNDING'
  | 'HELD_IN_ESCROW'
  | 'SPLIT_ADVANCE_RELEASED'
  | 'RELEASED_TO_FARMER'
  | 'REFUNDED'
  | 'DISPUTE_LOCKED';

export interface Order {
  id: string;
  buyer_id: string;
  buyer?: User;
  listing_id: string;
  listing?: CropListing;
  quantity_kg: number;
  farmer_unit_price: number;
  logistics_fee: number;
  platform_fee: number;
  total_amount: number;
  escrow_status: EscrowStatus;
  status: OrderStatus;
  delivery_location_id: string;
  delivery_location?: Location;
  scheduled_delivery_slot?: {
    start: string;
    end: string;
  } | null;
  qr_provenance_hash?: string;
  created_at: string;
}

// ==========================================
// 6. AGGREGATION HUBS & LOGISTICS DISPATCH
// ==========================================

export interface AggregationHub {
  id: string;
  hub_name: string;
  hub_location: GeoPoint;
  district: string;
  state: string;
  capacity_metric_tons: number;
  cold_storage_available: boolean;
  current_storage_tons?: number;
}

export type TripStatus = 'PLANNED' | 'DISPATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type StopType = 'PICKUP' | 'DROPOFF';

export interface TripStop {
  id: string;
  trip_id: string;
  order_id?: string | null;
  listing_id?: string | null;
  stop_sequence: number;
  stop_type: StopType;
  waypoint_point: GeoPoint;
  farmer_name?: string;
  address_summary?: string;
  expected_arrival_time: string;
  actual_arrival_time?: string | null;
  weight_verified_kg?: number | null;
  temperature_celsius?: number | null;
  is_completed: boolean;
}

export interface LogisticsTrip {
  id: string;
  driver_id: string;
  driver?: User;
  vehicle_reg_number: string;
  max_payload_kg: number;
  destination_hub_id: string;
  destination_hub?: AggregationHub;
  optimized_polyline?: string | null;
  total_distance_km: number;
  estimated_duration_minutes: number;
  capacity_utilized_kg: number;
  trip_status: TripStatus;
  stops: TripStop[];
  started_at?: string | null;
  completed_at?: string | null;
}

// ==========================================
// 7. AI DEMAND FORECASTING & CVRPTW ROUTING
// ==========================================

export interface DemandForecast {
  id: string;
  crop_name: string;
  district: string;
  forecast_date: string;
  projected_demand_quintals: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  suggested_price_min: number;
  suggested_price_max: number;
  demand_classification: 'HIGH_DEFICIT' | 'EQUILIBRIUM' | 'OVERSUPPLY_SURPLUS' | 'GLUT_WARNING';
  optimal_harvest_window_start?: string;
  optimal_harvest_window_end?: string;
  created_at: string;
}

export interface RouteOptimizationRequest {
  depot: GeoPoint;
  vehicles: {
    id: string;
    capacity_kg: number;
    type: string;
  }[];
  stops: {
    id: string;
    location: GeoPoint;
    demand_kg: number;
    time_window_start_min: number;
    time_window_end_min: number;
    stop_type: StopType;
    farmer_name?: string;
    address_summary?: string;
  }[];
}

export interface RouteOptimizationResult {
  trips: {
    vehicle_id: string;
    stops: {
      stop_id: string;
      sequence: number;
      arrival_time_min: number;
      departure_time_min: number;
      cumulative_load_kg: number;
      farmer_name?: string;
      address_summary?: string;
    }[];
    total_distance_km: number;
    total_duration_min: number;
    capacity_utilization_percentage: number;
  }[];
  total_fleet_distance_km: number;
  co2_avoided_kg: number;
  computation_time_seconds: number;
}

// ==========================================
// 8. MANDI BENCHMARK PRICE ADAPTER
// ==========================================

export interface MandiPriceQuote {
  commodity: string;
  state: string;
  district: string;
  market: string;
  min_price_per_kg: number;
  max_price_per_kg: number;
  modal_price_per_kg: number;
  price_date: string;
  source: 'AGMARKNET' | 'NCDEX' | 'APMC_SPOT' | 'SIMULATED_FEED';
}

// ==========================================
// 9. API STANDARDS & PAGINATION
// ==========================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface APISuccessResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface APIErrorDetails {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
}

export interface APIErrorResponse {
  error: APIErrorDetails;
}

export type APIResponse<T> = APISuccessResponse<T> | APIErrorResponse;

// ==========================================
// 10. REAL-TIME NOTIFICATIONS & SSE EVENTS
// ==========================================

export type NotificationEventType =
  | 'ORDER_CREATED'
  | 'DISPATCH_SCHEDULED'
  | 'TEMPERATURE_ALERT'
  | 'PRICE_ALERT'
  | 'ESCROW_RELEASED';

export interface AppNotification {
  id: string;
  type: NotificationEventType;
  title: string;
  message: string;
  target_user_id?: string | null;
  target_role?: UserRole | null;
  payload?: Record<string, unknown>;
  created_at: string;
}

// ==========================================
// 11. VERNACULAR & VOICE AI INFRASTRUCTURE
// ==========================================

export interface LanguageMeta {
  code: PreferredLanguage;
  name: string;        // English name
  nativeName: string;  // Native script display name
  script: string;      // Script family
  bhashiniCode: string;
  samplePhrase: string;
}

export const SUPPORTED_LANGUAGES: Record<PreferredLanguage, LanguageMeta> = {
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari', bhashiniCode: 'hi', samplePhrase: '१० क्विंटल गेहूं ₹२२ प्रति किलो' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari', bhashiniCode: 'mr', samplePhrase: '१० क्विंटल गावरान टोमॅटो, ३५ रुपये किलो' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu', bhashiniCode: 'te', samplePhrase: '10 క్వింటాళ్ల టమోటాలు కేజీ 35 రూపాయలు' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil', bhashiniCode: 'ta', samplePhrase: '10 குவிண்டால் தக்காளி கிலோ ₹30' },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada', bhashiniCode: 'kn', samplePhrase: '10 ಕ್ವಿಂಟಾಲ್ ಟೊಮೆಟೊ, ಕೆಜಿಗೆ 35 ರೂಪಾಯಿ' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', bhashiniCode: 'bn', samplePhrase: '৫ কুইন্টাল আলু প্রতি কেজি ২০ টাকা' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati', bhashiniCode: 'gu', samplePhrase: '૫ મણ કપાસ ૬૫ રૂપિયા કિલો' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', bhashiniCode: 'pa', samplePhrase: '੨੦ ਕੁਇੰਟਲ ਬਾਸਮਤੀ ਝੋਨਾ ੩੫ ਰੁਪਏ ਕਿਲੋ' },
  or: { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia', bhashiniCode: 'or', samplePhrase: '୫ କ୍ୱିଣ୍ଟାଲ ଧାନ କିଲୋ ₹୨୨' },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam', bhashiniCode: 'ml', samplePhrase: '100 കിലോ നാടൻ കുരുമുളക്' },
  as: { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali-Assamese', bhashiniCode: 'as', samplePhrase: '৫ কুইন্টাল তেজপুৰীয়া আদা' },
  mai: { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', script: 'Devanagari', bhashiniCode: 'mai', samplePhrase: '१० क्विंटल मखाना ₹४५० प्रति किलो' },
  sat: { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', script: 'Ol Chiki', bhashiniCode: 'sat', samplePhrase: '᱕ ᱠᱣᱤᱱᱴᱟᱞ ᱦᱳᱲᱳ' },
  ur: { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Perso-Arabic', bhashiniCode: 'ur', samplePhrase: 'دس کوئنٹل سیب پچاس روپے کلو' },
  ks: { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', script: 'Perso-Arabic', bhashiniCode: 'ks', samplePhrase: 'پانژ دَبہٕ کۄنگ زعفران' },
  ne: { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', script: 'Devanagari', bhashiniCode: 'ne', samplePhrase: '१० बोरा अलैँची ₹८०० प्रति किलो' },
  kok: { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', script: 'Devanagari', bhashiniCode: 'kok', samplePhrase: '५०० नारळ २५ रुपयांक एक' },
  sd: { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', script: 'Perso-Arabic', bhashiniCode: 'sd', samplePhrase: 'ڏھ ڪوئينٽل ڪڻڪ' },
  doi: { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', script: 'Devanagari', bhashiniCode: 'doi', samplePhrase: '१० क्विंटल बासमती चावल' },
  mni: { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', script: 'Meetei Mayek', bhashiniCode: 'mni', samplePhrase: 'চাক-হাও চেং ৫০ কিলো' },
  brx: { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', script: 'Devanagari', bhashiniCode: 'brx', samplePhrase: '५ कुइन्टल माइ' },
  sa: { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', script: 'Devanagari', bhashiniCode: 'sa', samplePhrase: 'दश क्विण्टल परिमितं धान्यम्' },
  en: { code: 'en', name: 'English', nativeName: 'English', script: 'Latin', bhashiniCode: 'en', samplePhrase: '10 quintals of organic wheat at ₹22/kg' },
};

export interface ExtractedHarvestIntent {
  rawTranscript: string;
  englishTranscript: string;
  crop_name: string;
  category: 'VEGETABLES' | 'FRUITS' | 'GRAINS' | 'PULSES' | 'OILSEEDS' | 'SPICES';
  variety: string;
  quantity_kg: number;
  quantity_quintals: number;
  expected_price_per_kg: number;
  confidence: number;
  confirmation_prompt: string;
}

export interface VoiceProcessRequest {
  audioBase64?: string;
  audioMimeType?: string;
  textTranscript?: string;
  language: PreferredLanguage;
}

export interface VoiceProcessResponse {
  transcript: string;
  language: PreferredLanguage;
  extracted: ExtractedHarvestIntent;
  audioFeedbackBase64?: string;
}

export interface VoiceSynthesizeRequest {
  text: string;
  language: PreferredLanguage;
  gender?: 'female' | 'male';
}

export interface VoiceSynthesizeResponse {
  audioBase64: string;
  mimeType: string;
  durationEstimateMs: number;
}

// ==========================================
// 10. CRYPTOGRAPHIC PROVENANCE & ESCROW CHAIN
// ==========================================

export interface ProvenanceStage {
  stage_number: number;
  stage_name: string;
  stage_code: 'HARVEST' | 'ASSAY_QC' | 'REEFER_TRANSIT' | 'HUB_SORTING' | 'DOORSTEP_DELIVERY';
  timestamp: string;
  actor_name: string;
  location: string;
  telemetry?: {
    temperature_celsius?: number;
    quality_score_pct?: number;
    weight_kg?: number;
    geo_point?: { latitude: number; longitude: number };
  };
  stage_hash: string;
  previous_hash: string;
}

export interface ProvenanceBatch {
  batch_id: string;
  crop_name: string;
  farmer_name: string;
  farm_location: string;
  harvest_date: string;
  current_stage: number;
  final_qr_hash: string;
  stages: ProvenanceStage[];
  is_valid: boolean;
}

