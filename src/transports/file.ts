import { Transport, LogLevel } from '../core/interfaces';
import { writeFileSync, appendFileSync, existsSync } from 'fs';

export class FileTransport implements Transport {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  write(level: LogLevel, message: string, metadata?: Record<string, any>): void {
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