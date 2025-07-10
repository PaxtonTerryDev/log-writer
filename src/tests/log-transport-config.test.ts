import { ConfigLoader } from '../core/config-loader';
import { LoggerConfig, TransportConfig } from '../core/interfaces';
import { LogTransport, RotationMethod } from '../transports/log';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('LogTransport Configuration Integration', () => {
  const testDir = join(__dirname, 'test-config');
  const testConfigFile = join(testDir, 'test-config.json');

  beforeEach(() => {
    // Clean up test directories
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directories
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('ConfigLoader LogTransport Creation', () => {
    it('should create LogTransport with size-based rotation from config', () => {
      const configContent = {
        level: 'INFO',
        timestamp: false,
        colors: true,
        transports: {
          'test-log': {
            type: 'log',
            path: './logs/test.log',
            method: 'size',
            maxSize: '10MB',
            maxFiles: 5,
            archive: {
              enabled: true,
              directory: './logs/archive',
              compress: true,
              retentionDays: 30
            }
          }
        },
        defaultTransports: ['test-log']
      };

      writeFileSync(testConfigFile, JSON.stringify(configContent, null, 2));
      const loadedConfig = ConfigLoader.loadConfig(testConfigFile);
      
      // Load configuration through ConfigLoader
      const resolvedTransports = ConfigLoader.resolveTransports(loadedConfig, ['test-log']);
      
      expect(resolvedTransports).toHaveLength(1);
      expect(resolvedTransports[0]).toBeInstanceOf(LogTransport);
      expect(resolvedTransports[0].name).toBe('test-log');
    });

    it('should create LogTransport with date-based rotation from config', () => {
      const configContent = {
        level: 'INFO',
        timestamp: false,
        colors: true,
        transports: {
          'daily-log': {
            type: 'log',
            path: './logs/daily.log',
            method: 'date',
            dateFormat: 'YYYY-MM-DD',
            maxFiles: 30,
            archive: {
              enabled: true,
              directory: './logs/archive/daily',
              compress: false,
              retentionDays: 90
            }
          }
        },
        defaultTransports: ['daily-log']
      };

      writeFileSync(testConfigFile, JSON.stringify(configContent, null, 2));
      const loadedConfig = ConfigLoader.loadConfig(testConfigFile);
      
      const resolvedTransports = ConfigLoader.resolveTransports(loadedConfig, ['daily-log']);
      
      expect(resolvedTransports).toHaveLength(1);
      expect(resolvedTransports[0]).toBeInstanceOf(LogTransport);
      expect(resolvedTransports[0].name).toBe('daily-log');
    });

    it('should create LogTransport with minimal config using defaults', () => {
      const configContent = {
        level: 'INFO',
        timestamp: false,
        colors: true,
        transports: {
          'minimal-log': {
            type: 'log',
            path: './logs/minimal.log',
            method: 'size'
            // No other options - should use defaults
          }
        },
        defaultTransports: ['minimal-log']
      };

      writeFileSync(testConfigFile, JSON.stringify(configContent, null, 2));
      const loadedConfig = ConfigLoader.loadConfig(testConfigFile);
      
      const resolvedTransports = ConfigLoader.resolveTransports(loadedConfig, ['minimal-log']);
      
      expect(resolvedTransports).toHaveLength(1);
      expect(resolvedTransports[0]).toBeInstanceOf(LogTransport);
    });

    it('should handle error for LogTransport without required path', () => {
      const configContent = {
        level: 'INFO',
        timestamp: false,
        colors: true,
        transports: {
          'invalid-log': {
            type: 'log',
            method: 'size'
            // Missing path
          }
        },
        defaultTransports: ['invalid-log']
      };

      writeFileSync(testConfigFile, JSON.stringify(configContent, null, 2));
      
      // ConfigLoader should gracefully handle the error and return default config
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const config = ConfigLoader.loadConfig(testConfigFile);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load LogRider config'),
        expect.any(Error)
      );
      expect(config.transports).toEqual(expect.objectContaining({
        console: expect.any(Object)
      }));
      
      consoleSpy.mockRestore();
    });

    it('should handle error for LogTransport without required method', () => {
      const configContent = {
        level: 'INFO',
        timestamp: false,
        colors: true,
        transports: {
          'invalid-log': {
            type: 'log',
            path: './logs/test.log'
            // Missing method
          }
        },
        defaultTransports: ['invalid-log']
      };

      writeFileSync(testConfigFile, JSON.stringify(configContent, null, 2));
      
      // ConfigLoader should gracefully handle the error and return default config
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const config = ConfigLoader.loadConfig(testConfigFile);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load LogRider config'),
        expect.any(Error)
      );
      expect(config.transports).toEqual(expect.objectContaining({
        console: expect.any(Object)
      }));
      
      consoleSpy.mockRestore();
    });

    it('should handle error for invalid rotation method', () => {
      const configContent = {
        level: 'INFO',
        timestamp: false,
        colors: true,
        transports: {
          'invalid-log': {
            type: 'log',
            path: './logs/test.log',
            method: 'invalid'
          }
        },
        defaultTransports: ['invalid-log']
      };

      writeFileSync(testConfigFile, JSON.stringify(configContent, null, 2));
      
      // ConfigLoader should gracefully handle the error and return default config
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const config = ConfigLoader.loadConfig(testConfigFile);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load LogRider config'),
        expect.any(Error)
      );
      expect(config.transports).toEqual(expect.objectContaining({
        console: expect.any(Object)
      }));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Full Configuration File Integration', () => {
    it('should load complete config with multiple LogTransports', () => {
      const configContent = {
        level: 'INFO',
        timestamp: false,
        colors: true,
        transports: {
          console: {
            type: 'console'
          },
          'app-logs': {
            type: 'log',
            path: './logs/app.log',
            method: 'size',
            maxSize: '10MB',
            maxFiles: 5,
            archive: {
              enabled: true,
              directory: './logs/archive',
              compress: true,
              retentionDays: 30
            }
          },
          'daily-logs': {
            type: 'log',
            path: './logs/daily.log',
            method: 'date',
            dateFormat: 'YYYY-MM-DD',
            maxFiles: 30,
            archive: {
              enabled: true,
              directory: './logs/archive/daily',
              compress: false,
              retentionDays: 90
            }
          }
        },
        defaultTransports: ['console', 'app-logs', 'daily-logs']
      };

      writeFileSync(testConfigFile, JSON.stringify(configContent, null, 2));

      const loadedConfig = ConfigLoader.loadConfig(testConfigFile);
      
      expect(loadedConfig.defaultTransports).toEqual(['console', 'app-logs', 'daily-logs']);
      expect(Object.keys(loadedConfig.transports)).toHaveLength(3);
      
      // Test that LogTransports were created correctly
      const resolvedTransports = ConfigLoader.resolveTransports(loadedConfig, ['app-logs', 'daily-logs']);
      
      expect(resolvedTransports).toHaveLength(2);
      expect(resolvedTransports.every(t => t instanceof LogTransport)).toBe(true);
    });

    it('should handle LogTransport with level filtering', () => {
      const configContent = {
        level: 'INFO',
        timestamp: false,
        colors: true,
        transports: {
          'error-logs': {
            type: 'log',
            path: './logs/errors.log',
            method: 'size',
            maxSize: '5MB',
            maxFiles: 10,
            levels: {
              include: ['ERROR', 'WARN']
            },
            archive: {
              enabled: true,
              directory: './logs/archive/errors',
              compress: true,
              retentionDays: 365
            }
          }
        },
        defaultTransports: ['error-logs']
      };

      writeFileSync(testConfigFile, JSON.stringify(configContent, null, 2));

      const loadedConfig = ConfigLoader.loadConfig(testConfigFile);
      const resolvedTransports = ConfigLoader.resolveTransports(loadedConfig, ['error-logs']);
      
      expect(resolvedTransports).toHaveLength(1);
      expect(resolvedTransports[0]).toBeInstanceOf(LogTransport);
      
      // Test level filtering works
      const transport = resolvedTransports[0] as LogTransport;
      expect(transport.shouldLog('ERROR' as any)).toBe(true);
      expect(transport.shouldLog('WARN' as any)).toBe(true);
      expect(transport.shouldLog('INFO' as any)).toBe(false);
    });

    it('should handle LogTransport with archive disabled', () => {
      const configContent = {
        level: 'INFO',
        timestamp: false,
        colors: true,
        transports: {
          'simple-logs': {
            type: 'log',
            path: './logs/simple.log',
            method: 'size',
            maxSize: '1MB',
            maxFiles: 3,
            archive: {
              enabled: false
            }
          }
        },
        defaultTransports: ['simple-logs']
      };

      writeFileSync(testConfigFile, JSON.stringify(configContent, null, 2));

      const loadedConfig = ConfigLoader.loadConfig(testConfigFile);
      const resolvedTransports = ConfigLoader.resolveTransports(loadedConfig, ['simple-logs']);
      
      expect(resolvedTransports).toHaveLength(1);
      expect(resolvedTransports[0]).toBeInstanceOf(LogTransport);
    });
  });

  describe('Mixed Transport Types', () => {
    it('should handle config with both LogTransport and traditional transports', () => {
      const configContent = {
        level: 'INFO',
        timestamp: false,
        colors: true,
        transports: {
          console: {
            type: 'console'
          },
          'legacy-file': {
            type: 'file',
            path: './logs/legacy.log'
          },
          'json-audit': {
            type: 'json',
            path: './logs/audit.json'
          },
          'modern-log': {
            type: 'log',
            path: './logs/app.log',
            method: 'size',
            maxSize: '10MB',
            archive: {
              enabled: true,
              directory: './logs/archive'
            }
          }
        },
        defaultTransports: ['console', 'legacy-file', 'json-audit', 'modern-log']
      };

      writeFileSync(testConfigFile, JSON.stringify(configContent, null, 2));

      const loadedConfig = ConfigLoader.loadConfig(testConfigFile);
      const resolvedTransports = ConfigLoader.resolveTransports(loadedConfig, 
        ['console', 'legacy-file', 'json-audit', 'modern-log']);
      
      expect(resolvedTransports).toHaveLength(4);
      
      // Check that we have mixed transport types
      const transportTypes = resolvedTransports.map(t => t.constructor.name);
      expect(transportTypes).toContain('ConsoleTransport');
      expect(transportTypes).toContain('FileTransport');
      expect(transportTypes).toContain('JSONTransport');
      expect(transportTypes).toContain('LogTransport');
    });
  });
});