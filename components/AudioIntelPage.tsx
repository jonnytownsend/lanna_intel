import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Save, Activity, Settings, Volume2, Radio, Pause } from 'lucide-react';
import { elevenLabsTTS, fetchRadioStations } from '../services/api';
import { RadioStation } from '../types';

const AudioIntelPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [playingStation, setPlayingStation] = useState<RadioStation | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load Radio Stations
    fetchRadioStations().then(setStations);
    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const startMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      
      drawWaveform();
      setIsRecording(true); 
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopMonitoring = () => {
    setIsRecording(false);
    cancelAnimationFrame(animationFrameRef.current);
  };

  const playStation = (station: RadioStation) => {
    if (audioRef.current) {
        audioRef.current.pause();
    }
    const audio = new Audio(station.url);
    audio.play();
    audioRef.current = audio;
    setPlayingStation(station);

    // Optional: Connect to visualizer if CORS allows (often doesn't for streaming audio)
  };

  const stopStation = () => {
      if(audioRef.current) audioRef.current.pause();
      setPlayingStation(null);
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

    ctx.fillStyle = '#020617'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#22c55e'; 
    ctx.beginPath();

    const sliceWidth = canvas.width * 1.0 / dataArrayRef.current.length;
    let x = 0;

    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const v = dataArrayRef.current[i] / 128.0;
      const y = v * canvas.height / 2;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden">
      <div className="flex justify-between items-end mb-6">
         <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
               <Mic className="text-purple-500" size={32}/> 
               AUDIO <span className="text-slate-500">INTEL</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">11Labs Integration • Radio Intercepts • Live Spectrum</p>
         </div>
         <div className="flex gap-2">
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
               <Settings size={14}/> 11Labs Config
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
         {/* Visualizer & Controls */}
         <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 flex-1 relative min-h-[300px]">
               <canvas ref={canvasRef} width={800} height={400} className="w-full h-full rounded-xl bg-slate-950 block"/>
               {!isRecording && (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <button 
                      onClick={startMonitoring}
                      className="bg-red-600 hover:bg-red-700 text-white w-16 h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-transform hover:scale-105"
                    >
                      <Mic size={32}/>
                    </button>
                 </div>
               )}
               {isRecording && (
                 <div className="absolute bottom-4 right-4 flex gap-4">
                    <button onClick={stopMonitoring} className="bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-full border border-slate-600">
                       <Square size={24} fill="currentColor"/>
                    </button>
                 </div>
               )}
            </div>

            {/* EQ Controls */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
               <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                  <Activity size={14}/> Signal Enhancement
               </h3>
               <div className="flex gap-8 justify-center">
                  {['LOW', 'MID', 'HIGH'].map((band) => (
                    <div key={band} className="flex flex-col items-center gap-2 w-full max-w-[100px]">
                       <div className="text-xs font-mono text-slate-400">{band}</div>
                       <input 
                         type="range" min="0" max="100" 
                         className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                       />
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Sidebar Tools */}
         <div className="flex flex-col gap-4">
            {/* Radio Browser Integration */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-1/2">
               <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center justify-between">
                   <div className="flex items-center gap-2"><Radio size={14}/> Live Intercepts</div>
                   {playingStation && <div className="text-[10px] text-green-500 animate-pulse">STREAMING</div>}
               </h3>
               <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {stations.map(station => (
                      <div key={station.stationuuid} className="flex items-center justify-between bg-slate-800 p-2 rounded hover:bg-slate-700 transition-colors">
                          <div className="overflow-hidden">
                              <div className="text-xs font-bold text-slate-200 truncate">{station.name}</div>
                              <div className="text-[10px] text-slate-500 truncate">{station.tags}</div>
                          </div>
                          <button 
                            onClick={() => playingStation?.stationuuid === station.stationuuid ? stopStation() : playStation(station)}
                            className={`p-1.5 rounded-full ${playingStation?.stationuuid === station.stationuuid ? 'bg-red-500 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                          >
                             {playingStation?.stationuuid === station.stationuuid ? <Pause size={12}/> : <Play size={12}/>}
                          </button>
                      </div>
                  ))}
               </div>
            </div>

            {/* 11Labs Tools */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-1/2">
               <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Voice Isolation (11Labs)</h3>
               <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                     <p className="text-xs text-slate-500 mb-2">Upload Audio for processing</p>
                     <button className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded">
                        Select File
                     </button>
                  </div>
                  <div className="text-[10px] text-slate-600 text-center">
                     Powered by 11Labs Isolation API
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AudioIntelPage;
