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
  level?: LogLevel;              // Override minimum level check
  colors?: boolean;              // Override color usage
  transports?: (Transport | string)[];  // Override transports (instances or names)
  format?: string;               // Override message format
}

export interface Transport {
  write(level: LogLevel, message: string, metadata?: Record<string, any>): void;
  shouldLog?(level: LogLevel): boolean;  // Optional level filtering
  name?: string;                         // Optional transport name
}

export interface LoggerConfig {
  level: LogLevel;
  timestamp: boolean;
  colors: boolean | ColorConfig;
  includeLevel: boolean;                 // Whether to include [LEVEL] in output
  includeName: boolean;                  // Whether to include [ClassName] in output
  transports: Record<string, Transport>; // Named transports
  defaultTransports: string[];           // Default transport names to use
}

export interface ColorConfig {
  ERROR?: string;
  WARN?: string;
  INFO?: string;
  DEBUG?: string;
  TRACE?: string;
}

export interface FileConfig {
  level?: string;
  timestamp?: boolean;
  colors?: boolean | ColorConfig;
  includeLevel?: boolean;                // Whether to include [LEVEL] in output
  includeName?: boolean;                 // Whether to include [ClassName] in output
  transports?: Record<string, TransportConfig> | TransportConfig[]; // Named or array
  defaultTransports?: string[];
}

export interface TransportConfig {
  type: 'console' | 'file' | 'json';
  path?: string;
  levels?: LevelFilter;
  options?: Record<string, any>;
}

export interface LevelFilter {
  include?: LogLevel[];
  exclude?: LogLevel[];
}

