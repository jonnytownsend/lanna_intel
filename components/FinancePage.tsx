import React, { useEffect, useState } from 'react';
import { CurrencyRates, NewsItem } from '../types';
import { fetchCurrencyRates, fetchFinancialNews } from '../services/api';
import { DollarSign, TrendingUp, TrendingDown, Newspaper, Globe, RefreshCcw, ExternalLink } from 'lucide-react';

const FinancePage: React.FC = () => {
  const [rates, setRates] = useState<CurrencyRates | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [rData, nData] = await Promise.all([
      fetchCurrencyRates(),
      fetchFinancialNews()
    ]);
    setRates(rData);
    setNews(nData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadData, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden relative">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
         <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
               <DollarSign className="text-green-500" size={32}/> 
               FINANCIAL <span className="text-slate-500">INTEL</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Live Forex (THB) • SEA Markets • Economic OSINT</p>
         </div>
         <button onClick={loadData} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white">
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''}/>
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Currency Section */}
            <div className="space-y-4">
               <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <Globe size={16}/> Exchange Rates (Base: THB)
                  </h2>
                  
                  {rates ? (
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <RateCard currency="USD" rate={rates.usd} flag="🇺🇸" />
                           <RateCard currency="EUR" rate={rates.eur} flag="🇪🇺" />
                           <RateCard currency="CNY" rate={rates.cny} flag="🇨🇳" />
                           <RateCard currency="JPY" rate={rates.jpy} flag="🇯🇵" />
                           <RateCard currency="SGD" rate={rates.sgd} flag="🇸🇬" />
                           <RateCard currency="GBP" rate={rates.gbp} flag="🇬🇧" />
                           <RateCard currency="HKD" rate={rates.hkd} flag="🇭🇰" />
                        </div>
                        <div className="text-[10px] text-slate-600 text-center pt-2">
                           Updated: {new Date(rates.date).toLocaleDateString()}
                        </div>
                     </div>
                  ) : (
                     <div className="text-center text-slate-500 py-8">Loading Rates...</div>
                  )}
               </div>

               <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                   <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Market Sentiment</h2>
                   <div className="flex items-center gap-4">
                      <div className="flex-1 bg-slate-800 rounded-lg p-3 text-center">
                         <span className="block text-2xl font-bold text-white">SET</span>
                         <span className="text-xs text-slate-400">Thai Stock Exchange</span>
                      </div>
                      <div className="flex-1 bg-slate-800 rounded-lg p-3 text-center">
                         <span className="block text-2xl font-bold text-white">XAU</span>
                         <span className="text-xs text-slate-400">Gold Spot</span>
                      </div>
                   </div>
                   <p className="text-[10px] text-slate-500 mt-2 text-center">
                      * Index data pending real-time connection
                   </p>
               </div>
            </div>

            {/* News Feed */}
            <div className="lg:col-span-2">
               <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[500px]">
                  <div className="p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
                     <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Newspaper size={16}/> Live Economic Wire
                     </h2>
                  </div>
                  <div className="divide-y divide-slate-800 overflow-y-auto">
                     {news.length === 0 && !loading && (
                        <div className="p-8 text-center text-slate-500">No news feed available.</div>
                     )}
                     {news.map((item, idx) => (
                        <div key={idx} className="p-4 hover:bg-slate-800/50 transition-colors group">
                           <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                 <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.source.includes('Bangkok') ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'}`}>
                                       {item.source}
                                    </span>
                                    <span className="text-[10px] text-slate-500">{new Date(item.pubDate).toLocaleString()}</span>
                                 </div>
                                 <a href={item.link} target="_blank" rel="noreferrer" className="block font-bold text-white group-hover:text-cyan-400 transition-colors mb-2">
                                    {item.title}
                                 </a>
                                 <p className="text-xs text-slate-400 line-clamp-2" dangerouslySetInnerHTML={{__html: item.description.replace(/<[^>]*>?/gm, '')}} />
                              </div>
                              <a 
                                href={item.link} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-400 hover:text-white shrink-0"
                              >
                                 <ExternalLink size={16}/>
                              </a>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

         </div>
      </div>
    </div>
  );
};

const RateCard: React.FC<{currency: string, rate: number, flag: string}> = ({currency, rate, flag}) => {
   // Inverse rate logic for display: How many THB for 1 Unit of Foreign Currency?
   // API returns: 1 USD = X THB (actually API is 1 unit of foreign currency to THB if using fawazahmed0's thb.json endpoint correctly inverted)
   // Wait, API endpoint used is `currencies/thb.json`. This usually returns 1 THB = X USD.
   // So 1 USD = 1 / X THB.
   // rate passed in prop is ALREADY inverted in api.ts (1/val).
   
   return (
      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 flex justify-between items-center">
         <div className="flex items-center gap-2">
            <span className="text-lg">{flag}</span>
            <span className="font-bold text-sm text-slate-300">{currency}</span>
         </div>
         <div className="text-right">
            <div className="text-sm font-mono font-bold text-white">{rate.toFixed(2)} ฿</div>
         </div>
      </div>
   );
};

export default FinancePage;
