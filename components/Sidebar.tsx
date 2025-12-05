import React from 'react';
import { LayoutDashboard, Plane, Map as MapIcon, Video, Sun, Menu, X, Globe, Shield, Mic2, Radio, Rocket, DollarSign } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'God View / Overview', icon: Globe },
    { id: 'finance', label: 'Finance / Econ', icon: DollarSign },
    { id: 'space', label: 'Outer Space / OSINT', icon: Rocket },
    { id: 'flights', label: 'Realtime Flights', icon: Plane },
    { id: 'traffic', label: 'Longdo Traffic', icon: MapIcon },
    { id: 'webcams', label: 'Shodan OSINT', icon: Video },
    { id: 'audio', label: 'Audio Intel (11Labs)', icon: Mic2 },
    { id: 'weather', label: 'Weather Intel', icon: Sun },
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
        
        {/* LOGO SECTION - 3D Grayscale with Lighting Effect */}
        <div className="h-24 flex items-center border-b border-slate-800 relative overflow-hidden shrink-0 bg-slate-950">
          <div className="w-full flex items-center px-4 relative z-10 group cursor-default">
            {/* Logo Icon */}
            <div className={`
              text-slate-200 transition-all duration-300 flex-shrink-0
              ${isOpen ? 'w-16 h-16 mr-3' : 'w-10 h-10 mx-auto'}
            `}>
              <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center border border-slate-600 shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
                 <Shield className={isOpen ? "w-8 h-8 text-slate-300" : "w-5 h-5 text-slate-300"} />
              </div>
            </div>
            
            {/* Logo Text with Fade-out & Lighting Effect */}
            <div className={`
              flex flex-col whitespace-nowrap transition-opacity duration-300 relative
              ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}
            `}>
              {/* Main Text with 3D shadow effect */}
              <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] flex items-center gap-2">
                LANNA INTEL
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-[0.2em] uppercase">
                Global Operations
              </span>
            </div>
          </div>

          {/* Slick Lighting Effect / Fade Out Mask */}
          {isOpen && (
            <div className="absolute inset-0 pointer-events-none" 
                 style={{
                   background: 'linear-gradient(90deg, transparent 60%, #0f172a 100%)'
                 }}
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 space-y-2 px-3">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center p-3 rounded-xl transition-all duration-200 group
                ${activeTab === item.id 
                  ? 'bg-slate-800 text-white border-l-4 border-slate-400 shadow-lg' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
              `}
            >
              <item.icon 
                size={24} 
                className={`
                  transition-colors
                  ${activeTab === item.id ? 'text-slate-100' : 'group-hover:text-white'}
                  ${!isOpen ? 'mx-auto' : 'mr-4'}
                `} 
              />
              <span className={`
                font-medium whitespace-nowrap transition-all duration-300
                ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 hidden'}
              `}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Footer / Status */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
           <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
              <div className={`flex flex-col ${!isOpen && 'hidden'}`}>
                <span className="text-xs text-slate-500 font-mono">SECURE CONNECTION</span>
                <span className="text-xs text-green-500 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> ENCRYPTED
                </span>
              </div>
              <Radio size={16} className="text-slate-600 animate-pulse"/>
           </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
