
import React, { useState, useEffect } from 'react';
import { Plane, Clock, Calendar, RefreshCw, ExternalLink, Users, Briefcase } from 'lucide-react';
import { fetchFlightSchedule } from '../services/api';
import { FlightSchedule } from '../types';

const FlightBoard: React.FC = () => {
  const [mode, setMode] = useState<'arrivals' | 'departures'>('arrivals');
  const [day, setDay] = useState<'today' | 'tomorrow'>('today');
  const [filterType, setFilterType] = useState<'all' | 'domestic' | 'international'>('all');
  const [flights, setFlights] = useState<FlightSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFlights = async () => {
    setLoading(true);
    const data = await fetchFlightSchedule('VTCC', mode);
    setFlights(data);
    setLoading(false);
  };

  useEffect(() => {
    loadFlights();
    const interval = setInterval(loadFlights, 60000); // Poll every min
    return () => clearInterval(interval);
  }, [mode]);

  // Determine if Domestic or International
  // VTCC is Chiang Mai. 
  // If Mode is Arrival: Check Origin Code. If starts with VT, it's Domestic.
  // If Mode is Departure: Check Dest Code. If starts with VT, it's Domestic.
  const isDomestic = (f: FlightSchedule) => {
      const targetCode = mode === 'arrivals' ? f.originCode : f.destCode;
      return targetCode && targetCode.startsWith('VT');
  };

  const filteredFlights = flights.filter(f => {
      if (filterType === 'all') return true;
      if (filterType === 'domestic') return isDomestic(f);
      if (filterType === 'international') return !isDomestic(f);
      return true;
  });

  // Intel Simulation Generators
  const getCapacity = (flightCode: string) => {
      // Deterministic pseudo-random based on string char codes
      const seed = flightCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const types = [180, 220, 300, 150];
      return types[seed % types.length];
  };

  const getPax = (flightCode: string, capacity: number) => {
      const seed = flightCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const loadFactor = 0.7 + ((seed % 25) / 100); // 0.70 - 0.95
      return Math.floor(capacity * loadFactor);
  };

  return (
    <div className="h-full w-full bg-slate-950 p-4 md:p-6 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        {/* Header Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 shrink-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <Plane className={`text-cyan-400 ${mode === 'departures' ? '-rotate-45' : 'rotate-45'}`} size={32} />
              CNX {mode.toUpperCase()}
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2 text-sm">
              <Calendar size={14} /> 
              {day === 'today' ? new Date().toLocaleDateString() : new Date(Date.now() + 86400000).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
             <button onClick={loadFlights} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''}/>
             </button>

             {/* Day Toggles */}
             <div className="flex bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setDay('today')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${day === 'today' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  TODAY
                </button>
                <button 
                  onClick={() => setDay('tomorrow')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${day === 'tomorrow' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  TMRW
                </button>
             </div>
             
             {/* Region Filter */}
             <div className="flex bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${filterType === 'all' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  ALL
                </button>
                <button 
                  onClick={() => setFilterType('domestic')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${filterType === 'domestic' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  DOM
                </button>
                <button 
                  onClick={() => setFilterType('international')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${filterType === 'international' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  INTL
                </button>
             </div>

             {/* Mode Toggle */}
             <div className="flex bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setMode('arrivals')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${mode === 'arrivals' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  ARR
                </button>
                <button 
                  onClick={() => setMode('departures')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${mode === 'departures' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  DEP
                </button>
             </div>
          </div>
        </div>

        {/* Board Container - Responsive Table */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-900 border border-slate-800 rounded-xl shadow-2xl">
            {/* Header */}
            <div className="grid grid-cols-6 md:grid-cols-9 bg-slate-950 p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 shrink-0 gap-2">
                <div className="col-span-1">Time</div>
                <div className="col-span-2 md:col-span-1">Flight</div>
                <div className="col-span-2">{mode === 'arrivals' ? 'Origin' : 'Dest'}</div>
                <div className="col-span-2 hidden md:block">Airline</div>
                <div className="col-span-1 hidden md:block text-right">Cap</div>
                <div className="col-span-1 hidden md:block text-right">Est Pax</div>
                <div className="col-span-1 text-right">Status</div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-800/50 custom-scrollbar">
                {loading && filteredFlights.length === 0 && (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
                        <RefreshCw className="animate-spin" size={24}/>
                        Connecting to FIDS...
                    </div>
                )}
                {!loading && filteredFlights.length === 0 && (
                    <div className="p-8 text-center text-slate-500">No flight data available matching filters.</div>
                )}
                {filteredFlights.map((flight, idx) => {
                    const capacity = getCapacity(flight.flight);
                    const pax = getPax(flight.flight, capacity);
                    
                    return (
                        <div key={idx} className="grid grid-cols-6 md:grid-cols-9 p-4 text-sm items-center hover:bg-slate-800/50 transition-colors gap-2 group">
                            
                            {/* Time */}
                            <div className="col-span-1 font-mono text-cyan-400 font-bold text-xs md:text-sm">{flight.time}</div>
                            
                            {/* Flight Number (Link) */}
                            <div className="col-span-2 md:col-span-1">
                                <a 
                                    href={`https://www.flightradar24.com/data/flights/${flight.flight.replace(/\s/g, '')}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 font-bold text-white hover:text-cyan-400 transition-colors bg-slate-800/50 px-2 py-1 rounded border border-transparent hover:border-slate-600"
                                >
                                    {flight.flight} <ExternalLink size={10} className="opacity-50"/>
                                </a>
                            </div>

                            {/* Airport */}
                            <div className="col-span-2 flex flex-col justify-center">
                                <span className="text-slate-300 font-medium truncate">{flight.airport}</span>
                                <span className="text-[10px] text-slate-500 font-mono hidden md:block">
                                    Code: {mode === 'arrivals' ? flight.originCode : flight.destCode}
                                </span>
                            </div>

                            {/* Airline (Desktop) */}
                            <div className="col-span-2 hidden md:block text-slate-400 truncate">{flight.airline}</div>
                            
                            {/* Intel Stats (Desktop) */}
                            <div className="col-span-1 hidden md:block text-right font-mono text-slate-500">{capacity}</div>
                            <div className="col-span-1 hidden md:block text-right font-mono text-slate-300">{pax}</div>

                            {/* Status */}
                            <div className="col-span-1 text-right">
                                <span className={`px-2 py-1 rounded text-[10px] md:text-xs font-bold whitespace-nowrap ${flight.status.toLowerCase().includes('landed') ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                    {flight.status}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Intel Summary Footer */}
            <div className="bg-slate-950 p-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 shrink-0">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><Users size={12}/> Est. Pax Flow: {filteredFlights.reduce((acc, f) => acc + getPax(f.flight, getCapacity(f.flight)), 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Briefcase size={12}/> Ops Load: {filteredFlights.length} Flights</span>
                </div>
                <div>Lanna Intel v2.5</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FlightBoard;
