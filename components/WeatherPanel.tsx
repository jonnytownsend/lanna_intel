import React, { useState, useEffect } from 'react';
import { WeatherData, ForecastData } from '../types';
import { fetchForecast, fetchAirQuality } from '../services/api';
import { REGION_CENTER } from '../services/config';
import { ChevronLeft, ChevronRight, Cloud, Droplets, Wind, Activity } from 'lucide-react';

interface WeatherPanelProps {
  current: WeatherData | null;
}

const WeatherPanel: React.FC<WeatherPanelProps> = ({ current }) => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [aqi, setAqi] = useState<number | null>(null);
  const [dayOffset, setDayOffset] = useState(0);

  useEffect(() => {
    fetchForecast(REGION_CENTER.lat, REGION_CENTER.lng).then(setForecast);
    fetchAirQuality(REGION_CENTER.lat, REGION_CENTER.lng).then(setAqi);
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

  return (
    <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700 rounded-xl p-3 text-white shadow-xl min-w-[240px]">
      <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lanna Weather</span>
         <div className="flex gap-1">
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

      {aqi !== null && (
          <div className="mt-2 text-xs flex justify-between items-center bg-slate-800/50 p-2 rounded-lg">
              <span className="flex items-center gap-1 text-slate-400"><Activity size={10}/> AQI (PM2.5)</span>
              <span className={`font-bold ${getAqiColor(aqi)}`}>{aqi}</span>
          </div>
      )}
    </div>
  );
};

export default WeatherPanel;
