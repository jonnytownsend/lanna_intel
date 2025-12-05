export interface WeatherData {
  temp: number;
  humidity: number;
  description: string;
  windSpeed: number;
  icon: string;
  dt: number; // Unix timestamp
  aqi?: number; // Air Quality Index
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
}

export interface FlightSchedule {
  type: 'arrival' | 'departure';
  flight: string;
  time: string;
  airline: string;
  airport: string;
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
  date: string; // ISO Date string
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
}

export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  homepage: string;
  tags: string;
  country: string;
  state: string;
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
