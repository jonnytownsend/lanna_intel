import React, { useEffect, useState } from 'react';
import { useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { fetchRealtimeFlights } from '../services/api';
import { FlightData } from '../types';
import { Plane, Navigation } from 'lucide-react';

const createPlaneIcon = (heading: number, airline: string, isPriority: boolean) => {
  const color = airline.includes('AirAsia') ? '#ef4444' : '#3b82f6'; 
  const strokeColor = isPriority ? '#06b6d4' : 'white'; // Cyan for priority
  const size = isPriority ? 42 : 24;
  const shadow = isPriority ? 'filter: drop-shadow(0 0 8px #06b6d4);' : '';

  return L.divIcon({
    className: 'custom-plane-icon',
    html: `<div style="transform: rotate(${heading}deg); width: ${size}px; height: ${size}px; ${shadow}">
             <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${strokeColor}" stroke-width="${isPriority ? 3 : 2}" stroke-linecap="round" stroke-linejoin="round">
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
            <Popup className="bg-slate-800 border-none">
              <div className="p-2 min-w-[200px]">
                <div className={`flex items-center justify-between mb-2 pb-2 border-b ${isPriority ? 'border-cyan-500' : 'border-slate-700'}`}>
                  <span className={`font-bold text-lg ${isPriority ? 'text-cyan-400' : 'text-blue-400'}`}>
                    {flight.flightCode}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${flight.status === 'en-route' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {flight.status.toUpperCase()}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <Plane size={14} />
                    <span>{flight.airline}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span className={flight.origin === 'CNX' ? 'text-cyan-400 font-bold' : ''}>{flight.origin}</span>
                    <Navigation size={12} />
                    <span className={flight.destination === 'CNX' ? 'text-cyan-400 font-bold' : ''}>{flight.destination}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700">
                    <div>
                      <span className="block text-xs text-slate-500">Altitude</span>
                      <span className="font-mono">{flight.altitude}ft</span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Speed</span>
                      <span className="font-mono">{flight.speed}kts</span>
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
