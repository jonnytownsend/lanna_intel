
import React, { useState, useEffect } from 'react';
import AppSidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GlobalPlayer from './components/GlobalPlayer';
import CustomerLocator from './components/CustomerLocator';
import HoneypotLanding from './components/HoneypotLanding';
import { PlayerProvider } from './services/playerContext';
import { ToastProvider, useToast } from './services/toastContext';
import { Shield, Loader, Activity, Cpu } from 'lucide-react';
import { checkForMapUpdates } from './services/api';

// Wrapper component to use hooks inside App
const AppContent: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTrap, setIsTrap] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [traceId, setTraceId] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [targetName, setTargetName] = useState('');
  const [isAppLoading, setIsAppLoading] = useState(true); // App Loading State
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
        setIsAppLoading(false); // Immediate load for emergency
        return;
    }

    // Case 2: Honeypot Trap
    if (target && trace) {
        setIsTrap(true);
        setTargetUrl(target);
        setTraceId(trace);
        if(name) setTargetName(name);
        setIsAppLoading(false); // Immediate load for trap
        return;
    }

    // Handle Mobile Default
    if(window.innerWidth < 768) {
        setSidebarOpen(false);
    }

    // Initial Map Check (Simulated) & Boot Sequence
    const bootSequence = async () => {
        // Guaranteed minimum load time for visual effect (2s)
        const loadTimer = new Promise(resolve => setTimeout(resolve, 2000));
        
        // Perform checks in parallel, catch errors so they don't block boot
        const checksPromise = (async () => {
            try {
                const status = await checkForMapUpdates();
                return status;
            } catch (e) {
                console.warn("System checks failed", e);
                return null;
            }
        })();

        // Wait for timer
        await loadTimer;
        
        // Handle check results after loading screen clears
        checksPromise.then(status => {
            if(status && status.hasUpdate) {
                 addToast('info', 'Map Update Available', `Delta update found (${status.size}). Go to Settings to sync.`);
            }
        });

        // Always finish loading
        setIsAppLoading(false);
    };

    bootSequence();

  }, []);

  // Dedicated Landing Pages
  if (isEmergency) return <CustomerLocator traceId={traceId} userName={targetName} />;
  if (isTrap) return <HoneypotLanding redirectUrl={targetUrl} traceId={traceId} targetName={targetName} />;

  // System Loading Screen
  if (isAppLoading) {
      return (
          <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Background Grid */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                  <div className="relative mb-8">
                      <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
                      <Shield size={80} className="text-cyan-400 relative z-10 animate-bounce-slow" />
                      <Activity size={32} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow" />
                  </div>
                  
                  <h1 className="text-3xl font-black text-white tracking-[0.2em] mb-2">LANNA INTEL</h1>
                  
                  <div className="flex items-center gap-3 text-cyan-500 font-mono text-sm bg-slate-900/50 px-4 py-2 rounded border border-slate-800">
                      <Cpu size={16} className="animate-pulse" />
                      <span className="typewriter">INITIALIZING SYSTEMS...</span>
                  </div>

                  <div className="w-64 h-1 bg-slate-800 rounded-full mt-8 overflow-hidden">
                      <div className="h-full bg-cyan-500 w-full origin-left animate-[grow_2s_ease-in-out]"></div>
                  </div>
              </div>
              
              <div className="absolute bottom-8 text-[10px] text-slate-600 font-mono">
                  SECURE CONNECTION ESTABLISHED • v2.9.0
              </div>

              <style>{`
                  @keyframes grow {
                      0% { transform: scaleX(0); }
                      100% { transform: scaleX(1); }
                  }
                  .typewriter {
                      overflow: hidden;
                      white-space: nowrap;
                      animation: typing 2s steps(20, end);
                  }
                  @keyframes typing {
                      from { width: 0 }
                      to { width: 100% }
                  }
              `}</style>
          </div>
      );
  }

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
