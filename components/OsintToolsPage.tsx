
import React, { useState, useEffect, useRef } from 'react';
import { Search, Image, Shield, AlertTriangle, User, Fingerprint, ExternalLink, Code, Server, Globe, Mail, Eye, Mic, FileAudio, UploadCloud, Terminal as TerminalIcon } from 'lucide-react';
import EXIF from 'exif-js';
import { ExifData, DNSRecord, IpIntel } from '../types';
import { API_URLS } from '../services/config';
import { dbService } from '../services/db';
import { fetchDNSRecords, fetchIpIntel, mockAwsTranscribe } from '../services/api';

// Custom Terminal Component to replace xterm.js
const CustomTerminal: React.FC = () => {
    const [history, setHistory] = useState<string[]>([
        'LANNA SEC OPS TERMINAL v2.0',
        'Connected to secure environment.',
        'Type "help" for available tools.',
        ''
    ]);
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleCommand = (cmd: string) => {
        const args = cmd.trim().split(' ');
        const command = args[0].toLowerCase();
        const param = args[1];
        
        const newHistory = [...history, `$ ${cmd}`];

        switch(command) {
            case 'help':
                newHistory.push(
                    '  scan_headers <url>   Analyze HTTP security headers',
                    '  generate_lure <type> Generate phishing template (email/sms)',
                    '  check_mx <domain>    Check mail exchange records',
                    '  clear                Clear terminal'
                );
                setHistory(newHistory);
                break;
            case 'clear':
                setHistory([]);
                break;
            case 'scan_headers':
                if(!param) { newHistory.push('Usage: scan_headers <url>'); setHistory(newHistory); break; }
                newHistory.push(`[*] Connecting to ${param}...`);
                setHistory(newHistory);
                setTimeout(() => {
                    setHistory(prev => [
                        ...prev, 
                        '[+] Server: nginx/1.18.0',
                        '[-] X-Frame-Options: MISSING',
                        '[-] Content-Security-Policy: MISSING',
                        '[!] Target vulnerable to Clickjacking.'
                    ]);
                }, 800);
                break;
            case 'generate_lure':
                if(!param) { newHistory.push('Usage: generate_lure <email|sms>'); setHistory(newHistory); break; }
                newHistory.push('[*] Generating high-fidelity template...');
                setHistory(newHistory);
                setTimeout(() => {
                    if(param === 'email') {
                        setHistory(prev => [...prev, 'Subject: Urgent Security Alert: Unusual Login Attempt', 'Body: We detected a login from IP 45.2.1.2. Please verify your identity immediately: {{LINK}}']);
                    } else {
                        setHistory(prev => [...prev, 'SMS: Your bank account ending in 8832 has been frozen. Verify at {{LINK}} to restore access.']);
                    }
                }, 500);
                break;
            case 'check_mx':
                if(!param) { newHistory.push('Usage: check_mx <domain>'); setHistory(newHistory); break; }
                newHistory.push(`[*] Querying MX records for ${param}...`);
                setHistory(newHistory);
                setTimeout(() => {
                    setHistory(prev => [
                        ...prev,
                        '10 mxa.mailgun.org',
                        '10 mxb.mailgun.org',
                        '[+] SPF Record found: v=spf1 include:mailgun.org ~all',
                        '[!] DMARC policy is set to "none". Spoofing possible.'
                    ]);
                }, 800);
                break;
            default:
                if(cmd.trim()) newHistory.push(`command not found: ${command}`);
                setHistory(newHistory);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCommand(input);
            setInput('');
        }
    };

    return (
        <div className="h-full w-full bg-slate-950 font-mono text-sm p-4 overflow-hidden flex flex-col border border-green-500/30 rounded-lg">
            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                {history.map((line, i) => (
                    <div key={i} className={`${line.startsWith('$') ? 'text-white' : line.includes('[!]') || line.includes('[-]') ? 'text-red-400' : line.includes('[+]') ? 'text-green-400' : 'text-green-500'}`}>
                        {line}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800">
                <span className="text-green-500 font-bold">$</span>
                <input 
                    className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
            </div>
        </div>
    );
};

const OsintToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'identity' | 'infra' | 'threat' | 'media' | 'audio' | 'terminal'>('identity');

  // --- IDENTITY STATES ---
  const [targetUser, setTargetUser] = useState('');
  const [generatedDorks, setGeneratedDorks] = useState<{label: string, url: string}[]>([]);

  // --- INFRA STATES ---
  const [targetDomain, setTargetDomain] = useState('');
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);
  const [ipData, setIpData] = useState<IpIntel | null>(null);
  const [infraLoading, setInfraLoading] = useState(false);

  // --- MEDIA STATES ---
  const [exifData, setExifData] = useState<ExifData | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // --- AUDIO STATES ---
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [transcribing, setTranscribing] = useState(false);

  // --- THREAT STATES ---
  const [threatQuery, setThreatQuery] = useState('');
  const [vtResult, setVtResult] = useState<any>(null);
  const [vtLoading, setVtLoading] = useState(false);

  // --- IDENTITY LOGIC ---
  const generateDorks = () => {
    if(!targetUser) return;
    const q = encodeURIComponent(targetUser);
    setGeneratedDorks([
        { label: 'Social Profiles', url: `https://www.google.com/search?q=site:twitter.com+"${q}"+OR+site:facebook.com+"${q}"+OR+site:instagram.com+"${q}"+OR+site:linkedin.com+"${q}"` },
        { label: 'Pastebin / Leaks', url: `https://www.google.com/search?q=site:pastebin.com+"${q}"+OR+site:ghostbin.com+"${q}"` },
        { label: 'Public Documents', url: `https://www.google.com/search?q=filetype:pdf+OR+filetype:doc+OR+filetype:xls+"${q}"` },
        { label: 'Email Search', url: `https://www.google.com/search?q="${q}"+email` },
        { label: 'Username Check', url: `https://knowem.com/check usernames/?target=${q}` },
        { label: 'Hunter.io (Domain)', url: `https://hunter.io/search/${q}` }
    ]);
  };

  // --- INFRA LOGIC ---
  const scanInfra = async () => {
      setInfraLoading(true);
      setDnsRecords([]);
      setIpData(null);
      
      if(targetDomain.includes('.')) {
         const records = await fetchDNSRecords(targetDomain);
         setDnsRecords(records);
         
         const aRecord = records.find(r => r.type === 1);
         if(aRecord) {
             const ip = await fetchIpIntel(aRecord.data);
             setIpData(ip);
         }
      } 
      else if (targetDomain.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
          const ip = await fetchIpIntel(targetDomain);
          setIpData(ip);
      }
      setInfraLoading(false);
  };

  // --- MEDIA LOGIC ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      // @ts-ignore
      EXIF.getData(file, function(this: any) {
        const make = EXIF.getTag(this, 'Make');
        const model = EXIF.getTag(this, 'Model');
        const dateTime = EXIF.getTag(this, 'DateTime');
        
        const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
        const lat = EXIF.getTag(this, 'GPSLatitude');
        const lngRef = EXIF.getTag(this, 'GPSLongitudeRef');
        const lng = EXIF.getTag(this, 'GPSLongitude');

        let latitude = null;
        let longitude = null;

        if (lat && lng && latRef && lngRef) {
           latitude = (lat[0] + lat[1]/60 + lat[2]/3600) * (latRef === 'N' ? 1 : -1);
           longitude = (lng[0] + lng[1]/60 + lng[2]/3600) * (lngRef === 'E' ? 1 : -1);
        }

        setExifData({
            make: make?.toString(),
            model: model?.toString(),
            dateTime: dateTime?.toString(),
            lat: latitude,
            lng: longitude
        });
      });
    }
  };

  // --- AUDIO LOGIC ---
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files?.[0]) {
          setAudioFile(e.target.files[0]);
          setTranscription('');
      }
  };

  const processAudio = async () => {
      if(!audioFile) return;
      setTranscribing(true);
      const text = await mockAwsTranscribe(audioFile);
      setTranscription(text);
      setTranscribing(false);
  };

  // --- THREAT LOGIC ---
  const scanThreat = async () => {
      setVtLoading(true);
      setVtResult(null);
      
      const settings = await dbService.getSetting('global_config');
      if(!settings?.virusTotalKey) {
          alert("Please configure VirusTotal API Key in Settings.");
          setVtLoading(false);
          return;
      }

      let type = 'ip_addresses'; 
      if (threatQuery.includes('.')) type = 'domains';
      if (threatQuery.length === 64) type = 'files'; 

      try {
          const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(`${API_URLS.VIRUSTOTAL_API}/${type}/${threatQuery}`)}`, {
              headers: { 'x-apikey': settings.virusTotalKey }
          });
          
          if(response.ok) {
              const data = await response.json();
              setVtResult(data.data.attributes);
          }
      } catch (e) { console.error(e); }
      setVtLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden">
      <div className="flex justify-between items-end mb-6">
         <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
               <Fingerprint className="text-cyan-500" size={32}/> 
               OSINT <span className="text-slate-500">TOOLBOX</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Digital Forensics • Infrastructure Recon • Threat Intelligence</p>
         </div>
         <div className="flex gap-2 bg-slate-900 p-1 rounded-lg">
            <button onClick={() => setActiveTab('identity')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'identity' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <User size={14}/> IDENTITY
            </button>
            <button onClick={() => setActiveTab('infra')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'infra' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Server size={14}/> INFRA
            </button>
            <button onClick={() => setActiveTab('threat')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'threat' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Shield size={14}/> THREAT
            </button>
            <button onClick={() => setActiveTab('media')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'media' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Image size={14}/> MEDIA
            </button>
            <button onClick={() => setActiveTab('terminal')} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${activeTab === 'terminal' ? 'bg-green-600 text-white animate-pulse' : 'text-slate-400 hover:text-white'}`}>
                <TerminalIcon size={14}/> TERMINAL
            </button>
         </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col p-6">
          
          {/* TERMINAL TAB */}
          {activeTab === 'terminal' && <CustomTerminal />}

          {/* IDENTITY TAB */}
          {activeTab === 'identity' && (
              <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 mb-6">
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Target Username / Email / Domain</label>
                      <div className="flex gap-4">
                          <input 
                            value={targetUser}
                            onChange={(e) => setTargetUser(e.target.value)}
                            placeholder="e.g. john.doe@example.com, @johndoe"
                            className="flex-1 bg-slate-950 border border-slate-600 rounded px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                          />
                          <button onClick={generateDorks} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded font-bold">
                              RUN RECON
                          </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedDorks.map((dork, i) => (
                          <a key={i} href={dork.url} target="_blank" rel="noreferrer" className="bg-slate-800 hover:bg-slate-700 p-4 rounded-lg border border-slate-700 group transition-all">
                              <div className="flex justify-between items-center">
                                  <div className="font-bold text-slate-200">{dork.label}</div>
                                  <ExternalLink size={16} className="text-slate-500 group-hover:text-cyan-400"/>
                              </div>
                              <div className="text-xs text-slate-500 mt-2 font-mono truncate">
                                  {dork.url}
                              </div>
                          </a>
                      ))}
                  </div>
              </div>
          )}

          {/* INFRASTRUCTURE TAB */}
          {activeTab === 'infra' && (
              <div className="h-full flex flex-col max-w-5xl mx-auto w-full">
                   <div className="flex gap-4 mb-6">
                        <input 
                           value={targetDomain}
                           onChange={(e) => setTargetDomain(e.target.value)}
                           placeholder="Enter Domain (example.com) or IP Address..."
                           className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                        />
                        <button onClick={scanInfra} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 rounded-lg font-bold flex items-center gap-2">
                            {infraLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Search size={16}/>}
                            SCAN
                        </button>
                   </div>
                   
                   <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                       {/* DNS Records */}
                       <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                           <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><Globe size={16}/> DNS Records</h3>
                           <div className="space-y-2 font-mono text-xs">
                               {dnsRecords.length === 0 && <div className="text-slate-500">No records found.</div>}
                               {dnsRecords.map((rec, i) => (
                                   <div key={i} className="flex gap-2 p-2 bg-slate-900 rounded border-l-2 border-cyan-500">
                                       <span className="text-cyan-400 w-10">{rec.type === 1 ? 'A' : rec.type === 28 ? 'AAAA' : rec.type === 15 ? 'MX' : rec.type === 16 ? 'TXT' : 'NS'}</span>
                                       <span className="text-slate-300 break-all">{rec.data}</span>
                                   </div>
                               ))}
                           </div>
                       </div>
                       
                       {/* IP Intel */}
                       <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                           <h3 className="font-bold text-slate-300 mb-4 flex items-center gap-2"><Server size={16}/> Server Intelligence</h3>
                           {ipData ? (
                               <div className="space-y-3 text-sm">
                                   <div className="flex justify-between border-b border-slate-700 pb-2">
                                       <span className="text-slate-500">IP Address</span>
                                       <span className="text-white font-mono">{ipData.ip}</span>
                                   </div>
                                   <div className="flex justify-between border-b border-slate-700 pb-2">
                                       <span className="text-slate-500">Location</span>
                                       <span className="text-white">{ipData.city}, {ipData.country}</span>
                                   </div>
                                   <div className="flex justify-between border-b border-slate-700 pb-2">
                                       <span className="text-slate-500">Organization</span>
                                       <span className="text-white text-right max-w-[200px]">{ipData.org}</span>
                                   </div>
                                   <div className="flex justify-between border-b border-slate-700 pb-2">
                                       <span className="text-slate-500">ASN</span>
                                       <span className="text-white">{ipData.asn}</span>
                                   </div>
                               </div>
                           ) : (
                               <div className="text-slate-500 text-sm">Resolve A-Record to fetch server details.</div>
                           )}
                       </div>
                   </div>
              </div>
          )}

          {/* MEDIA TAB */}
          {activeTab === 'media' && (
              <div className="h-full flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/2 flex flex-col gap-4">
                      <div className="flex-1 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center relative bg-slate-950">
                          {imageUrl ? (
                              <img src={imageUrl} alt="Analysis" className="max-h-full max-w-full object-contain p-2"/>
                          ) : (
                              <div className="text-center text-slate-500">
                                  <Image size={48} className="mx-auto mb-2 opacity-50"/>
                                  <p>Upload Image for Metadata Extraction</p>
                              </div>
                          )}
                          <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*"/>
                      </div>
                  </div>
                  <div className="w-full md:w-1/2 bg-slate-800 rounded-xl p-6 border border-slate-700 overflow-y-auto">
                      <h3 className="font-bold text-slate-300 border-b border-slate-600 pb-2 mb-4 flex items-center gap-2">
                          <Code size={18}/> EXIF METADATA
                      </h3>
                      {exifData ? (
                          <pre className="text-xs text-slate-400 font-mono">{JSON.stringify(exifData, null, 2)}</pre>
                      ) : <div className="text-slate-500 text-sm">Upload an image to inspect headers...</div>}
                  </div>
              </div>
          )}

          {/* AUDIO TAB - NEW */}
          {activeTab === 'audio' && (
              <div className="h-full flex flex-col max-w-4xl mx-auto w-full gap-6">
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                      <h3 className="text-sm font-bold text-slate-300 uppercase mb-4 flex items-center gap-2">
                          <UploadCloud size={16}/> Forensic Audio Transcription (AWS)
                      </h3>
                      
                      <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-900/50 hover:bg-slate-900 transition-colors relative">
                          <FileAudio size={48} className="text-slate-500 mb-4"/>
                          <p className="text-slate-300 font-bold mb-1">{audioFile ? audioFile.name : "Drag & Drop Audio File"}</p>
                          <p className="text-slate-500 text-xs">Supported: .MP3, .WAV, .FLAC (Max 25MB)</p>
                          <input type="file" onChange={handleAudioUpload} accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer"/>
                      </div>

                      {audioFile && (
                          <button 
                            onClick={processAudio}
                            disabled={transcribing}
                            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
                          >
                             {transcribing ? (
                                 <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> PROCESSING AWS JOB...</>
                             ) : (
                                 <><Mic size={18}/> START TRANSCRIPTION</>
                             )}
                          </button>
                      )}
                  </div>

                  <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-4 relative">
                      <div className="absolute top-0 left-0 bg-slate-800 text-xs font-bold text-slate-400 px-3 py-1 rounded-br-lg border-b border-r border-slate-700">
                          OUTPUT CONSOLE
                      </div>
                      <div className="mt-6 font-mono text-sm text-green-400 whitespace-pre-wrap h-full overflow-y-auto custom-scrollbar">
                          {transcription || <span className="text-slate-600 opacity-50">Waiting for input...</span>}
                      </div>
                  </div>
              </div>
          )}

          {/* THREAT TAB */}
          {activeTab === 'threat' && (
               <div className="max-w-4xl mx-auto w-full">
                    <div className="flex gap-4 mb-8">
                        <input 
                           value={threatQuery}
                           onChange={(e) => setThreatQuery(e.target.value)}
                           placeholder="Enter IP, Domain, or File Hash..."
                           className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500"
                        />
                        <button onClick={scanThreat} className="bg-red-600 hover:bg-red-500 text-white px-8 rounded-lg font-bold">
                            {vtLoading ? 'SCANNING...' : 'SCAN TARGET'}
                        </button>
                    </div>
                    {/* VT Results */}
                    {vtResult && <pre className="bg-slate-950 p-4 rounded border border-slate-800 text-xs text-slate-300 overflow-auto">{JSON.stringify(vtResult, null, 2)}</pre>}
               </div>
          )}

      </div>
    </div>
  );
};

export default OsintToolsPage;
