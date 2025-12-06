

export interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  windSpeed: number;
  icon: string;
  dt: number; // Unix timestamp
  aqi?: number; // Air Quality Index
  uv?: number; // UV Index
}

export interface ForecastData {
  list: Array<{
    dt: number;
    main: {
      temp: number;
      humidity: number;
    };
    weather: Array<{
      description: string;
      icon: string;
    }>;
    wind: {
      speed: number;
    };
  }>;
  city: {
    name: string;
  };
}

export interface UVData {
  uv: number;
  uv_time: string;
  uv_max: number;
  uv_max_time: string;
  ozone: number;
}

export interface FlightData {
  id: string;
  flightCode: string; // IATA/ICAO
  airline: string;
  lat: number;
  lng: number;
  heading: number;
  altitude: number; // in feet
  speed: number; // in knots
  status: 'en-route' | 'landed' | 'scheduled' | 'unknown';
  origin: string;
  destination: string;
  timestamp?: string; // For historical tracking
}

export interface FlightSchedule {
  type: 'arrival' | 'departure';
  flight: string;
  time: string;
  airline: string;
  airport: string;
  originCode: string; // ICAO
  destCode: string; // ICAO
  status: string;
}

export interface WebcamData {
  id: string;
  ip: string;
  port: number;
  city: string;
  country: string;
  lat: number;
  lng: number;
  timestamp: string;
  org: string;
  data?: string; // Shodan banner
  product?: string;
  os?: string;
  imageUrl?: string; 
}

export interface TrafficIncident {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  type: string;
}

export interface AppTask {
  id: number;
  title: string;
  date: string; // ISO Date string (Creation date)
  dueDate?: string; // ISO Date string (Target date/time)
  url?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface GdeltEvent {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    url: string;
    name: string;
    shareimage?: string;
    domain?: string;
  };
}

export interface AudioRecording {
  id: string;
  url: string;
  timestamp: number;
  duration: number;
  label: string;
  transcription?: string;
  aiAnalysis?: string;
  type: 'intercept' | 'synthesis'; // New field to distinguish source
}

export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  homepage: string;
  tags: string;
  country: string;
  state: string;
  freq?: string;
  signalStrength?: number; // 0-100 for UI simulation
  modulation?: 'FM' | 'AM' | 'USB' | 'LSB' | 'DIG'; // for UI simulation
}

export interface FireHotspot {
  id: string;
  lat: number;
  lng: number;
  brightness: number;
  confidence: string;
  acquisitionDate: string;
}

export interface InfrastructurePOI {
  id: number;
  lat: number;
  lng: number;
  name: string;
  type: 'police' | 'hospital' | 'embassy';
}

export interface HotelPOI {
  id: number;
  lat: number;
  lng: number;
  name: string;
  type: 'hotel' | 'hostel' | 'guest_house';
  phone?: string;
  website?: string;
  email?: string;
  stars?: string;
}

export interface CurrencyRates {
  date: string;
  usd: number;
  eur: number;
  cny: number;
  jpy: number;
  sgd: number;
  gbp: number;
  hkd: number;
}

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description: string;
}

export interface NasaAsteroid {
  id: string;
  name: string;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: {
    meters: {
      estimated_diameter_min: number;
      estimated_diameter_max: number;
    }
  };
  close_approach_data: Array<{
    close_approach_date: string;
    relative_velocity: {
      kilometers_per_hour: string;
    };
    miss_distance: {
      kilometers: string;
    }
  }>;
}

export interface NasaSolarFlare {
  flrID: string;
  beginTime: string;
  peakTime: string;
  classType: string;
  sourceLocation: string;
}

export interface NasaGST {
  gstID: string;
  startTime: string;
  allKpIndex: Array<{
    observedTime: string;
    kpIndex: number;
    source: string;
  }>;
}

export interface NasaEpicImage {
  identifier: string;
  caption: string;
  image: string;
  date: string;
  imageUrl?: string; // Constructed URL
}

export interface ISSData {
  name: string;
  id: number;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  footprint: number;
  timestamp: number;
  solar_lat: number;
  solar_lon: number;
}

export interface EonetEvent {
  id: string;
  title: string;
  description?: string;
  link: string;
  categories: Array<{
    id: string;
    title: string;
  }>;
  sources: Array<{
    id: string;
    url: string;
  }>;
  geometry: Array<{
    magnitudeValue?: number;
    magnitudeUnit?: string;
    date: string;
    type: string;
    coordinates: [number, number]; // GeoJSON format [lng, lat]
  }>;
}

export interface AddressResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
}

export interface GovStat {
  indicator: string;
  value: number | string;
  date: string;
  source: string;
}

export interface AppSettings {
  geminiKey: string;
  elevenLabsKey: string;
  shodanKey: string;
  flightRadarKey: string;
  nasaKey: string;
  openWeatherKey: string;
  virusTotalKey: string; 
  builtWithKey?: string;
  hunterKey?: string;
  hibpKey?: string;
  theme: 'dark' | 'light';
  notifications: boolean;
  // Notification Preferences
  notifyPush: boolean;
  notifyApp: boolean;
  notifyEmail: boolean;
  mongoUri?: string; 
}

export interface ARObject {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'flight' | 'place' | 'infra';
  distance: number; // meters
  bearing: number; // degrees
}

export interface ExifData {
    make?: string;
    model?: string;
    dateTime?: string;
    lat?: number;
    lng?: number;
    software?: string;
}

// OSINT Types
export interface DNSRecord {
    name: string;
    type: number;
    data: string;
    TTL: number;
}

export interface IpIntel {
    ip: string;
    city: string;
    region: string;
    country: string;
    org: string;
    asn: string;
}

// Tracker Types
export interface TrackedClick {
    id: string;
    timestamp: string;
    ip: string;
    userAgent: string;
    lat?: number;
    lng?: number;
    accuracy?: number;
    platform: string;
    name?: string; // Customer Name
}

// System Alerts
export interface SystemAlert {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  title: string;
  message: string;
  source: string; // e.g., 'FlightRadar', 'System', 'Shodan'
  read: boolean;
  meta?: any;
}

// ElevenLabs Voice
export interface ElevenLabsVoice {
    voice_id: string;
    name: string;
    category: string;
    labels?: {
        accent?: string;
        gender?: string;
    }
}

// --- MAP & REGION TYPES ---

export interface MapFeature {
  id: string; // OSM ID
  type: 'node' | 'way' | 'relation';
  category: 'infra' | 'hotel' | 'traffic' | 'gov';
  tags: Record<string, string>;
  lat: number;
  lng: number;
  updatedAt: string; // ISO date
  region: string;
}

export interface MapVersion {
  region: string; // e.g., "chiang_mai_50mi"
  version: number; // e.g., 6
  lastCheck: string; // ISO date of last sync
  featureCount: number;
  bbox: {
      north: number;
      south: number;
      east: number;
      west: number;
  };
}

export interface FlightIntegrityReport {
    totalRecords: number;
    invalidTimestamps: number;
    futureTimestamps: number;
    duplicates: number;
    gapsFilled: number;
    status: 'clean' | 'repaired' | 'error';
}
