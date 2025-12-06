
// NOTE: In a production environment, these should be in a .env file and accessed via process.env
// For this generated application, we are using the provided keys directly as requested.

export const ADMIN_EMAIL = 'devops@lenna-lens.com';

export const API_KEYS = {
  LONGDO: '3e9c595a84c02e4dd26a645bca3eba50',
  FLIGHTRADAR24: '019af03f-e3e2-7039-9d82-61261417fce3', 
  SHODAN: 'CZMkDhO98M3MymFghnCIc2m47IgCCqjh',
  OPENWEATHER: 'a1957bcdde9d69f0c1a7d675c256f397',
  ELEVENLABS: 'YOUR_ELEVENLABS_API_KEY', // Placeholder
  WAQI: 'demo', // 'demo' works for specific stations, otherwise requires free key
  NASA: 'DwfvWjXOIprDNiE7Ye3ocRzWOwhV6YwMPWHBgfi4',
  GEMINI: 'AIzaSyC1RHhAwTAYeyFS2ARdunQwOidbIS-_i3',
  VIRUSTOTAL: '', // User must provide in settings
  MAILTRAP: 'eb568ffdde5941e506dcb97acde8cac1',
  OPENUV: 'openuv-13uyiwrmih36iis-io'
};

// Switched to corsproxy.io which handles Shodan and FR24 headers better than allorigins
export const CORS_PROXY = 'https://corsproxy.io/?';

export const API_URLS = {
  LONGDO_TRAFFIC_TILES: 'https://ms.longdo.com/mmmap/tile.php',
  LONGDO_API: 'https://api.longdo.com/traffic',
  // Switched to public data-cloud endpoint which matches the array parsing logic and is CORS-friendly
  FLIGHTRADAR24_BASE: 'https://data-cloud.flightradar24.com/zones/fcgi/feed.js', 
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
  IP_API: 'https://ipapi.co',
  MAILTRAP_SEND: 'https://send.api.mailtrap.io/api/send',
  OPENUV_API: 'https://api.openuv.io/api/v1/uv'
};

// Lanna Region Center (Chiang Mai)
export const REGION_CENTER = {
  lat: 18.7883,
  lng: 98.9853,
  zoom: 12
};
