
import React, { useEffect, useRef, useState } from 'react';
import { Camera, Navigation, MapPin, AlertTriangle, VideoOff, RefreshCw, Layers, EyeOff, Globe, Repeat } from 'lucide-react';
import { fetchInfrastructure, fetchTrafficIncidents } from '../services/api';
import { REGION_CENTER } from '../services/config';
import { ARObject } from '../types';

const ARIntelPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'error'>('prompt');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [simulationMode, setSimulationMode] = useState(false);
  
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [poiList, setPoiList] = useState<ARObject[]>([]);
  
  // Calibration State
  const [showCalibration, setShowCalibration] = useState(false);
  
  const startCamera = async () => {
    setPermissionState('prompt');
    setErrorMsg('');
    
    // Check for Secure Context (HTTPS) - Required for getUserMedia
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        setPermissionState('error');
        setErrorMsg('Browser blocks Camera on insecure (HTTP) connections. Use HTTPS.');
        return;
    }

    try {
      // 1. Try Environment Camera (Rear)
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
              video: { facingMode: 'environment' } 
          });
          if (videoRef.current) videoRef.current.srcObject = stream;
          setPermissionState('granted');
      } catch (envErr) {
          // 2. Fallback to any camera (Desktop/Laptop)
          console.warn("Environment camera failed, trying default user camera...", envErr);
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) videoRef.current.srcObject = stream;
          setPermissionState('granted');
      }
    } catch (err: any) {
      console.error("Camera Error", err);
      setPermissionState('denied');
      
      if (err.name === 'NotAllowedError') {
          setErrorMsg('Permission denied by user.');
      } else if (err.name === 'NotFoundError') {
          setErrorMsg('No camera device found.');
      } else {
          setErrorMsg(err.message || 'Unknown camera error.');
      }
    }
  };

  // Initialize Camera on Mount
  useEffect(() => {
    if (!simulationMode) {
        startCamera();
    }
    
    return () => {
        if(videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    };
  }, [simulationMode]);

  // Location & Orientation
  useEffect(() => {
    if (!navigator.geolocation) return;

    // Geolocation
    const geoWatch = navigator.geolocation.watchPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("Geo Error", err),
        { enableHighAccuracy: true }
    );

    // Device Orientation (Compass)
    const handleOrientation = (event: DeviceOrientationEvent) => {
        const ev = event as any;
        if(ev.webkitCompassHeading) {
            // iOS
            setHeading(ev.webkitCompassHeading);
        } else if (event.alpha) {
            // Android (absolute)
            setHeading(360 - event.alpha);
        }
    };
    
    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
        navigator.geolocation.clearWatch(geoWatch);
        window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Calibration Check Effect
  useEffect(() => {
      // Show calibration if we have a real location (not sim), and haven't calibrated yet
      if (userLoc && !simulationMode) {
          const hasCalibrated = localStorage.getItem('compass_calibrated');
          if (!hasCalibrated) {
              setShowCalibration(true);
          }
      }
  }, [userLoc, simulationMode]);

  const completeCalibration = () => {
      localStorage.setItem('compass_calibrated', 'true');
      setShowCalibration(false);
  };

  // Load POIs based on location
  useEffect(() => {
    // If no user loc, default to Region Center for demo purposes
    const center = userLoc || REGION_CENTER;

    const loadPOIs = async () => {
        const [traffic, infra] = await Promise.all([
            fetchTrafficIncidents(),
            fetchInfrastructure()
        ]);

        const arObjects: ARObject[] = [];

        traffic.forEach(t => {
            arObjects.push({
                id: `traffic-${t.id}`,
                lat: t.lat,
                lng: t.lng,
                title: t.title,
                type: 'infra', 
                distance: 0,
                bearing: 0
            });
        });

        infra.forEach(i => {
            arObjects.push({
                id: `infra-${i.id}`,
                lat: i.lat,
                lng: i.lng,
                title: i.name,
                type: 'place',
                distance: 0,
                bearing: 0
            });
        });

        // Calculate relative bearing and distance
        const updated = arObjects.map(obj => {
            const dist = getDistance(center.lat, center.lng, obj.lat, obj.lng);
            const bear = getBearing(center.lat, center.lng, obj.lat, obj.lng);
            return { ...obj, distance: dist, bearing: bear };
        }).filter(obj => obj.distance < 10000); // Increased range to 10km for demo

        setPoiList(updated);
    };

    loadPOIs();
  }, [userLoc]);

  // Haversine Distance (meters)
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Bearing (degrees)
  const getBearing = (startLat: number, startLng: number, destLat: number, destLng: number) => {
    const y = Math.sin(destLng - startLng) * Math.cos(destLat);
    const x = Math.cos(startLat) * Math.sin(destLat) - Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    const brng = Math.atan2(y, x);
    return (brng * 180 / Math.PI + 360) % 360; 
  };

  return (
    <div className="h-full w-full bg-black relative overflow-hidden flex flex-col items-center justify-center">
        
        {/* Background Layer */}
        {simulationMode ? (
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px] z-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80"></div>
            </div>
        ) : (
             <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="absolute inset-0 w-full h-full object-cover z-0"
            />
        )}

        {/* CALIBRATION OVERLAY */}
        {showCalibration && (
           <div className="absolute inset-0 z-[2000] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="bg-slate-900 border border-cyan-500/50 p-8 rounded-2xl max-w-sm text-center shadow-[0_0_30px_rgba(6,182,212,0.3)] relative overflow-hidden">
                   {/* Decorative background pulse */}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
                   
                   <div className="mx-auto bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mb-6 relative z-10">
                       <div className="absolute inset-0 border-4 border-cyan-500/30 rounded-full"></div>
                       <div className="absolute inset-0 border-t-4 border-cyan-400 rounded-full animate-spin"></div>
                       <Repeat size={48} className="text-white relative z-10 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                   </div>
                   
                   <h3 className="text-xl font-bold text-white mb-2 relative z-10">Compass Calibration</h3>
                   <p className="text-slate-400 text-sm mb-8 leading-relaxed relative z-10">
                       GPS signal acquired. To align AR sensors accurately, please wave your device in a 
                       <span className="text-cyan-400 font-bold"> figure-8 motion </span> 
                       for a few seconds.
                   </p>
                   
                   <button 
                       onClick={completeCalibration}
                       className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all active:scale-95 shadow-lg shadow-cyan-900/50 relative z-10"
                   >
                       SENSORS ALIGNED
                   </button>
               </div>
           </div>
        )}

        {/* Error / Permission State Overlay */}
        {!simulationMode && (permissionState === 'denied' || permissionState === 'error') && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
                <div className="bg-red-500/10 p-4 rounded-full mb-4 border border-red-500/50">
                    <VideoOff size={48} className="text-red-500"/>
                </div>
                <h2 className="text-2xl font-black text-white mb-2">OPTICAL SENSORS OFFLINE</h2>
                <p className="text-slate-400 mb-6 max-w-sm">
                    {errorMsg || "Camera access is unavailable. Check browser permissions or device capabilities."}
                </p>
                
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <button 
                        onClick={() => startCamera()}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg border border-slate-600 flex items-center justify-center gap-2 transition-colors"
                    >
                        <RefreshCw size={16}/> RETRY UPLINK
                    </button>
                    <button 
                        onClick={() => setSimulationMode(true)}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(22,163,74,0.3)]"
                    >
                        <Globe size={16}/> ENABLE SIMULATION MODE
                    </button>
                </div>
                <div className="mt-8 text-[10px] text-slate-600 font-mono">
                    ERROR_CODE: VIDEO_INPUT_FAILURE
                </div>
            </div>
        )}

        {/* HUD Overlay (Only visible if granted or simulation) */}
        {(permissionState === 'granted' || simulationMode) && (
            <div className="absolute inset-0 z-10 pointer-events-none">
                {/* Header / Compass Strip */}
                <div className="bg-gradient-to-b from-black/80 to-transparent p-4 flex justify-between items-start pointer-events-auto">
                    <div>
                        <h1 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-md">
                            <Camera className={simulationMode ? "text-slate-400" : "text-green-500"} size={24}/> 
                            AR <span className={simulationMode ? "text-slate-400" : "text-green-500"}>{simulationMode ? 'SIMULATION' : 'RECON'}</span>
                        </h1>
                        <div className="text-xs text-green-400 font-mono mt-1 flex gap-4 bg-black/50 px-2 py-1 rounded w-fit backdrop-blur-sm">
                            <span>HDG: {Math.round(heading)}°</span>
                            <span className="hidden md:inline">LAT: {userLoc?.lat.toFixed(4) || '...'}</span>
                            <span className="hidden md:inline">LNG: {userLoc?.lng.toFixed(4) || '...'}</span>
                        </div>
                    </div>
                    {simulationMode && (
                        <button 
                            onClick={() => setSimulationMode(false)} 
                            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded border border-slate-600 flex items-center gap-2"
                        >
                            <RefreshCw size={12}/> RETRY CAMERA
                        </button>
                    )}
                </div>

                {/* AR Points */}
                <div className="relative w-full h-full overflow-hidden">
                    {poiList.length === 0 && (
                         <div className="absolute top-1/4 w-full text-center text-xs text-green-500/50 font-mono animate-pulse">
                            SCANNING HORIZON...
                         </div>
                    )}
                    
                    {poiList.map(poi => {
                        // Field of view calculation (approx 60 deg FOV)
                        let delta = poi.bearing - heading;
                        if (delta < -180) delta += 360;
                        if (delta > 180) delta -= 360;

                        // If within 40 degrees either side center
                        if (Math.abs(delta) < 40) {
                            const leftPos = 50 + (delta / 40) * 50; // percentage
                            // Scale size based on distance (closer = bigger)
                            // Max scale 1.2, min 0.6
                            const scale = Math.max(0.6, Math.min(1.2, 1 - (poi.distance / 10000)));
                            const opacity = Math.max(0.4, 1 - (poi.distance / 8000));

                            return (
                                <div 
                                    key={poi.id}
                                    className="absolute top-1/2 flex flex-col items-center transition-all duration-300 pointer-events-auto cursor-pointer group"
                                    style={{ 
                                        left: `${leftPos}%`, 
                                        transform: `translate(-50%, -50%) scale(${scale})`,
                                        opacity: opacity,
                                        zIndex: Math.round(100 - (poi.distance/100))
                                    }}
                                >
                                    <div className="bg-slate-900/80 backdrop-blur border border-green-500/50 p-2 rounded text-center min-w-[120px] shadow-[0_0_15px_rgba(34,197,94,0.2)] group-hover:border-green-400 group-hover:bg-slate-800">
                                        <div className="text-green-400 mb-1 group-hover:text-green-300">
                                            {poi.type === 'infra' ? <AlertTriangle size={16} className="mx-auto"/> : <MapPin size={16} className="mx-auto"/>}
                                        </div>
                                        <div className="text-xs font-bold text-white truncate max-w-[150px]">{poi.title}</div>
                                        <div className="text-[10px] text-green-300 font-mono">{(poi.distance / 1000).toFixed(1)} km</div>
                                    </div>
                                    <div className="h-16 w-px bg-gradient-to-b from-green-500/50 to-transparent"></div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
                
                {/* Center Reticle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-16 h-16 border border-green-500/30 rounded-full flex items-center justify-center relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-green-500"></div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-green-500"></div>
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-green-500"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-green-500"></div>
                        <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
                
                {/* Compass Strip Bottom */}
                <div className="absolute bottom-10 left-0 w-full overflow-hidden h-12 bg-gradient-to-t from-black to-transparent pointer-events-none">
                    <div className="relative w-full h-full flex items-end justify-center">
                        <div className="w-[1px] h-4 bg-red-500 absolute bottom-0 z-20"></div>
                        {/* Simple CSS compass marks based on heading */}
                        <div className="flex gap-8 transition-transform duration-100" style={{ transform: `translateX(${-heading * 4}px)` }}>
                           {Array.from({length: 72}).map((_, i) => (
                               <div key={i} className="flex flex-col items-center w-12 shrink-0">
                                   <div className={`w-0.5 ${i % 9 === 0 ? 'h-3 bg-white' : 'h-1 bg-slate-500'}`}></div>
                                   {i % 9 === 0 && <span className="text-[10px] text-slate-300 mt-1 font-mono">{(i * 5)}</span>}
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ARIntelPage;
