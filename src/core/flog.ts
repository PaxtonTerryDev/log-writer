import { LogLevel, LogOptions, LoggerConfig, Transport } from './interfaces';
import { ColorUtils } from '../utils/colors';
import { ConfigLoader } from './config-loader';

export class Flog {
  private className: string;
  private instanceId?: string;
  private config: LoggerConfig;
  private defaultTransportNames: string[];

  constructor(className: string, instanceId?: string, configPath?: string, defaultTransportNames?: string[]) {
    this.className = className;
    this.instanceId = instanceId;
    this.config = ConfigLoader.loadConfig(configPath);
    this.defaultTransportNames = defaultTransportNames || this.config.defaultTransports;
  }

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const context = this.buildContext();
    const useTimestamp = options?.timestamp ?? this.config.timestamp;
    const useColors = options?.colors ?? this.config.colors;
    const includeLevel = this.config.includeLevel;
    const includeName = this.config.includeName;
    const timestamp = useTimestamp ? this.formatTimestamp() : '';
    
    // Handle custom format override
    if (options?.format) {
      return this.applyCustomFormat(options.format, level, context, message, timestamp);
    }
    
    const levelStr = useColors ? ColorUtils.colorizeLevel(level) : level;
    const contextStr = useColors ? ColorUtils.colorizeContext(context) : context;
    const messageStr = useColors ? ColorUtils.colorizeMessage(level, message) : message;
    
    const levelPart = includeLevel ? `[${levelStr}] ` : '';
    const namePart = includeName ? `[${contextStr}] ` : '';
    return `${timestamp}${levelPart}${namePart}${messageStr}`;
  }

  private buildContext(): string {
    return this.instanceId 
      ? `${this.className}:${this.instanceId}`
      : this.className;
  }

  private formatTimestamp(): string {
    return `${new Date().toISOString()} `;
  }

  private log(level: LogLevel, message: string, options?: LogOptions): void {
    // Check if this level should be logged (with optional override)
    const effectiveLevel = options?.level ?? this.config.level;
    if (!this.shouldLog(level, effectiveLevel)) {
      return;
    }
    
    const formattedMessage = this.formatMessage(level, message, options);
    const transports = this.resolveTransports(options?.transports);
    
    transports.forEach(transport => {
      transport.write(level, formattedMessage, options?.metadata);
    });
  }

  error(message: string, options?: LogOptions): void {
    this.log(LogLevel.ERROR, message, options);
  }

  warn(message: string, options?: LogOptions): void {
    this.log(LogLevel.WARN, message, options);
  }

  info(message: string, options?: LogOptions): void {
    this.log(LogLevel.INFO, message, options);
  }

  debug(message: string, options?: LogOptions): void {
    this.log(LogLevel.DEBUG, message, options);
  }

  trace(message: string, options?: LogOptions): void {
    this.log(LogLevel.TRACE, message, options);
  }

  /**
   * Checks if a log level should be output based on configuration
   */
  private shouldLog(messageLevel: LogLevel, configLevel: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.TRACE];
    const configLevelIndex = levels.indexOf(configLevel);
    const messageLevelIndex = levels.indexOf(messageLevel);
    
    return messageLevelIndex <= configLevelIndex;
  }

  /**
   * Applies custom format string to log message
   */
  private applyCustomFormat(format: string, level: LogLevel, context: string, message: string, timestamp: string): string {
    return format
      .replace('{timestamp}', timestamp.trim())
      .replace('{level}', level)
      .replace('{context}', context)
      .replace('{message}', message);
  }

  /**
   * Gets the current configuration (for testing/debugging)
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Updates the configuration for this logger instance
   */
  setConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Sets default transport names for this logger instance
   */
  setDefaultTransports(transportNames: string[]): void {
    this.defaultTransportNames = transportNames;
  }

  /**
   * Gets the names of currently configured transports
   */
  getTransportNames(): string[] {
    return Object.keys(this.config.transports);
  }

  /**
   * Resolves transport names or instances to transport instances
   */
  private resolveTransports(transports?: (Transport | string)[]): Transport[] {
    // If no transports specified, use instance defaults
    if (!transports) {
      return ConfigLoader.resolveTransports(this.config, this.defaultTransportNames);
    }

    const resolvedTransports: Transport[] = [];
    
    for (const transport of transports) {
      if (typeof transport === 'string') {
        // Resolve string name to transport instance
        const resolvedTransport = this.config.transports[transport];
        if (!resolvedTransport) {
          throw new Error(`Transport '${transport}' not found in configuration`);
        }
        resolvedTransports.push(resolvedTransport);
      } else {
        // Already a Transport instance
        resolvedTransports.push(transport);
      }
    }

    return resolvedTransports;
  }
}