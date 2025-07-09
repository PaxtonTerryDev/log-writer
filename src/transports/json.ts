import { Transport, LogLevel, LevelFilter, ColorConfig, LogOptions } from '../core/interfaces';
import { ColorUtils } from '../utils/colors';
import { writeFileSync, appendFileSync, existsSync } from 'fs';

export class JSONTransport implements Transport {
  private filePath: string;
  public name?: string;
  public colors?: boolean | ColorConfig;
  private levelFilter?: LevelFilter;

  constructor(filePath: string, name?: string, levelFilter?: LevelFilter, colors?: boolean | ColorConfig) {
    this.filePath = filePath;
    this.name = name;
    this.levelFilter = levelFilter;
    this.colors = colors;
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

  formatMessage(level: LogLevel, rawMessage: string, context: string, timestamp: string, options?: LogOptions): string {
    const useColors = this.colors ?? false; // Default to false for JSON output
    const includeLevel = options?.includeLevel ?? true;
    const includeName = options?.includeName ?? true;
    
    // Handle custom format override
    if (options?.format) {
      return this.applyCustomFormat(options.format, level, context, rawMessage, timestamp);
    }
    
    const levelStr = useColors ? ColorUtils.colorizeLevel(level) : level;
    const contextStr = useColors ? ColorUtils.colorizeContext(context) : context;
    const messageStr = useColors ? ColorUtils.colorizeMessage(level, rawMessage) : rawMessage;
    
    const levelPart = includeLevel ? `[${levelStr}] ` : '';
    const namePart = includeName ? `[${contextStr}] ` : '';
    return `${timestamp}${levelPart}${namePart}${messageStr}`;
  }

  private applyCustomFormat(format: string, level: LogLevel, context: string, message: string, timestamp: string): string {
    return format
      .replace('{timestamp}', timestamp.trim())
      .replace('{level}', level)
      .replace('{context}', context)
      .replace('{message}', message);
  }

  write(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;
    
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