
import React, { useState, useEffect } from 'react';
import { WeatherData, ForecastData, UVData } from '../types';
import { fetchForecast, fetchAirQuality, fetchUVIndex } from '../services/api';
import { REGION_CENTER } from '../services/config';
import { ChevronLeft, ChevronRight, Cloud, Droplets, Wind, Activity, Maximize2, Minimize2, Sun } from 'lucide-react';

interface WeatherPanelProps {
  current: WeatherData | null;
}

const WeatherPanel: React.FC<WeatherPanelProps> = ({ current }) => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [aqi, setAqi] = useState<number | null>(null);
  const [uv, setUv] = useState<UVData | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchForecast(REGION_CENTER.lat, REGION_CENTER.lng).then(setForecast);
    fetchAirQuality(REGION_CENTER.lat, REGION_CENTER.lng).then(setAqi);
    fetchUVIndex(REGION_CENTER.lat, REGION_CENTER.lng).then(setUv);
  }, []);

  if (!current || !forecast) return <div className="text-xs text-slate-500">Loading forecast...</div>;

  // Group forecast by day
  const dailyData = forecast.list.reduce((acc, item) => {
    const date = new Date(item.dt * 1000).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const dates = Object.keys(dailyData);
  const selectedDate = dates[dayOffset];
  const selectedData = dailyData[selectedDate] || [];

  const avgTemp = selectedData.reduce((sum, item) => sum + item.main.temp, 0) / selectedData.length;
  
  // AQI Color Logic
  const getAqiColor = (val: number) => {
      if(val <= 50) return 'text-green-400';
      if(val <= 100) return 'text-yellow-400';
      if(val <= 150) return 'text-orange-400';
      return 'text-red-500';
  };

  const getUvColor = (val: number) => {
      if(val <= 2) return 'text-green-400';
      if(val <= 5) return 'text-yellow-400';
      if(val <= 7) return 'text-orange-400';
      if(val <= 10) return 'text-red-500';
      return 'text-purple-500'; // Extreme
  };

  const getUvLabel = (val: number) => {
      if(val <= 2) return 'Low';
      if(val <= 5) return 'Mod';
      if(val <= 7) return 'High';
      if(val <= 10) return 'Very High';
      return 'Extreme';
  };

  if (isExpanded) {
      return (
          <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-8 pointer-events-auto">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-5xl shadow-2xl relative">
                  <button onClick={() => setIsExpanded(false)} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 text-white">
                      <Minimize2 size={24}/>
                  </button>
                  
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                      <Cloud className="text-cyan-500"/> 5-Day Meteorological Forecast
                  </h2>
                  
                  <div className="grid grid-cols-5 gap-4">
                      {dates.slice(0,5).map(date => {
                          const dayItems = dailyData[date];
                          const dayTemp = dayItems.reduce((s, i) => s + i.main.temp, 0) / dayItems.length;
                          return (
                              <div key={date} className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
                                  <div className="text-slate-400 font-bold mb-2">{new Date(date).toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'})}</div>
                                  <img 
                                    src={`http://openweathermap.org/img/wn/${dayItems[0].weather[0].icon}@2x.png`} 
                                    alt="icon" className="w-16 h-16 mx-auto"
                                  />
                                  <div className="text-2xl font-light text-white my-2">{Math.round(dayTemp)}°</div>
                                  <div className="text-xs text-slate-500 capitalize">{dayItems[0].weather[0].description}</div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl p-3 text-white shadow-xl min-w-[240px] transition-all">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lanna Weather</span>
         <div className="flex gap-1">
            <button onClick={() => setIsExpanded(true)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">
                <Maximize2 size={12}/>
            </button>
            <div className="w-px h-4 bg-slate-700 mx-1"></div>
            <button 
              disabled={dayOffset === 0}
              onClick={() => setDayOffset(d => Math.max(0, d - 1))}
              className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
            >
              <ChevronLeft size={12}/>
            </button>
            <button 
              disabled={dayOffset >= dates.length - 1}
              onClick={() => setDayOffset(d => Math.min(dates.length - 1, d + 1))}
              className="p-1 hover:bg-slate-700 rounded disabled:opacity-30"
            >
              <ChevronRight size={12}/>
            </button>
         </div>
      </div>
      
      <div className="flex items-center gap-4 mb-3">
        <div className="flex flex-col items-center">
           <img 
             src={`http://openweathermap.org/img/wn/${selectedData[0]?.weather[0]?.icon || current.icon}@2x.png`} 
             alt="weather" 
             className="w-12 h-12 -my-2"
           />
           <span className="text-xs text-slate-300 capitalize">{selectedData[0]?.weather[0]?.description || current.description}</span>
        </div>
        <div>
          <div className="text-xs font-bold text-cyan-400 mb-0.5">
             {new Date(selectedDate || Date.now()).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="text-3xl font-light">{Math.round(avgTemp || current.temp)}°</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-800/50 p-2 rounded-lg">
         <div className="flex items-center gap-1"><Droplets size={10}/> {current.humidity}% Humidity</div>
         <div className="flex items-center gap-1"><Wind size={10}/> {current.windSpeed}m/s Wind</div>
      </div>

      <div className="mt-2 text-xs flex justify-between items-center bg-slate-800/50 p-2 rounded-lg gap-2">
          {aqi !== null && (
              <div className="flex-1">
                <span className="flex items-center gap-1 text-slate-400"><Activity size={10}/> AQI</span>
                <span className={`font-bold ${getAqiColor(aqi)}`}>{aqi}</span>
              </div>
          )}
          {uv && (
              <div className="flex-1 border-l border-slate-700 pl-2">
                <span className="flex items-center gap-1 text-slate-400"><Sun size={10}/> UV</span>
                <span className={`font-bold ${getUvColor(uv.uv)}`}>{uv.uv.toFixed(1)} ({getUvLabel(uv.uv)})</span>
              </div>
          )}
      </div>
    </div>
  );
};

export default WeatherPanel;
