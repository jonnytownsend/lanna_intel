
import React, { useState } from 'react';
import { Plane, Map as MapIcon, Video, Sun, Menu, X, Globe, Shield, Mic2, Radio, Rocket, DollarSign, Building, MapPin, Camera, Settings, Fingerprint, ChevronDown, ChevronRight, BarChart3, Target } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, activeTab, onTabChange }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'Intel': true,
    'Ops': true,
    'Env': false,
    'Sys': false
  });

  const toggleGroup = (group: string) => {
    setExpanded(prev => ({...prev, [group]: !prev[group]}));
  };

  const menuGroups = [
    {
      id: 'Intel',
      label: 'INTELLIGENCE',
      items: [
        { id: 'dashboard', label: 'God View', icon: Globe },
        { id: 'osint', label: 'OSINT Toolbox', icon: Fingerprint },
        { id: 'webcams', label: 'Shodan Scanner', icon: Video },
        { id: 'tracker', label: 'Target Tracker', icon: Target }, // New
        { id: 'predictive', label: 'Predictive AI', icon: BarChart3 }, // New
      ]
    },
    {
      id: 'Ops',
      label: 'OPERATIONS',
      items: [
        { id: 'flights', label: 'Realtime Flights', icon: Plane },
        { id: 'traffic', label: 'Ground Traffic', icon: MapIcon },
        { id: 'ar', label: 'AR Recon', icon: Camera },
        { id: 'audio', label: 'Audio Intercept', icon: Mic2 },
      ]
    },
    {
      id: 'Env',
      label: 'ENVIRONMENT',
      items: [
        { id: 'weather', label: 'Weather Data', icon: Sun },
        { id: 'address', label: 'Geo Analysis', icon: MapPin },
        { id: 'space', label: 'Space Domain', icon: Rocket },
        { id: 'finance', label: 'Econ Metrics', icon: DollarSign },
        { id: 'gov', label: 'Gov Data', icon: Building },
      ]
    },
    {
      id: 'Sys',
      label: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Configuration', icon: Settings },
      ]
    }
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={onToggle}
        className="fixed top-4 left-4 z-[9999] p-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 md:hidden text-white hover:bg-slate-700 transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-800 z-[9000]
        transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'w-80 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'}
      `}>
        
        {/* LOGO SECTION */}
        <div className="h-24 flex items-center border-b border-slate-800 relative overflow-hidden shrink-0 bg-slate-950">
          <div className="w-full flex items-center px-4 relative z-10 group cursor-default">
            <div className={`text-slate-200 transition-all duration-300 flex-shrink-0 ${isOpen ? 'w-16 h-16 mr-3' : 'w-10 h-10 mx-auto'}`}>
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center border border-slate-600 shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
                 <Shield className={isOpen ? "w-8 h-8 text-slate-300" : "w-5 h-5 text-slate-300"} />
              </div>
            </div>
            
            <div className={`flex flex-col whitespace-nowrap transition-opacity duration-300 relative ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
              <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] flex items-center gap-2">
                LANNA INTEL
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase">
                Global Operations
              </span>
            </div>
          </div>
          {isOpen && <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent 60%, #0f172a 100%)' }}/>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-2 px-3 custom-scrollbar">
          {menuGroups.map((group) => (
             <div key={group.id} className="mb-2">
                 {/* Group Header */}
                 {isOpen && (
                     <button 
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-2 hover:text-cyan-400 transition-colors"
                     >
                        {group.label}
                        {expanded[group.id] ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                     </button>
                 )}
                 {!isOpen && <div className="h-px bg-slate-800 mx-3 my-2"></div>}

                 {/* Group Items */}
                 <div className={`space-y-1 transition-all duration-300 ${!isOpen || expanded[group.id] ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                    {group.items.map(item => (
                        <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`
                            w-full flex items-center p-2 rounded-lg transition-all duration-200 group relative
                            ${activeTab === item.id 
                            ? 'bg-cyan-900/20 text-cyan-400 border border-cyan-500/30' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                        `}
                        >
                        <item.icon 
                            size={20} 
                            className={`
                            transition-colors shrink-0
                            ${activeTab === item.id ? 'text-cyan-400' : 'group-hover:text-white'}
                            ${!isOpen ? 'mx-auto' : 'mr-3'}
                            `} 
                        />
                        <span className={`
                            text-sm font-medium whitespace-nowrap transition-all duration-300
                            ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 hidden'}
                        `}>
                            {item.label}
                        </span>
                        
                        {/* Tooltip for collapsed mode */}
                        {!isOpen && (
                            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                                {item.label}
                            </div>
                        )}
                        </button>
                    ))}
                 </div>
             </div>
          ))}
        </nav>

        {/* Footer / Status */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
              <div className={`flex flex-col ${!isOpen && 'hidden'}`}>
                <span className="text-xs text-slate-500 font-mono">DB: MONGO_ATLAS</span>
                <span className="text-[10px] text-green-500 font-mono mt-1 flex items-center gap-1"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> CONNECTED</span>
              </div>
              <Radio size={16} className="text-slate-600"/>
           </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
