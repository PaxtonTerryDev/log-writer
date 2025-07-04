import { LogLevel, LogOptions } from './interfaces';
import { ColorUtils } from '../utils/colors';
import { LoggerConfigManager } from './config';

export class Flog {
  private className: string;
  private instanceId?: string;

  constructor(className: string, instanceId?: string) {
    this.className = className;
    this.instanceId = instanceId;
  }

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const context = this.buildContext();
    const config = LoggerConfigManager.getInstance().getConfig();
    const timestamp = (options?.timestamp || config.timestamp) ? this.formatTimestamp() : '';
    
    const levelStr = config.colors ? ColorUtils.colorizeLevel(level) : level;
    const contextStr = config.colors ? ColorUtils.colorizeContext(context) : context;
    const messageStr = config.colors ? ColorUtils.colorizeMessage(level, message) : message;
    
    return `${timestamp}[${levelStr}] [${contextStr}] ${messageStr}`;
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
    const configManager = LoggerConfigManager.getInstance();
    
    if (!configManager.shouldLog(level)) {
      return;
    }
    
    const formattedMessage = this.formatMessage(level, message, options);
    const config = configManager.getConfig();
    
    config.transports.forEach(transport => {
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
}