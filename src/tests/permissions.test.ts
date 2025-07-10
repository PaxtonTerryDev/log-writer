import { PermissionUtils, PermissionErrorType } from '../utils/permissions';
import { FileTransport } from '../transports/file';
import { LogTransport, RotationMethod } from '../transports/log';
import { LogLevel } from '../core/interfaces';
import { existsSync, rmSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';

// Mock console to capture warnings/errors
const mockConsoleWarn = jest.fn();
const mockConsoleError = jest.fn();
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  jest.clearAllMocks();
  console.warn = mockConsoleWarn;
  console.error = mockConsoleError;
});

afterAll(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

describe('PermissionUtils', () => {
  const testDir = join(tmpdir(), 'permission-tests');
  const testFile = join(testDir, 'test.log');

  beforeEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('validateFilePath', () => {
    it('should validate normal file paths', () => {
      const result = PermissionUtils.validateFilePath('/path/to/file.log');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty file paths', () => {
      const result = PermissionUtils.validateFilePath('');
      expect(result.valid).toBe(false);
      expect(result.error?.type).toBe(PermissionErrorType.INVALID_PATH);
    });

    it('should reject paths with relative references', () => {
      const result = PermissionUtils.validateFilePath('/path/../../../etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error?.type).toBe(PermissionErrorType.INVALID_PATH);
    });
  });

  describe('ensureDirectoryWithFallback', () => {
    it('should create directory successfully', () => {
      const result = PermissionUtils.ensureDirectoryWithFallback(testFile);
      expect(result.success).toBe(true);
      expect(result.usedFallback).toBe(false);
      expect(result.finalPath).toBe(testFile);
      expect(existsSync(testDir)).toBe(true);
    });

    it('should use fallback directory when original fails', () => {
      // Try to create in a non-existent root directory (should fail)
      const invalidPath = '/nonexistent/deeply/nested/path/file.log';
      const result = PermissionUtils.ensureDirectoryWithFallback(invalidPath);
      
      // Should succeed with fallback
      expect(result.success).toBe(true);
      expect(result.usedFallback).toBe(true);
      expect(result.finalPath).not.toBe(invalidPath);
      expect(existsSync(dirname(result.finalPath))).toBe(true);
    });

    it('should handle absolute failure gracefully', () => {
      // Mock mkdirSync to always fail
      const originalMkdirSync = require('fs').mkdirSync;
      require('fs').mkdirSync = jest.fn(() => {
        throw new Error('Mock permission denied');
      });

      const result = PermissionUtils.ensureDirectoryWithFallback('/invalid/path/file.log');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBe(PermissionErrorType.FALLBACK_FAILED);

      // Restore original function
      require('fs').mkdirSync = originalMkdirSync;
    });
  });

  describe('hasWritePermission', () => {
    it('should return true for writable directories', () => {
      const result = PermissionUtils.ensureDirectoryWithFallback(testFile);
      expect(result.success).toBe(true);
      expect(PermissionUtils.hasWritePermission(testDir)).toBe(true);
    });

    it('should return false for non-existent directories', () => {
      expect(PermissionUtils.hasWritePermission('/nonexistent/path')).toBe(false);
    });
  });

  describe('getRecommendedLogDirectories', () => {
    it('should return platform-appropriate directories', () => {
      const dirs = PermissionUtils.getRecommendedLogDirectories();
      expect(dirs.length).toBeGreaterThan(0);
      expect(dirs.every(dir => typeof dir === 'string')).toBe(true);
    });
  });
});

describe('FileTransport Permission Handling', () => {
  const testDir = join(tmpdir(), 'file-transport-tests');
  const testFile = join(testDir, 'test.log');

  beforeEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create transport with valid directory', () => {
    expect(() => {
      const transport = new FileTransport(testFile);
      transport.write(LogLevel.INFO, 'Test message');
    }).not.toThrow();
    
    expect(existsSync(testFile)).toBe(true);
  });

  it('should use fallback directory when original fails', () => {
    const invalidPath = '/nonexistent/deeply/nested/path/file.log';
    
    expect(() => {
      const transport = new FileTransport(invalidPath);
      transport.write(LogLevel.INFO, 'Test message');
    }).not.toThrow();
    
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Using fallback directory')
    );
  });

  it('should throw on invalid file path', () => {
    expect(() => {
      new FileTransport('');
    }).toThrow();
    
    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('Invalid file path')
    );
  });
});

describe('LogTransport Permission Handling', () => {
  const testDir = join(tmpdir(), 'log-transport-tests');
  const testFile = join(testDir, 'test.log');

  beforeEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create transport with valid directory', () => {
    expect(() => {
      const transport = new LogTransport(testFile, {
        method: RotationMethod.SIZE,
        maxSize: '1MB'
      });
      transport.write(LogLevel.INFO, 'Test message');
    }).not.toThrow();
    
    expect(existsSync(testFile)).toBe(true);
  });

  it('should use fallback directory when original fails', () => {
    const invalidPath = '/nonexistent/deeply/nested/path/file.log';
    
    expect(() => {
      const transport = new LogTransport(invalidPath, {
        method: RotationMethod.SIZE,
        maxSize: '1MB'
      });
      transport.write(LogLevel.INFO, 'Test message');
    }).not.toThrow();
    
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Using fallback directory')
    );
  });

  it('should handle archive directory fallback', () => {
    const validPath = join(testDir, 'test.log');
    const invalidArchivePath = '/nonexistent/archive';
    
    expect(() => {
      const transport = new LogTransport(validPath, {
        method: RotationMethod.SIZE,
        maxSize: '1MB',
        archiveDir: invalidArchivePath
      });
      transport.write(LogLevel.INFO, 'Test message');
    }).not.toThrow();
    
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to create archive directory')
    );
  });
});