
import React, { useEffect, useState } from 'react';
import { Settings, Save, Key, Bell, Shield, Server, Database, RefreshCw } from 'lucide-react';
import { dbService } from '../services/db';
import { AppSettings } from '../types';
import { API_KEYS } from '../services/config';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    geminiKey: API_KEYS.GEMINI,
    elevenLabsKey: API_KEYS.ELEVENLABS,
    shodanKey: API_KEYS.SHODAN,
    flightRadarKey: API_KEYS.FLIGHTRADAR24,
    nasaKey: API_KEYS.NASA,
    openWeatherKey: API_KEYS.OPENWEATHER,
    virusTotalKey: '',
    builtWithKey: '',
    hunterKey: '',
    hibpKey: '',
    theme: 'dark',
    notifications: true
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const stored = await dbService.getSetting('global_config');
      if (stored) {
        // Merge stored with defaults to ensure new keys exist
        setSettings(prev => ({...prev, ...stored}));
      }
    };
    loadSettings();
  }, []);

  const handleChange = (field: keyof AppSettings, value: any) => {
    setSettings(prev => ({...prev, [field]: value}));
    setSaved(false);
  };

  const saveSettings = async () => {
    await dbService.saveSetting('global_config', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden relative">
      <div className="mb-6 border-b border-slate-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Settings className="text-slate-400" size={32} />
            SYSTEM <span className="text-slate-600">CONFIGURATION</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Backend Config • API Credentials • System Preferences
          </p>
        </div>
        <button 
          onClick={saveSettings}
          className={`px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${saved ? 'bg-green-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
        >
           {saved ? 'CONFIGURATION SAVED' : <><Save size={18}/> SAVE CHANGES</>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
            
            {/* API Keys Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
               <h3 className="text-sm font-bold text-cyan-400 uppercase mb-6 flex items-center gap-2">
                  <Key size={16}/> API Credential Vault
               </h3>
               
               <div className="space-y-4">
                  <div className="group">
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1 group-focus-within:text-cyan-500">Google Gemini API (v3)</label>
                     <input 
                       type="password"
                       value={settings.geminiKey}
                       onChange={(e) => handleChange('geminiKey', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
                       placeholder="AI Analysis Key..."
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="group">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1 group-focus-within:text-purple-500">11Labs API Key</label>
                        <input 
                          type="password"
                          value={settings.elevenLabsKey}
                          onChange={(e) => handleChange('elevenLabsKey', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div className="group">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1 group-focus-within:text-red-500">Shodan API Key</label>
                        <input 
                          type="password"
                          value={settings.shodanKey}
                          onChange={(e) => handleChange('shodanKey', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none transition-colors"
                        />
                      </div>
                  </div>

                  <div className="group">
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1 group-focus-within:text-blue-500">VirusTotal API Key</label>
                     <input 
                       type="password"
                       value={settings.virusTotalKey}
                       onChange={(e) => handleChange('virusTotalKey', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-colors"
                       placeholder="For Threat Intelligence..."
                     />
                  </div>

                  <h4 className="text-xs font-bold text-slate-400 mt-4 border-b border-slate-800 pb-2">Extended OSINT Keys (Optional)</h4>

                  <div className="group">
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">BuiltWith API Key</label>
                     <input 
                       type="password"
                       value={settings.builtWithKey}
                       onChange={(e) => handleChange('builtWithKey', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none transition-colors"
                       placeholder="Tech Stack Recon..."
                     />
                  </div>

                  <div className="group">
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Hunter.io API Key</label>
                     <input 
                       type="password"
                       value={settings.hunterKey}
                       onChange={(e) => handleChange('hunterKey', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none transition-colors"
                       placeholder="Email Discovery..."
                     />
                  </div>
                  
                  <div className="group">
                     <label className="text-xs font-bold text-slate-500 uppercase block mb-1">HIBP API Key</label>
                     <input 
                       type="password"
                       value={settings.hibpKey}
                       onChange={(e) => handleChange('hibpKey', e.target.value)}
                       className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-pink-500 focus:outline-none transition-colors"
                       placeholder="Have I Been Pwned..."
                     />
                  </div>
               </div>
            </div>

            {/* System Preferences */}
            <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h3 className="text-sm font-bold text-slate-400 uppercase mb-6 flex items-center gap-2">
                      <Server size={16}/> System Preferences
                   </h3>
                   
                   <div className="flex items-center justify-between py-3 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                         <Bell size={18} className="text-slate-500"/>
                         <div>
                            <div className="text-sm font-bold text-slate-200">System Notifications</div>
                            <div className="text-xs text-slate-500">Alerts for critical intel events</div>
                         </div>
                      </div>
                      <button 
                        onClick={() => handleChange('notifications', !settings.notifications)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${settings.notifications ? 'bg-green-600' : 'bg-slate-700'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.notifications ? 'left-7' : 'left-1'}`}></div>
                      </button>
                   </div>

                   <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                         <Shield size={18} className="text-slate-500"/>
                         <div>
                            <div className="text-sm font-bold text-slate-200">Secure Mode</div>
                            <div className="text-xs text-slate-500">Force HTTPS and Proxy rotation</div>
                         </div>
                      </div>
                      <div className="text-xs font-bold text-green-500 flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> ACTIVE
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h3 className="text-sm font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
                      <Database size={16}/> Local Storage
                   </h3>
                   <div className="text-xs text-slate-500 mb-4">
                      Clear cached map tiles, search history, and recorded audio clips.
                   </div>
                   <button className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-4 py-2 rounded text-xs font-bold flex items-center gap-2 w-full justify-center transition-colors">
                      <RefreshCw size={14}/> PURGE CACHE DB
                   </button>
                </div>
            </div>

         </div>
      </div>
      
      <div className="mt-6 text-center text-[10px] text-slate-600 font-mono">
         Lanna Intel Platform • Version 2.6.0-BETA • Gemini v3 Integrated
      </div>
    </div>
  );
};

export default SettingsPage;
