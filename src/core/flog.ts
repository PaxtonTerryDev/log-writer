import { LogLevel, LogOptions } from './interfaces';
import { ColorUtils } from '../utils/colors';

export class Flog {
  private className: string;
  private instanceId?: string;

  constructor(className: string, instanceId?: string) {
    this.className = className;
    this.instanceId = instanceId;
  }

  private formatMessage(level: LogLevel, message: string, options?: LogOptions): string {
    const context = this.buildContext();
    const timestamp = options?.timestamp ? this.formatTimestamp() : '';
    
    const levelStr = ColorUtils.colorizeLevel(level);
    const contextStr = ColorUtils.colorizeContext(context);
    const messageStr = ColorUtils.colorizeMessage(level, message);
    
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
    const formattedMessage = this.formatMessage(level, message, options);
    console.log(formattedMessage);
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