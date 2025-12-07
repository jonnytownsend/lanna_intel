
import React, { useState, useEffect } from 'react';
import { Menu, Icon, Sidebar as SemanticSidebar } from 'semantic-ui-react';
import { Shield } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AppSidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, activeTab, onTabChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleItemClick = (e: any, { name }: any) => {
      onTabChange(name);
      if(window.innerWidth < 768) onToggle();
  };

  return (
    <>
      {/* Animated Mobile Toggle Button */}
      <button 
        onClick={onToggle}
        className="fixed top-3 left-3 z-[9999] md:hidden p-3 bg-slate-900/90 backdrop-blur-md rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-slate-700 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50 transition-all duration-300 group active:scale-95"
        aria-label="Toggle Menu"
      >
        <div className="relative w-6 h-5">
            <span 
                className={`absolute left-0 w-full h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                    isOpen ? 'top-2.5 rotate-45' : 'top-0'
                }`} 
            />
            <span 
                className={`absolute left-0 top-2.5 w-full h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                    isOpen ? 'opacity-0 translate-x-4' : 'opacity-100'
                }`} 
            />
            <span 
                className={`absolute left-0 w-full h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out ${
                    isOpen ? 'top-2.5 -rotate-45' : 'top-5'
                }`} 
            />
        </div>
      </button>

      <SemanticSidebar
        as={Menu}
        animation='overlay'
        icon='labeled'
        inverted
        vertical
        visible={isOpen || window.innerWidth >= 768}
        width='thin'
        className="!bg-slate-900 !border-r !border-slate-800 z-[9000] !w-64 md:!w-thin shadow-[4px_0_24px_rgba(0,0,0,0.4)]"
        style={{ position: 'fixed', top: 0, bottom: 0, left: 0, height: '100%', overflowY: 'auto' }}
      >
        <div className="p-4 mb-2 border-b border-slate-800 flex flex-col items-center pt-20 md:pt-4">
            <Shield className="text-cyan-500 w-10 h-10 mb-2 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            <span className="text-white font-bold tracking-wider text-lg">LANNA INTEL</span>
            <span className="text-[10px] text-slate-500 font-mono">OPS: ACTIVE</span>
        </div>

        <Menu.Item as='a' name='dashboard' active={activeTab === 'dashboard'} onClick={handleItemClick}>
          <Icon name='globe' />
          GODMODE
        </Menu.Item>

        <Menu.Item as='a' name='alerts' active={activeTab === 'alerts'} onClick={handleItemClick}>
          <Icon name='bell' className="text-red-400" />
          ALERTS
        </Menu.Item>

        <Menu.Item>
          <Menu.Header>INTELLIGENCE</Menu.Header>
          <Menu.Menu>
            <Menu.Item as='a' name='osint' active={activeTab === 'osint'} onClick={handleItemClick}>
                <Icon name='user secret' /> OSINT Tools
            </Menu.Item>
            <Menu.Item as='a' name='webcams' active={activeTab === 'webcams'} onClick={handleItemClick}>
                <Icon name='video camera' /> Shodan
            </Menu.Item>
            <Menu.Item as='a' name='tracker' active={activeTab === 'tracker'} onClick={handleItemClick}>
                <Icon name='target' /> Target Tracker
            </Menu.Item>
            <Menu.Item as='a' name='predictive' active={activeTab === 'predictive'} onClick={handleItemClick}>
                <Icon name='chart area' /> Predictive AI
            </Menu.Item>
          </Menu.Menu>
        </Menu.Item>

        <Menu.Item>
          <Menu.Header>OPERATIONS</Menu.Header>
          <Menu.Menu>
            <Menu.Item as='a' name='flights' active={activeTab === 'flights'} onClick={handleItemClick}>
                <Icon name='plane' /> Flights
            </Menu.Item>
            <Menu.Item as='a' name='ar' active={activeTab === 'ar'} onClick={handleItemClick}>
                <Icon name='eye' /> AR Recon
            </Menu.Item>
            <Menu.Item as='a' name='audio' active={activeTab === 'audio'} onClick={handleItemClick}>
                <Icon name='microphone' /> Audio Intel
            </Menu.Item>
          </Menu.Menu>
        </Menu.Item>

        <Menu.Item>
          <Menu.Header>ENVIRONMENT</Menu.Header>
          <Menu.Menu>
            <Menu.Item as='a' name='weather' active={activeTab === 'weather'} onClick={handleItemClick}>
                <Icon name='cloud' /> Weather
            </Menu.Item>
            <Menu.Item as='a' name='space' active={activeTab === 'space'} onClick={handleItemClick}>
                <Icon name='rocket' /> Space Domain
            </Menu.Item>
            <Menu.Item as='a' name='finance' active={activeTab === 'finance'} onClick={handleItemClick}>
                <Icon name='money bill alternate' /> Economy
            </Menu.Item>
            <Menu.Item as='a' name='gov' active={activeTab === 'gov'} onClick={handleItemClick}>
                <Icon name='university' /> Gov Data
            </Menu.Item>
          </Menu.Menu>
        </Menu.Item>

        <Menu.Item as='a' name='settings' active={activeTab === 'settings'} onClick={handleItemClick}>
          <Icon name='settings' /> Configuration
        </Menu.Item>

        <div className="absolute bottom-4 left-0 w-full text-center text-xs text-slate-500 font-mono">
            {currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </SemanticSidebar>
      
      {/* Overlay backdrop for mobile */}
      {isOpen && window.innerWidth < 768 && (
          <div className="fixed inset-0 bg-black/50 z-[8999]" onClick={onToggle}></div>
      )}
    </>
  );
};

export default AppSidebar;
