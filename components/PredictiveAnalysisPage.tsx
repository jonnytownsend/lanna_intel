
import React from 'react';
import { BarChart3, TrendingUp, AlertOctagon, Plane, Thermometer } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const MOCK_FLIGHT_DATA = [
  { time: '00:00', inbound: 12, outbound: 8 },
  { time: '04:00', inbound: 5, outbound: 15 },
  { time: '08:00', inbound: 45, outbound: 50 },
  { time: '12:00', inbound: 60, outbound: 55 },
  { time: '16:00', inbound: 55, outbound: 65 },
  { time: '20:00', inbound: 30, outbound: 25 },
];

const MOCK_INCIDENT_PREDICTION = [
  { region: 'Old City', probability: 85, type: 'Traffic' },
  { region: 'Nimman', probability: 65, type: 'Crowd' },
  { region: 'Airport', probability: 40, type: 'Delay' },
  { region: 'Hang Dong', probability: 30, type: 'Accident' },
];

const PredictiveAnalysisPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden">
        <div className="mb-6 flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-2">
                    <BarChart3 className="text-blue-500" size={32}/> 
                    PREDICTIVE <span className="text-slate-500">ANALYSIS</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Historical Trend Analysis • Future Incident Prediction • MongoDB Integration
                </p>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-bold">Data Source</div>
                <div className="text-xs text-green-500 font-mono">mongodb+srv://lens_on_dba...</div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto">
            
            {/* Flight Volume Prediction */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-[400px]">
                <h3 className="text-sm font-bold text-slate-300 uppercase mb-4 flex items-center gap-2">
                    <Plane size={16}/> Air Traffic Volume Forecast (24h)
                </h3>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={MOCK_FLIGHT_DATA}>
                            <defs>
                                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                            <Legend />
                            <Area type="monotone" dataKey="inbound" stroke="#06b6d4" fillOpacity={1} fill="url(#colorIn)" />
                            <Area type="monotone" dataKey="outbound" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorOut)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Incident Heatmap Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-[400px]">
                <h3 className="text-sm font-bold text-slate-300 uppercase mb-4 flex items-center gap-2">
                    <AlertOctagon size={16}/> Incident Probability by Sector
                </h3>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={MOCK_INCIDENT_PREDICTION} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                            <XAxis type="number" stroke="#64748b" fontSize={12} domain={[0, 100]} />
                            <YAxis dataKey="region" type="category" stroke="#64748b" fontSize={12} width={80} />
                            <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', border: '1px solid #334155'}} />
                            <Bar dataKey="probability" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 text-center">
                    Based on historical accident reports and current weather patterns
                </div>
            </div>

            {/* Insight Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center text-red-500">
                         <TrendingUp size={24}/>
                     </div>
                     <div>
                         <div className="text-xs text-slate-500 uppercase font-bold">Risk Trend</div>
                         <div className="text-lg font-bold text-white">Elevated (+12%)</div>
                         <div className="text-[10px] text-slate-400">vs last 30 days</div>
                     </div>
                 </div>

                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-500">
                         <Thermometer size={24}/>
                     </div>
                     <div>
                         <div className="text-xs text-slate-500 uppercase font-bold">Weather Impact</div>
                         <div className="text-lg font-bold text-white">Moderate</div>
                         <div className="text-[10px] text-slate-400">High probability of PM2.5 spike</div>
                     </div>
                 </div>

                 <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full bg-purple-900/20 flex items-center justify-center text-purple-500">
                         <Plane size={24}/>
                     </div>
                     <div>
                         <div className="text-xs text-slate-500 uppercase font-bold">Tourism Flow</div>
                         <div className="text-lg font-bold text-white">~12,400 Pax</div>
                         <div className="text-[10px] text-slate-400">Estimated arrivals today</div>
                     </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default PredictiveAnalysisPage;
