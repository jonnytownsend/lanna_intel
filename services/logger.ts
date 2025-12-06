
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any;
}

class LoggerService {
  private logs: LogEntry[] = [];

  private log(level: LogLevel, message: string, meta?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta
    };
    this.logs.push(entry);
    
    // Console Output with styling
    const styles = {
      info: 'color: #3b82f6',
      warn: 'color: #eab308',
      error: 'color: #ef4444',
      debug: 'color: #a855f7'
    };
    
    console.log(`%c[${level.toUpperCase()}] ${message}`, styles[level], meta || '');
    
    // In a real app, we might persist this to IndexedDB or send to a server here
  }

  info(message: string, meta?: any) { this.log('info', message, meta); }
  warn(message: string, meta?: any) { this.log('warn', message, meta); }
  error(message: string, meta?: any) { this.log('error', message, meta); }
  debug(message: string, meta?: any) { this.log('debug', message, meta); }

  getLogs() {
    return this.logs;
  }
}

export const logger = new LoggerService();
