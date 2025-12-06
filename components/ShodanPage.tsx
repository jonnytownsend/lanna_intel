
import React, { useEffect, useState } from 'react';
import { WebcamData } from '../types';
import { fetchShodanWebcams } from '../services/api';
import { Search, ShieldAlert, Server, Maximize2, X, MapPin, Shield, RefreshCw, Layers, ExternalLink, Copy, Map as MapIcon, Grid } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ShodanPage: React.FC = () => {
  const [webcams, setWebcams] = useState<WebcamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCam, setSelectedCam] = useState<WebcamData | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filters - Defaults empty
  const [queryPort, setQueryPort] = useState('');
  const [queryOrg, setQueryOrg] = useState('');
  const [queryProduct, setQueryProduct] = useState('');

  const loadData = async () => {
    setLoading(true);
    // Fetch without filters initially (api.ts will default to just country:TH or global if adjusted)
    const data = await fetchShodanWebcams({
        port: queryPort,
        org: queryOrg,
        product: queryProduct
    });
    setWebcams(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []); // Initial load

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Copied to clipboard: ${text}`);
  };

  const openFeed = (url: string) => {
      window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden relative">
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
             {/* View Toggle */}
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

             {/* Advanced Filters */}
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
                        <option value="21">21 (FTP)</option>
                        <option value="22">22 (SSH)</option>
                        <option value="23">23 (Telnet)</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold ml-1">Device Type</label>
                    <select 
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                        value={queryProduct}
                        onChange={(e) => setQueryProduct(e.target.value)}
                    >
                        <option value="">All Devices</option>
                        <option value="webcam">Webcams</option>
                        <option value="apache">Apache Servers</option>
                        <option value="nginx">Nginx</option>
                        <option value="mikrotik">MikroTik Routers</option>
                        <option value="openssh">OpenSSH</option>
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

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-4">
          <div className="w-12 h-12 border-4 border-slate-800 border-t-red-500 rounded-full animate-spin"/>
          <div className="text-sm font-mono animate-pulse">ESTABLISHING SHODAN UPLINK...</div>
        </div>
      ) : viewMode === 'map' ? (
          /* MAP VIEW */
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-800">
               <MapContainer 
                   center={[13.7563, 100.5018]} 
                   zoom={6} 
                   style={{height: '100%', width: '100%', background: '#020617'}}
               >
                   <TileLayer
                      attribution='&copy; CARTO'
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                   />
                   {webcams.map(cam => (
                       <Marker 
                          key={cam.id} 
                          position={[cam.lat, cam.lng]}
                          eventHandlers={{ click: () => setSelectedCam(cam) }}
                       >
                       </Marker>
                   ))}
               </MapContainer>
          </div>
      ) : (
        /* GRID VIEW */
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {webcams.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-center text-slate-500 py-20 border border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                    <ShieldAlert size={48} className="mb-4 text-slate-700"/>
                    <p className="font-bold text-lg">No Live Targets Found</p>
                    <p className="text-sm max-w-md mt-2">
                        The current API plan may restrict detailed filters (like Country code) or no live devices match your criteria.
                        <br/><span className="text-red-500">No simulated data is displayed.</span>
                    </p>
                </div>
            )}
            {webcams.map(cam => (
              <div key={cam.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-red-500/50 transition-colors group flex flex-col">
                <div className="relative h-40 bg-black cursor-pointer group-hover:bg-slate-950 transition-colors flex items-center justify-center" onClick={() => setSelectedCam(cam)}>
                   {/* Attempt to load live snapshot. If fail, showing nothing but UI controls */}
                   <img 
                      src={cam.imageUrl} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                      alt="feed" 
                      onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          // Show placeholder text if image fails (common for non-HTTP streams)
                          const parent = (e.target as HTMLElement).parentElement;
                          if(parent) {
                              const div = document.createElement('div');
                              div.className = "text-xs text-slate-600 font-mono p-4 text-center";
                              div.innerText = "NO HTTP SNAPSHOT\nPROTOCOL: " + (cam.port === 554 ? 'RTSP' : 'TCP/IP');
                              parent.appendChild(div);
                          }
                      }}
                   />
                   
                   <div className="absolute top-2 right-2 flex gap-1 z-10">
                     <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                        PORT {cam.port}
                     </span>
                   </div>
                   
                   <div className="absolute bottom-2 left-2 z-10">
                      {cam.product && (
                        <span className="bg-blue-900/80 text-blue-200 text-[10px] px-2 py-0.5 rounded border border-blue-500/30">
                            {cam.product}
                        </span>
                      )}
                   </div>

                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 z-20">
                      <Maximize2 className="text-white drop-shadow-md" size={32} />
                   </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-mono text-sm text-red-400 font-bold truncate" title={cam.ip}>{cam.ip}</h3>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-slate-400 flex-1">
                    <div className="flex items-center gap-2 truncate" title={cam.org}>
                       <Server size={12} className="shrink-0"/> {cam.org}
                    </div>
                    <div className="flex items-center gap-2">
                       <MapPin size={12} className="shrink-0"/> {cam.city}, {cam.country}
                    </div>
                    {cam.os && (
                        <div className="flex items-center gap-2">
                            <Layers size={12} className="shrink-0"/> {cam.os}
                        </div>
                    )}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center gap-2">
                     <button 
                        onClick={() => openFeed(cam.imageUrl || `http://${cam.ip}:${cam.port}`)}
                        className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 py-1.5 rounded transition-colors"
                     >
                        <ExternalLink size={10}/> Connect
                     </button>
                     <button 
                        onClick={() => copyToClipboard(`http://${cam.ip}:${cam.port}`)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                        title="Copy URL"
                     >
                        <Copy size={12}/>
                     </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCam && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-200">
           <div className="bg-slate-900 w-full h-full max-w-6xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                 <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                       <Shield size={18} className="text-slate-400"/>
                       Target: {selectedCam.ip}
                    </h2>
                 </div>
                 <button onClick={() => setSelectedCam(null)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"><X size={24} /></button>
              </div>
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                 <div className="flex-1 bg-black relative flex items-center justify-center p-4">
                    <pre className="text-green-500 font-mono text-xs overflow-auto max-h-full w-full p-4 border border-slate-800 rounded bg-slate-900/50">
                        {JSON.stringify(selectedCam, null, 2)}
                    </pre>
                 </div>
                 <div className="w-full md:w-80 bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">Intelligence</h3>
                    <div className="space-y-6">
                       <div><label className="text-xs text-slate-500 uppercase block mb-1">Organization</label><div className="text-sm text-white">{selectedCam.org}</div></div>
                       <div><label className="text-xs text-slate-500 uppercase block mb-1">Location</label><div className="text-sm text-white">{selectedCam.city}, {selectedCam.country}</div></div>
                       <div><label className="text-xs text-slate-500 uppercase block mb-1">Banner Data</label><div className="text-[10px] font-mono text-slate-400 bg-black p-2 rounded max-h-40 overflow-y-auto">{selectedCam.data}</div></div>
                    
                       <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                           <button 
                              onClick={() => openFeed(selectedCam.imageUrl || `http://${selectedCam.ip}:${selectedCam.port}`)}
                              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-2"
                           >
                              <ExternalLink size={14}/> Attempt Direct Connection
                           </button>
                           <button 
                              onClick={() => copyToClipboard(`http://${selectedCam.ip}:${selectedCam.port}`)}
                              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded text-xs flex items-center justify-center gap-2"
                           >
                              <Copy size={14}/> Copy Feed URL
                           </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ShodanPage;
