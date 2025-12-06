
import React, { useEffect, useState } from 'react';
import AppMap from './AppMap';
import ShodanPage from './ShodanPage';
import FlightBoard from './FlightBoard';
import AudioIntelPage from './AudioIntelPage';
import SpaceIntelPage from './SpaceIntelPage';
import FinancePage from './FinancePage';
import AddressIntelPage from './AddressIntelPage';
import GovOpsPage from './GovOpsPage';
import ARIntelPage from './ARIntelPage';
import SettingsPage from './SettingsPage';
import OsintToolsPage from './OsintToolsPage';
import TrackerPage from './TrackerPage';
import PredictiveAnalysisPage from './PredictiveAnalysisPage';
import AlertsPage from './AlertsPage';
import WeatherPanel from './WeatherPanel';
import CalendarPanel from './CalendarPanel';
import { WebcamData, WeatherData, CurrencyRates } from '../types';
import { fetchShodanWebcams, fetchWeather, fetchCurrencyRates } from '../services/api';
import { REGION_CENTER } from '../services/config';
import { DollarSign, Flame, Building2, Bed, BarChart3, ShieldAlert, Globe, Plane, Video, Map, Eye, Layers, Users, X, Menu } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface DashboardProps {
  activeTab: string;
}

const Dashboard: React.FC<DashboardProps> = ({ activeTab }) => {
  
  const [activeLayers, setActiveLayers] = useState({
    flights: true,
    traffic: true,
    webcams: true,
    fires: false,
    infra: false,
    hotels: false,
    gdelt: false,
    eonet: false,
    touristHeatmap: false
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [webcams, setWebcams] = useState<WebcamData[]>([]);
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [layersOpen, setLayersOpen] = useState(true); // Control layer panel visibility
  
  // Simulation Date for Heatmap
  const [heatmapDate, setHeatmapDate] = useState(new Date().toISOString().split('T')[0]);

  // Persist Map State across tabs
  const [mapState, setMapState] = useState<{lat: number, lng: number, zoom: number}>({
      lat: REGION_CENTER.lat,
      lng: REGION_CENTER.lng,
      zoom: REGION_CENTER.zoom
  });

  useEffect(() => {
    // Handle mobile initial state
    if (window.innerWidth < 768) {
        setLayersOpen(false);
    }

    // Determine active layers based on tab if NOT in God Mode
    const isGodMode = activeTab === 'dashboard';
    
    if (!isGodMode) {
        setActiveLayers(prev => ({
            ...prev,
            flights: activeTab === 'flights',
            traffic: activeTab === 'traffic',
            webcams: activeTab === 'webcams',
            hotels: false
        }));
    } else {
        if(!activeLayers.flights && !activeLayers.webcams) {
             setActiveLayers({
                flights: true,
                traffic: true,
                webcams: true,
                fires: true,
                infra: true,
                hotels: true,
                gdelt: true,
                eonet: true,
                touristHeatmap: false
            });
        }
    }
  }, [activeTab]);

  useEffect(() => {
    const initData = async () => {
      const [wData, cData, rData] = await Promise.all([
        fetchWeather(mapState.lat, mapState.lng), 
        fetchShodanWebcams(),
        fetchCurrencyRates()
      ]);
      setWeather(wData);
      setWebcams(cData);
      setRates(rData);
    };
    initData();
  }, [mapState]); 

  const toggleLayer = (layer: keyof typeof activeLayers) => {
      setActiveLayers(prev => ({...prev, [layer]: !prev[layer]}));
  };

  // View Routing
  if (activeTab === 'space') return <SpaceIntelPage />;
  if (activeTab === 'finance') return <FinancePage />;
  if (activeTab === 'address') return <AddressIntelPage />;
  if (activeTab === 'gov') return <GovOpsPage />;
  if (activeTab === 'webcams') return <ShodanPage />;
  if (activeTab === 'audio') return <AudioIntelPage />;
  if (activeTab === 'ar') return <ARIntelPage />;
  if (activeTab === 'settings') return <SettingsPage />;
  if (activeTab === 'osint') return <OsintToolsPage />;
  if (activeTab === 'tracker') return <TrackerPage />;
  if (activeTab === 'predictive') return <PredictiveAnalysisPage />;
  if (activeTab === 'alerts') return <AlertsPage />;

  return (
    <div className="flex-1 h-full relative flex flex-col bg-slate-950 overflow-hidden">
      {/* Top Bar / Header Overlay */}
      <div className="absolute top-0 left-0 w-full z-[1000] pointer-events-none p-2 md:p-4 flex flex-col items-start gap-2 max-w-[80%] md:max-w-none">
        <WeatherPanel current={weather} />
        {activeTab === 'dashboard' && <CalendarPanel />}
      </div>

      {activeTab === 'dashboard' && (
         <>
             {/* Mobile Layer Toggle Button */}
             <div className="absolute top-4 right-4 z-[1000] md:hidden">
                 <button 
                    onClick={() => setLayersOpen(!layersOpen)} 
                    className="bg-slate-900 border border-slate-700 text-cyan-400 p-2 rounded-lg shadow-lg"
                 >
                    {layersOpen ? <X size={24}/> : <Layers size={24}/>}
                 </button>
             </div>

             {/* Right Side GODMODE Layer Control Panel */}
             <div className={`
                absolute top-0 right-0 z-[1000] h-full w-72 bg-slate-950/95 backdrop-blur-md md:bg-transparent md:backdrop-blur-none
                transition-transform duration-300 ease-in-out
                flex flex-col gap-4 p-4 pt-16 md:pt-4
                ${layersOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                md:pointer-events-none
             `}>
                 <div className="pointer-events-auto flex flex-col gap-4 max-h-full">
                     {/* Layer Controls */}
                     <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-2xl overflow-hidden flex flex-col shrink-0">
                         <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 flex items-center gap-2 border-b border-slate-700 pb-2">
                            <Layers size={14}/> Omni-Layer Control
                         </h3>
                         
                         <div className="overflow-y-auto custom-scrollbar pr-2 space-y-2 flex-1 max-h-[40vh]">
                             <LayerToggle 
                                label="Tourist Density Heatmap" 
                                icon={<Users size={14}/>} 
                                active={activeLayers.touristHeatmap} 
                                onClick={() => toggleLayer('touristHeatmap')} 
                                color="text-pink-500"
                             />
                             
                             {activeLayers.touristHeatmap && (
                                 <div className="p-2 bg-slate-800 rounded mb-2 border border-slate-700 animate-in slide-in-from-top-2">
                                     <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Predictive Date</label>
                                     <input 
                                        type="date" 
                                        value={heatmapDate} 
                                        onChange={(e) => setHeatmapDate(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded text-xs px-2 py-1 text-white"
                                     />
                                     <div className="text-[10px] text-slate-500 mt-1">Simulates crowd flow based on historical Longdo data.</div>
                                 </div>
                             )}

                             <div className="h-px bg-slate-700 my-2"></div>

                             <LayerToggle 
                                label="Realtime Flights" 
                                icon={<Plane size={14}/>} 
                                active={activeLayers.flights} 
                                onClick={() => toggleLayer('flights')} 
                                color="text-cyan-400"
                             />
                             <LayerToggle 
                                label="Traffic & Incidents" 
                                icon={<Map size={14}/>} 
                                active={activeLayers.traffic} 
                                onClick={() => toggleLayer('traffic')} 
                                color="text-yellow-400"
                             />
                             <LayerToggle 
                                label="Shodan Webcams" 
                                icon={<Video size={14}/>} 
                                active={activeLayers.webcams} 
                                onClick={() => toggleLayer('webcams')} 
                                color="text-red-400"
                             />
                             <LayerToggle 
                                label="NASA FIRMS (Fire)" 
                                icon={<Flame size={14}/>} 
                                active={activeLayers.fires} 
                                onClick={() => toggleLayer('fires')} 
                                color="text-orange-500"
                             />
                             <LayerToggle 
                                label="Key Infrastructure" 
                                icon={<Building2 size={14}/>} 
                                active={activeLayers.infra} 
                                onClick={() => toggleLayer('infra')} 
                                color="text-blue-400"
                             />
                             <LayerToggle 
                                label="Hotels & Hostels" 
                                icon={<Bed size={14}/>} 
                                active={activeLayers.hotels} 
                                onClick={() => toggleLayer('hotels')} 
                                color="text-purple-400"
                             />
                             <LayerToggle 
                                label="GDELT Global Risk" 
                                icon={<ShieldAlert size={14}/>} 
                                active={activeLayers.gdelt} 
                                onClick={() => toggleLayer('gdelt')} 
                                color="text-orange-400"
                             />
                             <LayerToggle 
                                label="NASA EONET Events" 
                                icon={<Eye size={14}/>} 
                                active={activeLayers.eonet} 
                                onClick={() => toggleLayer('eonet')} 
                                color="text-teal-400"
                             />
                         </div>
                     </div>

                     {/* Hotel Analytics Widget - Hidden on very small screens to save space if needed */}
                     <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-xl p-4 shadow-xl shrink-0 hidden md:block">
                        <h3 className="text-xs font-bold text-slate-300 uppercase mb-3 flex items-center gap-2">
                            <BarChart3 size={14}/> Tourism Pulse
                        </h3>
                        <div className="h-32 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={[
                                    {time: 'Mon', occ: 45, rate: 1200},
                                    {time: 'Tue', occ: 52, rate: 1150},
                                    {time: 'Wed', occ: 68, rate: 1400},
                                    {time: 'Thu', occ: 74, rate: 1600},
                                    {time: 'Fri', occ: 89, rate: 2100},
                                    {time: 'Sat', occ: 92, rate: 2400},
                                    {time: 'Sun', occ: 60, rate: 1800},
                                ]}>
                                    <defs>
                                        <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                                    <Area type="monotone" dataKey="occ" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorOcc)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between mt-2 text-xs">
                            <span className="text-slate-400">Avg Rate: <span className="text-white font-bold">฿1,850</span></span>
                            <span className="text-slate-400">Occupancy: <span className="text-purple-400 font-bold">82%</span></span>
                        </div>
                     </div>

                     {/* Currency Ticker */}
                     {rates && (
                         <div className="bg-slate-900/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-lg shadow-lg shrink-0">
                            <span className="block text-xs text-slate-500 uppercase mb-1 flex items-center gap-1"><DollarSign size={10}/> Forex (THB)</span>
                            <div className="text-xs font-mono grid grid-cols-2 gap-x-4">
                                <span className="text-slate-300">USD: <span className="text-green-400">{rates.usd.toFixed(2)}</span></span>
                                <span className="text-slate-300">EUR: <span className="text-green-400">{rates.eur.toFixed(2)}</span></span>
                            </div>
                         </div>
                     )}
                 </div>
             </div>
         </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full h-full relative">
        {activeTab === 'flights' ? (
           <div className="absolute inset-0 z-10 bg-slate-950 flex flex-col md:flex-row">
              <div className="h-1/2 md:h-full md:w-1/2 relative border-b md:border-b-0 md:border-r border-slate-800">
                 <AppMap activeLayers={{ flights: true, traffic: false, webcams: false }} webcams={[]} />
              </div>
              <div className="h-1/2 md:h-full md:w-1/2">
                 <FlightBoard />
              </div>
           </div>
        ) : (
           <AppMap 
                activeLayers={activeLayers} 
                webcams={webcams} 
                onMapStateChange={setMapState} 
                heatmapDate={heatmapDate}
           />
        )}
      </div>
    </div>
  );
};

const LayerToggle: React.FC<{label: string, icon: React.ReactNode, active: boolean, onClick: () => void, color: string}> = ({label, icon, active, onClick, color}) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all ${active ? `bg-slate-800 border-slate-600` : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-800'}`}
    >
        <div className="flex items-center gap-3">
            <div className={`${active ? color : 'text-slate-500'}`}>{icon}</div>
            <span className={`text-xs font-medium ${active ? 'text-white' : 'text-slate-500'}`}>{label}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-700'}`}></div>
    </button>
);

export default Dashboard;
