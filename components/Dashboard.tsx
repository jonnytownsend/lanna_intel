
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
import WeatherPanel from './WeatherPanel';
import CalendarPanel from './CalendarPanel';
import { WebcamData, WeatherData, CurrencyRates } from '../types';
import { fetchShodanWebcams, fetchWeather, fetchCurrencyRates } from '../services/api';
import { REGION_CENTER } from '../services/config';
import { DollarSign, Flame, Building2 } from 'lucide-react';

interface DashboardProps {
  activeTab: string;
}

const Dashboard: React.FC<DashboardProps> = ({ activeTab }) => {
  const [activeLayers, setActiveLayers] = useState({
    flights: true,
    traffic: true,
    webcams: true,
    fires: false,
    infra: false
  });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [webcams, setWebcams] = useState<WebcamData[]>([]);
  const [rates, setRates] = useState<CurrencyRates | null>(null);

  useEffect(() => {
    // Determine active layers based on tab
    const isOverview = activeTab === 'dashboard';
    setActiveLayers(prev => ({
      ...prev,
      flights: isOverview || activeTab === 'flights',
      traffic: isOverview || activeTab === 'traffic',
      webcams: isOverview || activeTab === 'webcams',
    }));
  }, [activeTab]);

  useEffect(() => {
    const initData = async () => {
      // In God View, we fetch basics. Detailed pages fetch their own data.
      const [wData, cData, rData] = await Promise.all([
        fetchWeather(REGION_CENTER.lat, REGION_CENTER.lng),
        fetchShodanWebcams(),
        fetchCurrencyRates()
      ]);
      setWeather(wData);
      setWebcams(cData);
      setRates(rData);
    };
    initData();
  }, []);

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

  return (
    <div className="flex-1 h-full relative flex flex-col">
      {/* Top Bar / Header Overlay */}
      <div className="absolute top-0 left-0 w-full z-[1000] pointer-events-none p-4 flex flex-col items-start gap-2">
        <WeatherPanel current={weather} />
        {activeTab === 'dashboard' && <CalendarPanel />}
      </div>

      {activeTab === 'dashboard' && (
         <div className="absolute top-4 right-4 z-[1000] pointer-events-none hidden md:flex flex-col gap-2 items-end">
             <div className="bg-slate-900/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-lg shadow-lg">
                <span className="block text-xs text-slate-500 uppercase">God View</span>
                <span className="text-lg font-mono font-bold text-orange-400 flex items-center gap-2">
                   ACTIVE <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"/>
                </span>
             </div>

             {/* Currency Ticker - Mini */}
             {rates && (
                 <div className="bg-slate-900/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-lg shadow-lg pointer-events-auto">
                    <span className="block text-xs text-slate-500 uppercase mb-1 flex items-center gap-1"><DollarSign size={10}/> Forex (THB)</span>
                    <div className="text-xs font-mono grid grid-cols-2 gap-x-4">
                        <span className="text-slate-300">USD: <span className="text-green-400">{rates.usd.toFixed(2)}</span></span>
                        <span className="text-slate-300">EUR: <span className="text-green-400">{rates.eur.toFixed(2)}</span></span>
                        <span className="text-slate-300">CNY: <span className="text-green-400">{rates.cny.toFixed(2)}</span></span>
                        <span className="text-slate-300">JPY: <span className="text-green-400">{rates.jpy.toFixed(2)}</span></span>
                    </div>
                 </div>
             )}
             
             {/* Map Controls */}
             <div className="pointer-events-auto flex flex-col gap-1 mt-2">
                 <button onClick={() => toggleLayer('fires')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${activeLayers.fires ? 'bg-red-900/80 border-red-500 text-white' : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'}`}>
                     <Flame size={12} className={activeLayers.fires ? 'text-red-400' : ''}/> NASA FIRMS
                 </button>
                 <button onClick={() => toggleLayer('infra')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${activeLayers.infra ? 'bg-blue-900/80 border-blue-500 text-white' : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'}`}>
                     <Building2 size={12} className={activeLayers.infra ? 'text-blue-400' : ''}/> INFRASTRUCTURE
                 </button>
             </div>
         </div>
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
           <AppMap activeLayers={activeLayers} webcams={webcams} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
