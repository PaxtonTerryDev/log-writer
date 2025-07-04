import { LoggerConfig, LogLevel, Transport } from './interfaces';
import { ConsoleTransport } from '../transports/console';

export class LoggerConfigManager {
  private static instance: LoggerConfigManager;
  private config: LoggerConfig;

  private constructor() {
    this.config = {
      level: LogLevel.TRACE,
      timestamp: false,
      colors: true,
      transports: [new ConsoleTransport()]
    };
  }

  static getInstance(): LoggerConfigManager {
    if (!LoggerConfigManager.instance) {
      LoggerConfigManager.instance = new LoggerConfigManager();
    }
    return LoggerConfigManager.instance;
  }

  getConfig(): LoggerConfig {
    return this.config;
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setTimestamp(enabled: boolean): void {
    this.config.timestamp = enabled;
  }

  setColors(enabled: boolean): void {
    this.config.colors = enabled;
  }

  setTransports(transports: Transport[]): void {
    this.config.transports = transports;
  }

  addTransport(transport: Transport): void {
    this.config.transports.push(transport);
  }

  shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.TRACE];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex <= currentLevelIndex;
  }
}