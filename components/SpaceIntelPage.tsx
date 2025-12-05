import React, { useEffect, useState, useRef } from 'react';
import { Rocket, AlertTriangle, Activity, Satellite, Globe, Zap, Radio, Map as MapIcon, Layers, Flame, Eye } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { fetchAsteroids, fetchSolarFlares, fetchEpicImages, fetchGeomagneticStorms, fetchISSPosition, fetchEonetEvents } from '../services/api';
import { NasaAsteroid, NasaSolarFlare, NasaEpicImage, NasaGST, ISSData, EonetEvent } from '../types';

// Custom Icon for ISS
const issIcon = L.divIcon({
  className: 'iss-icon',
  html: `<div class="text-white drop-shadow-[0_0_10px_cyan] animate-pulse"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h20"/><path d="m12 2 3 3-3 3-3-3 3-3Z"/><path d="m12 22 3-3-3-3-3 3 3 3Z"/><rect x="8" y="8" width="8" height="8" rx="1"/></svg></div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const SpaceIntelPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'deep' | 'leo'>('deep');
  const [asteroids, setAsteroids] = useState<NasaAsteroid[]>([]);
  const [flares, setFlares] = useState<NasaSolarFlare[]>([]);
  const [storms, setStorms] = useState<NasaGST[]>([]);
  const [epicImage, setEpicImage] = useState<NasaEpicImage | null>(null);
  const [issData, setIssData] = useState<ISSData | null>(null);
  const [issPath, setIssPath] = useState<[number, number][]>([]);
  const [eonetEvents, setEonetEvents] = useState<EonetEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Initial Data
  useEffect(() => {
    const loadSpaceData = async () => {
      setLoading(true);
      const [astData, flrData, epicData, gstData, eonetData] = await Promise.all([
        fetchAsteroids(),
        fetchSolarFlares(),
        fetchEpicImages(),
        fetchGeomagneticStorms(),
        fetchEonetEvents()
      ]);
      setAsteroids(astData);
      setFlares(flrData);
      setStorms(gstData);
      setEonetEvents(eonetData);
      if (epicData.length > 0) setEpicImage(epicData[0]);
      setLoading(false);
    };
    loadSpaceData();
  }, []);

  // Poll ISS Data
  useEffect(() => {
    const updateISS = async () => {
      const data = await fetchISSPosition();
      if (data) {
        setIssData(data);
        setIssPath(prev => {
           const newPath = [...prev, [data.latitude, data.longitude] as [number, number]];
           if (newPath.length > 300) return newPath.slice(newPath.length - 300); // Keep last 300 points
           return newPath;
        });
      }
    };
    
    // Initial fetch
    updateISS();
    
    // Poll every 5 seconds for live track
    const interval = setInterval(updateISS, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate Threat Level
  const calculateThreatLevel = () => {
    let level = 0;
    if (flares.some(f => f.classType.startsWith('X'))) level += 4;
    else if (flares.some(f => f.classType.startsWith('M'))) level += 2;
    
    if (storms.length > 0) {
       const recentKp = storms[0].allKpIndex.slice(-1)[0]?.kpIndex || 0;
       if (recentKp >= 8) level += 5;
       else if (recentKp >= 5) level += 3;
    }
    
    const countHazardous = asteroids.filter(a => a.is_potentially_hazardous_asteroid).length;
    if (countHazardous > 0) level += 2;
    
    if (level >= 7) return { text: 'CRITICAL', color: 'text-red-500', bg: 'bg-red-500', val: 90 };
    if (level >= 4) return { text: 'ELEVATED', color: 'text-orange-400', bg: 'bg-orange-400', val: 60 };
    return { text: 'NOMINAL', color: 'text-green-400', bg: 'bg-green-400', val: 20 };
  };

  const threat = calculateThreatLevel();

  return (
    <div className="h-full w-full bg-black relative overflow-hidden flex flex-col">
       {/* Background Stars Effect */}
       <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50 pointer-events-none"></div>

       {/* Header */}
       <div className="relative z-20 p-6 flex justify-between items-start bg-gradient-to-b from-black/90 to-transparent">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
               <Rocket className="text-cyan-400" size={32}/> 
               ORBITAL <span className="text-slate-500">OSINT</span>
            </h1>
            <p className="text-cyan-600 text-sm mt-1 font-mono tracking-widest uppercase">
              Planetary Defense • Satellites • Space Weather
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
             <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-700">
                <button 
                  onClick={() => setViewMode('deep')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-2 ${viewMode === 'deep' ? 'bg-cyan-900 text-cyan-200' : 'text-slate-400 hover:text-white'}`}
                >
                   <Globe size={14}/> DEEP SPACE
                </button>
                <button 
                  onClick={() => setViewMode('leo')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-2 ${viewMode === 'leo' ? 'bg-purple-900 text-purple-200' : 'text-slate-400 hover:text-white'}`}
                >
                   <Satellite size={14}/> LOW EARTH ORBIT
                </button>
             </div>
             
             {/* Threat Matrix */}
             <div className="bg-slate-900/80 border border-slate-700 px-4 py-2 rounded flex items-center gap-4">
                 <div className="text-right">
                    <span className="block text-[10px] text-slate-500 uppercase">Threat Matrix</span>
                    <span className={`font-black font-mono text-lg ${threat.color}`}>{threat.text}</span>
                 </div>
                 <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${threat.bg} transition-all duration-500`} style={{ width: `${threat.val}%` }}></div>
                 </div>
             </div>
          </div>
       </div>

       {/* Main Content Area */}
       <div className="flex-1 relative z-10 flex overflow-hidden">
          
          {/* LEFT PANEL: Space Weather & Assets */}
          <div className="w-80 bg-black/60 backdrop-blur-sm border-r border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar z-30">
              {/* Solar Status */}
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg">
                 <h3 className="text-xs font-bold text-yellow-500 uppercase mb-2 flex items-center gap-2"><Zap size={12}/> Solar Activity (DONKI)</h3>
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-300">
                       <span>Solar Flares (30d):</span>
                       <span className="font-mono font-bold text-white">{flares.length}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                       <span>Geomag Storms (15d):</span>
                       <span className="font-mono font-bold text-white">{storms.length}</span>
                    </div>
                    {flares.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-800">
                           <div className="text-[10px] text-slate-400 mb-1">Latest Flare:</div>
                           <div className="text-xs font-bold text-yellow-400">{flares[flares.length-1].classType} Class</div>
                           <div className="text-[10px] text-slate-500">{new Date(flares[flares.length-1].beginTime).toLocaleDateString()}</div>
                        </div>
                    )}
                 </div>
              </div>

              {/* Asset Count */}
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg">
                 <h3 className="text-xs font-bold text-cyan-500 uppercase mb-2 flex items-center gap-2"><Layers size={12}/> Orbit Census</h3>
                 <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-300">
                       <span>Hazardous Asteroids:</span>
                       <span className="font-mono font-bold text-red-400">{asteroids.filter(a => a.is_potentially_hazardous_asteroid).length}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                       <span>Total NEOs Tracked:</span>
                       <span className="font-mono font-bold text-white">{asteroids.length}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                       <span>Active ISS Crew:</span>
                       <span className="font-mono font-bold text-green-400">7</span>
                    </div>
                 </div>
              </div>

              {/* EONET Events List */}
              <div className="flex-1 bg-slate-900/50 border border-slate-800 p-3 rounded-lg overflow-hidden flex flex-col">
                 <h3 className="text-xs font-bold text-orange-500 uppercase mb-2 flex items-center gap-2"><Eye size={12}/> Planetary Surveillance (EONET)</h3>
                 <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {eonetEvents.map(evt => (
                        <div key={evt.id} className="text-xs p-2 bg-slate-800/50 rounded border-l-2 border-orange-500">
                            <div className="font-bold text-slate-200 mb-1">{evt.title}</div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>{evt.categories[0]?.title}</span>
                                <span>{new Date(evt.geometry[0].date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
          </div>

          {/* CENTER PANEL: Main View */}
          <div className="flex-1 relative bg-black">
             {viewMode === 'deep' ? (
                 /* DEEP SPACE VIEW (EPIC) */
                 <div className="absolute inset-0 flex items-center justify-center">
                    {loading ? (
                        <div className="text-cyan-500 font-mono animate-pulse">ESTABLISHING DEEP SPACE LINK...</div>
                    ) : epicImage ? (
                        <div className="relative group w-full h-full flex items-center justify-center">
                            <img 
                            src={epicImage.imageUrl} 
                            alt="Earth from Space" 
                            className="max-h-[85vh] w-auto object-contain drop-shadow-[0_0_50px_rgba(6,182,212,0.2)]"
                            />
                            {/* Overlay Text */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur px-6 py-2 rounded-full border border-cyan-900 text-center">
                                <div className="text-xs font-bold text-cyan-300">DSCOVR SATELLITE FEED</div>
                                <div className="text-[10px] text-slate-400">{epicImage.date} • 1,000,000 miles away</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-red-500">NO VISUAL FEED AVAILABLE</div>
                    )}
                 </div>
             ) : (
                 /* LEO VIEW (Leaflet Map) */
                 <div className="h-full w-full">
                    <MapContainer
                        center={[0, 0]}
                        zoom={2}
                        style={{ height: '100%', width: '100%', background: '#000' }}
                        zoomControl={false}
                        attributionControl={false}
                    >
                         <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution="Tiles &copy; Esri"
                            opacity={0.6}
                         />
                         {/* ISS Marker & Path */}
                         {issData && (
                             <>
                                <Marker position={[issData.latitude, issData.longitude]} icon={issIcon}>
                                   <Popup className="bg-slate-900 text-white border-none">
                                      <div className="font-bold text-cyan-400">ISS (ZARYA)</div>
                                      <div className="text-xs">
                                         Alt: {issData.altitude.toFixed(2)} km<br/>
                                         Vel: {issData.velocity.toFixed(2)} km/h<br/>
                                         Lat: {issData.latitude.toFixed(2)}<br/>
                                         Lng: {issData.longitude.toFixed(2)}
                                      </div>
                                   </Popup>
                                </Marker>
                                <Polyline positions={issPath} color="cyan" weight={2} dashArray="5, 5" opacity={0.6} />
                             </>
                         )}

                         {/* EONET Markers */}
                         {eonetEvents.map(evt => {
                             // EONET usually provides [lng, lat] in GeoJSON, Leaflet needs [lat, lng]
                             const coords = evt.geometry[0].coordinates;
                             const pos: [number, number] = [coords[1], coords[0]]; 
                             return (
                                <Marker 
                                    key={evt.id} 
                                    position={pos}
                                    icon={L.divIcon({
                                        className: 'eonet-icon',
                                        html: `<div class="text-orange-500 animate-pulse"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg></div>`,
                                        iconSize: [20, 20]
                                    })}
                                >
                                    <Popup className="bg-slate-900 text-white border-none">
                                        <div className="font-bold text-orange-400 text-xs">{evt.title}</div>
                                        <div className="text-[10px]">{evt.categories[0]?.title}</div>
                                    </Popup>
                                </Marker>
                             );
                         })}
                    </MapContainer>
                    
                    {/* Live Telemetry Overlay */}
                    {issData && (
                        <div className="absolute top-4 right-4 z-[400] bg-black/70 backdrop-blur p-4 rounded-xl border border-purple-500/30 w-64">
                             <div className="text-xs font-bold text-purple-400 uppercase mb-2 border-b border-purple-500/30 pb-1">Live Telemetry (ISS)</div>
                             <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                 <div className="text-slate-400">LATITUDE</div>
                                 <div className="text-right text-white">{issData.latitude.toFixed(4)}</div>
                                 <div className="text-slate-400">LONGITUDE</div>
                                 <div className="text-right text-white">{issData.longitude.toFixed(4)}</div>
                                 <div className="text-slate-400">ALTITUDE</div>
                                 <div className="text-right text-white">{issData.altitude.toFixed(2)} km</div>
                                 <div className="text-slate-400">VELOCITY</div>
                                 <div className="text-right text-white">{issData.velocity.toFixed(0)} km/h</div>
                             </div>
                        </div>
                    )}
                 </div>
             )}
          </div>

          {/* RIGHT PANEL: NEOs & Lists */}
          <div className="w-72 bg-black/60 backdrop-blur-sm border-l border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar z-30">
              <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex-1">
                 <h3 className="text-xs font-bold text-red-500 uppercase mb-3 flex items-center gap-2 border-b border-red-900/50 pb-2">
                    <AlertTriangle size={14}/> Near Earth Objects
                 </h3>
                 <div className="space-y-2">
                    {asteroids.length === 0 && !loading && <div className="text-slate-500 text-xs">Scanning deep space...</div>}
                    {asteroids.map((ast) => (
                       <div key={ast.id} className={`p-2 rounded border-l-2 ${ast.is_potentially_hazardous_asteroid ? 'bg-red-950/30 border-red-500' : 'bg-slate-900/50 border-cyan-800'}`}>
                          <div className="flex justify-between items-center mb-1">
                             <span className={`font-bold text-xs ${ast.is_potentially_hazardous_asteroid ? 'text-red-400 animate-pulse' : 'text-cyan-200'}`}>
                                {ast.name.replace('(', '').replace(')', '')}
                             </span>
                             {ast.is_potentially_hazardous_asteroid && <AlertTriangle size={10} className="text-red-500"/>}
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400">
                             <div>Dia: {Math.round(ast.estimated_diameter.meters.estimated_diameter_max)}m</div>
                             <div>Dist: {Math.round(parseFloat(ast.close_approach_data[0]?.miss_distance.kilometers) / 1000000)}M km</div>
                             <div className="col-span-2 text-right">
                                {ast.close_approach_data[0]?.close_approach_date}
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
          </div>
       </div>

       <style>{`
          @keyframes spin-slow {
             from { transform: translate(-50%, -50%) rotate(0deg); }
             to { transform: translate(-50%, -50%) rotate(360deg); }
          }
          .animate-spin-slow {
             animation: spin-slow 120s linear infinite;
          }
       `}</style>
    </div>
  );
};

export default SpaceIntelPage;
