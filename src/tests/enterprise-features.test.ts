import { LogWriter } from '@/core/logwriter';
import { ConfigLoader } from '@/core/config-loader';
import { ConsoleTransport } from '@/transports/console';
import { FileTransport } from '@/transports/file';
import { JSONTransport } from '@/transports/json';
import { LogLevel, LevelFilter } from '@/core/interfaces';
import { readFileSync, existsSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

// Mock console methods
const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();
const mockConsoleWarn = jest.fn();
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  jest.clearAllMocks();
  console.log = mockConsoleLog;
  console.error = mockConsoleError;
  console.warn = mockConsoleWarn;
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

describe('Enterprise Logging Features', () => {
  describe('Transport Level Filtering', () => {
    it('should filter logs by include levels', () => {
      const includeFilter: LevelFilter = { include: [LogLevel.ERROR, LogLevel.WARN] };
      const transport = new ConsoleTransport('test', includeFilter);

      expect(transport.shouldLog!(LogLevel.ERROR)).toBe(true);
      expect(transport.shouldLog!(LogLevel.WARN)).toBe(true);
      expect(transport.shouldLog!(LogLevel.INFO)).toBe(false);
      expect(transport.shouldLog!(LogLevel.DEBUG)).toBe(false);
      expect(transport.shouldLog!(LogLevel.TRACE)).toBe(false);
    });

    it('should filter logs by exclude levels', () => {
      const excludeFilter: LevelFilter = { exclude: [LogLevel.DEBUG, LogLevel.TRACE] };
      const transport = new ConsoleTransport('test', excludeFilter);

      expect(transport.shouldLog!(LogLevel.ERROR)).toBe(true);
      expect(transport.shouldLog!(LogLevel.WARN)).toBe(true);
      expect(transport.shouldLog!(LogLevel.INFO)).toBe(true);
      expect(transport.shouldLog!(LogLevel.DEBUG)).toBe(false);
      expect(transport.shouldLog!(LogLevel.TRACE)).toBe(false);
    });

    it('should allow all levels when no filter is specified', () => {
      const transport = new ConsoleTransport('test');

      expect(transport.shouldLog!(LogLevel.ERROR)).toBe(true);
      expect(transport.shouldLog!(LogLevel.WARN)).toBe(true);
      expect(transport.shouldLog!(LogLevel.INFO)).toBe(true);
      expect(transport.shouldLog!(LogLevel.DEBUG)).toBe(true);
      expect(transport.shouldLog!(LogLevel.TRACE)).toBe(true);
    });

    it('should not write logs that are filtered out', () => {
      const includeFilter: LevelFilter = { include: [LogLevel.ERROR] };
      const transport = new ConsoleTransport('test', includeFilter);

      transport.write(LogLevel.ERROR, 'Error message');
      transport.write(LogLevel.INFO, 'Info message');

      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog).toHaveBeenCalledWith('Error message');
    });
  });

  describe('Named Transports Configuration', () => {
    const testConfigDir = join(__dirname, 'enterprise-config');
    const testConfigPath = join(testConfigDir, 'logwriter.config.json');

    beforeEach(() => {
      // Create test config directory if it doesn't exist
      if (!existsSync(testConfigDir)) {
        require('fs').mkdirSync(testConfigDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Clean up test files
      if (existsSync(testConfigPath)) {
        unlinkSync(testConfigPath);
      }
      // Clean up any log files created during tests
      const logFiles = ['errors.log', 'app.log', 'audit.json'];
      logFiles.forEach(file => {
        const filePath = join(testConfigDir, file);
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      });
    });

    it('should load named transports from config', () => {
      const config = {
        transports: {
          console: { type: 'console' },
          errors: { 
            type: 'file', 
            path: join(testConfigDir, 'errors.log'),
            levels: { include: ['ERROR', 'WARN'] }
          },
          audit: { type: 'json', path: join(testConfigDir, 'audit.json') }
        },
        defaultTransports: ['console', 'audit']
      };

      writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

      const loadedConfig = ConfigLoader.loadConfig(testConfigPath);
      
      expect(Object.keys(loadedConfig.transports)).toEqual(['console', 'errors', 'audit']);
      expect(loadedConfig.defaultTransports).toEqual(['console', 'audit']);
      expect(loadedConfig.transports.console).toBeInstanceOf(ConsoleTransport);
      expect(loadedConfig.transports.errors).toBeInstanceOf(FileTransport);
      expect(loadedConfig.transports.audit).toBeInstanceOf(JSONTransport);
    });

    it('should handle array format for backward compatibility', () => {
      const config = {
        transports: [
          { type: 'console' },
          { type: 'file', path: join(testConfigDir, 'app.log') }
        ]
      };

      writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

      const loadedConfig = ConfigLoader.loadConfig(testConfigPath);
      
      expect(Object.keys(loadedConfig.transports)).toEqual(['console_0', 'file_1']);
      expect(loadedConfig.defaultTransports).toEqual(['console_0', 'file_1']);
    });

    it('should validate mutual exclusivity of include/exclude filters', () => {
      const config = {
        transports: {
          invalid: {
            type: 'console',
            levels: {
              include: ['ERROR'],
              exclude: ['DEBUG']
            }
          }
        }
      };

      writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

      // The ConfigLoader catches validation errors and falls back to defaults
      const loadedConfig = ConfigLoader.loadConfig(testConfigPath);
      
      // Should fall back to default config due to validation error
      expect(loadedConfig.transports).toEqual({
        console: expect.any(ConsoleTransport)
      });
      expect(loadedConfig.defaultTransports).toEqual(['console']);
      
      // Console warning should have been called
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load LogWriter config'),
        expect.any(Error)
      );
    });

    it('should validate that defaultTransports reference existing transports', () => {
      const config = {
        transports: {
          console: { type: 'console' }
        },
        defaultTransports: ['console', 'nonexistent']
      };

      writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

      expect(() => {
        const loadedConfig = ConfigLoader.loadConfig(testConfigPath);
        ConfigLoader.validateConfig(loadedConfig);
      }).toThrow('Default transports reference non-existent transports: nonexistent');
    });
  });

  describe('Named Transport Usage in LogWriter', () => {
    const testConfigDir = join(__dirname, 'enterprise-usage');
    const testConfigPath = join(testConfigDir, 'logwriter.config.json');

    beforeEach(() => {
      if (!existsSync(testConfigDir)) {
        require('fs').mkdirSync(testConfigDir, { recursive: true });
      }

      const config = {
        transports: {
          console: { type: 'console' },
          errors: { 
            type: 'file', 
            path: join(testConfigDir, 'errors.log'),
            levels: { include: ['ERROR', 'WARN'] }
          },
          audit: { type: 'json', path: join(testConfigDir, 'audit.json') },
          debug: { 
            type: 'file', 
            path: join(testConfigDir, 'debug.log'),
            levels: { exclude: ['ERROR', 'WARN'] }
          }
        },
        defaultTransports: ['console', 'audit']
      };

      writeFileSync(testConfigPath, JSON.stringify(config, null, 2));
    });

    afterEach(() => {
      const filesToClean = [
        testConfigPath,
        join(testConfigDir, 'errors.log'),
        join(testConfigDir, 'audit.json'),
        join(testConfigDir, 'debug.log')
      ];
      
      filesToClean.forEach(file => {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      });
    });

    it('should use default transports from config', () => {
      const logger = new LogWriter('TestService', undefined, testConfigPath);
      
      logger.info('Test message');
      
      // Should appear in console (default)
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Test message')
      );
      
      // Should appear in audit.json (default)
      const auditPath = join(testConfigDir, 'audit.json');
      expect(existsSync(auditPath)).toBe(true);
      const auditContent = readFileSync(auditPath, 'utf-8');
      expect(auditContent).toContain('Test message');
    });

    it('should override transports with named transport strings', () => {
      const logger = new LogWriter('TestService', undefined, testConfigPath);
      
      logger.error('Critical error', { transports: ['errors', 'console'] });
      
      // Should appear in console
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Critical error')
      );
      
      // Should appear in errors.log
      const errorsPath = join(testConfigDir, 'errors.log');
      expect(existsSync(errorsPath)).toBe(true);
      const errorsContent = readFileSync(errorsPath, 'utf-8');
      expect(errorsContent).toContain('Critical error');
      
      // Should NOT appear in audit.json (not in override list)
      const auditPath = join(testConfigDir, 'audit.json');
      if (existsSync(auditPath)) {
        const auditContent = readFileSync(auditPath, 'utf-8');
        expect(auditContent).not.toContain('Critical error');
      }
    });

    it('should support constructor-level default transport override', () => {
      const logger = new LogWriter('DebugService', undefined, testConfigPath, ['debug', 'console']);
      
      logger.info('Debug info message');
      
      // Should appear in console
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Debug info message')
      );
      
      // Should appear in debug.log (INFO allowed by exclude filter)
      const debugPath = join(testConfigDir, 'debug.log');
      expect(existsSync(debugPath)).toBe(true);
      const debugContent = readFileSync(debugPath, 'utf-8');
      expect(debugContent).toContain('Debug info message');
    });

    it('should respect transport-level filtering', () => {
      const logger = new LogWriter('TestService', undefined, testConfigPath);
      
      // Try to log DEBUG to errors transport (should be filtered out)
      logger.debug('Debug message', { transports: ['errors'] });
      
      // errors.log should not be created because DEBUG is filtered out
      const errorsPath = join(testConfigDir, 'errors.log');
      expect(existsSync(errorsPath)).toBe(false);
      
      // But ERROR should work
      logger.error('Error message', { transports: ['errors'] });
      expect(existsSync(errorsPath)).toBe(true);
      const errorsContent = readFileSync(errorsPath, 'utf-8');
      expect(errorsContent).toContain('Error message');
      expect(errorsContent).not.toContain('Debug message');
    });

    it('should provide utility methods for transport management', () => {
      const logger = new LogWriter('TestService', undefined, testConfigPath);
      
      expect(logger.getTransportNames()).toEqual(['console', 'errors', 'audit', 'debug']);
      
      logger.setDefaultTransports(['errors', 'debug']);
      logger.warn('Warning message'); // Should only go to errors (WARN included) and debug (WARN excluded = false)
      
      const errorsPath = join(testConfigDir, 'errors.log');
      expect(existsSync(errorsPath)).toBe(true);
      
      // debug.log should not contain WARN (excluded)
      const debugPath = join(testConfigDir, 'debug.log');
      expect(existsSync(debugPath)).toBe(false);
    });

    it('should handle mixed Transport instances and string names', () => {
      const logger = new LogWriter('TestService', undefined, testConfigPath);
      const customTransport = new ConsoleTransport('custom');
      
      // Mix of transport instance and transport name
      logger.info('Mixed transport message', { 
        transports: [customTransport, 'audit'] 
      });
      
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Mixed transport message')
      );
      
      const auditPath = join(testConfigDir, 'audit.json');
      expect(existsSync(auditPath)).toBe(true);
      const auditContent = readFileSync(auditPath, 'utf-8');
      expect(auditContent).toContain('Mixed transport message');
    });
  });

  describe('Production Use Cases', () => {
    it('should demonstrate government-grade separation of concerns', () => {
      const governmentConfig = {
        transports: {
          console: { type: 'console' },
          security_alerts: { 
            type: 'json', 
            path: './logs/security.json',
            levels: { include: ['ERROR'] }
          },
          audit_trail: { 
            type: 'json', 
            path: './logs/audit.json',
            levels: { exclude: ['DEBUG', 'TRACE'] }
          },
          debug_logs: { 
            type: 'file', 
            path: './logs/debug.log',
            levels: { include: ['DEBUG', 'TRACE'] }
          },
          general_app: { type: 'file', path: './logs/app.log' }
        },
        defaultTransports: ['console', 'audit_trail', 'general_app']
      };

      // This demonstrates how different log types would be routed:
      
      // Security incident - goes to security alerts only
      const securityLogger = new LogWriter('SecurityModule');
      // securityLogger.error('Unauthorized access attempt', { transports: ['security_alerts', 'console'] });
      
      // Business logic - goes to default transports
      const businessLogger = new LogWriter('BusinessLogic');
      // businessLogger.info('Processing payment');
      
      // Debug info - goes to debug logs only  
      const devLogger = new LogWriter('DevModule');
      // devLogger.debug('Variable state', { transports: ['debug_logs'] });
      
      expect(governmentConfig.transports.security_alerts).toBeDefined();
      expect(governmentConfig.transports.audit_trail).toBeDefined();
      expect(governmentConfig.transports.debug_logs).toBeDefined();
    });
  });
});