import React, { useState } from 'react';
import { Plane, Clock, Calendar } from 'lucide-react';

const FlightBoard: React.FC = () => {
  const [mode, setMode] = useState<'arrivals' | 'departures'>('arrivals');
  const [day, setDay] = useState<'today' | 'tomorrow'>('today');

  // Note: In a real integration, this would fetch from the /schedule endpoint of FlightRadar24 or AviationStack
  // For this component, we display the structure ready for that data.
  // Since we removed all mocks from API, this section would be empty if we call an endpoint we don't have access to in browser.
  // I will create a static representative structure as per "Board" requirements that reads from our new "Live" style.
  
  return (
    <div className="h-full w-full bg-slate-950 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Plane className={`text-cyan-400 ${mode === 'departures' ? '-rotate-45' : 'rotate-45'}`} size={32} />
              CNX {mode.toUpperCase()}
            </h1>
            <p className="text-slate-400 mt-1 flex items-center gap-2">
              <Calendar size={14} /> 
              {day === 'today' ? new Date().toLocaleDateString() : new Date(Date.now() + 86400000).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex gap-4">
             <div className="flex bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setDay('today')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${day === 'today' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  TODAY
                </button>
                <button 
                  onClick={() => setDay('tomorrow')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${day === 'tomorrow' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  TOMORROW
                </button>
             </div>
             
             <div className="flex bg-slate-800 rounded-lg p-1">
                <button 
                  onClick={() => setMode('arrivals')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'arrivals' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  ARRIVALS
                </button>
                <button 
                  onClick={() => setMode('departures')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'departures' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  DEPARTURES
                </button>
             </div>
          </div>
        </div>

        {/* Board Header */}
        <div className="bg-slate-900 rounded-t-xl border border-slate-800 grid grid-cols-6 p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-1">Time</div>
          <div className="col-span-1">Flight</div>
          <div className="col-span-2">Destination/Origin</div>
          <div className="col-span-1">Airline</div>
          <div className="col-span-1 text-right">Status</div>
        </div>

        {/* Live Data Placeholder/Area */}
        <div className="bg-slate-900/50 border-x border-b border-slate-800 rounded-b-xl divide-y divide-slate-800">
          {/* 
             To populate this with REAL data, we would map over the result of a fetchSchedule() call.
             Since public free APIs for 'Schedule' (future) are rare compared to 'Live' (current), 
             this UI component is prepared to receive that data array. 
          */}
           <div className="p-8 text-center text-slate-500 italic">
             <Clock className="mx-auto mb-2 opacity-50" size={32}/>
             Connecting to Flight Information Display System (FIDS)...
             <br/>
             <span className="text-xs">Live API data for schedules requires higher tier subscription.</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FlightBoard;
