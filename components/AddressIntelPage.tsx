
import React, { useState } from 'react';
import { Search, MapPin, ExternalLink, Satellite, Locate, Layers, Sun, Eye } from 'lucide-react';
import { fetchAddressSearch, fetchWeather } from '../services/api';
import { AddressResult, WeatherData } from '../types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useToast } from '../services/toastContext';

// Fix icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const AddressIntelPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressResult[]>([]);
  const [selected, setSelected] = useState<AddressResult | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'street'>('map');
  const { addToast } = useToast();

  const handleSearch = async () => {
    if(!query) return;
    setLoading(true);
    // Nominatim handles address, postcode, and even some lat/lon formats
    const data = await fetchAddressSearch(query);
    setResults(data);
    setLoading(false);
    if(data.length === 0) addToast('warning', 'No Results', 'Target address not found in global DB.');
  };

  const selectAddress = async (addr: AddressResult) => {
      setSelected(addr);
      // Fetch rich data for location
      const wData = await fetchWeather(parseFloat(addr.lat), parseFloat(addr.lon));
      setWeather(wData);
      setViewMode('map');
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4 z-10">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <MapPin className="text-cyan-500 drop-shadow-[0_0_10px_#00ffff]" size={32} />
            TARGET <span className="text-slate-500">ACQUISITION</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Geolocation • Satellite Recon • Instant Street View • Rich Data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden z-0">
          {/* Search & Results Panel */}
          <div className="flex flex-col gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                 <div className="flex gap-2">
                     <input 
                       className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_#00ffff]"
                       placeholder="Enter coordinates, address, or postcode..."
                       value={query}
                       onChange={(e) => setQuery(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                     />
                     <button onClick={handleSearch} className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg shadow-[0_0_10px_#00ffff]">
                        <Search size={20}/>
                     </button>
                 </div>
                 <div className="text-[10px] text-slate-500 mt-2 px-1">
                    Supports: Address, Postcode, City, or "Lat, Long"
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-xl border border-slate-800 p-2 custom-scrollbar">
                  {loading && <div className="text-center p-4 text-slate-500 animate-pulse">Scanning Global Database...</div>}
                  {results.length === 0 && !loading && <div className="text-center p-4 text-slate-600">No targets loaded.</div>}
                  {results.map((res) => (
                      <div 
                        key={res.place_id} 
                        onClick={() => selectAddress(res)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 border ${selected?.place_id === res.place_id ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                      >
                          <div className="font-bold text-sm text-slate-200">{res.display_name.split(',')[0]}</div>
                          <div className="text-xs text-slate-400 mt-1 truncate">{res.display_name}</div>
                          <div className="text-[10px] font-mono text-slate-500 mt-2 flex gap-2">
                              <span>TYPE: {res.type.toUpperCase()}</span>
                              <span>LAT: {parseFloat(res.lat).toFixed(4)}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Map & Detail View */}
          <div className="lg:col-span-2 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              {selected ? (
                 <>
                   <div className="flex-1 relative z-0">
                       {viewMode === 'map' ? (
                            <MapContainer 
                                center={[parseFloat(selected.lat), parseFloat(selected.lon)]} 
                                zoom={16} 
                                style={{height: '100%', width: '100%'}}
                                key={selected.place_id} // Force remount on change
                            >
                                <TileLayer
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                    attribution="Esri"
                                />
                                <Marker 
                                    position={[parseFloat(selected.lat), parseFloat(selected.lon)]}
                                    icon={L.divIcon({
                                        className: 'neon-marker-wrap',
                                        html: `<div class="text-cyan-400 drop-shadow-[0_0_20px_#00ffff] animate-bounce"><svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
                                        iconSize: [64, 64],
                                        iconAnchor: [32, 64]
                                    })}
                                >
                                    <Popup className="bg-slate-900 border-none text-white">{selected.display_name}</Popup>
                                </Marker>
                            </MapContainer>
                       ) : (
                           /* Instant Street View Embed */
                           /* Logic: We use the coordinates from the selection to drive the Street View location */
                           <iframe 
                             src={`https://www.instantstreetview.com/@${selected.lat},${selected.lon},0h,0p,1z`}
                             className="w-full h-full border-none"
                             title="Instant Street View"
                             allowFullScreen
                           />
                       )}
                       
                       {/* Overlay Controls */}
                       <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                           <button 
                             onClick={() => setViewMode(viewMode === 'map' ? 'street' : 'map')}
                             className="bg-white text-black font-bold px-4 py-2 rounded shadow-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
                           >
                              {viewMode === 'map' ? <><Eye size={16}/> INSTANT STREET VIEW</> : <><Satellite size={16}/> SATELLITE MAP</>}
                           </button>
                           
                           <a 
                             href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selected.lat},${selected.lon}`}
                             target="_blank"
                             rel="noreferrer"
                             className="bg-blue-600 text-white font-bold px-4 py-2 rounded shadow-lg flex items-center gap-2 hover:bg-blue-500 transition-colors text-xs justify-center"
                           >
                              <ExternalLink size={14}/> GOOGLE MAPS
                           </a>

                           <div className="bg-slate-900/80 backdrop-blur text-white p-2 rounded border border-slate-600 mt-2">
                               <div className="text-[10px] text-slate-400">LATITUDE</div>
                               <div className="font-mono text-sm">{selected.lat}</div>
                               <div className="text-[10px] text-slate-400 mt-1">LONGITUDE</div>
                               <div className="font-mono text-sm">{selected.lon}</div>
                           </div>
                       </div>
                   </div>
                   
                   {/* Info Deck */}
                   <div className="h-40 bg-slate-950 border-t border-slate-800 p-4 grid grid-cols-3 gap-4">
                       <div className="bg-slate-900 rounded p-3 border border-slate-800">
                           <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Sun size={12}/> Local Conditions</h3>
                           {weather ? (
                               <div className="text-sm">
                                   <div className="font-bold text-2xl text-cyan-400">{weather.temp}°C</div>
                                   <div className="text-slate-400 capitalize">{weather.description}</div>
                                   <div className="text-xs text-slate-500 mt-1">Wind: {weather.windSpeed}m/s</div>
                               </div>
                           ) : <div className="text-xs text-slate-500">Loading...</div>}
                       </div>
                       
                       <div className="bg-slate-900 rounded p-3 border border-slate-800 col-span-2">
                           <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Layers size={12}/> Target Metadata</h3>
                           <div className="grid grid-cols-2 gap-4 text-xs">
                               <div>
                                   <span className="text-slate-500 block">Class/Type</span>
                                   <span className="text-slate-300">{selected.class} / {selected.type}</span>
                               </div>
                               <div>
                                   <span className="text-slate-500 block">Importance Rank</span>
                                   <span className="text-slate-300">{selected.importance.toFixed(3)}</span>
                               </div>
                               <div>
                                   <span className="text-slate-500 block">OSM ID</span>
                                   <span className="text-slate-300">{selected.osm_id}</span>
                               </div>
                               <div>
                                   <span className="text-slate-500 block">Licence</span>
                                   <span className="text-slate-300 truncate">{selected.licence}</span>
                               </div>
                           </div>
                       </div>
                   </div>
                 </>
              ) : (
                 <div className="flex items-center justify-center h-full text-slate-600 flex-col gap-4">
                     <Satellite size={64} className="opacity-20"/>
                     <p>Select a target to initialize satellite uplink</p>
                 </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default AddressIntelPage;
