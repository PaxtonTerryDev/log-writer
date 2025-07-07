import { LogWriter } from '@/core/logwriter';
import { LogLevel } from '@/core/interfaces';
import stripAnsi from 'strip-ansi';
import { resolve } from 'path';

const TEST_CONFIG_PATH = resolve(__dirname, 'test-config.json');

// Mock console.log to capture output
const mockConsoleLog = jest.fn();
const originalConsoleLog = console.log;

// Helper function to get clean log output without ANSI codes
const getCleanLogOutput = (callIndex: number = 0): string => {
  return stripAnsi(mockConsoleLog.mock.calls[callIndex][0]);
};

beforeEach(() => {
  jest.clearAllMocks();
  console.log = mockConsoleLog;
});

afterAll(() => {
  console.log = originalConsoleLog;
});

describe('LogWriter Class', () => {
  describe('Constructor', () => {
    it('should create instance with className only', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      expect(logger).toBeInstanceOf(LogWriter);
    });

    it('should create instance with className and instanceId', () => {
      const logger = new LogWriter('TestClass', 'instance-1', TEST_CONFIG_PATH);
      expect(logger).toBeInstanceOf(LogWriter);
    });

    it('should handle empty className', () => {
      const logger = new LogWriter('', undefined, TEST_CONFIG_PATH);
      expect(logger).toBeInstanceOf(LogWriter);
    });
  });

  describe('Log Level Methods', () => {
    let logger: LogWriter;

    beforeEach(() => {
      logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
    });

    it('should have error method', () => {
      logger.error('Test error message');
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[ERROR]');
      expect(cleanOutput).toContain('[TestClass]');
      expect(cleanOutput).toContain('Test error message');
    });

    it('should have warn method', () => {
      logger.warn('Test warning message');
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[WARN]');
      expect(cleanOutput).toContain('[TestClass]');
      expect(cleanOutput).toContain('Test warning message');
    });

    it('should have info method', () => {
      logger.info('Test info message');
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[INFO]');
      expect(cleanOutput).toContain('[TestClass]');
      expect(cleanOutput).toContain('Test info message');
    });

    it('should have debug method', () => {
      logger.debug('Test debug message');
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[DEBUG]');
      expect(cleanOutput).toContain('[TestClass]');
      expect(cleanOutput).toContain('Test debug message');
    });

    it('should have trace method', () => {
      logger.trace('Test trace message');
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[TRACE]');
      expect(cleanOutput).toContain('[TestClass]');
      expect(cleanOutput).toContain('Test trace message');
    });
  });

  describe('Message Formatting', () => {
    it('should format message with className only', () => {
      const logger = new LogWriter('UserService', undefined, TEST_CONFIG_PATH);
      logger.info('Processing user data');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[INFO] [UserService] Processing user data');
    });

    it('should format message with className and instanceId', () => {
      const logger = new LogWriter('Worker', 'thread-1', TEST_CONFIG_PATH);
      logger.info('Starting work');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[INFO] [Worker:thread-1] Starting work');
    });

    it('should handle timestamp option', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.info('Test message', { timestamp: true });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[TestClass\] Test message$/);
    });

    it('should handle metadata option', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      const metadata = { userId: '123', action: 'login' };
      logger.info('User action', { metadata });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[INFO] [TestClass] User action');
    });
  });

  describe('Configuration Options', () => {
    it('should override colors per call', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.info('Test message', { colors: false });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const rawOutput = mockConsoleLog.mock.calls[0][0];
      const cleanOutput = stripAnsi(rawOutput);
      // Should be the same since colors were disabled
      expect(rawOutput).toBe(cleanOutput);
    });

    it('should override timestamp per call', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.info('Without timestamp');
      logger.info('With timestamp', { timestamp: true });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      const firstOutput = getCleanLogOutput(0);
      const secondOutput = getCleanLogOutput(1);
      
      expect(firstOutput).not.toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(secondOutput).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should handle custom format', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.info('Test message', { format: '{level}: {message} from {context}' });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toBe('INFO: Test message from TestClass');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty messages', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.info('');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[INFO] [TestClass] ');
    });

    it('should handle very long messages', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      const longMessage = 'A'.repeat(10000);
      
      expect(() => logger.info(longMessage)).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog.mock.calls[0][0]).toContain(longMessage);
    });

    it('should handle special Unicode characters', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      const unicodeMessage = '🚀 Hello 世界 émojis! 🌍';
      
      logger.info(unicodeMessage);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog.mock.calls[0][0]).toContain(unicodeMessage);
    });

    it('should handle newlines in messages', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      
      logger.info(multilineMessage);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog.mock.calls[0][0]).toContain(multilineMessage);
    });

    it('should handle very long class names', () => {
      const longClassName = 'VeryLongClassNameThatExceedsNormalLengthLimits'.repeat(10);
      const logger = new LogWriter(longClassName, undefined, TEST_CONFIG_PATH);
      
      expect(() => logger.info('Test message')).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog.mock.calls[0][0]).toContain(longClassName);
    });

    it('should handle special characters in class names', () => {
      const logger = new LogWriter('Class-Name_123@Service', undefined, TEST_CONFIG_PATH);
      logger.info('Test message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[Class-Name_123@Service]');
    });

    it('should handle multiple rapid log calls', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`);
      }
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(100);
    });
  });

  describe('includeName Configuration', () => {
    it('should include name by default', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.info('Test message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[INFO] [TestClass] Test message');
    });

    it('should exclude name when includeName is false', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.setConfig({ includeName: false });
      logger.info('Test message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toBe('[INFO] Test message');
    });

    it('should work with all log levels when includeName is false', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.setConfig({ includeName: false });
      
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');
      logger.trace('Trace message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(5);
      expect(getCleanLogOutput(0)).toBe('[ERROR] Error message');
      expect(getCleanLogOutput(1)).toBe('[WARN] Warning message');
      expect(getCleanLogOutput(2)).toBe('[INFO] Info message');
      expect(getCleanLogOutput(3)).toBe('[DEBUG] Debug message');
      expect(getCleanLogOutput(4)).toBe('[TRACE] Trace message');
    });

    it('should work with timestamps when includeName is false', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.setConfig({ includeName: false });
      logger.info('Test message', { timestamp: true });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] Test message$/);
    });

    it('should work with both includeLevel and includeName disabled', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.setConfig({ includeLevel: false, includeName: false });
      logger.info('Test message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toBe('Test message');
    });

    it('should work with timestamps when both includeLevel and includeName disabled', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.setConfig({ includeLevel: false, includeName: false });
      logger.info('Test message', { timestamp: true });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z Test message$/);
    });
  });

  describe('includeLevel Configuration', () => {
    it('should include level by default', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.info('Test message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[INFO] [TestClass] Test message');
    });

    it('should exclude level when includeLevel is false', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.setConfig({ includeLevel: false });
      logger.info('Test message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toBe('[TestClass] Test message');
    });

    it('should work with all log levels when includeLevel is false', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.setConfig({ includeLevel: false });
      
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');
      logger.trace('Trace message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(5);
      expect(getCleanLogOutput(0)).toBe('[TestClass] Error message');
      expect(getCleanLogOutput(1)).toBe('[TestClass] Warning message');
      expect(getCleanLogOutput(2)).toBe('[TestClass] Info message');
      expect(getCleanLogOutput(3)).toBe('[TestClass] Debug message');
      expect(getCleanLogOutput(4)).toBe('[TestClass] Trace message');
    });

    it('should work with instanceId when includeLevel is false', () => {
      const logger = new LogWriter('Worker', 'thread-1', TEST_CONFIG_PATH);
      logger.setConfig({ includeLevel: false });
      logger.info('Processing task');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toBe('[Worker:thread-1] Processing task');
    });

    it('should work with timestamps when includeLevel is false', () => {
      const logger = new LogWriter('TestClass', undefined, TEST_CONFIG_PATH);
      logger.setConfig({ includeLevel: false });
      logger.info('Test message', { timestamp: true });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[TestClass\] Test message$/);
    });
  });

  describe('Integration Tests', () => {
    it('should work with typical usage patterns', () => {
      class UserService {
        private log = new LogWriter('UserService', undefined, TEST_CONFIG_PATH);
        
        fetchUser(id: string) {
          this.log.info(`Fetching user ${id}`);
          this.log.debug('Validating user ID');
          this.log.info('User fetched successfully');
        }
      }
      
      const service = new UserService();
      service.fetchUser('123');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      expect(getCleanLogOutput(0)).toContain('[INFO] [UserService] Fetching user 123');
      expect(getCleanLogOutput(1)).toContain('[DEBUG] [UserService] Validating user ID');
      expect(getCleanLogOutput(2)).toContain('[INFO] [UserService] User fetched successfully');
    });

    it('should work with worker pattern', () => {
      class Worker {
        private log: LogWriter;
        
        constructor(private id: string) {
          this.log = new LogWriter('Worker', this.id, TEST_CONFIG_PATH);
        }
        
        processTask(task: string) {
          this.log.info(`Processing task ${task}`);
          this.log.debug('Task processing completed');
        }
      }
      
      const worker1 = new Worker('worker-1');
      const worker2 = new Worker('worker-2');
      
      worker1.processTask('task-123');
      worker2.processTask('task-456');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(4);
      expect(getCleanLogOutput(0)).toContain('[INFO] [Worker:worker-1] Processing task task-123');
      expect(getCleanLogOutput(1)).toContain('[DEBUG] [Worker:worker-1] Task processing completed');
      expect(getCleanLogOutput(2)).toContain('[INFO] [Worker:worker-2] Processing task task-456');
      expect(getCleanLogOutput(3)).toContain('[DEBUG] [Worker:worker-2] Task processing completed');
    });

    it('should demonstrate configuration flexibility', () => {
      const logger = new LogWriter('FlexibleLogger', undefined, TEST_CONFIG_PATH);
      
      // Normal log
      logger.info('Normal message');
      
      // With timestamp
      logger.warn('Warning with timestamp', { timestamp: true });
      
      // With metadata
      logger.error('Error with metadata', { 
        metadata: { 
          error: 'NETWORK_ERROR', 
          retry: 3 
        } 
      });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
      
      const normalOutput = getCleanLogOutput(0);
      const timestampOutput = getCleanLogOutput(1);
      const metadataOutput = getCleanLogOutput(2);
      
      expect(normalOutput).toContain('[INFO] [FlexibleLogger] Normal message');
      expect(timestampOutput).toMatch(/^\d{4}-\d{2}-\d{2}T.*\[WARN\] \[FlexibleLogger\] Warning with timestamp$/);
      expect(metadataOutput).toContain('[ERROR] [FlexibleLogger] Error with metadata');
    });
  });
});