import { API_KEYS, API_URLS, CORS_PROXY } from './config';
import { 
  FlightData, WeatherData, WebcamData, ForecastData, GdeltEvent, TrafficIncident,
  RadioStation, FireHotspot, InfrastructurePOI, CurrencyRates, NewsItem,
  NasaAsteroid, NasaSolarFlare, NasaEpicImage, NasaGST, ISSData, EonetEvent
} from '../types';
import { dbService, STORES } from './db';

// Helper for Shodan
const SHODAN_HOST_SEARCH = `${API_URLS.SHODAN_BASE}/shodan/host/search`;

/**
 * OpenWeather API - Current & Forecast
 */
export const fetchWeather = async (lat: number, lng: number): Promise<WeatherData | null> => {
  try {
    const response = await fetch(
      `${API_URLS.OPENWEATHER_BASE}/weather?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEYS.OPENWEATHER}`
    );
    if (!response.ok) throw new Error('Weather API failed');
    const data = await response.json();
    
    // Attempt to get AQI if available in standard call or set to undefined (UI handles null)
    // We strictly do not simulate data.
    return {
      temp: data.main.temp,
      humidity: data.main.humidity,
      description: data.weather[0].description,
      windSpeed: data.wind.speed,
      icon: data.weather[0].icon,
      dt: data.dt,
      aqi: undefined 
    };
  } catch (error) {
    console.error('Weather Fetch Error:', error);
    return null;
  }
};

/**
 * WAQI API - Air Quality
 */
export const fetchAirQuality = async (lat: number, lng: number): Promise<number | undefined> => {
    try {
        const response = await fetch(`${API_URLS.WAQI_BASE}/geo:${lat};${lng}/?token=${API_KEYS.WAQI}`);
        const data = await response.json();
        if (data.status === 'ok') {
            return data.data.aqi;
        }
        return undefined;
    } catch (e) {
        return undefined;
    }
};

export const fetchForecast = async (lat: number, lng: number): Promise<ForecastData | null> => {
  try {
    const response = await fetch(
      `${API_URLS.OPENWEATHER_BASE}/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${API_KEYS.OPENWEATHER}`
    );
    if (!response.ok) throw new Error('Forecast API failed');
    return await response.json();
  } catch (error) {
    console.error('Forecast Fetch Error:', error);
    return null;
  }
};

/**
 * FlightRadar24 API Logic
 */
export const fetchRealtimeFlights = async (
  bounds: { north: number; south: number; east: number; west: number }
): Promise<FlightData[]> => {
  const CACHE_KEY = 'flights_realtime';
  
  const isCached = await dbService.isCacheValid(CACHE_KEY, 10);
  if (isCached) {
    return await dbService.getAll<FlightData>(STORES.FLIGHTS);
  }

  try {
    const url = `${API_URLS.FLIGHTRADAR24_BASE}/live/flight-positions/full?bounds=${bounds.north},${bounds.south},${bounds.west},${bounds.east}`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`, {
      headers: {
        'Authorization': `Bearer ${API_KEYS.FLIGHTRADAR24}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
       console.warn('FlightRadar24 Live Fetch failed (likely CORS/Auth).'); 
       return [];
    }

    const data = await response.json();
    const flights: FlightData[] = Object.keys(data)
      .filter(key => key !== 'full_count' && key !== 'version')
      .map(key => {
        const f = data[key];
        return {
          id: key,
          flightCode: f[13] || 'UNK',
          airline: f[18] || 'Unknown',
          lat: f[1],
          lng: f[2],
          heading: f[3],
          altitude: f[4],
          speed: f[5],
          status: f[16] === 0 ? 'unknown' : 'en-route',
          origin: f[11] || '',
          destination: f[12] || ''
        };
      });

    for (const f of flights) {
       await dbService.add(STORES.FLIGHTS, f);
    }
    await dbService.updateCacheTimestamp(CACHE_KEY);
    return flights;

  } catch (error) {
    console.error('FlightRadar24 Fetch Error:', error);
    return await dbService.getAll<FlightData>(STORES.FLIGHTS);
  }
};

/**
 * Shodan API Logic - STRICT NO SIMULATION
 */
export const fetchShodanWebcams = async (filters: { port?: string, org?: string, product?: string } = {}): Promise<WebcamData[]> => {
  try {
    let query = 'country:TH';
    if (filters.port) query += ` port:${filters.port}`;
    if (filters.org) query += ` org:"${filters.org}"`;
    if (filters.product) query += ` product:"${filters.product}"`;
    if (!filters.product && !filters.port) query += ' webcam'; 

    const targetUrl = `${SHODAN_HOST_SEARCH}?key=${API_KEYS.SHODAN}&query=${encodeURIComponent(query)}`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(targetUrl)}`);
    
    // Strictly return empty if error/limited, no mocks
    if (!response.ok) {
        console.warn(`Shodan API Error: ${response.status}. Likely plan limits or CORS.`);
        return [];
    }

    const data = await response.json();
    
    return (data.matches || []).map((m: any) => ({
      id: m.ip_str,
      ip: m.ip_str,
      port: m.port,
      city: m.location?.city || 'Unknown',
      country: m.location?.country_name || 'Thailand',
      lat: m.location?.latitude,
      lng: m.location?.longitude,
      timestamp: m.timestamp,
      org: m.org || 'Unknown',
      data: m.data,
      product: m.product,
      os: m.os,
      // We do not simulate the image URL. We construct a potential direct link.
      // If Shodan doesn't provide a snapshot, we try to guess the root.
      imageUrl: `http://${m.ip_str}:${m.port}/` 
    }));
  } catch (error) {
    console.error('Shodan Fetch Error:', error);
    return [];
  }
};

/**
 * GDELT Project - God View
 */
export const fetchGdeltEvents = async (): Promise<GdeltEvent[]> => {
  try {
    const query = 'Thailand';
    const targetUrl = `${API_URLS.GDELT_GEO_API}?query=${encodeURIComponent(query)}&mode=pointdata&format=geojson`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(targetUrl)}`);
    if (!response.ok) throw new Error('GDELT API Failed');
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('GDELT Fetch Error:', error);
    return [];
  }
};

/**
 * Longdo Traffic Incidents
 */
export const fetchTrafficIncidents = async (): Promise<TrafficIncident[]> => {
  try {
    const targetUrl = 'https://traffic.longdo.com/api/traffic/incident/json';
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(targetUrl)}`);
    if(!response.ok) return [];
    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.long),
      type: item.type
    }));
  } catch (error) {
    console.error('Longdo Traffic Error:', error);
    return [];
  }
};

/**
 * Radio Browser API - Fetch Live Radio Stations
 */
export const fetchRadioStations = async (): Promise<RadioStation[]> => {
    try {
        const response = await fetch(`${API_URLS.RADIO_BROWSER}?country=Thailand&limit=20&order=clickcount&reverse=true`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.map((s: any) => ({
            stationuuid: s.stationuuid,
            name: s.name,
            url: s.url,
            homepage: s.homepage,
            tags: s.tags,
            country: s.country,
            state: s.state
        }));
    } catch (e) {
        console.error("Radio API Error", e);
        return [];
    }
};

/**
 * NASA FIRMS - Live Fire Data (Strictly needs Key for real data, using public feeds if available)
 */
export const fetchFireHotspots = async (): Promise<FireHotspot[]> => {
   // Without a specific MAP_KEY for FIRMS, we cannot fetch live vector data securely from client.
   return [];
};

/**
 * Overpass API - Fetch Infrastructure (Police/Hospital)
 */
export const fetchInfrastructure = async (): Promise<InfrastructurePOI[]> => {
    try {
        const query = `
            [out:json];
            (
              node["amenity"="police"](18.5,98.5,19.0,99.5);
              node["amenity"="hospital"](18.5,98.5,19.0,99.5);
            );
            out body;
            >;
            out skel qt;
        `;
        const response = await fetch(API_URLS.OVERPASS_API, {
            method: 'POST',
            body: query
        });
        if(!response.ok) return [];
        const data = await response.json();
        return data.elements.map((el: any) => ({
            id: el.id,
            lat: el.lat,
            lng: el.lon,
            name: el.tags?.name || 'Unknown Facility',
            type: el.tags?.amenity
        }));
    } catch (e) {
        console.error("Overpass API Error", e);
        return [];
    }
};

/**
 * Currency API - Fetch Exchange Rates
 */
export const fetchCurrencyRates = async (): Promise<CurrencyRates | null> => {
    try {
        const response = await fetch(API_URLS.CURRENCY_API);
        if(!response.ok) return null;
        const data = await response.json();
        const rates = data.thb;
        return {
            date: data.date,
            usd: 1 / rates.usd,
            eur: 1 / rates.eur,
            cny: 1 / rates.cny,
            jpy: 1 / rates.jpy,
            sgd: 1 / rates.sgd,
            gbp: 1 / rates.gbp,
            hkd: 1 / rates.hkd
        };
    } catch (e) {
        return null;
    }
};

/**
 * Financial News Aggregator
 */
export const fetchFinancialNews = async (): Promise<NewsItem[]> => {
    const feeds = [
        'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.bangkokpost.com%2Frss%2Fdata%2Fbusiness.xml',
        'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.channelnewsasia.com%2Fapi%2Fv1%2Frss-feeds%2Fcid%2F6936d808-158a-40a2-921d-910408542981'
    ];

    try {
        const requests = feeds.map(url => fetch(url).then(r => r.json()));
        const results = await Promise.all(requests);
        let allNews: NewsItem[] = [];
        
        results.forEach(res => {
            if (res.status === 'ok' && res.items) {
                const items = res.items.map((item: any) => ({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    source: res.feed.title,
                    description: item.description
                }));
                allNews = [...allNews, ...items];
            }
        });
        return allNews.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    } catch (e) {
        console.error("News Fetch Error", e);
        return [];
    }
};

/**
 * NASA NeoWs API - Near Earth Objects (Asteroids)
 */
export const fetchAsteroids = async (): Promise<NasaAsteroid[]> => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const response = await fetch(`${API_URLS.NASA_BASE}/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=${API_KEYS.NASA}`);
        if(!response.ok) return [];
        const data = await response.json();
        const asteroids: NasaAsteroid[] = [];
        Object.values(data.near_earth_objects).forEach((list: any) => {
            asteroids.push(...list);
        });
        return asteroids.sort((a,b) => (a.is_potentially_hazardous_asteroid === b.is_potentially_hazardous_asteroid) ? 0 : a.is_potentially_hazardous_asteroid ? -1 : 1);
    } catch (e) {
        console.error("NASA NEO Error", e);
        return [];
    }
};

/**
 * NASA DONKI API - Solar Flares (Space Weather)
 */
export const fetchSolarFlares = async (): Promise<NasaSolarFlare[]> => {
    try {
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const response = await fetch(`${API_URLS.NASA_BASE}/DONKI/FLR?startDate=${startDate}&api_key=${API_KEYS.NASA}`);
        if(!response.ok) return [];
        return await response.json();
    } catch (e) {
        console.error("NASA DONKI Error", e);
        return [];
    }
};

/**
 * NASA DONKI API - Geomagnetic Storms (GST)
 * Used to calculate Threat Level
 */
export const fetchGeomagneticStorms = async (): Promise<NasaGST[]> => {
    try {
        const startDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 15 days
        const response = await fetch(`${API_URLS.NASA_BASE}/DONKI/GST?startDate=${startDate}&api_key=${API_KEYS.NASA}`);
        if(!response.ok) return [];
        return await response.json();
    } catch (e) {
        console.error("NASA GST Error", e);
        return [];
    }
};

/**
 * NASA EPIC API
 */
export const fetchEpicImages = async (): Promise<NasaEpicImage[]> => {
    try {
        const response = await fetch(`${API_URLS.NASA_BASE}/EPIC/api/natural/images?api_key=${API_KEYS.NASA}`);
        if(!response.ok) return [];
        const data = await response.json();
        
        return data.slice(0, 5).map((img: any) => {
            const date = new Date(img.date);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return {
                ...img,
                imageUrl: `https://epic.gsfc.nasa.gov/archive/natural/${year}/${month}/${day}/png/${img.image}.png`
            };
        });
    } catch (e) {
        console.error("NASA EPIC Error", e);
        return [];
    }
};

/**
 * Live ISS Tracking - WhereTheISS.at API
 */
export const fetchISSPosition = async (): Promise<ISSData | null> => {
    try {
        const response = await fetch(API_URLS.ISS_TLE);
        if(!response.ok) return null;
        return await response.json();
    } catch (e) {
        console.error("ISS API Error", e);
        return null;
    }
};

/**
 * NASA EONET - Natural Events
 */
export const fetchEonetEvents = async (): Promise<EonetEvent[]> => {
    try {
        const response = await fetch(`${API_URLS.NASA_EONET}/events?status=open&limit=10`);
        if(!response.ok) return [];
        const data = await response.json();
        return data.events || [];
    } catch (e) {
        console.error("EONET API Error", e);
        return [];
    }
};

/**
 * 11Labs Integration Stubs
 */
export const elevenLabsTTS = async (text: string, voiceId: string = '21m00Tcm4TlvDq8ikWAM'): Promise<ArrayBuffer | null> => {
   if (API_KEYS.ELEVENLABS === 'YOUR_ELEVENLABS_API_KEY') return null;
   try {
     const response = await fetch(`${API_URLS.ELEVENLABS_API}/text-to-speech/${voiceId}`, {
       method: 'POST',
       headers: { 'xi-api-key': API_KEYS.ELEVENLABS, 'Content-Type': 'application/json' },
       body: JSON.stringify({ text, model_id: "eleven_monolingual_v1", voice_settings: { stability: 0.5, similarity_boost: 0.5 } })
     });
     if(!response.ok) throw new Error("TTS Failed");
     return await response.arrayBuffer();
   } catch(e) { return null; }
};
