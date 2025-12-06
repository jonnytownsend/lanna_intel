import React, { useEffect, useState, useRef } from 'react';
import { WebcamData } from '../types';
import { fetchShodanWebcams } from '../services/api';
import { Search, ShieldAlert, Grid, Map as MapIcon, RefreshCw, X, Maximize2, ExternalLink, Globe, Server, Activity, Play, Pause, AlertTriangle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet Icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ShodanPage: React.FC = () => {
  const [webcams, setWebcams] = useState<WebcamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filters
  const [queryPort, setQueryPort] = useState('');
  const [queryProduct, setQueryProduct] = useState('');

  // Modal / Player State
  const [selectedCam, setSelectedCam] = useState<WebcamData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Forces image reload for "stream" effect
  const playerRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchShodanWebcams({
        port: queryPort,
        product: queryProduct
    });
    setWebcams(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Simulated MJPEG Stream Loop
  useEffect(() => {
    let interval: any;
    if (selectedCam && isPlaying) {
        interval = setInterval(() => {
            setRefreshKey(prev => prev + 1);
        }, 1000); // 1 FPS Refresh
    }
    return () => clearInterval(interval);
  }, [selectedCam, isPlaying]);

  const openCam = (cam: WebcamData) => {
      setSelectedCam(cam);
      setIsPlaying(true);
  };

  const closeCam = () => {
      setSelectedCam(null);
      setIsPlaying(false);
  };

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          playerRef.current?.requestFullscreen();
      } else {
          document.exitFullscreen();
      }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={32} />
            SHODAN <span className="text-slate-500">IOT SCANNER</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Deep Scan • Ports • IoT Devices • Webcams • SCADA
          </p>
        </div>
        
        <div className="flex gap-2">
             <div className="flex bg-slate-900 rounded-xl border border-slate-800 p-1">
                 <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
                    title="Grid View"
                 >
                    <Grid size={18}/>
                 </button>
                 <button 
                    onClick={() => setViewMode('map')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}
                    title="Map View"
                 >
                    <MapIcon size={18}/>
                 </button>
             </div>

             <div className="flex flex-wrap gap-2 items-end bg-slate-900 p-2 rounded-xl border border-slate-800">
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold ml-1">Target Port</label>
                    <select 
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                        value={queryPort}
                        onChange={(e) => setQueryPort(e.target.value)}
                    >
                        <option value="">Any Port</option>
                        <option value="80">80 (HTTP)</option>
                        <option value="443">443 (HTTPS)</option>
                        <option value="554">554 (RTSP)</option>
                    </select>
                </div>
                
                <button 
                    onClick={loadData}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors h-full flex items-center justify-center"
                >
                    {loading ? <RefreshCw className="animate-spin" size={16}/> : <Search size={16}/>}
                </button>
            </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
          <div className="w-12 h-12 border-4 border-slate-800 border-t-red-500 rounded-full animate-spin"/>
          <div className="text-sm font-mono animate-pulse">ESTABLISHING SHODAN UPLINK...</div>
        </div>
      ) : viewMode === 'map' ? (
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
               <MapContainer 
                   center={[13.7563, 100.5018]} 
                   zoom={6} 
                   style={{height: '100%', width: '100%'}}
               >
                   <TileLayer
                      attribution='&copy; CARTO'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                   />
                   {webcams.map(cam => (
                       <Marker 
                          key={cam.id} 
                          position={[cam.lat, cam.lng]}
                          eventHandlers={{ click: () => openCam(cam) }}
                          icon={L.divIcon({
                              className: 'neon-marker-wrap',
                              html: `<div class="text-red-500 bg-red-900/30 rounded-full p-1 border border-red-500"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg></div>`,
                              iconSize: [24, 24],
                              iconAnchor: [12, 12]
                          })}
                       />
                   ))}
               </MapContainer>
          </div>
      ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {webcams.map(cam => (
                      <div 
                        key={cam.id} 
                        onClick={() => openCam(cam)}
                        className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-red-500/50 transition-all cursor-pointer group hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                      >
                          <div className="h-40 bg-black relative overflow-hidden">
                              <img 
                                src={cam.imageUrl} 
                                alt="Feed" 
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300/000000/333333?text=NO+SIGNAL'; }}
                              />
                              <div className="absolute top-2 right-2 bg-black/80 text-red-500 text-[10px] font-bold px-2 py-1 rounded border border-red-900 flex items-center gap-1">
                                  <Activity size={10} className="animate-pulse"/> LIVE
                              </div>
                          </div>
                          <div className="p-3">
                              <div className="flex justify-between items-start mb-2">
                                  <div className="font-mono text-xs font-bold text-white">{cam.ip}</div>
                                  <div className="text-[10px] text-slate-500">{cam.port}</div>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
                                  <Globe size={10}/> {cam.city}, {cam.country}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 truncate" title={cam.org}>
                                  <Server size={10}/> {cam.org}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* WEBCAM PLAYER MODAL */}
      {selectedCam && (
          <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
              <div ref={playerRef} className="bg-slate-900 w-full max-w-6xl h-[80vh] border border-slate-700 rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                  
                  {/* Close Button */}
                  <button onClick={closeCam} className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-red-600 text-white p-2 rounded-full transition-colors">
                      <X size={20}/>
                  </button>

                  {/* Video Stage */}
                  <div className="flex-1 bg-black relative flex flex-col">
                       {/* Simulated Stream Feed */}
                       <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-zinc-950">
                           {selectedCam.port === 554 ? (
                               <div className="text-center p-8">
                                   <AlertTriangle size={64} className="text-yellow-500 mx-auto mb-4"/>
                                   <h3 className="text-xl font-bold text-white mb-2">RTSP Stream Detected</h3>
                                   <p className="text-slate-400 mb-6 max-w-md mx-auto">
                                       Real-Time Streaming Protocol (Port 554) requires a dedicated player or WebSocket proxy. 
                                       Browsers cannot render raw RTSP natively.
                                   </p>
                                   <div className="bg-slate-800 p-3 rounded font-mono text-xs text-green-400 mb-4 inline-block">
                                       rtsp://{selectedCam.ip}:{selectedCam.port}/
                                   </div>
                               </div>
                           ) : (
                               <img 
                                   src={`${selectedCam.imageUrl}${isPlaying ? `?t=${refreshKey}` : ''}`} 
                                   alt="Live Stream" 
                                   className="max-w-full max-h-full object-contain"
                               />
                           )}
                           
                           {/* Overlay UI */}
                           <div className="absolute top-4 left-4 flex gap-2">
                               <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse flex items-center gap-1">
                                   <span className="w-2 h-2 bg-white rounded-full"></span> LIVE REC
                               </span>
                           </div>
                       </div>

                       {/* Controls Bar */}
                       <div className="h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-6">
                           <div className="flex items-center gap-4">
                               <button onClick={() => setIsPlaying(!isPlaying)} className="text-slate-300 hover:text-white">
                                   {isPlaying ? <Pause size={24}/> : <Play size={24}/>}
                               </button>
                               <div className="text-xs text-slate-500 font-mono">
                                   {isPlaying ? 'STREAMING... (1 FPS MJPEG)' : 'PAUSED'}
                               </div>
                           </div>
                           <div className="flex items-center gap-4">
                               <button onClick={toggleFullscreen} className="text-slate-400 hover:text-white" title="Fullscreen">
                                   <Maximize2 size={20}/>
                               </button>
                               <a 
                                 href={`http://${selectedCam.ip}:${selectedCam.port}`} 
                                 target="_blank" 
                                 rel="noreferrer" 
                                 className="text-slate-400 hover:text-cyan-400"
                                 title="Open in Browser"
                               >
                                   <ExternalLink size={20}/>
                               </a>
                           </div>
                       </div>
                  </div>

                  {/* Intel Sidebar */}
                  <div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 flex flex-col">
                      <div className="p-4 border-b border-slate-800">
                          <h2 className="font-bold text-white flex items-center gap-2">
                              <Server size={18} className="text-cyan-500"/> Target Intel
                          </h2>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-6">
                          {/* Mini Map */}
                          <div className="h-40 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative">
                               <MapContainer 
                                   center={[selectedCam.lat, selectedCam.lng]} 
                                   zoom={10} 
                                   style={{height: '100%', width: '100%'}} 
                                   zoomControl={false}
                                   attributionControl={false}
                               >
                                   <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"/>
                                   <Marker position={[selectedCam.lat, selectedCam.lng]}/>
                               </MapContainer>
                               <div className="absolute bottom-0 left-0 w-full bg-black/50 p-1 text-[10px] text-white text-center backdrop-blur-sm">
                                   {selectedCam.city}, {selectedCam.country}
                               </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-3 text-xs">
                              <div className="flex justify-between border-b border-slate-800 pb-2">
                                  <span className="text-slate-500">IP Address</span>
                                  <span className="font-mono text-cyan-400">{selectedCam.ip}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-800 pb-2">
                                  <span className="text-slate-500">Port / Protocol</span>
                                  <span className="font-mono text-white">{selectedCam.port} / TCP</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-800 pb-2">
                                  <span className="text-slate-500">Organization</span>
                                  <span className="text-white text-right w-32 truncate">{selectedCam.org}</span>
                              </div>
                              <div className="flex justify-between border-b border-slate-800 pb-2">
                                  <span className="text-slate-500">Last Seen</span>
                                  <span className="text-white">{new Date(selectedCam.timestamp).toLocaleDateString()}</span>
                              </div>
                          </div>

                          {/* Raw Data */}
                          <div className="bg-black/50 p-3 rounded border border-slate-800 font-mono text-[10px] text-green-500 overflow-x-hidden">
                              <div className="opacity-50 mb-1">SHODAN_BANNER_GRAB:</div>
                              <div className="break-all whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                                  {selectedCam.data ? selectedCam.data.trim() : 'No banner data available.'}
                              </div>
                          </div>
                      </div>
                      
                      <div className="p-4 border-t border-slate-800">
                          <button className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-2">
                              <ShieldAlert size={14}/> VIEW FULL REPORT
                          </button>
                      </div>
                  </div>

              </div>
          </div>
      )}
    </div>
  );
};

export default ShodanPage;