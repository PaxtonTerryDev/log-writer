import { Transport, LogLevel, LevelFilter } from '../core/interfaces';

export class ConsoleTransport implements Transport {
  public name?: string;
  private levelFilter?: LevelFilter;

  constructor(name?: string, levelFilter?: LevelFilter) {
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
    console.log(message);
  }
}