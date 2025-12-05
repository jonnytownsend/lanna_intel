import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, GeoJSON, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Plane, AlertTriangle, AlertOctagon, Flame, Building2, Stethoscope, ExternalLink } from 'lucide-react';
import FlightMapLayer from './FlightMapLayer';
import { REGION_CENTER, API_URLS } from '../services/config';
import { WebcamData, GdeltEvent, TrafficIncident, FireHotspot, InfrastructurePOI } from '../types';
import { fetchGdeltEvents, fetchTrafficIncidents, fetchFireHotspots, fetchInfrastructure } from '../services/api';

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
  };
  webcams: WebcamData[];
}

const AppMap: React.FC<AppMapProps> = ({ activeLayers, webcams }) => {
  const [thailandGeo, setThailandGeo] = useState<any>(null);
  const [gdeltEvents, setGdeltEvents] = useState<GdeltEvent[]>([]);
  const [trafficIncidents, setTrafficIncidents] = useState<TrafficIncident[]>([]);
  const [fires, setFires] = useState<FireHotspot[]>([]);
  const [infra, setInfra] = useState<InfrastructurePOI[]>([]);

  // Lanna Region Polygon
  const lannaRegion: [number, number][] = [
    [20.4633, 99.8833], [19.9167, 100.4167], [17.8000, 100.5000],
    [17.2000, 99.4000], [17.8000, 97.9000], [19.3000, 97.8000], [20.4633, 99.8833]
  ];

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries/THA.geo.json')
      .then(res => res.json()).then(setThailandGeo).catch(console.error);
      
    // Load God View Data
    fetchGdeltEvents().then(setGdeltEvents);
    
    // Load Traffic Vector Data
    if (activeLayers.traffic) fetchTrafficIncidents().then(setTrafficIncidents);
    
    // Load Fires
    if (activeLayers.fires) fetchFireHotspots().then(setFires);

    // Load Infrastructure
    if (activeLayers.infra) fetchInfrastructure().then(setInfra);

  }, [activeLayers.traffic, activeLayers.fires, activeLayers.infra]);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={[REGION_CENTER.lat, REGION_CENTER.lng]}
        zoom={REGION_CENTER.zoom}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={false}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Dark Matter">
            <TileLayer attribution='&copy; CARTO' url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </LayersControl.BaseLayer>
          
          {activeLayers.traffic && (
            <LayersControl.Overlay checked name="Longdo Tiles">
               <TileLayer url={`${API_URLS.LONGDO_TRAFFIC_TILES}?zoom={z}&x={x}&y={y}&mode=traffic`} opacity={0.8} zIndex={500} />
            </LayersControl.Overlay>
          )}
        </LayersControl>

        {thailandGeo && (
           <GeoJSON data={thailandGeo} style={{ color: '#06b6d4', weight: 2, fillOpacity: 0, className: 'neon-border' }} />
        )}

        <Polygon positions={lannaRegion} pathOptions={{ color: '#a855f7', weight: 2, fillColor: '#a855f7', fillOpacity: 0.1, dashArray: '10, 10' }} />

        {/* GDELT God View Markers - CLICKTHROUGH FIXED */}
        {gdeltEvents.map((event, idx) => (
           <Marker
             key={`gdelt-${idx}`}
             position={[event.geometry.coordinates[1], event.geometry.coordinates[0]]}
             icon={L.divIcon({
               className: 'gdelt-icon',
               html: `<div class="bg-orange-500 w-4 h-4 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
               iconSize: [16, 16]
             })}
           >
             <Popup className="bg-slate-900 border-none p-0 min-w-[200px]">
               <div className="bg-slate-800 p-2 rounded-t text-xs font-bold text-orange-400 border-b border-slate-700">
                 GLOBAL RISK EVENT
               </div>
               <div className="p-3 text-white text-xs">
                 <p className="mb-3 font-semibold text-sm">{event.properties.name || "Unidentified Event"}</p>
                 <a 
                   href={event.properties.url} 
                   target="_blank" 
                   rel="noreferrer" 
                   className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded w-full font-bold transition-colors"
                 >
                   <ExternalLink size={12}/> ACCESS SOURCE
                 </a>
               </div>
             </Popup>
           </Marker>
        ))}

        {/* Traffic Incidents */}
        {activeLayers.traffic && trafficIncidents.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.lat, incident.lng]}
              icon={L.divIcon({
                className: 'traffic-icon',
                html: `<div class="text-yellow-500"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></div>`,
                iconSize: [20, 20]
              })}
            >
                <Popup className="bg-slate-900 text-white">
                    <div className="text-xs p-1">
                        <strong className="text-yellow-400 block">{incident.title}</strong>
                        <p>{incident.description}</p>
                    </div>
                </Popup>
            </Marker>
        ))}

        {/* NASA FIRMS Fire Data */}
        {activeLayers.fires && fires.map((fire) => (
            <Marker
              key={fire.id}
              position={[fire.lat, fire.lng]}
              icon={L.divIcon({
                className: 'fire-icon',
                html: `<div class="text-red-500 animate-pulse"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.011-.224-4.011s1.224 1.868 2.224 4.011c.5 1 1 1.62 1 3a2.5 2.5 0 005 0c0-1.38-.5-2-1-3-1.072-2.143-.224-4.011-.224-4.011s1.224 1.868 2.224 4.011c.5 1 1 1.62 1 3a2.5 2.5 0 005 0v1.5c0 1.38-.5 2-1 3"></path><path d="M12 22c4.97 0 9-4.03 9-9 0-4.97-9-13-9-13S3 8.03 3 13c0 4.97 4.03 9 9 9z" fill-opacity="0.6"></path></svg></div>`,
                iconSize: [24, 24]
              })}
            >
                <Popup className="bg-slate-900 text-white">
                    <div className="text-xs">
                        <strong className="text-red-500 block">Thermal Anomaly</strong>
                        Brightness: {fire.brightness.toFixed(0)}<br/>
                        Confidence: {fire.confidence}
                    </div>
                </Popup>
            </Marker>
        ))}

        {/* Infrastructure POI */}
        {activeLayers.infra && infra.map((poi) => (
            <Marker
              key={poi.id}
              position={[poi.lat, poi.lng]}
              icon={L.divIcon({
                className: 'infra-icon',
                html: `<div class="text-white bg-${poi.type === 'police' ? 'blue-600' : 'red-600'} rounded p-1 shadow-lg">${poi.type === 'police' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>'}</div>`,
                iconSize: [20, 20]
              })}
            >
                <Popup className="bg-slate-900 text-white">
                    <div className="text-xs">
                        <strong className="block capitalize">{poi.type}</strong>
                        {poi.name}
                    </div>
                </Popup>
            </Marker>
        ))}

        {activeLayers.flights && <FlightMapLayer />}

        {activeLayers.webcams && webcams.map((cam) => (
          <Marker 
            key={cam.id} 
            position={[cam.lat, cam.lng]}
            icon={L.divIcon({
              className: 'custom-cam-icon',
              html: `<div class="bg-red-500 w-3 h-3 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] border border-white animate-pulse"></div>`,
              iconSize: [12, 12]
            })}
          >
            <Popup className="bg-slate-900">
               <div className="min-w-[250px]">
                 <h3 className="text-white font-bold mb-1 border-b border-slate-700 pb-1">Unsecured Webcam</h3>
                 <img src={cam.imageUrl} alt="Cam Feed" className="w-full h-32 object-cover rounded mb-2 bg-slate-800" />
                 <div className="text-xs text-slate-400 space-y-1">
                   <p><span className="text-slate-500">IP:</span> {cam.ip}:{cam.port}</p>
                   <p><span className="text-slate-500">ISP:</span> {cam.org}</p>
                 </div>
               </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <style>{`
        .neon-border { filter: drop-shadow(0 0 5px #06b6d4) drop-shadow(0 0 10px #06b6d4); }
      `}</style>
      
      {/* Legend */}
      <div className="absolute bottom-6 right-6 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg text-xs space-y-2">
         <div className="font-bold text-slate-300 border-b border-slate-700 pb-1 mb-1">Live Intel Layers</div>
         {gdeltEvents.length > 0 && (
           <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div> <span>Global Risk Event</span>
           </div>
         )}
         {activeLayers.fires && (
             <div className="flex items-center gap-2">
                 <Flame size={12} className="text-red-500"/> <span>Fire/Hotspots</span>
             </div>
         )}
         {activeLayers.infra && (
             <div className="flex items-center gap-2">
                 <Building2 size={12} className="text-blue-500"/> <span>Infrastructure</span>
             </div>
         )}
         {activeLayers.traffic && (
            <div className="flex items-center gap-2">
               <AlertOctagon size={12} className="text-yellow-500"/> <span>Traffic Incident</span>
            </div>
         )}
         {activeLayers.flights && (
           <div className="flex items-center gap-2">
             <Plane size={14} className="text-blue-400" /> <span>Commercial Air</span>
           </div>
         )}
      </div>
    </div>
  );
};

export default AppMap;
