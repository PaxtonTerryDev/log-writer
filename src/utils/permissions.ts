import { existsSync, mkdirSync, accessSync, constants } from 'fs';
import { dirname, basename, join } from 'path';
import { tmpdir, homedir } from 'os';

export enum PermissionErrorType {
  DIRECTORY_CREATE_FAILED = 'DIRECTORY_CREATE_FAILED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  FALLBACK_FAILED = 'FALLBACK_FAILED',
  INVALID_PATH = 'INVALID_PATH'
}

export interface PermissionError extends Error {
  type: PermissionErrorType;
  originalPath: string;
  fallbackPath?: string;
}

export interface DirectoryResult {
  success: boolean;
  finalPath: string;
  originalPath: string;
  usedFallback: boolean;
  error?: PermissionError;
}

export class PermissionUtils {
  private static readonly FALLBACK_DIRS = [
    () => join(tmpdir(), 'app-logs'),
    () => join(homedir(), '.logs'),
    () => join(process.cwd(), 'logs')
  ];

  /**
   * Checks if a directory has write permissions
   */
  static hasWritePermission(dir: string): boolean {
    try {
      if (!existsSync(dir)) {
        return false;
      }
      accessSync(dir, constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if a directory can be created (parent has write permissions)
   */
  static canCreateDirectory(dir: string): boolean {
    if (existsSync(dir)) {
      return this.hasWritePermission(dir);
    }

    const parent = dirname(dir);
    if (parent === dir) {
      return false; // Reached root
    }

    return this.hasWritePermission(parent) || this.canCreateDirectory(parent);
  }

  /**
   * Creates a directory with comprehensive error handling and fallback mechanisms
   */
  static ensureDirectoryWithFallback(filePath: string): DirectoryResult {
    const originalDir = dirname(filePath);
    const fileName = basename(filePath);
    
    // First attempt: try the original directory
    const originalResult = this.tryCreateDirectory(originalDir);
    if (originalResult.success) {
      return {
        success: true,
        finalPath: filePath,
        originalPath: filePath,
        usedFallback: false
      };
    }

    // Fallback attempts
    for (const fallbackDirFn of this.FALLBACK_DIRS) {
      try {
        const fallbackDir = fallbackDirFn();
        const fallbackResult = this.tryCreateDirectory(fallbackDir);
        
        if (fallbackResult.success) {
          const fallbackPath = join(fallbackDir, fileName);
          return {
            success: true,
            finalPath: fallbackPath,
            originalPath: filePath,
            usedFallback: true
          };
        }
      } catch (error) {
        // Continue to next fallback
        continue;
      }
    }

    // All attempts failed
    const error = new Error(
      `Failed to create directory for ${filePath}. Original error: ${originalResult.error?.message || 'Unknown error'}`
    ) as PermissionError;
    error.type = PermissionErrorType.FALLBACK_FAILED;
    error.originalPath = filePath;

    return {
      success: false,
      finalPath: filePath,
      originalPath: filePath,
      usedFallback: false,
      error
    };
  }

  /**
   * Attempts to create a single directory
   */
  private static tryCreateDirectory(dir: string): { success: boolean; error?: PermissionError } {
    try {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      
      // Verify we can write to the directory
      if (!this.hasWritePermission(dir)) {
        const error = new Error(`Directory ${dir} exists but is not writable`) as PermissionError;
        error.type = PermissionErrorType.INSUFFICIENT_PERMISSIONS;
        error.originalPath = dir;
        return { success: false, error };
      }
      
      return { success: true };
    } catch (err) {
      const error = new Error(`Failed to create directory ${dir}: ${err instanceof Error ? err.message : String(err)}`) as PermissionError;
      error.type = PermissionErrorType.DIRECTORY_CREATE_FAILED;
      error.originalPath = dir;
      return { success: false, error };
    }
  }

  /**
   * Validates a file path for potential issues
   */
  static validateFilePath(filePath: string): { valid: boolean; error?: PermissionError } {
    try {
      // Check for invalid characters or patterns
      if (!filePath || filePath.trim() === '') {
        const error = new Error('File path cannot be empty') as PermissionError;
        error.type = PermissionErrorType.INVALID_PATH;
        error.originalPath = filePath;
        return { valid: false, error };
      }

      // Check for relative paths that might be problematic
      if (filePath.includes('..')) {
        const error = new Error('File path contains invalid relative references') as PermissionError;
        error.type = PermissionErrorType.INVALID_PATH;
        error.originalPath = filePath;
        return { valid: false, error };
      }

      return { valid: true };
    } catch (err) {
      const error = new Error(`Invalid file path: ${err instanceof Error ? err.message : String(err)}`) as PermissionError;
      error.type = PermissionErrorType.INVALID_PATH;
      error.originalPath = filePath;
      return { valid: false, error };
    }
  }

  /**
   * Gets platform-specific recommended log directories
   */
  static getRecommendedLogDirectories(): string[] {
    const platform = process.platform;
    const dirs: string[] = [];

    switch (platform) {
      case 'win32':
        dirs.push(
          join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'logs'),
          join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), 'logs'),
          join(tmpdir(), 'logs')
        );
        break;
      case 'darwin':
        dirs.push(
          join(homedir(), 'Library', 'Logs'),
          join(homedir(), '.logs'),
          join(tmpdir(), 'logs')
        );
        break;
      default: // Linux and other Unix-like systems
        dirs.push(
          join(homedir(), '.logs'),
          join(tmpdir(), 'logs'),
          '/var/log', // Only if writable
          '/tmp/logs'
        );
        break;
    }

    return dirs;
  }
}