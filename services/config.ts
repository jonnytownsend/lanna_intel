
// NOTE: In a production environment, these should be in a .env file and accessed via process.env
// For this generated application, we are using the provided keys directly as requested.

export const API_KEYS = {
  LONGDO: '3e9c595a84c02e4dd26a645bca3eba50',
  FLIGHTRADAR24: '019af03f-e3e2-7039-9d82-61261417fce3', 
  SHODAN: 'CZMkDhO98M3MymFghnCIc2m47IgCCqjh',
  OPENWEATHER: 'a1957bcdde9d69f0c1a7d675c256f397',
  ELEVENLABS: 'YOUR_ELEVENLABS_API_KEY', // Placeholder
  WAQI: 'demo', // 'demo' works for specific stations, otherwise requires free key
  NASA: 'DwfvWjXOIprDNiE7Ye3ocRzWOwhV6YwMPWHBgfi4',
  GEMINI: 'AIzaSyC1RHhAwTAYeyFS2ARdunQwOidbIS-_i3',
  VIRUSTOTAL: '' // User must provide in settings
};

// We use a CORS proxy to bypass browser restrictions for APIs that don't support CORS (like Shodan direct access)
export const CORS_PROXY = 'https://corsproxy.io/?';

export const API_URLS = {
  LONGDO_TRAFFIC_TILES: 'https://ms.longdo.com/mmmap/tile.php',
  LONGDO_API: 'https://api.longdo.com/traffic',
  FLIGHTRADAR24_BASE: 'https://fr24api.flightradar24.com/api', 
  SHODAN_BASE: 'https://api.shodan.io',
  OPENWEATHER_BASE: 'https://api.openweathermap.org/data/2.5',
  GDELT_GEO_API: 'https://api.gdeltproject.org/api/v2/geo/geo',
  ELEVENLABS_API: 'https://api.elevenlabs.io/v1',
  WAQI_BASE: 'https://api.waqi.info/feed',
  RADIO_BROWSER: 'https://de1.api.radio-browser.info/json/stations/search',
  OVERPASS_API: 'https://overpass-api.de/api/interpreter',
  CURRENCY_API: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/thb.json',
  NASA_BASE: 'https://api.nasa.gov',
  NASA_EONET: 'https://eonet.gsfc.nasa.gov/api/v3',
  ISS_TLE: 'https://api.wheretheiss.at/v1/satellites/25544',
  NOMINATIM_SEARCH: 'https://nominatim.openstreetmap.org/search',
  WORLDBANK_API: 'https://api.worldbank.org/v2/country/th',
  VIRUSTOTAL_API: 'https://www.virustotal.com/api/v3',
  GOOGLE_DNS: 'https://dns.google/resolve',
  IP_API: 'https://ipapi.co'
};

// Lanna Region Center (Chiang Mai)
export const REGION_CENTER = {
  lat: 18.7883,
  lng: 98.9853,
  zoom: 12
};
