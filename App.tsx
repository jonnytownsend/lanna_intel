
import React, { useState, useEffect } from 'react';
import AppSidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GlobalPlayer from './components/GlobalPlayer';
import CustomerLocator from './components/CustomerLocator';
import HoneypotLanding from './components/HoneypotLanding';
import { PlayerProvider } from './services/playerContext';
import { ToastProvider, useToast } from './services/toastContext';
import { ShieldAlert, Loader } from 'lucide-react';
import { sendSystemEmail, checkForMapUpdates } from './services/api';
import { ADMIN_EMAIL } from './services/config';

// Wrapper component to use hooks inside App
const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTrap, setIsTrap] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [traceId, setTraceId] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [targetName, setTargetName] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get('target');
    const trace = params.get('trace');
    const name = params.get('name');
    const emergencyTrace = params.get('emergency_trace');

    // Case 1: Emergency Locate
    if (emergencyTrace) {
        setIsEmergency(true);
        setTraceId(emergencyTrace);
        if(name) setTargetName(name);
        return;
    }

    // Case 2: Honeypot Trap
    if (target && trace) {
        setIsTrap(true);
        setTargetUrl(target);
        setTraceId(trace);
        if(name) setTargetName(name);
        return;
    }

    // Handle Mobile Default
    if(window.innerWidth < 768) {
        setSidebarOpen(false);
    }

    // Initial Map Check (Simulated)
    checkForMapUpdates().then(status => {
        if(status.hasUpdate) {
            addToast('info', 'Map Update Available', `Delta update found (${status.size}). Go to Settings to sync.`);
        }
    });

  }, []);

  // Dedicated Landing Pages
  if (isEmergency) return <CustomerLocator traceId={traceId} userName={targetName} />;
  if (isTrap) return <HoneypotLanding redirectUrl={targetUrl} traceId={traceId} targetName={targetName} />;

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
      <AppSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <main className={`
        flex-1 h-full relative transition-all duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'md:ml-80' : 'md:ml-0'}
      `}>
        <Dashboard activeTab={activeTab} />
        <GlobalPlayer />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </ToastProvider>
  );
};

export default App;
