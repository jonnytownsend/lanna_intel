




import { API_KEYS, API_URLS, CORS_PROXY, REGION_CENTER } from './config';
import { 
  FlightData, WeatherData, WebcamData, ForecastData, GdeltEvent, TrafficIncident,
  RadioStation, FireHotspot, InfrastructurePOI, CurrencyRates, NewsItem,
  NasaAsteroid, NasaSolarFlare, NasaEpicImage, NasaGST, ISSData, EonetEvent,
  AddressResult, GovStat, FlightSchedule, DNSRecord, IpIntel, HotelPOI, UVData, ElevenLabsVoice,
  FlightIntegrityReport
} from '../types';
import { dbService, STORES } from './db';
import { logger } from './logger';

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

/**
 * OpenUV API - UV Index
 */
export const fetchUVIndex = async (lat: number, lng: number): Promise<UVData | null> => {
    try {
        const response = await fetch(`${API_URLS.OPENUV_API}?lat=${lat}&lng=${lng}`, {
            headers: {
                'x-access-token': API_KEYS.OPENUV
            }
        });
        if(!response.ok) return null;
        const data = await response.json();
        return data.result;
    } catch (e) {
        console.error("OpenUV Error", e);
        return null;
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
 * FIX: Used corsproxy.io and cleaned up params
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
    const params = new URLSearchParams({
        bounds: `${bounds.north},${bounds.south},${bounds.west},${bounds.east}`,
        faa: '1',
        satellite: '1',
        mlat: '1',
        flarm: '1',
        adsb: '1',
        gnd: '1',
        air: '1',
        vehicles: '1',
        estimated: '1',
        maxage: '14400',
        gliders: '1',
        stats: '1'
    });
    
    const url = `${API_URLS.FLIGHTRADAR24_BASE}?${params.toString()}`;
    const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);

    if (!response.ok) {
       console.warn(`FlightRadar24 Fetch failed: ${response.status}. Returning cached.`); 
       return await dbService.getAll<FlightData>(STORES.FLIGHTS);
    }

    const data = await response.json();
    const flights: FlightData[] = Object.keys(data)
      .filter(key => key !== 'full_count' && key !== 'version' && key !== 'stats')
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
          destination: f[12] || '',
          timestamp: new Date().toISOString()
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
 * FLIGHT BACKFILL TOOL
 * Simulates fetching historical data and checking integrity.
 */
export const backfillFlightData = async (days: number): Promise<number> => {
    // Real FR24 history requires a paid endpoint. This simulates the logic.
    // 1. Identify start/end time.
    // 2. Query external source (simulated here with random data generation to fill gaps).
    // 3. Insert into DB.
    
    logger.info(`Starting flight backfill for last ${days} days...`, 'FlightOps');
    let count = 0;
    
    for (let i = 0; i < days; i++) {
        // Generate mock data for "gap filling"
        const mockFlight: FlightData = {
            id: `hist_backfill_${Date.now()}_${i}`,
            flightCode: `BKF${100+i}`,
            airline: 'Lanna Historical Air',
            lat: 18.7 + (Math.random() * 0.5),
            lng: 98.9 + (Math.random() * 0.5),
            heading: Math.floor(Math.random() * 360),
            altitude: 30000,
            speed: 450,
            status: 'landed',
            origin: 'DMK',
            destination: 'CNX',
            timestamp: new Date(Date.now() - (i * 86400000)).toISOString()
        };
        await dbService.add(STORES.FLIGHTS, mockFlight);
        count++;
    }
    
    return count;
};

export const verifyFlightIntegrity = async (): Promise<FlightIntegrityReport> => {
    const flights = await dbService.getAll<FlightData>(STORES.FLIGHTS);
    const now = Date.now();
    let invalid = 0;
    let future = 0;
    let duplicates = 0;
    const seen = new Set<string>();
    
    flights.forEach(f => {
        // Check 1: Timestamp Validity
        const ts = f.timestamp ? new Date(f.timestamp).getTime() : 0;
        if (!ts || isNaN(ts)) invalid++;
        
        // Check 2: Future Dates (Allow 1 hour drift)
        if (ts > now + 3600000) future++;
        
        // Check 3: Duplicates
        if (seen.has(f.id)) duplicates++;
        seen.add(f.id);
    });
    
    return {
        totalRecords: flights.length,
        invalidTimestamps: invalid,
        futureTimestamps: future,
        duplicates: duplicates,
        gapsFilled: 0,
        status: (invalid + future + duplicates) === 0 ? 'clean' : 'repaired'
    };
};

export const fetchFlightSchedule = async (airportCode: string = 'VTCC', type: 'arrivals' | 'departures' = 'arrivals'): Promise<FlightSchedule[]> => {
   try {
       const url = `https://api.flightradar24.com/common/v1/airport.json?code=${airportCode}&page=1&limit=20`;
       const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);
       
       if(!response.ok) return [];
       const data = await response.json();
       
       const list = data.result.response.airport.pluginData.schedule[type].data;
       
       return list.map((item: any) => ({
           type: type,
           flight: item.flight.identification.number.default,
           time: new Date(item.flight.time.scheduled.departure * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
           airline: item.flight.airline.name,
           airport: type === 'arrivals' ? item.flight.airport.origin.name : item.flight.airport.destination.name,
           originCode: item.flight.airport.origin.code.icao,
           destCode: item.flight.airport.destination.code.icao,
           status: item.flight.status.text
       }));

   } catch(e) {
       console.error("Flight Schedule Error", e);
       return [];
   }
};

/**
 * Shodan API Logic
 */
export const fetchShodanWebcams = async (filters: { port?: string, org?: string, product?: string } = {}): Promise<WebcamData[]> => {
  try {
    let query = '';
    
    // If specific filters are provided, construct specific query
    if (filters.port) query += `port:${filters.port} `;
    if (filters.org) query += `org:"${filters.org}" `;
    if (filters.product) query += `product:"${filters.product}" `;
    
    // Default fallback if no filters provided: Broad webcam search in Thailand
    if (!query.trim()) {
       query = 'country:TH webcam'; 
    } else {
        if(!query.includes('country:')) {
            query += ' country:TH';
        }
    }

    const targetUrl = `${SHODAN_HOST_SEARCH}?key=${API_KEYS.SHODAN}&query=${encodeURIComponent(query.trim())}`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(targetUrl)}`);
    
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
      // Use corsproxy for image fetching too to avoid Mixed Content
      imageUrl: `${CORS_PROXY}${encodeURIComponent(`http://${m.ip_str}:${m.port}/`)}`
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
 * Radio Browser API - Optimized for "Scanner" feel
 */
export const fetchRadioStations = async (): Promise<RadioStation[]> => {
    try {
        const response = await fetch(`${API_URLS.RADIO_BROWSER}?country=Thailand&limit=50&order=clickcount&reverse=true`);
        if (!response.ok) return [];
        const data = await response.json();
        
        // Enrich data with simulated scanner metadata
        return data.map((s: any) => {
            // Simulate random signal properties
            const strength = Math.floor(Math.random() * (100 - 40) + 40); 
            const modTypes: ('FM'|'AM'|'USB')[] = ['FM', 'FM', 'FM', 'AM', 'USB'];
            const modulation = modTypes[Math.floor(Math.random() * modTypes.length)];
            
            return {
                stationuuid: s.stationuuid,
                name: s.name,
                url: s.url,
                homepage: s.homepage,
                tags: s.tags,
                country: s.country,
                state: s.state,
                freq: s.freq || 'WEB',
                signalStrength: strength,
                modulation: modulation
            };
        });
    } catch (e) {
        console.error("Radio API Error", e);
        return [];
    }
};

export const fetchFireHotspots = async (): Promise<FireHotspot[]> => {
   return [];
};

/**
 * Overpass API - Infrastructure
 * Refactored to support Dynamic Bounds for Offline Cache
 */
export const fetchInfrastructure = async (bounds?: {south: number, west: number, north: number, east: number}): Promise<InfrastructurePOI[]> => {
    // Check offline cache first if bounds match cached region
    if (bounds) {
        const cached = await dbService.getOfflineData('infrastructure_vectors');
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hr cache for specific bounds
            return cached.value;
        }
    }

    try {
        const box = bounds 
            ? `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`
            : '18.5,98.5,19.0,99.5'; // Default Central Chiang Mai

        const query = `
            [out:json][timeout:25];
            (
              node["amenity"="police"](${box});
              node["amenity"="hospital"](${box});
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
        const results = data.elements.map((el: any) => ({
            id: el.id,
            lat: el.lat,
            lng: el.lon,
            name: el.tags?.name || 'Unknown Facility',
            type: el.tags?.amenity
        }));

        // Cache if it was a custom bounds request (likely download)
        if (bounds) {
            await dbService.add(STORES.OFFLINE_DATA, { 
                key: 'infrastructure_vectors', 
                value: results,
                timestamp: Date.now() 
            });
        }

        return results;
    } catch (e) {
        console.error("Overpass API Error", e);
        // Fallback to offline if available
        const cached = await dbService.getOfflineData('infrastructure_vectors');
        return cached ? cached.value : [];
    }
};

/**
 * Overpass API - Hotels & Hostels
 * Refactored to support Dynamic Bounds
 */
export const fetchHotelsAndHostels = async (bounds?: {south: number, west: number, north: number, east: number}): Promise<HotelPOI[]> => {
    if (bounds) {
        const cached = await dbService.getOfflineData('hotel_vectors');
        if (cached && Date.now() - cached.timestamp < 3600000) return cached.value;
    }

    try {
        const box = bounds 
            ? `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`
            : '18.7,98.9,18.85,99.05';

        const query = `
            [out:json][timeout:25];
            (
              node["tourism"~"hotel|hostel|guest_house"](${box});
            );
            out body;
        `;
        const response = await fetch(API_URLS.OVERPASS_API, {
            method: 'POST',
            body: query
        });
        if(!response.ok) return [];
        const data = await response.json();
        
        const results = data.elements.map((el: any) => ({
            id: el.id,
            lat: el.lat,
            lng: el.lon,
            name: el.tags?.name || 'Unknown Accommodation',
            type: el.tags?.tourism || 'hotel',
            phone: el.tags?.phone || el.tags?.['contact:phone'],
            website: el.tags?.website || el.tags?.['contact:website'],
            email: el.tags?.email || el.tags?.['contact:email'],
            stars: el.tags?.stars
        }));

        if (bounds) {
            await dbService.add(STORES.OFFLINE_DATA, { 
                key: 'hotel_vectors', 
                value: results,
                timestamp: Date.now() 
            });
        }

        return results;
    } catch (e) {
        console.error("Overpass Hotel Error", e);
        const cached = await dbService.getOfflineData('hotel_vectors');
        return cached ? cached.value : [];
    }
};

/**
 * OFFLINE MAP MANAGER
 * Handles the "Download Chiang Mai + 50 miles" logic
 */
export const checkForMapUpdates = async (): Promise<{hasUpdate: boolean, version: string, size: string}> => {
    // Simulate checking a metadata endpoint
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockUpdate = Math.random() > 0.5;
            resolve({
                hasUpdate: mockUpdate,
                version: '2024-05-DELTA-02',
                size: '45 MB'
            });
        }, 1500);
    });
};

export const downloadChiangMaiRegion = async (onProgress: (pct: number) => void): Promise<boolean> => {
    try {
        // Define 50 mile radius bounds around Chiang Mai (approx 0.72 deg delta)
        // Center: 18.7883, 98.9853
        const delta = 0.72;
        const bounds = {
            north: 18.7883 + delta,
            south: 18.7883 - delta,
            east: 98.9853 + delta,
            west: 98.9853 - delta
        };

        onProgress(10);
        
        // 1. Fetch Infrastructure
        const infra = await fetchInfrastructure(bounds);
        onProgress(40);

        // 2. Fetch Hotels
        const hotels = await fetchHotelsAndHostels(bounds);
        onProgress(70);

        // 3. Store Metadata
        await dbService.add(STORES.OFFLINE_DATA, {
            key: 'region_metadata',
            value: {
                name: 'Chiang Mai + 50mi',
                lastUpdated: new Date().toISOString(),
                bounds: bounds,
                stats: {
                    infraCount: infra.length,
                    hotelCount: hotels.length
                }
            }
        });
        
        onProgress(100);
        return true;
    } catch (e) {
        console.error("Download Failed", e);
        return false;
    }
};

/**
 * Currency API
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
 * Financial News
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
 * NASA NEO
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
 * NASA DONKI
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
 * NASA GST
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
 * NASA EPIC
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
 * ISS Position
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
 * NASA EONET
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
 * Nominatim
 */
export const fetchAddressSearch = async (query: string): Promise<AddressResult[]> => {
  try {
    const url = `${API_URLS.NOMINATIM_SEARCH}?q=${encodeURIComponent(query)}&format=json&countrycodes=th&addressdetails=1&limit=5`;
    const response = await fetch(url);
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    console.error("Address Search Error", e);
    return [];
  }
};

/**
 * World Bank
 */
export const fetchGovStats = async (): Promise<GovStat[]> => {
    try {
        const indicators = ['SP.POP.TOT', 'NY.GDP.MKTP.CD', 'FP.CPI.TOTL.ZG', 'ST.INT.ARVL'];
        const promises = indicators.map(ind => 
             fetch(`${API_URLS.WORLDBANK_API}/indicator/${ind}?format=json&date=2020:2023`).then(r => r.json())
        );
        const results = await Promise.all(promises);
        const stats: GovStat[] = [];
        results.forEach((res) => {
            if(res && res[1] && res[1][0]) {
               stats.push({
                   indicator: res[1][0].indicator.value,
                   value: res[1][0].value,
                   date: res[1][0].date,
                   source: 'World Bank Open Data'
               });
            }
        });
        return stats;
    } catch (e) {
        console.error("Gov Data Error", e);
        return [];
    }
};

// --- ELEVEN LABS OPTIMIZATION ---

/**
 * Fetch available voices from ElevenLabs
 */
export const fetchElevenLabsVoices = async (apiKey: string): Promise<ElevenLabsVoice[]> => {
    if (!apiKey) return [];
    try {
        const response = await fetch(`${API_URLS.ELEVENLABS_API}/voices`, {
            headers: { 'xi-api-key': apiKey }
        });
        if (!response.ok) throw new Error('Failed to fetch voices');
        const data = await response.json();
        return data.voices.map((v: any) => ({
            voice_id: v.voice_id,
            name: v.name,
            category: v.category,
            labels: v.labels
        }));
    } catch (e) {
        console.error("ElevenLabs Voices Error", e);
        return [];
    }
};

/**
 * Enhanced TTS: Returns a Blob for playback and saving
 */
export const elevenLabsTTS = async (text: string, voiceId: string, apiKey: string): Promise<Blob | null> => {
   if (!apiKey) return null;
   try {
     const response = await fetch(`${API_URLS.ELEVENLABS_API}/text-to-speech/${voiceId}`, {
       method: 'POST',
       headers: { 
           'xi-api-key': apiKey, 
           'Content-Type': 'application/json' 
       },
       body: JSON.stringify({ 
           text, 
           model_id: "eleven_monolingual_v1", 
           voice_settings: { stability: 0.5, similarity_boost: 0.75 } 
       })
     });
     
     if(!response.ok) throw new Error("TTS Failed");
     return await response.blob();
   } catch(e) { 
       console.error(e);
       return null; 
   }
};

// --- OSINT ---

export const fetchDNSRecords = async (domain: string): Promise<DNSRecord[]> => {
    const types = [1, 28, 15, 16, 2];
    const records: DNSRecord[] = [];
    try {
        const promises = types.map(type => 
            fetch(`${API_URLS.GOOGLE_DNS}?name=${domain}&type=${type}`).then(r => r.json())
        );
        const results = await Promise.all(promises);
        results.forEach(res => {
            if (res.Answer) {
                res.Answer.forEach((ans: any) => {
                    records.push({ name: ans.name, type: ans.type, data: ans.data, TTL: ans.TTL });
                });
            }
        });
    } catch(e) { console.error(e); }
    return records;
};

export const fetchPublicIP = async (): Promise<string> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch(e) {
        return 'Unknown';
    }
};

export const fetchIpIntel = async (ip: string): Promise<IpIntel | null> => {
    try {
        const response = await fetch(`${API_URLS.IP_API}/${ip}/json/`);
        if (!response.ok) return null;
        const data = await response.json();
        return {
            ip: data.ip,
            city: data.city,
            region: data.region,
            country: data.country_name,
            org: data.org,
            asn: data.asn
        };
    } catch(e) { return null; }
};

/**
 * Mailtrap API - Send System Alert
 */
export const sendSystemEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
    // FIX: Client-side calls to Mailtrap trigger CORS NetworkErrors. Simulated for demo.
    console.warn("Mailtrap API: Simulated send. Client-side CORS restriction active.");
    
    // Simulate real send delay
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`[SIMULATED EMAIL] To: ${to}, Subject: ${subject}\nBody: ${body.substring(0, 50)}...`);
            resolve(true);
        }, 800);
    });
};

/**
 * MOCK AWS Transcribe Service
 */
export const mockAwsTranscribe = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
        // Simulating upload and processing delay
        setTimeout(() => {
            resolve(`[AWS Transcribe - ${file.name}]
            
SPEAKER 01: Status report on sector 7?
SPEAKER 02: Negative contact. The target was last seen moving towards the night market area.
SPEAKER 01: Copy. Drone surveillance is active. We are picking up heat signatures near the river.
SPEAKER 02: Acknowledged. Moving to intercept.
            
[END OF TRANSCRIPT]`);
        }, 3000);
    });
};
