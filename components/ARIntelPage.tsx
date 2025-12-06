
import React, { useEffect, useRef, useState } from 'react';
import { Camera, Navigation, MapPin, AlertTriangle, VideoOff } from 'lucide-react';
import { fetchInfrastructure, fetchTrafficIncidents } from '../services/api';
import { REGION_CENTER } from '../services/config';
import { ARObject } from '../types';

const ARIntelPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [poiList, setPoiList] = useState<ARObject[]>([]);
  
  // Initialize Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasPermission(true);
      } catch (err) {
        console.error("Camera Error", err);
        setHasPermission(false);
      }
    };
    startCamera();

    // Cleanup
    return () => {
        if(videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    };
  }, []);

  // Location & Orientation
  useEffect(() => {
    // Geolocation
    navigator.geolocation.watchPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error(err),
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
    
    // Note: Request permission for iOS 13+ might be needed in a real click handler
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Load POIs based on location
  useEffect(() => {
    if (!userLoc) return;

    const loadPOIs = async () => {
        // Fetch surrounding data
        // For demo, we are fetching the same Lanna region data but in real app would be bbox around userLoc
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
                type: 'infra', // treating traffic as infra for simplicity
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
            const dist = getDistance(userLoc.lat, userLoc.lng, obj.lat, obj.lng);
            const bear = getBearing(userLoc.lat, userLoc.lng, obj.lat, obj.lng);
            return { ...obj, distance: dist, bearing: bear };
        }).filter(obj => obj.distance < 5000); // Only show within 5km

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
    return (brng * 180 / Math.PI + 360) % 360; // to degrees
  };

  return (
    <div className="h-full w-full bg-black relative overflow-hidden">
        {/* Camera Feed */}
        {hasPermission === false ? (
            <div className="absolute inset-0 flex items-center justify-center text-slate-500 flex-col gap-4">
                <VideoOff size={48}/>
                <p>Camera Access Denied or Unavailable.</p>
                <p className="text-xs">Ensure you are using HTTPS on a mobile device.</p>
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

        {/* HUD Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Header / Compass Strip */}
            <div className="bg-gradient-to-b from-black/80 to-transparent p-4 flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-black text-white flex items-center gap-2 drop-shadow-md">
                        <Camera className="text-green-500" size={24}/> AR <span className="text-green-500">RECON</span>
                    </h1>
                    <div className="text-xs text-green-400 font-mono mt-1 flex gap-4">
                        <span>HDG: {Math.round(heading)}°</span>
                        <span>LAT: {userLoc?.lat.toFixed(4) || '...'}</span>
                        <span>LNG: {userLoc?.lng.toFixed(4) || '...'}</span>
                    </div>
                </div>
            </div>

            {/* AR Points */}
            <div className="relative w-full h-full overflow-hidden">
                {poiList.map(poi => {
                    // Simple field of view calculation (approx 60 deg FOV)
                    let delta = poi.bearing - heading;
                    if (delta < -180) delta += 360;
                    if (delta > 180) delta -= 360;

                    // If within 30 degrees either side center
                    if (Math.abs(delta) < 30) {
                        const leftPos = 50 + (delta / 30) * 50; // percentage
                        return (
                            <div 
                                key={poi.id}
                                className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-300"
                                style={{ left: `${leftPos}%` }}
                            >
                                <div className="bg-slate-900/80 backdrop-blur border border-green-500/50 p-2 rounded text-center min-w-[120px]">
                                    <div className="text-green-400 mb-1"><MapPin size={16} className="mx-auto"/></div>
                                    <div className="text-xs font-bold text-white truncate max-w-[150px]">{poi.title}</div>
                                    <div className="text-[10px] text-green-300 font-mono">{(poi.distance / 1000).toFixed(1)} km</div>
                                </div>
                                <div className="h-10 w-0.5 bg-green-500/50"></div>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
            
            {/* Center Reticle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-12 h-12 border border-green-500/30 rounded-full flex items-center justify-center">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                </div>
                <div className="absolute top-1/2 w-full h-0.5 bg-green-500/20 -translate-y-1/2 -z-10 w-[200px] -left-[76px]"></div>
            </div>
        </div>
    </div>
  );
};

export default ARIntelPage;
