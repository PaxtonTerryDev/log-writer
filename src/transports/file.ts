import { Transport, LogLevel, LevelFilter, ColorConfig, LogOptions } from '../core/interfaces';
import { ColorUtils } from '../utils/colors';
import { writeFileSync, appendFileSync, existsSync } from 'fs';
import { PermissionUtils, PermissionError } from '../utils/permissions';

export class FileTransport implements Transport {
  private filePath: string;
  public name?: string;
  public colors?: boolean | ColorConfig;
  private levelFilter?: LevelFilter;

  constructor(filePath: string, name?: string, levelFilter?: LevelFilter, colors?: boolean | ColorConfig) {
    this.filePath = filePath;
    this.name = name;
    this.levelFilter = levelFilter;
    this.colors = colors;
    this.initializeFileSystem();
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
    const useColors = this.colors ?? false; // Default to false for file output
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

  private initializeFileSystem(): void {
    // Validate the file path
    const validation = PermissionUtils.validateFilePath(this.filePath);
    if (!validation.valid) {
      console.error(`FileTransport: Invalid file path: ${validation.error?.message}`);
      throw validation.error;
    }

    // Ensure directory exists with fallback mechanisms
    const result = PermissionUtils.ensureDirectoryWithFallback(this.filePath);
    
    if (!result.success) {
      console.error(`FileTransport: Failed to create directory: ${result.error?.message}`);
      throw result.error;
    }

    // Update file path if fallback was used
    if (result.usedFallback) {
      console.warn(`FileTransport: Using fallback directory. Original: ${result.originalPath}, Fallback: ${result.finalPath}`);
      this.filePath = result.finalPath;
    }
  }

  write(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;
    
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