import { Transport, LogLevel } from '../core/interfaces';
import { writeFileSync, appendFileSync, existsSync } from 'fs';

export class JSONTransport implements Transport {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  write(level: LogLevel, message: string, metadata?: Record<string, any>): void {
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