
import { dbService, STORES } from './db';
import { SystemAlert } from '../types';

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

class LoggerService {
  
  private async persist(level: LogLevel, message: string, source: string = 'System', meta?: any) {
    const entry: SystemAlert = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level: level === 'debug' ? 'info' : level, // Normalize for UI
      title: `${level.toUpperCase()} Event`,
      message,
      source,
      read: false,
      meta
    };

    // Console output for dev
    const styles = {
      info: 'color: #3b82f6',
      warn: 'color: #eab308',
      error: 'color: #ef4444',
      success: 'color: #22c55e',
      debug: 'color: #a855f7'
    };
    console.log(`%c[${level.toUpperCase()}] ${message}`, styles[level], meta || '');

    // Persist to "Mongo" (IndexedDB)
    try {
        await dbService.add(STORES.ALERTS, entry);
    } catch (e) {
        console.error("Failed to persist log", e);
    }
  }

  info(message: string, source?: string, meta?: any) { this.persist('info', message, source, meta); }
  warn(message: string, source?: string, meta?: any) { this.persist('warn', message, source, meta); }
  error(message: string, source?: string, meta?: any) { this.persist('error', message, source, meta); }
  success(message: string, source?: string, meta?: any) { this.persist('success', message, source, meta); }
  debug(message: string, source?: string, meta?: any) { this.persist('debug', message, source, meta); }
}

export const logger = new LoggerService();
