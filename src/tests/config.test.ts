import { LoggerConfigManager } from '@/core/config';
import { ConsoleTransport } from '@/transports/console';
import { FileTransport } from '@/transports/file';
import { JSONTransport } from '@/transports/json';
import { LogLevel } from '@/core/interfaces';

describe('LoggerConfigManager', () => {
  let configManager: LoggerConfigManager;

  beforeEach(() => {
    configManager = LoggerConfigManager.getInstance();
    // Reset to default configuration
    configManager.setLevel(LogLevel.TRACE);
    configManager.setTimestamp(false);
    configManager.setColors(true);
    configManager.setTransports([new ConsoleTransport()]);
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = LoggerConfigManager.getInstance();
      const instance2 = LoggerConfigManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should maintain state across getInstance calls', () => {
      const instance1 = LoggerConfigManager.getInstance();
      instance1.setLevel(LogLevel.ERROR);
      
      const instance2 = LoggerConfigManager.getInstance();
      expect(instance2.getConfig().level).toBe(LogLevel.ERROR);
    });
  });

  describe('Default Configuration', () => {
    it('should have default configuration', () => {
      const config = configManager.getConfig();
      expect(config.level).toBe(LogLevel.TRACE);
      expect(config.timestamp).toBe(false);
      expect(config.colors).toBe(true);
      expect(config.transports).toHaveLength(1);
      expect(config.transports[0]).toBeInstanceOf(ConsoleTransport);
    });
  });

  describe('Configuration Management', () => {
    it('should set and get log level', () => {
      configManager.setLevel(LogLevel.ERROR);
      expect(configManager.getConfig().level).toBe(LogLevel.ERROR);
      
      configManager.setLevel(LogLevel.DEBUG);
      expect(configManager.getConfig().level).toBe(LogLevel.DEBUG);
    });

    it('should set and get timestamp setting', () => {
      configManager.setTimestamp(true);
      expect(configManager.getConfig().timestamp).toBe(true);
      
      configManager.setTimestamp(false);
      expect(configManager.getConfig().timestamp).toBe(false);
    });

    it('should set and get colors setting', () => {
      configManager.setColors(false);
      expect(configManager.getConfig().colors).toBe(false);
      
      configManager.setColors(true);
      expect(configManager.getConfig().colors).toBe(true);
    });

    it('should set and get transports', () => {
      const fileTransport = new FileTransport('/tmp/test.log');
      const jsonTransport = new JSONTransport('/tmp/test.json');
      const transports = [fileTransport, jsonTransport];
      
      configManager.setTransports(transports);
      expect(configManager.getConfig().transports).toEqual(transports);
    });

    it('should add transport to existing transports', () => {
      const initialTransportsLength = configManager.getConfig().transports.length;
      const fileTransport = new FileTransport('/tmp/test.log');
      
      configManager.addTransport(fileTransport);
      
      const newTransports = configManager.getConfig().transports;
      expect(newTransports).toHaveLength(initialTransportsLength + 1);
      expect(newTransports).toContain(fileTransport);
    });
  });

  describe('Log Level Filtering', () => {
    it('should allow ERROR level when set to ERROR', () => {
      configManager.setLevel(LogLevel.ERROR);
      expect(configManager.shouldLog(LogLevel.ERROR)).toBe(true);
      expect(configManager.shouldLog(LogLevel.WARN)).toBe(false);
      expect(configManager.shouldLog(LogLevel.INFO)).toBe(false);
      expect(configManager.shouldLog(LogLevel.DEBUG)).toBe(false);
      expect(configManager.shouldLog(LogLevel.TRACE)).toBe(false);
    });

    it('should allow ERROR and WARN levels when set to WARN', () => {
      configManager.setLevel(LogLevel.WARN);
      expect(configManager.shouldLog(LogLevel.ERROR)).toBe(true);
      expect(configManager.shouldLog(LogLevel.WARN)).toBe(true);
      expect(configManager.shouldLog(LogLevel.INFO)).toBe(false);
      expect(configManager.shouldLog(LogLevel.DEBUG)).toBe(false);
      expect(configManager.shouldLog(LogLevel.TRACE)).toBe(false);
    });

    it('should allow ERROR, WARN, and INFO levels when set to INFO', () => {
      configManager.setLevel(LogLevel.INFO);
      expect(configManager.shouldLog(LogLevel.ERROR)).toBe(true);
      expect(configManager.shouldLog(LogLevel.WARN)).toBe(true);
      expect(configManager.shouldLog(LogLevel.INFO)).toBe(true);
      expect(configManager.shouldLog(LogLevel.DEBUG)).toBe(false);
      expect(configManager.shouldLog(LogLevel.TRACE)).toBe(false);
    });

    it('should allow ERROR, WARN, INFO, and DEBUG levels when set to DEBUG', () => {
      configManager.setLevel(LogLevel.DEBUG);
      expect(configManager.shouldLog(LogLevel.ERROR)).toBe(true);
      expect(configManager.shouldLog(LogLevel.WARN)).toBe(true);
      expect(configManager.shouldLog(LogLevel.INFO)).toBe(true);
      expect(configManager.shouldLog(LogLevel.DEBUG)).toBe(true);
      expect(configManager.shouldLog(LogLevel.TRACE)).toBe(false);
    });

    it('should allow all levels when set to TRACE', () => {
      configManager.setLevel(LogLevel.TRACE);
      expect(configManager.shouldLog(LogLevel.ERROR)).toBe(true);
      expect(configManager.shouldLog(LogLevel.WARN)).toBe(true);
      expect(configManager.shouldLog(LogLevel.INFO)).toBe(true);
      expect(configManager.shouldLog(LogLevel.DEBUG)).toBe(true);
      expect(configManager.shouldLog(LogLevel.TRACE)).toBe(true);
    });
  });

  describe('Multiple Transports', () => {
    it('should support multiple transports', () => {
      const consoleTransport = new ConsoleTransport();
      const fileTransport = new FileTransport('/tmp/test.log');
      const jsonTransport = new JSONTransport('/tmp/test.json');
      
      configManager.setTransports([consoleTransport, fileTransport, jsonTransport]);
      
      const config = configManager.getConfig();
      expect(config.transports).toHaveLength(3);
      expect(config.transports[0]).toBeInstanceOf(ConsoleTransport);
      expect(config.transports[1]).toBeInstanceOf(FileTransport);
      expect(config.transports[2]).toBeInstanceOf(JSONTransport);
    });

    it('should support empty transports array', () => {
      configManager.setTransports([]);
      expect(configManager.getConfig().transports).toHaveLength(0);
    });

    it('should replace existing transports when setting new ones', () => {
      const initialTransports = configManager.getConfig().transports;
      const newTransports = [new FileTransport('/tmp/test.log')];
      
      configManager.setTransports(newTransports);
      
      expect(configManager.getConfig().transports).toEqual(newTransports);
      expect(configManager.getConfig().transports).not.toEqual(initialTransports);
    });
  });

  describe('Configuration Persistence', () => {
    it('should maintain configuration across multiple operations', () => {
      configManager.setLevel(LogLevel.WARN);
      configManager.setTimestamp(true);
      configManager.setColors(false);
      
      const fileTransport = new FileTransport('/tmp/test.log');
      configManager.addTransport(fileTransport);
      
      const config = configManager.getConfig();
      expect(config.level).toBe(LogLevel.WARN);
      expect(config.timestamp).toBe(true);
      expect(config.colors).toBe(false);
      expect(config.transports).toContain(fileTransport);
    });

    it('should allow chaining configuration calls', () => {
      const fileTransport = new FileTransport('/tmp/test.log');
      
      configManager.setLevel(LogLevel.ERROR);
      configManager.setTimestamp(true);
      configManager.setColors(false);
      configManager.addTransport(fileTransport);
      
      const config = configManager.getConfig();
      expect(config.level).toBe(LogLevel.ERROR);
      expect(config.timestamp).toBe(true);
      expect(config.colors).toBe(false);
      expect(config.transports).toContain(fileTransport);
    });
  });

  describe('Edge Cases', () => {
    it('should handle adding multiple instances of same transport type', () => {
      const transport1 = new FileTransport('/tmp/test1.log');
      const transport2 = new FileTransport('/tmp/test2.log');
      
      configManager.addTransport(transport1);
      configManager.addTransport(transport2);
      
      const transports = configManager.getConfig().transports;
      expect(transports).toContain(transport1);
      expect(transports).toContain(transport2);
    });

    it('should handle setting the same configuration multiple times', () => {
      configManager.setLevel(LogLevel.ERROR);
      configManager.setLevel(LogLevel.ERROR);
      
      expect(configManager.getConfig().level).toBe(LogLevel.ERROR);
    });

    it('should handle rapid configuration changes', () => {
      for (let i = 0; i < 100; i++) {
        configManager.setLevel(i % 2 === 0 ? LogLevel.INFO : LogLevel.DEBUG);
        configManager.setTimestamp(i % 2 === 0);
        configManager.setColors(i % 2 === 1);
      }
      
      // Should end with the final configuration
      const config = configManager.getConfig();
      expect(config.level).toBe(LogLevel.DEBUG);
      expect(config.timestamp).toBe(false);
      expect(config.colors).toBe(true);
    });
  });
});