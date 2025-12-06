
import React, { useState } from 'react';
import { Target, Link, Copy, AlertTriangle, MapPin, Smartphone, Globe, Activity } from 'lucide-react';
import { useToast } from '../services/toastContext';
import { TrackedClick } from '../types';

// Mock Data for "Captured" Clicks to visualize functionality
const MOCK_CLICKS: TrackedClick[] = [
    { id: 'clk_1', timestamp: new Date(Date.now() - 3600000).toISOString(), ip: '49.230.1.15', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)', lat: 18.7883, lng: 98.9853, platform: 'iOS' },
    { id: 'clk_2', timestamp: new Date(Date.now() - 7200000).toISOString(), ip: '124.122.50.9', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', lat: 13.7563, lng: 100.5018, platform: 'Windows' }
];

const TrackerPage: React.FC = () => {
  const [targetUrl, setTargetUrl] = useState('');
  const [shortLink, setShortLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [clicks, setClicks] = useState<TrackedClick[]>(MOCK_CLICKS);
  const { addToast } = useToast();

  const generateLink = async () => {
    if (!targetUrl) return;
    setLoading(true);

    // Concept: We create a link to *this* app's domain with a redirect param
    // In a real deployed scenario, this would be the public URL of the app
    const appBaseUrl = window.location.origin;
    const trackingId = Math.random().toString(36).substring(7);
    
    // The "Trap" URL - This app will intercept this on load
    const trapUrl = `${appBaseUrl}/?target=${encodeURIComponent(targetUrl)}&trace=${trackingId}`;
    
    try {
        // Use 1pt.co to mask the trap URL
        const response = await fetch(`https://api.1pt.co/addURL?long=${encodeURIComponent(trapUrl)}`);
        const data = await response.json();
        
        if (data.short) {
            setShortLink(`https://1pt.co/${data.short}`);
            addToast('success', 'Trap Generated', 'Short link created successfully.');
        } else {
            throw new Error("Shortening failed");
        }
    } catch (e) {
        addToast('error', 'Generation Error', 'Could not create short link.');
        console.error(e);
    }
    setLoading(false);
  };

  const copyLink = () => {
      navigator.clipboard.writeText(shortLink);
      addToast('info', 'Copied', 'Link copied to clipboard.');
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden">
       <div className="mb-6">
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
                <Target className="text-red-500" size={32}/> 
                TARGET <span className="text-slate-500">TRACKER</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Generate Geolocated Honeypot Links • Capture IP & Device Fingerprints</p>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
            {/* Generator Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
                <h3 className="text-sm font-bold text-slate-300 uppercase mb-4 flex items-center gap-2">
                    <Link size={16}/> Link Generator
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Destination URL</label>
                        <input 
                            value={targetUrl}
                            onChange={(e) => setTargetUrl(e.target.value)}
                            placeholder="https://google.com"
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-red-500 outline-none"
                        />
                        <p className="text-[10px] text-slate-600 mt-1">The actual website the target will see after profiling.</p>
                    </div>

                    <button 
                        onClick={generateLink}
                        disabled={loading || !targetUrl}
                        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? 'ENCRYPTING...' : 'GENERATE TRAP'}
                    </button>

                    {shortLink && (
                        <div className="bg-slate-950 p-3 rounded border border-red-900/50 mt-4">
                            <label className="text-[10px] text-red-400 uppercase font-bold mb-1 block">Deployable Link</label>
                            <div className="flex gap-2">
                                <code className="flex-1 text-red-100 text-sm truncate bg-transparent">{shortLink}</code>
                                <button onClick={copyLink} className="text-slate-400 hover:text-white"><Copy size={14}/></button>
                            </div>
                        </div>
                    )}
                    
                    <div className="bg-yellow-900/10 border border-yellow-900/30 p-3 rounded">
                        <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold mb-1">
                            <AlertTriangle size={12}/> Operational Warning
                        </div>
                        <p className="text-[10px] text-yellow-600/80">
                            This tool requests Geolocation permissions from the target. Effectiveness depends on user consent.
                        </p>
                    </div>
                </div>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                 <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                     <h3 className="text-sm font-bold text-slate-300 uppercase flex items-center gap-2">
                         <Activity size={16}/> Intercept Log
                     </h3>
                     <span className="text-xs text-slate-500">Database: MongoDB Atlas (Prod)</span>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {clicks.length === 0 ? (
                         <div className="text-center text-slate-500 py-10">No intercepts recorded yet.</div>
                     ) : (
                         clicks.map(click => (
                             <div key={click.id} className="bg-slate-800 rounded border border-slate-700 p-4 hover:border-red-500/50 transition-colors">
                                 <div className="flex justify-between items-start mb-2">
                                     <div className="flex items-center gap-2">
                                         <span className="bg-red-900/30 text-red-400 text-xs font-bold px-2 py-0.5 rounded border border-red-900/50">
                                            {click.ip}
                                         </span>
                                         <span className="text-xs text-slate-400">{new Date(click.timestamp).toLocaleString()}</span>
                                     </div>
                                     <div className="text-xs text-slate-300 font-mono">{click.platform}</div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-4 text-xs mt-3">
                                     <div className="flex items-start gap-2">
                                         <MapPin size={14} className="text-slate-500 mt-0.5"/>
                                         <div>
                                             <span className="block text-slate-400 text-[10px] uppercase">Geolocation</span>
                                             <span className="text-white font-mono">{click.lat?.toFixed(5)}, {click.lng?.toFixed(5)}</span>
                                             <a 
                                                 href={`https://www.google.com/maps?q=${click.lat},${click.lng}`} 
                                                 target="_blank" 
                                                 rel="noreferrer"
                                                 className="block text-cyan-500 hover:underline mt-1"
                                             >
                                                 View on Map
                                             </a>
                                         </div>
                                     </div>
                                     <div className="flex items-start gap-2">
                                         <Smartphone size={14} className="text-slate-500 mt-0.5"/>
                                         <div className="overflow-hidden">
                                             <span className="block text-slate-400 text-[10px] uppercase">Device Fingerprint</span>
                                             <span className="text-slate-300 truncate block" title={click.userAgent}>{click.userAgent}</span>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                         ))
                     )}
                 </div>
            </div>
       </div>
    </div>
  );
};

export default TrackerPage;
