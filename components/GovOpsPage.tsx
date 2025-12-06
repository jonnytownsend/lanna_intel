import React, { useEffect, useState } from 'react';
import { Building, Users, TrendingUp, FileText, Globe, AlertCircle } from 'lucide-react';
import { fetchGovStats } from '../services/api';
import { GovStat } from '../types';

const GovOpsPage: React.FC = () => {
  const [stats, setStats] = useState<GovStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
        setLoading(true);
        const data = await fetchGovStats();
        setStats(data);
        setLoading(false);
    };
    load();
  }, []);

  const formatValue = (val: string | number) => {
      if (typeof val === 'number') {
          if (val > 1000000000) return (val / 1000000000).toFixed(2) + ' B';
          if (val > 1000000) return (val / 1000000).toFixed(2) + ' M';
          return val.toLocaleString();
      }
      return val;
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden relative">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white flex items-center gap-2">
           <Building className="text-yellow-500" size={32} />
           GOVOPS <span className="text-slate-500">INTELLIGENCE</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
           Public Sector Data • Demographics • Open Government Services
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Key Indicators */}
          {loading ? (
             [1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-900 animate-pulse rounded-xl"></div>)
          ) : (
             stats.map((stat, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase mb-2">{stat.indicator}</div>
                        <div className="text-3xl font-black text-white">{formatValue(stat.value)}</div>
                    </div>
                    <div className="mt-4 flex justify-between items-end text-[10px] text-slate-400">
                        <span>{stat.date}</span>
                        <span>{stat.source}</span>
                    </div>
                </div>
             ))
          )}
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Public Services List */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                <h3 className="font-bold text-slate-300 flex items-center gap-2"><Globe size={16}/> Digital Government Services</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[
                     { name: 'Immigration Bureau', desc: '90-day reporting, Visa extension queuing', status: 'Online', url: 'https://www.immigration.go.th/' },
                     { name: 'Department of Land Transport', desc: 'Driver license renewal booking', status: 'Online', url: 'https://www.dlt.go.th/' },
                     { name: 'Revenue Department', desc: 'E-Filing for Tax Returns', status: 'Maintenance', url: 'https://www.rd.go.th/' },
                     { name: 'Social Security Office', desc: 'Benefits checking and registration', status: 'Online', url: 'https://www.sso.go.th/' },
                     { name: 'Meteorological Dept', desc: 'Official Weather Warnings', status: 'Online', url: 'https://www.tmd.go.th/' },
                     { name: 'Tourism Authority', desc: 'Travel advisories and stats', status: 'Online', url: 'https://www.tat.or.th/' }
                 ].map((service, i) => (
                     <a key={i} href={service.url} target="_blank" rel="noreferrer" className="block p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors border border-slate-700/50 hover:border-slate-600">
                         <div className="flex justify-between items-start mb-2">
                             <div className="font-bold text-white">{service.name}</div>
                             <span className={`text-[10px] px-2 py-0.5 rounded ${service.status === 'Online' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>{service.status}</span>
                         </div>
                         <div className="text-xs text-slate-400">{service.desc}</div>
                     </a>
                 ))}
             </div>
          </div>

          {/* Alerts / Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                 <h3 className="font-bold text-slate-300 flex items-center gap-2"><AlertCircle size={16}/> Official Announcements</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Mock Alerts as we don't have a direct scraped feed configured yet */}
                  <div className="p-3 bg-slate-800/50 rounded border-l-2 border-yellow-500">
                      <div className="text-xs font-bold text-yellow-500 mb-1">PM 2.5 Warning</div>
                      <p className="text-xs text-slate-300">High particulate matter levels detected in Northern provinces. Outdoor activity discouraged.</p>
                      <div className="text-[10px] text-slate-500 mt-2">Source: Pollution Control Dept</div>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded border-l-2 border-blue-500">
                      <div className="text-xs font-bold text-blue-500 mb-1">Digital Wallet Update</div>
                      <p className="text-xs text-slate-300">Registration for the 10,000 THB scheme opens next month for eligible citizens.</p>
                      <div className="text-[10px] text-slate-500 mt-2">Source: Ministry of Finance</div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default GovOpsPage;
