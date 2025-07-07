import { Transport, LogLevel, LevelFilter } from '../core/interfaces';
import { writeFileSync, appendFileSync, existsSync } from 'fs';

export class FileTransport implements Transport {
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
    
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} ${message}\n`;
    
    try {
      if (existsSync(this.filePath)) {
        appendFileSync(this.filePath, logEntry);
      } else {
        writeFileSync(this.filePath, logEntry);
      }
    } catch (error) {
      // Fallback to console if file write fails
      console.error('Failed to write to log file:', error);
      console.log(message);
    }
  }
}