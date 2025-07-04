import { Transport, LogLevel } from '../core/interfaces';

export class ConsoleTransport implements Transport {
  write(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    console.log(message);
  }
}