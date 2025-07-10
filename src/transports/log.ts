import { Transport, LogLevel, LevelFilter, ColorConfig, LogOptions } from '../core/interfaces';
import { ColorUtils } from '../utils/colors';
import {
  writeFileSync,
  appendFileSync,
  existsSync,
  statSync,
  renameSync,
  unlinkSync,
  readdirSync,
  mkdirSync,
  readFileSync,
  createWriteStream,
  createReadStream,
} from 'fs';
import { dirname, join, basename, extname } from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';

export enum RotationMethod {
  SIZE = 'size',
  DATE = 'date',
}

type DateFormat = 'YYYY-MM-DD' | 'YYYY-MM-DD-HH' | 'YYYY-MM';

export interface LogTransportOptions {
  method: RotationMethod; // Rotation Strategy
  maxSize?: string; // "10MB", "1GB", etc. (for SIZE method)
  maxFiles?: number; // Number of rotated files to keep
  dateFormat?: DateFormat; // Date format pattern (for DATE method) - "YYYY-MM-DD", "YYYY-MM-DD-HH"
  archiveDir?: string; // Directory to store archived files
  compress?: boolean; // Whether to compress archived files with gzip
  retentionDays?: number; // Number of days to keep archived files (0 = keep forever)
  archivePattern?: string; // Pattern for archived files (future)
}

export class LogTransport implements Transport {
  private filePath: string;
  public name?: string;
  public colors?: boolean | ColorConfig;
  private levelFilter?: LevelFilter;
  private options: LogTransportOptions;
  private currentDateString?: string; // Track current date for date-based rotation

  constructor(
    filePath: string,
    options: LogTransportOptions,
    name?: string,
    levelFilter?: LevelFilter,
    colors?: boolean | ColorConfig
  ) {
    this.filePath = filePath;
    this.name = name;
    this.levelFilter = levelFilter;
    this.colors = colors;

    // Set defaults based on rotation method
    const defaultArchiveDir = join(process.cwd(), 'logs', this.name || 'archive');
    
    this.options = {
      method: options.method,
      maxSize: options.maxSize || '10MB',
      maxFiles: options.maxFiles || 5,
      dateFormat: options.dateFormat || 'YYYY-MM-DD',
      archiveDir: options.archiveDir || defaultArchiveDir,
      compress: options.compress !== undefined ? options.compress : true,
      retentionDays: options.retentionDays || 30,
      archivePattern: options.archivePattern || '{name}.{index}',
    };

    // Ensure archive directory exists
    this.ensureArchiveDirectory();
    
    // Ensure the main log file directory exists
    this.ensureLogDirectory();

    // For date-based rotation, initialize current date
    if (this.options.method === RotationMethod.DATE) {
      this.currentDateString = this.formatDate(new Date());
    }
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
    const useColors = this.colors ?? false; // Default to false for log file output
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

  write(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} ${message}\n`;

    try {
      // Check if rotation is needed before writing
      if (this.needsRotation(logEntry)) {
        // Handle rotation synchronously to ensure file state is consistent
        this.rotateFileSync();
      }

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

  private needsRotation(nextEntry: string): boolean {
    if (!existsSync(this.filePath)) return false;

    switch (this.options.method) {
      case RotationMethod.SIZE:
        return this.needsSizeRotation(nextEntry);
      case RotationMethod.DATE:
        return this.needsDateRotation();
      default:
        return false;
    }
  }

  private needsSizeRotation(nextEntry: string): boolean {
    const currentSize = statSync(this.filePath).size;
    const nextEntrySize = Buffer.byteLength(nextEntry, 'utf8');
    const maxSizeBytes = this.parseSize(this.options.maxSize!);

    return currentSize + nextEntrySize > maxSizeBytes;
  }

  private needsDateRotation(): boolean {
    const currentDate = this.formatDate(new Date());
    return this.currentDateString !== currentDate;
  }

  private rotateFileSync(): void {
    if (!existsSync(this.filePath)) return;

    switch (this.options.method) {
      case RotationMethod.SIZE:
        this.rotateBySizeStrategySync();
        break;
      case RotationMethod.DATE:
        this.rotateByDateStrategySync();
        break;
    }
  }

  private async rotateFile(): Promise<void> {
    if (!existsSync(this.filePath)) return;

    switch (this.options.method) {
      case RotationMethod.SIZE:
        await this.rotateBySizeStrategy();
        break;
      case RotationMethod.DATE:
        await this.rotateByDateStrategy();
        break;
    }
  }

  private rotateBySizeStrategySync(): void {
    const dir = dirname(this.filePath);
    const fileName = basename(this.filePath);
    const ext = extname(fileName);
    const baseName = basename(fileName, ext);

    // Archive files that exceed maxFiles limit
    for (let i = this.options.maxFiles! - 1; i >= 1; i--) {
      const oldFile = join(dir, `${baseName}.${i}${ext}`);
      const newFile = join(dir, `${baseName}.${i + 1}${ext}`);

      if (existsSync(oldFile)) {
        if (i === this.options.maxFiles! - 1) {
          // Archive the oldest file instead of deleting
          const archiveFileName = `${baseName}.${i}${ext}`;
          this.archiveFileSync(oldFile, archiveFileName);
        } else {
          // Rename to next number
          try {
            renameSync(oldFile, newFile);
          } catch (error) {
            console.warn(`Failed to rename ${oldFile} to ${newFile}:`, error);
          }
        }
      }
    }

    // Move current file to .1
    const rotatedFile = join(dir, `${baseName}.1${ext}`);
    try {
      renameSync(this.filePath, rotatedFile);
    } catch (error) {
      console.warn(`Failed to rotate ${this.filePath} to ${rotatedFile}:`, error);
    }

    // Clean up old archived files based on retention policy
    this.cleanupArchivedFiles();
  }

  private async rotateBySizeStrategy(): Promise<void> {
    const dir = dirname(this.filePath);
    const fileName = basename(this.filePath);
    const ext = extname(fileName);
    const baseName = basename(fileName, ext);

    // Archive files that exceed maxFiles limit
    for (let i = this.options.maxFiles! - 1; i >= 1; i--) {
      const oldFile = join(dir, `${baseName}.${i}${ext}`);
      const newFile = join(dir, `${baseName}.${i + 1}${ext}`);

      if (existsSync(oldFile)) {
        if (i === this.options.maxFiles! - 1) {
          // Archive the oldest file instead of deleting
          const archiveFileName = `${baseName}.${i}${ext}`;
          await this.archiveFile(oldFile, archiveFileName);
        } else {
          // Rename to next number
          try {
            renameSync(oldFile, newFile);
          } catch (error) {
            console.warn(`Failed to rename ${oldFile} to ${newFile}:`, error);
          }
        }
      }
    }

    // Move current file to .1
    const rotatedFile = join(dir, `${baseName}.1${ext}`);
    try {
      renameSync(this.filePath, rotatedFile);
    } catch (error) {
      console.warn(`Failed to rotate ${this.filePath} to ${rotatedFile}:`, error);
    }

    // Clean up old archived files based on retention policy
    this.cleanupArchivedFiles();
  }

  private rotateByDateStrategySync(): void {
    const fileName = basename(this.filePath);
    const ext = extname(fileName);
    const baseName = basename(fileName, ext);

    // Archive current file with date suffix
    const dateString = this.currentDateString!;
    let archiveFileName = `${baseName}.${dateString}${ext}`;
    
    // If a file with this date already exists in archive, append a number
    let counter = 1;
    let finalArchiveFileName = archiveFileName;
    const archiveDir = this.options.archiveDir!;
    
    while (existsSync(join(archiveDir, finalArchiveFileName)) || 
           existsSync(join(archiveDir, finalArchiveFileName + '.gz'))) {
      finalArchiveFileName = `${baseName}.${dateString}.${counter}${ext}`;
      counter++;
    }
    
    this.archiveFileSync(this.filePath, finalArchiveFileName);
    
    // Update current date for future rotations
    this.currentDateString = this.formatDate(new Date());
    
    // Clean up old archived files based on retention policy
    this.cleanupArchivedFiles();
    
    // Clean up old files if maxFiles is specified (for backward compatibility)
    if (this.options.maxFiles) {
      this.cleanupOldDateFiles();
    }
  }

  private async rotateByDateStrategy(): Promise<void> {
    const fileName = basename(this.filePath);
    const ext = extname(fileName);
    const baseName = basename(fileName, ext);

    // Archive current file with date suffix
    const dateString = this.currentDateString!;
    let archiveFileName = `${baseName}.${dateString}${ext}`;
    
    // If a file with this date already exists in archive, append a number
    let counter = 1;
    let finalArchiveFileName = archiveFileName;
    const archiveDir = this.options.archiveDir!;
    
    while (existsSync(join(archiveDir, finalArchiveFileName)) || 
           existsSync(join(archiveDir, finalArchiveFileName + '.gz'))) {
      finalArchiveFileName = `${baseName}.${dateString}.${counter}${ext}`;
      counter++;
    }
    
    await this.archiveFile(this.filePath, finalArchiveFileName);
    
    // Update current date for future rotations
    this.currentDateString = this.formatDate(new Date());
    
    // Clean up old archived files based on retention policy
    this.cleanupArchivedFiles();
    
    // Clean up old files if maxFiles is specified (for backward compatibility)
    if (this.options.maxFiles) {
      this.cleanupOldDateFiles();
    }
  }

  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B?)$/i);
    if (!match) {
      throw new Error(
        `Invalid size format: ${sizeStr}. Use format like "10MB", "1GB", etc.`
      );
    }

    const [, numberStr, unit] = match;
    const number = parseFloat(numberStr);
    const upperUnit = unit.toUpperCase();

    const multipliers: Record<string, number> = {
      B: 1,
      '': 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
      TB: 1024 * 1024 * 1024 * 1024,
      K: 1024,
      M: 1024 * 1024,
      G: 1024 * 1024 * 1024,
      T: 1024 * 1024 * 1024 * 1024,
    };

    const multiplier = multipliers[upperUnit];
    if (multiplier === undefined) {
      throw new Error(`Unknown size unit: ${unit}`);
    }

    return Math.floor(number * multiplier);
  }

  private formatDate(date: Date): string {
    const format = this.options.dateFormat!;

    // Simple date formatting - can be extended for more complex patterns
    switch (format) {
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0];
      case 'YYYY-MM-DD-HH':
        return (
          date.toISOString().split('T')[0] +
          '-' +
          date.getHours().toString().padStart(2, '0')
        );
      case 'YYYY-MM':
        return date.toISOString().substring(0, 7);
      default:
        // Default to daily rotation
        return date.toISOString().split('T')[0];
    }
  }

  private cleanupOldDateFiles(): void {
    const dir = dirname(this.filePath);
    const fileName = basename(this.filePath);
    const ext = extname(fileName);
    const baseName = basename(fileName, ext);

    try {
      const files = readdirSync(dir);

      // Find files matching our pattern
      const logFiles = files
        .filter((file: string) => {
          // Match files like: basename.YYYY-MM-DD.log or basename.YYYY-MM-DD.1.log
          const pattern = new RegExp(
            `^${baseName}\\.(\\d{4}-\\d{2}-\\d{2}(?:-\\d{2})?(?:\\.\\d+)?)\\.?${ext.replace('.', '\\.')}$`
          );
          return pattern.test(file);
        })
        .map((file: string) => ({
          name: file,
          path: join(dir, file),
          stat: statSync(join(dir, file)),
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime()); // Sort by modification time, newest first

      // Delete oldest files if we exceed maxFiles
      if (logFiles.length > this.options.maxFiles!) {
        const filesToDelete = logFiles.slice(this.options.maxFiles!);
        filesToDelete.forEach((file) => {
          try {
            unlinkSync(file.path);
          } catch (error) {
            console.warn(`Failed to delete old log file ${file.name}:`, error);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to cleanup old date-based log files:', error);
    }
  }

  private ensureArchiveDirectory(): void {
    const archiveDir = this.options.archiveDir!;
    if (!existsSync(archiveDir)) {
      try {
        mkdirSync(archiveDir, { recursive: true });
      } catch (error) {
        console.warn(`Failed to create archive directory ${archiveDir}:`, error);
      }
    }
  }

  private ensureLogDirectory(): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      try {
        mkdirSync(dir, { recursive: true });
      } catch (error) {
        console.warn(`Failed to create log directory ${dir}:`, error);
      }
    }
  }

  private archiveFileSync(sourceFile: string, archiveFileName: string): void {
    const archiveDir = this.options.archiveDir!;
    const archivePath = join(archiveDir, archiveFileName);
    
    try {
      if (!existsSync(sourceFile)) {
        return; // File doesn't exist, nothing to archive
      }
      
      if (this.options.compress) {
        // For sync version, just move the file - compression can be done later
        renameSync(sourceFile, archivePath);
      } else {
        renameSync(sourceFile, archivePath);
      }
    } catch (error) {
      console.warn(`Failed to archive file ${sourceFile}:`, error);
    }
  }

  private async archiveFile(sourceFile: string, archiveFileName: string): Promise<void> {
    const archiveDir = this.options.archiveDir!;
    const archivePath = join(archiveDir, archiveFileName);
    
    try {
      if (!existsSync(sourceFile)) {
        return; // File doesn't exist, nothing to archive
      }
      
      if (this.options.compress) {
        await this.compressFile(sourceFile, archivePath + '.gz');
        unlinkSync(sourceFile);
      } else {
        renameSync(sourceFile, archivePath);
      }
    } catch (error) {
      console.warn(`Failed to archive file ${sourceFile}:`, error);
      // Fallback: just move the file without compression
      try {
        renameSync(sourceFile, archivePath);
      } catch (fallbackError) {
        console.warn(`Failed to move file to archive:`, fallbackError);
      }
    }
  }

  private async compressFile(sourceFile: string, targetFile: string): Promise<void> {
    const source = createReadStream(sourceFile);
    const destination = createWriteStream(targetFile);
    const gzip = createGzip();

    await pipeline(source, gzip, destination);
  }

  private cleanupArchivedFiles(): void {
    if (this.options.retentionDays === 0) return; // Keep forever

    const archiveDir = this.options.archiveDir!;
    const retentionMs = this.options.retentionDays! * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - retentionMs);

    try {
      if (!existsSync(archiveDir)) return;

      const files = readdirSync(archiveDir);
      
      files.forEach(file => {
        const filePath = join(archiveDir, file);
        const stats = statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          try {
            unlinkSync(filePath);
          } catch (error) {
            console.warn(`Failed to delete expired archive file ${file}:`, error);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to cleanup archived files:', error);
    }
  }
}
