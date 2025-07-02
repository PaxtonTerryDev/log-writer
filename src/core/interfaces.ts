export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  TRACE = 'TRACE'
}

export interface LogOptions {
  timestamp?: boolean;
  metadata?: Record<string, any>;
}

export interface Transport {
  write(level: LogLevel, message: string, metadata?: Record<string, any>): void;
}

export interface LoggerConfig {
  level: LogLevel;
  timestamp: boolean;
  colors: boolean;
  transports: Transport[];
}

// Forward declaration for Loggable interface
export interface Loggable {
  log: any; // Will be Flog type when imported
}