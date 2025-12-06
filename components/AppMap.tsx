
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, GeoJSON, Polygon, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Search, Navigation, Plus, Minus, Compass, ExternalLink, AlertTriangle, Construction, Car, AlertOctagon } from 'lucide-react';
import FlightMapLayer from './FlightMapLayer';
import { REGION_CENTER, API_URLS } from '../services/config';
import { WebcamData, GdeltEvent, TrafficIncident, FireHotspot, InfrastructurePOI, HotelPOI, EonetEvent } from '../types';
import { fetchGdeltEvents, fetchTrafficIncidents, fetchFireHotspots, fetchInfrastructure, fetchHotelsAndHostels, fetchEonetEvents, fetchAddressSearch } from '../services/api';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface AppMapProps {
  activeLayers: {
    flights: boolean;
    traffic: boolean;
    webcams: boolean;
    fires?: boolean;
    infra?: boolean;
    hotels?: boolean;
    gdelt?: boolean;
    eonet?: boolean;
    touristHeatmap?: boolean;
  };
  webcams: WebcamData[];
  onMapStateChange?: (state: {lat: number, lng: number, zoom: number}) => void;
  heatmapDate?: string;
}

// Custom Map Controller & Search
const MapController = ({ onReset, onSearch }: { onReset: () => void, onSearch: (q: string) => void }) => {
    const map = useMap();
    const [query, setQuery] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <>
            {/* Search Box */}
            <div className="absolute top-4 left-14 z-[999] pointer-events-auto flex items-center gap-2">
                <form onSubmit={handleSearch} className="bg-slate-900/90 backdrop-blur border border-cyan-500/50 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center p-2 w-64 md:w-96 transform hover:scale-105 transition-all">
                    <Search size={20} className="text-cyan-400 ml-2 drop-shadow-[0_0_5px_#00ffff]"/>
                    <input 
                        className="bg-transparent border-none text-cyan-50 text-sm px-2 py-1 focus:outline-none w-full placeholder:text-slate-500 font-mono"
                        placeholder="SEARCH TARGET LOCATION..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded text-white font-bold shadow-[0_0_10px_#00ffff]">
                        <Navigation size={16}/>
                    </button>
                </form>
            </div>

            {/* Controls */}
            <div className="absolute top-4 right-4 z-[999] flex flex-col gap-3 pointer-events-auto">
                <div className="flex flex-col bg-slate-900 border border-cyan-500/50 rounded-lg overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    <button onClick={() => map.zoomIn()} className="p-3 hover:bg-slate-800 text-cyan-400 border-b border-cyan-500/30"><Plus size={24}/></button>
                    <button onClick={() => map.zoomOut()} className="p-3 hover:bg-slate-800 text-cyan-400"><Minus size={24}/></button>
                </div>
                <button 
                    onClick={() => {
                        onReset();
                        map.setView([REGION_CENTER.lat, REGION_CENTER.lng], REGION_CENTER.zoom);
                    }} 
                    className="p-3 bg-slate-900 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-slate-800 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    title="Reset View"
                >
                    <Compass size={24}/>
                </button>
                <a 
                    href={`https://map.longdo.com/?lat=${map.getCenter().lat}&long=${map.getCenter().lng}&mode=icons`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-slate-900 border border-cyan-500/50 rounded-lg text-cyan-400 hover:bg-slate-800 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center"
                    title="Open in Longdo Map"
                >
                    <ExternalLink size={24}/>
                </a>
            </div>
        </>
    );
};

// Map State Listener
const MapStateListener = ({ onChange }: { onChange: (state: {lat: number, lng: number, zoom: number}) => void }) => {
    const map = useMap();
    useEffect(() => {
        const handler = () => {
            onChange({
                lat: map.getCenter().lat,
                lng: map.getCenter().lng,
                zoom: map.getZoom()
            });
        };
        map.on('moveend', handler);
        return () => { map.off('moveend', handler); };
    }, [map, onChange]);
    return null;
};

const AppMap: React.FC<AppMapProps> = ({ activeLayers, webcams, onMapStateChange, heatmapDate }) => {
  const [thailandGeo, setThailandGeo] = useState<any>(null);
  const [gdeltEvents, setGdeltEvents] = useState<GdeltEvent[]>([]);
  const [trafficIncidents, setTrafficIncidents] = useState<TrafficIncident[]>([]);
  const [fires, setFires] = useState<FireHotspot[]>([]);
  const [infra, setInfra] = useState<InfrastructurePOI[]>([]);
  const [hotels, setHotels] = useState<HotelPOI[]>([]);
  const [eonetEvents, setEonetEvents] = useState<EonetEvent[]>([]);
  const [searchResult, setSearchResult] = useState<{lat: number, lng: number} | null>(null);

  // Lanna Region Polygon
  const lannaRegion: [number, number][] = [
    [20.4633, 99.8833], [19.9167, 100.4167], [17.8000, 100.5000],
    [17.2000, 99.4000], [17.8000, 97.9000], [19.3000, 97.8000], [20.4633, 99.8833]
  ];

  // Load Base GeoJSON
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries/THA.geo.json')
      .then(res => res.json()).then(setThailandGeo).catch(console.error);
  }, []);

  // Conditional Data Fetching - Split to prevent re-fetching everything on toggle
  useEffect(() => { if (activeLayers.gdelt) fetchGdeltEvents().then(setGdeltEvents); }, [activeLayers.gdelt]);
  useEffect(() => { if (activeLayers.traffic) fetchTrafficIncidents().then(setTrafficIncidents); }, [activeLayers.traffic]);
  useEffect(() => { if (activeLayers.fires) fetchFireHotspots().then(setFires); }, [activeLayers.fires]);
  useEffect(() => { if (activeLayers.infra) fetchInfrastructure().then(setInfra); }, [activeLayers.infra]);
  useEffect(() => { if (activeLayers.hotels) fetchHotelsAndHostels().then(setHotels); }, [activeLayers.hotels]);
  useEffect(() => { if (activeLayers.eonet) fetchEonetEvents().then(setEonetEvents); }, [activeLayers.eonet]);

  // Handle Search
  const performSearch = async (q: string) => {
      const results = await fetchAddressSearch(q);
      if(results && results.length > 0) {
          const first = results[0];
          setSearchResult({ lat: parseFloat(first.lat), lng: parseFloat(first.lon) });
      }
  };

  const SearchFlyTo = () => {
      const map = useMap();
      useEffect(() => {
          if (searchResult) {
              map.flyTo([searchResult.lat, searchResult.lng], 14, { duration: 1.5 });
          }
      }, [map, searchResult]); 
      return searchResult ? (
          <Marker 
            position={[searchResult.lat, searchResult.lng]} 
            icon={L.divIcon({
                className: 'neon-marker-wrap',
                html: `<div class="text-cyan-400 drop-shadow-[0_0_15px_#00ffff]"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
                iconSize: [64, 64],
                iconAnchor: [32, 64]
            })}
          >
              <Popup className="bg-slate-900 text-white border-none">Search Result</Popup>
          </Marker>
      ) : null;
  };

  // MEMOIZED MARKERS
  const webcamMarkers = useMemo(() => activeLayers.webcams ? webcams.map((cam) => (
      <Marker 
        key={cam.id} 
        position={[cam.lat, cam.lng]}
        icon={L.divIcon({
          className: 'neon-marker-wrap',
          html: `<div class="text-cyan-400 bg-slate-900/90 rounded-full p-2 border-2 border-cyan-500 shadow-[0_0_20px_#00ffff] neon-pulse"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg></div>`,
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        })}
      >
        <Popup className="bg-slate-900">
           <div className="min-w-[250px]">
             <h3 className="text-cyan-400 font-bold mb-1 border-b border-cyan-500/30 pb-1">Unsecured Webcam</h3>
             <img src={cam.imageUrl} alt="Cam Feed" className="w-full h-32 object-cover rounded mb-2 bg-slate-800" />
             <div className="text-xs text-slate-400 space-y-1">
               <p><span className="text-slate-500">IP:</span> {cam.ip}:{cam.port}</p>
               <p><span className="text-slate-500">ISP:</span> {cam.org}</p>
             </div>
           </div>
        </Popup>
      </Marker>
  )) : [], [activeLayers.webcams, webcams]);

  const trafficMarkers = useMemo(() => activeLayers.traffic ? trafficIncidents.map((inc) => {
      let iconColor = 'text-yellow-500';
      let iconHtml = `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2zm0 3l7.53 15H4.47L12 5zm-1 8h2v2h-2zm0 4h2v2h-2z"/></svg>`; // Warning triangle default

      if (inc.type.includes('accident')) {
          iconColor = 'text-red-600';
          iconHtml = `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`; // Alert circle
      } else if (inc.type.includes('roadwork') || inc.type.includes('construction')) {
          iconColor = 'text-orange-500';
          iconHtml = `<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M18.667 11.111l-3.334 3.334-3.333-3.334L15.333 7.778l3.334 3.333zm-13.334 0l3.334 3.334-3.334 3.333-3.333-3.333 3.333-3.334zM22 19.444v2.222h-3.333v-2.222H22zM5.333 19.444v2.222H2v-2.222h3.333z"/></svg>`; // Construction (approx)
      }

      return (
          <Marker
              key={inc.id}
              position={[inc.lat, inc.lng]}
              icon={L.divIcon({
                  className: 'traffic-marker',
                  html: `<div class="${iconColor} drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-pulse">${iconHtml}</div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16]
              })}
          >
              <Popup className="bg-slate-900 border-none">
                  <div className="text-white">
                      <div className="font-bold text-sm mb-1 text-orange-400">{inc.title}</div>
                      <div className="text-xs text-slate-300">{inc.description}</div>
                      <div className="text-[10px] text-slate-500 mt-1 uppercase">{inc.type}</div>
                  </div>
              </Popup>
          </Marker>
      );
  }) : [], [activeLayers.traffic, trafficIncidents]);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={[REGION_CENTER.lat, REGION_CENTER.lng]}
        zoom={REGION_CENTER.zoom}
        style={{ height: '100%', width: '100%', background: '#020617' }}
        zoomControl={false}
      >
        <MapController onReset={() => setSearchResult(null)} onSearch={performSearch} />
        {onMapStateChange && <MapStateListener onChange={onMapStateChange} />}
        <SearchFlyTo />

        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="Dark Matter">
            <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Longdo Map">
            <TileLayer attribution='&copy; Longdo Map' url="https://ms.longdo.com/mmmap/tile.php?zoom={z}&x={x}&y={y}&mode=icons" />
          </LayersControl.BaseLayer>
          
          {activeLayers.traffic && (
            <LayersControl.Overlay checked name="Traffic Heatmap">
               <TileLayer 
                  url={`${API_URLS.LONGDO_TRAFFIC_TILES}?zoom={z}&x={x}&y={y}&mode=traffic`} 
                  opacity={0.9} 
                  zIndex={500}
                  className="neon-traffic-tiles" // Applies custom CSS filter for neon effect
               />
            </LayersControl.Overlay>
          )}
        </LayersControl>

        {thailandGeo && (
           <GeoJSON data={thailandGeo} style={{ color: '#00ffff', weight: 2, fillOpacity: 0.1, className: 'neon-border' }} />
        )}

        <Polygon positions={lannaRegion} pathOptions={{ color: '#00ffff', weight: 4, fillColor: '#06b6d4', fillOpacity: 0.1, dashArray: '10, 10' }} />

        {activeLayers.flights && <FlightMapLayer />}
        {webcamMarkers}
        {trafficMarkers}

      </MapContainer>
      
      <style>{`
        .neon-border { filter: drop-shadow(0 0 10px #06b6d4) drop-shadow(0 0 20px #06b6d4); }
      `}</style>
    </div>
  );
};

export default AppMap;
