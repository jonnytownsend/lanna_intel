
import React, { useState } from 'react';
import { Search, Image, Shield, AlertTriangle, User, Fingerprint, ExternalLink, Code, Crosshair, Server, Globe, Mail, Eye } from 'lucide-react';
import EXIF from 'exif-js';
import { ExifData, DNSRecord, IpIntel } from '../types';
import { API_URLS } from '../services/config';
import { dbService } from '../services/db';
import { fetchDNSRecords, fetchIpIntel } from '../services/api';

const OsintToolsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'identity' | 'infra' | 'threat' | 'media'>('identity');

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
        { label: 'Hunter.io (Domain)', url: `https://hunter.io/search/${q}` } // Assuming user puts domain for hunter
    ]);
  };

  // --- INFRA LOGIC ---
  const scanInfra = async () => {
      setInfraLoading(true);
      setDnsRecords([]);
      setIpData(null);
      
      // 1. DNS Recon
      if(targetDomain.includes('.')) {
         const records = await fetchDNSRecords(targetDomain);
         setDnsRecords(records);
         
         // If A record found, fetch IP Intel for first IP
         const aRecord = records.find(r => r.type === 1);
         if(aRecord) {
             const ip = await fetchIpIntel(aRecord.data);
             setIpData(ip);
         }
      } 
      // 2. IP Direct
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
         </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col p-6">
          
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

                  {targetUser && generatedDorks.length > 0 && (
                      <div className="mt-8 border-t border-slate-800 pt-6">
                          <h3 className="text-sm font-bold text-slate-300 mb-4">External Verification Tools</h3>
                          <div className="grid grid-cols-2 gap-4">
                              <a href="https://haveibeenpwned.com/" target="_blank" rel="noreferrer" className="p-3 bg-red-900/30 border border-red-800 rounded text-red-300 text-xs font-bold flex items-center justify-between hover:bg-red-900/50">
                                  <span>Have I Been Pwned Check</span> <ExternalLink size={12}/>
                              </a>
                              <a href="https://hunter.io/" target="_blank" rel="noreferrer" className="p-3 bg-orange-900/30 border border-orange-800 rounded text-orange-300 text-xs font-bold flex items-center justify-between hover:bg-orange-900/50">
                                  <span>Hunter.io Email Verify</span> <ExternalLink size={12}/>
                              </a>
                          </div>
                      </div>
                  )}
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

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto">
                       {/* DNS Column */}
                       <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                           <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Globe size={14}/> DNS Records</h3>
                           <div className="space-y-2">
                               {dnsRecords.length === 0 && !infraLoading && <div className="text-slate-500 text-xs italic">No records loaded.</div>}
                               {dnsRecords.map((r, i) => (
                                   <div key={i} className="text-xs p-2 bg-slate-900 rounded border border-slate-800 break-all">
                                       <span className="font-bold text-cyan-400 mr-2">
                                          {r.type === 1 ? 'A' : r.type === 28 ? 'AAAA' : r.type === 15 ? 'MX' : r.type === 16 ? 'TXT' : r.type === 2 ? 'NS' : r.type}
                                       </span>
                                       <span className="text-slate-300">{r.data}</span>
                                   </div>
                               ))}
                           </div>
                       </div>

                       {/* IP Intel Column */}
                       <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                           <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2"><Server size={14}/> IP Intelligence</h3>
                           {ipData ? (
                               <div className="space-y-4">
                                   <div className="grid grid-cols-2 gap-4">
                                       <div><label className="text-[10px] text-slate-500 block">IP Address</label><div className="text-white font-mono text-sm">{ipData.ip}</div></div>
                                       <div><label className="text-[10px] text-slate-500 block">ASN</label><div className="text-white font-mono text-sm">{ipData.asn}</div></div>
                                       <div className="col-span-2"><label className="text-[10px] text-slate-500 block">Organization</label><div className="text-white font-mono text-sm">{ipData.org}</div></div>
                                       <div className="col-span-2"><label className="text-[10px] text-slate-500 block">Location</label><div className="text-white font-mono text-sm">{ipData.city}, {ipData.region}, {ipData.country}</div></div>
                                   </div>
                                   
                                   <div className="bg-slate-900 p-3 rounded text-xs text-slate-400 border border-slate-800">
                                       <div className="mb-2 font-bold text-slate-300">External Lookups</div>
                                       <a href={`https://builtwith.com/${targetDomain}`} target="_blank" rel="noreferrer" className="block hover:text-cyan-400 mb-1 flex items-center gap-2"><ExternalLink size={10}/> BuiltWith Tech Stack</a>
                                       <a href={`https://securitytrails.com/domain/${targetDomain}/dns`} target="_blank" rel="noreferrer" className="block hover:text-cyan-400 flex items-center gap-2"><ExternalLink size={10}/> SecurityTrails History</a>
                                   </div>
                               </div>
                           ) : (
                               <div className="text-slate-500 text-xs italic">No IP data resolved.</div>
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
                          <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="text-[10px] text-slate-500 uppercase">Device Make</label>
                                      <div className="text-white font-mono">{exifData.make || 'N/A'}</div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] text-slate-500 uppercase">Device Model</label>
                                      <div className="text-white font-mono">{exifData.model || 'N/A'}</div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] text-slate-500 uppercase">Timestamp</label>
                                      <div className="text-white font-mono">{exifData.dateTime || 'N/A'}</div>
                                  </div>
                              </div>

                              <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                                  <label className="text-[10px] text-slate-500 uppercase mb-2 block flex items-center gap-2">
                                      <Crosshair size={12}/> Geolocation Data
                                  </label>
                                  {exifData.lat ? (
                                      <div>
                                          <div className="text-green-400 font-mono text-lg">{exifData.lat.toFixed(6)}, {exifData.lng?.toFixed(6)}</div>
                                          <a 
                                            href={`https://www.google.com/maps?q=${exifData.lat},${exifData.lng}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-block mt-2 text-xs bg-cyan-600 text-white px-3 py-1 rounded"
                                          >
                                              VIEW ON MAP
                                          </a>
                                      </div>
                                  ) : (
                                      <div className="text-slate-500 text-xs">No GPS data found in image.</div>
                                  )}
                              </div>
                          </div>
                      ) : (
                          <div className="text-slate-500 text-sm">Upload an image to inspect headers...</div>
                      )}
                  </div>
              </div>
          )}

          {/* THREAT TAB */}
          {activeTab === 'threat' && (
               <div className="max-w-4xl mx-auto w-full">
                    <div className="text-center mb-8">
                        <Shield size={48} className="mx-auto text-slate-600 mb-4"/>
                        <h2 className="text-xl font-bold text-white">IOC Scanner</h2>
                        <p className="text-slate-400 text-sm">Check IP Addresses, Domains, or File Hashes against VirusTotal database.</p>
                    </div>
                    
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

                    {vtResult && (
                        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 animate-in fade-in slide-in-from-bottom-4">
                             <div className="flex justify-between items-start mb-6">
                                 <div>
                                     <div className="text-xs text-slate-500 uppercase">Analysis Result</div>
                                     <div className="text-2xl font-bold text-white flex items-center gap-2">
                                         {vtResult.last_analysis_stats?.malicious > 0 ? (
                                             <span className="text-red-500 flex items-center gap-2"><AlertTriangle/> MALICIOUS</span>
                                         ) : (
                                             <span className="text-green-500 flex items-center gap-2"><Shield/> CLEAN</span>
                                         )}
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-3xl font-black text-slate-200">
                                         {vtResult.last_analysis_stats?.malicious} <span className="text-sm text-slate-500 font-normal">/ {vtResult.last_analysis_stats?.harmless + vtResult.last_analysis_stats?.malicious}</span>
                                     </div>
                                     <div className="text-xs text-slate-500">Security Vendors Flagged</div>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                 <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                     <div className="text-slate-500 text-xs">Reputation</div>
                                     <div className="text-white font-mono">{vtResult.reputation}</div>
                                 </div>
                                 <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                     <div className="text-slate-500 text-xs">Country</div>
                                     <div className="text-white font-mono">{vtResult.country || 'N/A'}</div>
                                 </div>
                                 <div className="bg-slate-900 p-3 rounded border border-slate-700 col-span-2">
                                     <div className="text-slate-500 text-xs">Network Owner</div>
                                     <div className="text-white font-mono truncate">{vtResult.as_owner || 'N/A'}</div>
                                 </div>
                             </div>
                        </div>
                    )}

                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <a href={`https://transparencyreport.google.com/safe-browsing/search?url=${threatQuery}`} target="_blank" rel="noreferrer" className="p-4 bg-slate-800 rounded hover:bg-slate-700 flex items-center justify-between">
                            <span className="font-bold text-slate-300">Google Safe Browsing Check</span>
                            <ExternalLink size={14}/>
                        </a>
                        <a href={`https://otx.alienvault.com/browse/global/pulses?q=${threatQuery}`} target="_blank" rel="noreferrer" className="p-4 bg-slate-800 rounded hover:bg-slate-700 flex items-center justify-between">
                            <span className="font-bold text-slate-300">AlienVault OTX Lookup</span>
                            <ExternalLink size={14}/>
                        </a>
                    </div>
               </div>
          )}

      </div>
    </div>
  );
};

export default OsintToolsPage;
