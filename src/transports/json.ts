import { Transport, LogLevel, LevelFilter } from '../core/interfaces';
import { writeFileSync, appendFileSync, existsSync } from 'fs';

export class JSONTransport implements Transport {
  private filePath: string;
  public name?: string;
  private levelFilter?: LevelFilter;

  constructor(filePath: string, name?: string, levelFilter?: LevelFilter) {
    this.filePath = filePath;
    this.name = name;
    this.levelFilter = levelFilter;
  }

  shouldLog(level: LogLevel): boolean {
    if (!this.levelFilter) return true;

    // If include is specified, level must be in include list
    if (this.levelFilter.include) {
      return this.levelFilter.include.includes(level);
    }

    // If exclude is specified, level must NOT be in exclude list
    if (this.levelFilter.exclude) {
      return !this.levelFilter.exclude.includes(level);
    }

    return true;
  }

  write(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;
    
    const logEntry: any = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    
    if (metadata !== undefined) {
      logEntry.metadata = metadata;
    }
    
    const jsonLine = JSON.stringify(logEntry) + '\n';
    
    try {
      if (existsSync(this.filePath)) {
        appendFileSync(this.filePath, jsonLine);
      } else {
        writeFileSync(this.filePath, jsonLine);
      }
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write to JSON log file:', error);
      console.log(message);
    }
  }
}