
import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Play, Save, Activity, Settings, Volume2, Radio, Pause, FileText, Search, BrainCircuit, Globe, AlertCircle } from 'lucide-react';
import { fetchRadioStations } from '../services/api';
import { RadioStation, AudioRecording, AppSettings } from '../types';
import { dbService, STORES } from '../services/db';
import { usePlayer } from '../services/playerContext';
import { useToast } from '../services/toastContext';

const AudioIntelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'library'>('monitor');
  const [isRecording, setIsRecording] = useState(false);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  
  // Use Global Player Context
  const { currentStation, isPlaying, playStation, stopStation } = usePlayer();
  const { addToast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Specific high-value targets
  const priorityStations: RadioStation[] = [
      {
          stationuuid: 'manual-rtp-th',
          name: 'Royal Thai Police Radio',
          url: 'http://nossl.fmstream.org/royal-thai-police-radio-live',
          homepage: '',
          tags: 'police, emergency, government',
          country: 'Thailand',
          state: 'Bangkok',
          freq: 'WEB STREAM'
      },
      {
          stationuuid: 'manual-map-99',
          name: 'MAP Radio (Chiang Mai)',
          url: 'http://radio.mapfoundation.org:8000/stream',
          homepage: 'http://mapfoundation.org',
          tags: 'community, migrant, ngo',
          country: 'Thailand',
          state: 'Chiang Mai',
          freq: 'FM 99.0 MHz'
      },
      {
          stationuuid: 'manual-atc-vtcc-app',
          name: 'Chiang Mai Approach (VTCC)',
          url: 'https://s1-fmt2.liveatc.net/vtcc_app',
          homepage: 'https://liveatc.net',
          tags: 'air traffic, control',
          country: 'Thailand',
          state: 'Chiang Mai',
          freq: '124.700 MHz'
      },
      {
          stationuuid: 'manual-atc-vtcc-twr',
          name: 'Chiang Mai Tower (VTCC)',
          url: 'https://s1-fmt2.liveatc.net/vtcc_twr',
          homepage: 'https://liveatc.net',
          tags: 'air traffic, tower',
          country: 'Thailand',
          state: 'Chiang Mai',
          freq: '118.100 MHz'
      }
  ];

  useEffect(() => {
    // Load Recordings
    dbService.getAll<AudioRecording>(STORES.RECORDINGS).then(setRecordings);

    // Load Radio Stations (API + Priority)
    fetchRadioStations().then(apiStations => {
        // De-dupe based on UUID if necessary, but priority first
        setStations([...priorityStations, ...apiStations.slice(0, 50)]);
    });

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
      
      // Setup Recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = saveRecording;
      mediaRecorderRef.current.start();

      drawWaveform();
      setIsRecording(true); 
      addToast('success', 'Recording Started', 'Microphone active and capturing.');
    } catch (err) {
      console.error("Microphone access denied", err);
      addToast('error', 'Microphone Error', 'Access denied or device not found.');
    }
  };

  const stopMonitoring = () => {
    if(mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    cancelAnimationFrame(animationFrameRef.current);
    addToast('info', 'Recording Stopped', 'Processing audio file...');
  };

  const saveRecording = async () => {
      const blob = new Blob(chunksRef.current, { 'type' : 'audio/ogg; codecs=opus' });
      const url = window.URL.createObjectURL(blob);
      const newRec: AudioRecording = {
          id: Date.now().toString(),
          url: url,
          timestamp: Date.now(),
          duration: 0, 
          label: `Intercept #${Math.floor(Math.random() * 1000)}`,
          transcription: 'Processing...',
          aiAnalysis: 'Pending Gemini Analysis...'
      };
      await dbService.add(STORES.RECORDINGS, newRec);
      setRecordings(prev => [newRec, ...prev]);
      addToast('success', 'Intercept Saved', 'Audio saved to local archive.');
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

  const analyzeRecording = (rec: AudioRecording) => {
      addToast('info', 'AI Analysis Initiated', 'Sending to Gemini v3 for processing...');
      setTimeout(() => {
          // Simulation updates would happen here
          addToast('success', 'Analysis Complete', 'Intelligence report generated.');
      }, 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden mb-12">
      <div className="flex justify-between items-end mb-6">
         <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
               <Mic className="text-purple-500" size={32}/> 
               AUDIO <span className="text-slate-500">INTEL</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Live Intercepts • Gemini v3 Analysis • Spectrum Monitoring</p>
         </div>
         <div className="flex gap-2 bg-slate-900 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('monitor')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'monitor' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                LIVE MONITOR
            </button>
            <button 
                onClick={() => setActiveTab('library')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${activeTab === 'library' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
                ARCHIVE & ANALYSIS
            </button>
         </div>
      </div>

      {activeTab === 'monitor' ? (
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
                        <div className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full animate-pulse font-bold text-xs flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"/> RECORDING
                        </div>
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
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-full">
                   <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center justify-between">
                       <div className="flex items-center gap-2"><Radio size={14}/> Live Intercepts</div>
                       {currentStation && isPlaying && <div className="text-[10px] text-green-500 animate-pulse">ACTIVE</div>}
                   </h3>
                   
                   <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {stations.map(station => (
                          <div key={station.stationuuid} className={`flex items-center justify-between bg-slate-800 p-2 rounded hover:bg-slate-700 transition-colors ${station.freq ? 'border-l-2 border-orange-500' : ''}`}>
                              <div className="overflow-hidden">
                                  <div className="text-xs font-bold text-slate-200 truncate">{station.name}</div>
                                  <div className="flex gap-2 text-[10px] text-slate-500 truncate">
                                     {station.freq && <span className="text-orange-400 font-mono">{station.freq}</span>}
                                     <span>{station.tags}</span>
                                  </div>
                              </div>
                              <button 
                                onClick={() => currentStation?.stationuuid === station.stationuuid && isPlaying ? stopStation() : playStation(station)}
                                className={`p-1.5 rounded-full ${currentStation?.stationuuid === station.stationuuid && isPlaying ? 'bg-red-500 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
                              >
                                 {currentStation?.stationuuid === station.stationuuid && isPlaying ? <Pause size={12}/> : <Play size={12}/>}
                              </button>
                          </div>
                      ))}
                   </div>
                   <div className="mt-2 text-[10px] text-slate-600 text-center italic">
                       * Some ATC/Police streams may require VPN or Local Relay.
                       <br/>Global Player active in footer.
                   </div>
                </div>
            </div>
        </div>
      ) : (
        /* ARCHIVE TAB */
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                <h2 className="font-bold text-slate-300 flex items-center gap-2"><FileText size={16}/> Intelligence Archive</h2>
                <div className="text-xs text-slate-500">{recordings.length} Recordings</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {recordings.map(rec => (
                    <div key={rec.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="font-bold text-white text-sm">{rec.label}</div>
                                <div className="text-xs text-slate-500">{new Date(rec.timestamp).toLocaleString()}</div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-slate-700 hover:bg-purple-600 rounded-full text-white transition-colors" onClick={() => {const a = new Audio(rec.url); a.play();}}>
                                    <Play size={14}/>
                                </button>
                                <button className="p-2 bg-slate-700 hover:bg-cyan-600 rounded-full text-white transition-colors" onClick={() => analyzeRecording(rec)}>
                                    <BrainCircuit size={14}/>
                                </button>
                            </div>
                        </div>
                        
                        <div className="bg-slate-950 rounded p-3 mb-2 min-h-[60px]">
                            <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">AI Analysis (Gemini v3)</div>
                            <p className="text-xs text-slate-300 whitespace-pre-wrap">{rec.aiAnalysis || "Pending analysis..."}</p>
                        </div>

                        {rec.transcription && (
                            <div className="bg-slate-900/50 rounded p-2">
                                <div className="text-[10px] font-bold text-slate-600 uppercase mb-1">Transcription</div>
                                <p className="text-xs text-slate-400 italic">"{rec.transcription}"</p>
                            </div>
                        )}
                    </div>
                ))}
                {recordings.length === 0 && (
                    <div className="col-span-2 text-center text-slate-500 py-12">No recordings available. Start monitoring to capture intel.</div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default AudioIntelPage;
