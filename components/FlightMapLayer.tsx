
import React, { useEffect, useState } from 'react';
import { useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { fetchRealtimeFlights } from '../services/api';
import { FlightData } from '../types';
import { Plane, Navigation } from 'lucide-react';

const createPlaneIcon = (heading: number, airline: string, isPriority: boolean) => {
  // Ultra Neon Cyan Scheme
  const color = '#00ffff'; 
  const strokeColor = '#ffffff'; 
  const size = 64; // Oversized 64px
  
  // Intense shadow
  const shadow = isPriority 
    ? 'filter: drop-shadow(0 0 20px #00ffff) drop-shadow(0 0 40px #06b6d4);' 
    : 'filter: drop-shadow(0 0 15px #06b6d4);';

  return L.divIcon({
    className: 'custom-plane-icon',
    html: `<div style="transform: rotate(${heading}deg); width: ${size}px; height: ${size}px; ${shadow} transition: all 0.5s ease;">
             <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${strokeColor}" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
               <path d="M2 12h20"/><path d="m13 2 9 10-9 10"/><path d="m2 12 5-5m-5 5 5 5"/>
             </svg>
           </div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
};

const FlightMapLayer: React.FC = () => {
  const map = useMap();
  const [flights, setFlights] = useState<FlightData[]>([]);

  const updateFlights = async () => {
    const bounds = map.getBounds();
    const flightData = await fetchRealtimeFlights({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    });
    setFlights(flightData);
  };

  useEffect(() => {
    updateFlights();
    const interval = setInterval(updateFlights, 10000); // 10s polling for live
    map.on('moveend', updateFlights);
    return () => {
      clearInterval(interval);
      map.off('moveend', updateFlights);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  return (
    <>
      {flights.map((flight) => {
        // Priority Logic: Flights to/from Chiang Mai (CNX / VTCC)
        const isPriority = ['CNX', 'VTCC'].includes(flight.origin) || ['CNX', 'VTCC'].includes(flight.destination);

        return (
          <Marker
            key={flight.id}
            position={[flight.lat, flight.lng]}
            icon={createPlaneIcon(flight.heading, flight.airline, isPriority)}
            zIndexOffset={isPriority ? 1000 : 0}
          >
            <Popup className="bg-slate-900 border-none">
              <div className="p-2 min-w-[200px]">
                <div className={`flex items-center justify-between mb-2 pb-2 border-b border-cyan-500/30`}>
                  <span className={`font-bold text-lg text-cyan-400 font-mono drop-shadow-[0_0_5px_#00ffff]`}>
                    {flight.flightCode}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${flight.status === 'en-route' ? 'bg-cyan-900/50 text-cyan-200' : 'bg-slate-800 text-slate-400'}`}>
                    {flight.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-300 font-mono">
                  <div className="flex items-center gap-2">
                    <Plane size={14} className="text-cyan-500" />
                    <span>{flight.airline}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span className={flight.origin === 'CNX' ? 'text-cyan-400 font-bold' : ''}>{flight.origin}</span>
                    <Navigation size={12} className="text-cyan-600"/>
                    <span className={flight.destination === 'CNX' ? 'text-cyan-400 font-bold' : ''}>{flight.destination}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-cyan-900/30">
                    <div>
                      <span className="block text-xs text-slate-500">Altitude</span>
                      <span className="font-mono text-cyan-200">{flight.altitude}ft</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Speed</span>
                      <span className="font-mono text-cyan-200">{flight.speed}kts</span>
                    </div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default FlightMapLayer;
