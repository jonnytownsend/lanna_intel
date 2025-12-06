
import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, AlertOctagon, Info, Trash2, Filter, Search } from 'lucide-react';
import { dbService, STORES } from '../services/db';
import { SystemAlert } from '../types';
import { logger } from '../services/logger';

const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [loading, setLoading] = useState(true);

  const loadAlerts = async () => {
    setLoading(true);
    const data = await dbService.getAll<SystemAlert>(STORES.ALERTS);
    // Sort by newest
    setAlerts(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000); // Auto-refresh
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async () => {
      await dbService.markAllAlertsRead();
      loadAlerts();
      logger.info('User marked all alerts as read', 'UserAction');
  };

  const handleClearAll = async () => {
      // In a real Mongo app this would be a deleteMany. Here we loop.
      const data = await dbService.getAll<SystemAlert>(STORES.ALERTS);
      for(const item of data) {
          await dbService.delete(STORES.ALERTS, item.id);
      }
      loadAlerts();
  };

  const filteredAlerts = alerts.filter(a => {
      if (filter === 'unread') return !a.read;
      if (filter === 'critical') return a.level === 'error' || a.level === 'warn';
      return true;
  });

  const getIcon = (level: string) => {
      switch(level) {
          case 'error': return <AlertOctagon className="text-red-500" size={24}/>;
          case 'warn': return <AlertTriangle className="text-yellow-500" size={24}/>;
          case 'success': return <CheckCircle className="text-green-500" size={24}/>;
          default: return <Info className="text-blue-500" size={24}/>;
      }
  };

  const getBorderColor = (level: string) => {
    switch(level) {
        case 'error': return 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
        case 'warn': return 'border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]';
        case 'success': return 'border-green-500';
        default: return 'border-slate-700';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 p-6 overflow-hidden">
        <div className="flex justify-between items-end mb-6">
            <div>
                <h1 className="text-3xl font-black text-white flex items-center gap-2">
                    <Bell className="text-purple-500" size={32}/> 
                    SYSTEM <span className="text-slate-500">ALERTS</span>
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Centralized Event Log • Flight Anomalies • Security Notifications
                </p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handleMarkRead}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                >
                    <CheckCircle size={14}/> MARK ALL READ
                </button>
                <button 
                    onClick={handleClearAll}
                    className="flex items-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-red-900/50"
                >
                    <Trash2 size={14}/> CLEAR LOG
                </button>
            </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2 mb-6 flex items-center gap-4">
            <Filter size={16} className="text-slate-500 ml-2"/>
            <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-xs font-bold ${filter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
            >
                ALL EVENTS
            </button>
            <button 
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded text-xs font-bold ${filter === 'unread' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
            >
                UNREAD ONLY
            </button>
            <button 
                onClick={() => setFilter('critical')}
                className={`px-3 py-1 rounded text-xs font-bold ${filter === 'critical' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
            >
                CRITICAL / WARNINGS
            </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredAlerts.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                    <CheckCircle size={48} className="mb-4 opacity-20"/>
                    <p>All systems nominal. No alerts found.</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                {filteredAlerts.map(alert => (
                    <div 
                        key={alert.id} 
                        className={`bg-slate-900 rounded-xl p-4 border transition-all ${getBorderColor(alert.level)} ${!alert.read ? 'bg-slate-800' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                {getIcon(alert.level)}
                                <div>
                                    <div className={`font-bold text-sm ${!alert.read ? 'text-white' : 'text-slate-300'}`}>{alert.title}</div>
                                    <div className="text-[10px] text-slate-500 font-mono">{alert.source}</div>
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">
                                {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                            {alert.message}
                        </p>
                        <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded ${alert.level === 'error' ? 'bg-red-900/30 text-red-400' : 'bg-slate-800 text-slate-500'}`}>
                                {alert.level.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-600 font-mono">{new Date(alert.timestamp).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default AlertsPage;
