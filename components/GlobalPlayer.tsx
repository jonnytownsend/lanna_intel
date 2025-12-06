
import React from 'react';
import { Play, Pause, Square, Volume2, Radio, Activity } from 'lucide-react';
import { usePlayer } from '../services/playerContext';

const GlobalPlayer: React.FC = () => {
  const { isPlaying, currentStation, stopStation, volume, setVolume, isLoading, playStation } = usePlayer();

  if (!currentStation) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-700 p-2 z-[9999] flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
       {/* Info */}
       <div className="flex items-center gap-3 pl-2 flex-1 min-w-0">
          <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center border border-slate-600 relative overflow-hidden">
             {isPlaying && !isLoading && (
                 <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                     {[1,2,3].map(i => <div key={i} className="w-1 bg-green-500 animate-[bounce_1s_infinite]" style={{animationDelay: `${i*0.1}s`}}></div>)}
                 </div>
             )}
             {isLoading && <div className="w-4 h-4 border-2 border-slate-600 border-t-cyan-500 rounded-full animate-spin"></div>}
             {!isPlaying && !isLoading && <Radio size={14} className="text-slate-500"/>}
          </div>
          <div className="overflow-hidden">
             <div className="text-xs font-bold text-white truncate">{currentStation.name}</div>
             <div className="text-[10px] text-slate-400 flex items-center gap-2">
                 {currentStation.freq && <span className="bg-orange-900/50 text-orange-400 px-1 rounded">{currentStation.freq}</span>}
                 <span className="truncate">{isLoading ? 'BUFFERING STREAM...' : 'LIVE AUDIO FEED'}</span>
             </div>
          </div>
       </div>

       {/* Controls */}
       <div className="flex items-center gap-4 px-4">
          <button 
            onClick={() => isPlaying ? stopStation() : playStation(currentStation)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
          >
             {isPlaying ? <Square size={14} fill="currentColor"/> : <Play size={16} fill="currentColor"/>}
          </button>
       </div>

       {/* Volume */}
       <div className="hidden md:flex items-center gap-2 pr-4 w-32">
           <Volume2 size={14} className="text-slate-500"/>
           <input 
             type="range" 
             min="0" 
             max="1" 
             step="0.05"
             value={volume}
             onChange={(e) => setVolume(parseFloat(e.target.value))}
             className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
           />
       </div>
    </div>
  );
};

export default GlobalPlayer;
