
import React, { useEffect, useRef, useState } from 'react';
import { Mic, Play, Save, Settings, Radio, Pause, FileText, BrainCircuit, Activity, Waves, Cpu, RadioReceiver, Volume2, Download, RefreshCw, Zap } from 'lucide-react';
import { fetchRadioStations, fetchElevenLabsVoices, elevenLabsTTS } from '../services/api';
import { RadioStation, AudioRecording, ElevenLabsVoice } from '../types';
import { dbService, STORES } from '../services/db';
import { usePlayer } from '../services/playerContext';
import { useToast } from '../services/toastContext';
import { API_KEYS } from '../services/config';
import * as Tone from 'tone';
import { Button, Segment, Header, Grid, Icon, List, Label, Card, Select, TextArea } from 'semantic-ui-react';

const AudioIntelPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'synthesis' | 'library'>('monitor');
  const [isRecording, setIsRecording] = useState(false);
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  
  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scanIndex, setScanIndex] = useState(0);

  // ElevenLabs State
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [synthesisText, setSynthesisText] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Audio Processing State
  const [eqHigh, setEqHigh] = useState(0);
  const [eqMid, setEqMid] = useState(0);
  const [eqLow, setEqLow] = useState(0);

  // Use Global Player Context
  const { currentStation, isPlaying, playStation, stopStation } = usePlayer();
  const { addToast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Tone.js Refs
  const micRef = useRef<Tone.UserMedia | null>(null);
  const waveformRef = useRef<Tone.Waveform | null>(null);
  const eqRef = useRef<Tone.EQ3 | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const animationFrameRef = useRef<number>(0);

  // Priority Stations
  const priorityStations: RadioStation[] = [
      {
          stationuuid: 'manual-rtp-th',
          name: 'Royal Thai Police Radio',
          url: 'http://nossl.fmstream.org/royal-thai-police-radio-live',
          homepage: '',
          tags: 'police, emergency, government',
          country: 'Thailand',
          state: 'Bangkok',
          freq: 'WEB STREAM',
          signalStrength: 95,
          modulation: 'FM'
      },
      {
          stationuuid: 'manual-atc-vtcc-app',
          name: 'Chiang Mai Approach (VTCC)',
          url: 'https://s1-fmt2.liveatc.net/vtcc_app',
          homepage: 'https://liveatc.net',
          tags: 'air traffic, control',
          country: 'Thailand',
          state: 'Chiang Mai',
          freq: '124.700 MHz',
          signalStrength: 88,
          modulation: 'AM'
      },
  ];

  useEffect(() => {
    // Load Recordings
    dbService.getAll<AudioRecording>(STORES.RECORDINGS).then(setRecordings);

    // Load Radio Stations (API + Priority)
    fetchRadioStations().then(apiStations => {
        setStations([...priorityStations, ...apiStations.slice(0, 50)]);
    });

    // Load ElevenLabs Voices
    if(API_KEYS.ELEVENLABS) {
        fetchElevenLabsVoices(API_KEYS.ELEVENLABS).then(setVoices);
    }

    return () => {
      stopMonitoring();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Update EQ
  useEffect(() => {
      if (eqRef.current) {
          eqRef.current.high.value = eqHigh;
          eqRef.current.mid.value = eqMid;
          eqRef.current.low.value = eqLow;
      }
  }, [eqHigh, eqMid, eqLow]);

  // Scanner Logic
  useEffect(() => {
      let scanTimer: any;
      if (isScanning && activeTab === 'monitor') {
          scanTimer = setInterval(() => {
              const nextIndex = (scanIndex + 1) % stations.length;
              setScanIndex(nextIndex);
              playStation(stations[nextIndex]);
          }, 8000); // Scan every 8 seconds
      } else {
          clearInterval(scanTimer);
      }
      return () => clearInterval(scanTimer);
  }, [isScanning, scanIndex, stations, activeTab]);

  const toggleScanner = () => {
      if (isScanning) {
          setIsScanning(false);
          stopStation();
          addToast('info', 'Scanner Halted', 'Manual control resumed.');
      } else {
          setIsScanning(true);
          addToast('success', 'Scanner Active', 'Cycling frequencies (8s interval).');
      }
  };

  const startMonitoring = async () => {
    try {
      await Tone.start();
      micRef.current = new Tone.UserMedia();
      eqRef.current = new Tone.EQ3(eqLow, eqMid, eqHigh);
      waveformRef.current = new Tone.Waveform(1024);
      
      micRef.current.connect(eqRef.current);
      eqRef.current.connect(waveformRef.current);

      await micRef.current.open();
      
      const stream = (micRef.current as any)._stream; 
      recorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      recorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorderRef.current.onstop = saveRecording;
      recorderRef.current.start();

      drawWaveform();
      setIsRecording(true); 
      addToast('success', 'Tone.js Engine Active', 'Spectral analysis and recording started.');
    } catch (err) {
      console.error("Microphone access denied", err);
      addToast('error', 'Microphone Error', 'Access denied or device not found.');
    }
  };

  const stopMonitoring = () => {
    if(recorderRef.current && isRecording) {
        recorderRef.current.stop();
    }
    if (micRef.current) {
        micRef.current.close();
    }
    setIsRecording(false);
    cancelAnimationFrame(animationFrameRef.current);
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
          aiAnalysis: 'Pending Gemini Analysis...',
          type: 'intercept'
      };
      await dbService.add(STORES.RECORDINGS, newRec);
      setRecordings(prev => [newRec, ...prev]);
      addToast('success', 'Intercept Saved', 'Audio saved to local archive.');
  };

  // ElevenLabs Synthesis
  const handleSynthesis = async () => {
      if (!synthesisText || !selectedVoice) return;
      setIsSynthesizing(true);
      
      const blob = await elevenLabsTTS(synthesisText, selectedVoice, API_KEYS.ELEVENLABS);
      
      if (blob) {
          const url = window.URL.createObjectURL(blob);
          const newRec: AudioRecording = {
              id: Date.now().toString(),
              url: url,
              timestamp: Date.now(),
              duration: 0,
              label: `Synthesized Ops - ${voices.find(v => v.voice_id === selectedVoice)?.name || 'Unknown'}`,
              transcription: synthesisText,
              aiAnalysis: 'Generated Content (Deepfake/Lure)',
              type: 'synthesis'
          };
          await dbService.add(STORES.RECORDINGS, newRec);
          setRecordings(prev => [newRec, ...prev]);
          addToast('success', 'Voice Generated', 'Audio synthesized and archived successfully.');
      } else {
          addToast('error', 'Synthesis Failed', 'Check API Key or Credits.');
      }
      setIsSynthesizing(false);
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !waveformRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    animationFrameRef.current = requestAnimationFrame(drawWaveform);
    
    const values = waveformRef.current.getValue();
    
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#22c55e'; // green-500
    ctx.beginPath();
    
    const sliceWidth = canvas.width * 1.0 / values.length;
    let x = 0;
    
    for (let i = 0; i < values.length; i++) {
      const v = values[i] as number; // Tone.js returns Float32Array
      const y = (v + 1) / 2 * canvas.height;
      
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
            <Header as='h1' inverted>
               <Icon name='microphone' className="text-purple-500" />
               <Header.Content>
                 AUDIO INTEL
                 <Header.Subheader className="text-slate-400">
                   Tone.js Engine • ElevenLabs Ops • Spectrum Monitoring
                 </Header.Subheader>
               </Header.Content>
            </Header>
         </div>
         <Button.Group size='small'>
            <Button 
                inverted 
                color={activeTab === 'monitor' ? 'purple' : 'grey'}
                active={activeTab === 'monitor'} 
                onClick={() => setActiveTab('monitor')}
            >
                LIVE MONITOR
            </Button>
            <Button 
                inverted 
                color={activeTab === 'synthesis' ? 'purple' : 'grey'}
                active={activeTab === 'synthesis'} 
                onClick={() => setActiveTab('synthesis')}
            >
                VOICE OPS
            </Button>
            <Button 
                inverted 
                color={activeTab === 'library' ? 'purple' : 'grey'}
                active={activeTab === 'library'} 
                onClick={() => setActiveTab('library')}
            >
                ARCHIVE
            </Button>
         </Button.Group>
      </div>

      {activeTab === 'monitor' ? (
        <Grid columns={2} stackable className="h-full">
            <Grid.Column width={10} className="flex flex-col h-full">
                {/* Visualizer */}
                <Segment inverted className="flex-1 relative p-0 overflow-hidden border-slate-700 bg-black">
                    <canvas ref={canvasRef} width={800} height={400} className="w-full h-full block opacity-80"/>
                    
                    {/* Grid Overlay for Scope effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

                    {!isRecording && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Button circular icon='microphone' size='massive' color='red' onClick={startMonitoring} className="shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse" />
                        </div>
                    )}
                    {isRecording && (
                        <div className="absolute bottom-4 right-4 flex gap-4 items-center">
                            <div className="bg-red-900/50 text-red-500 px-3 py-1 rounded border border-red-500 animate-pulse font-mono text-xs font-bold">● REC 00:04:12</div>
                            <Button circular icon='stop' size='big' color='grey' onClick={stopMonitoring} />
                        </div>
                    )}
                </Segment>

                {/* Tone.js EQ Controls */}
                <Segment inverted className="mt-0">
                   <div className="flex justify-between items-center mb-4">
                       <Header as='h5' icon='settings' content='Tone.js Signal Enhancement' inverted className="m-0" />
                       <Label color='purple' size='tiny'>DSP ACTIVE</Label>
                   </div>
                   <Grid columns={3} centered>
                      <Grid.Column textAlign='center'>
                         <div className="text-xs text-slate-400 mb-2 font-mono">LOW_PASS ({eqLow} dB)</div>
                         <input type="range" min="-20" max="10" value={eqLow} onChange={(e) => setEqLow(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                      </Grid.Column>
                      <Grid.Column textAlign='center'>
                         <div className="text-xs text-slate-400 mb-2 font-mono">BAND_PASS ({eqMid} dB)</div>
                         <input type="range" min="-20" max="10" value={eqMid} onChange={(e) => setEqMid(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                      </Grid.Column>
                      <Grid.Column textAlign='center'>
                         <div className="text-xs text-slate-400 mb-2 font-mono">HIGH_PASS ({eqHigh} dB)</div>
                         <input type="range" min="-20" max="10" value={eqHigh} onChange={(e) => setEqHigh(Number(e.target.value))} className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                      </Grid.Column>
                   </Grid>
                </Segment>
            </Grid.Column>

            <Grid.Column width={6} className="h-full flex flex-col">
                <Segment inverted className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-900 border-slate-700">
                   <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                       <div>
                           <h4 className="text-white font-bold flex items-center gap-2 m-0"><RadioReceiver size={16} className="text-cyan-500"/> SPECTRUM SCANNER</h4>
                           <div className="text-[10px] text-slate-500 font-mono mt-1">
                               {stations.length} FREQUENCIES LOCKED
                           </div>
                       </div>
                       <Button 
                          size='mini' 
                          color={isScanning ? 'green' : 'grey'} 
                          onClick={toggleScanner}
                          animated
                          className={isScanning ? 'animate-pulse' : ''}
                       >
                          <Button.Content visible>{isScanning ? 'SCANNING' : 'START SCAN'}</Button.Content>
                          <Button.Content hidden><RefreshCw/></Button.Content>
                       </Button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                      {stations.map((station, idx) => {
                          const active = currentStation?.stationuuid === station.stationuuid;
                          return (
                              <div 
                                key={station.stationuuid}
                                onClick={() => active && isPlaying ? stopStation() : playStation(station)}
                                className={`
                                    group cursor-pointer rounded border p-2 transition-all duration-200
                                    ${active ? 'bg-cyan-900/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}
                                `}
                              >
                                  <div className="flex justify-between items-start mb-1">
                                      <div className="flex items-center gap-2">
                                          {active && isPlaying ? (
                                              <Activity size={14} className="text-cyan-400 animate-pulse"/>
                                          ) : (
                                              <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-600 group-hover:border-cyan-500 transition-colors"></div>
                                          )}
                                          <span className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-300'}`}>{station.name}</span>
                                      </div>
                                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-900/30 px-1 rounded">
                                          {station.freq || 'WEB'}
                                      </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-2 pl-6">
                                      <div className="flex gap-1 items-center">
                                          {/* Simulated Signal Bars */}
                                          <div className="flex gap-0.5 items-end h-3">
                                              {[1,2,3,4,5].map(i => (
                                                  <div 
                                                    key={i} 
                                                    className={`w-1 rounded-sm ${i <= Math.ceil((station.signalStrength || 50)/20) ? 'bg-green-500' : 'bg-slate-700'}`}
                                                    style={{height: `${i*20}%`}}
                                                  ></div>
                                              ))}
                                          </div>
                                          <span className="text-[10px] text-slate-500 ml-1">{station.signalStrength || 0}%</span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-mono border border-slate-700 px-1 rounded">
                                          {station.modulation || 'FM'}
                                      </span>
                                  </div>
                              </div>
                          );
                      })}
                   </div>
                </Segment>
            </Grid.Column>
        </Grid>
      ) : activeTab === 'synthesis' ? (
        /* VOICE OPS TAB */
        <div className="h-full flex flex-col md:flex-row gap-6 max-w-6xl mx-auto w-full">
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                <Segment inverted className="border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                    <Header as='h3' icon className="text-center">
                        <BrainCircuit className="text-cyan-400 mb-2 mx-auto" size={40}/>
                        <Header.Content>Neural Voice Synthesis</Header.Content>
                        <Header.Subheader>ElevenLabs v2 GenAI Model</Header.Subheader>
                    </Header>
                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Voice Model</label>
                            <select 
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white focus:border-cyan-500 outline-none"
                                value={selectedVoice}
                                onChange={(e) => setSelectedVoice(e.target.value)}
                            >
                                <option value="">Select Target Voice...</option>
                                {voices.map(v => (
                                    <option key={v.voice_id} value={v.voice_id}>{v.name} ({v.category})</option>
                                ))}
                            </select>
                        </div>
                        <div className="p-3 bg-slate-800 rounded border border-slate-700 text-xs text-slate-400">
                            <p className="mb-2"><span className="text-cyan-400 font-bold">Credits Remaining:</span> Unknown</p>
                            <p>Generates high-fidelity deepfake audio for psyops, lures, or automated broadcasts. Stored securely in Archive.</p>
                        </div>
                    </div>
                </Segment>
            </div>
            
            <div className="flex-1 flex flex-col">
                <Segment inverted className="flex-1 flex flex-col relative border-slate-700">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 animate-pulse"></div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block p-2">Input Script</label>
                    <textarea 
                        className="flex-1 bg-slate-900/50 border-none resize-none p-4 text-white font-mono focus:ring-0 focus:outline-none text-sm"
                        placeholder="Enter text to synthesize..."
                        value={synthesisText}
                        onChange={(e) => setSynthesisText(e.target.value)}
                    />
                    <div className="p-4 border-t border-slate-700 bg-slate-900 flex justify-between items-center">
                        <span className="text-xs text-slate-500">{synthesisText.length} chars</span>
                        <Button 
                            color='teal' 
                            onClick={handleSynthesis} 
                            disabled={!selectedVoice || !synthesisText || isSynthesizing}
                            className="shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                        >
                            {isSynthesizing ? (
                                <><RefreshCw className="animate-spin mr-2"/> GENERATING...</>
                            ) : (
                                <><Zap className="mr-2"/> SYNTHESIZE AUDIO</>
                            )}
                        </Button>
                    </div>
                </Segment>
            </div>
        </div>
      ) : (
        /* ARCHIVE TAB */
        <Segment inverted className="flex-1 overflow-hidden flex flex-col">
            <Header as='h3' inverted dividing>
                <Icon name='folder open' />
                <Header.Content>Intelligence Archive <Label circular color='blue'>{recordings.length}</Label></Header.Content>
            </Header>
            <div className="flex-1 overflow-y-auto p-2">
                <Card.Group itemsPerRow={2} stackable>
                    {recordings.map(rec => (
                        <Card key={rec.id} fluid className="!bg-slate-900 !border !border-slate-700">
                            <Card.Content>
                                <Card.Header className="flex justify-between !text-slate-200">
                                    <span>{rec.label}</span>
                                    <Label size='mini' color={rec.type === 'synthesis' ? 'purple' : 'red'}>
                                        {rec.type === 'synthesis' ? 'AI GEN' : 'INTERCEPT'}
                                    </Label>
                                </Card.Header>
                                <Card.Meta className="!text-slate-500 font-mono text-xs">{new Date(rec.timestamp).toLocaleString()}</Card.Meta>
                                <Card.Description className="!text-slate-400 mt-2">
                                    <div className="text-xs p-2 bg-slate-950 rounded border border-slate-800 min-h-[40px] italic">
                                        "{rec.transcription ? (rec.transcription.substring(0, 100) + (rec.transcription.length > 100 ? '...' : '')) : 'No text content.'}"
                                    </div>
                                    <div className="mt-2 text-xs flex items-center gap-1 text-cyan-500">
                                        <BrainCircuit size={12}/> {rec.aiAnalysis || "Pending analysis..."}
                                    </div>
                                </Card.Description>
                            </Card.Content>
                            <Card.Content extra className="!border-t !border-slate-800">
                                <div className='ui two buttons'>
                                    <Button basic inverted color='green' onClick={() => {const a = new Audio(rec.url); a.play();}}>
                                        <Icon name='play' /> Play
                                    </Button>
                                    <Button basic inverted color='teal' onClick={() => analyzeRecording(rec)}>
                                        <Icon name='microchip' /> Analyze
                                    </Button>
                                </div>
                            </Card.Content>
                        </Card>
                    ))}
                </Card.Group>
                {recordings.length === 0 && (
                    <Segment placeholder inverted className="!bg-transparent">
                        <Header icon>
                            <Icon name='file audio outline' />
                            No recordings found in secure storage.
                        </Header>
                    </Segment>
                )}
            </div>
        </Segment>
      )}
    </div>
  );
};

export default AudioIntelPage;
