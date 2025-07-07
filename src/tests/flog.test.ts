import { Flog } from '@/core/flog';
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

describe('Flog Class', () => {
  describe('Constructor', () => {
    it('should create instance with className only', () => {
      const logger = new Flog('TestClass', undefined, TEST_CONFIG_PATH);
      expect(logger).toBeInstanceOf(Flog);
    });

    it('should create instance with className and instanceId', () => {
      const logger = new Flog('TestClass', 'instance-1', TEST_CONFIG_PATH);
      expect(logger).toBeInstanceOf(Flog);
    });

    it('should handle empty className', () => {
      const logger = new Flog('', undefined, TEST_CONFIG_PATH);
      expect(logger).toBeInstanceOf(Flog);
    });
  });

  describe('Log Level Methods', () => {
    let logger: Flog;

    beforeEach(() => {
      logger = new Flog('TestClass', undefined, TEST_CONFIG_PATH);
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
      const logger = new Flog('UserService', undefined, TEST_CONFIG_PATH);
      logger.info('Processing user data');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[INFO] [UserService] Processing user data');
    });

    it('should format message with className and instanceId', () => {
      const logger = new Flog('Worker', 'thread-1', TEST_CONFIG_PATH);
      logger.info('Starting work');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[INFO] [Worker:thread-1] Starting work');
    });

    it('should handle timestamp option', () => {
      const logger = new Flog('TestClass', undefined, TEST_CONFIG_PATH);
      logger.info('Test message', { timestamp: true });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\] \[TestClass\] Test message$/);
    });

    it('should handle metadata option', () => {
      const logger = new Flog('TestClass', undefined, TEST_CONFIG_PATH);
      const metadata = { userId: '123', action: 'login' };
      logger.info('User action', { metadata });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[INFO] [TestClass] User action');
    });
  });

  describe('Configuration Options', () => {
    it('should override colors per call', () => {
      const logger = new Flog('TestClass', undefined, TEST_CONFIG_PATH);
      logger.info('Test message', { colors: false });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const rawOutput = mockConsoleLog.mock.calls[0][0];
      const cleanOutput = stripAnsi(rawOutput);
      // Should be the same since colors were disabled
      expect(rawOutput).toBe(cleanOutput);
    });

    it('should override timestamp per call', () => {
      const logger = new Flog('TestClass', undefined, TEST_CONFIG_PATH);
      logger.info('Without timestamp');
      logger.info('With timestamp', { timestamp: true });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      const firstOutput = getCleanLogOutput(0);
      const secondOutput = getCleanLogOutput(1);
      
      expect(firstOutput).not.toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(secondOutput).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should handle custom format', () => {
      const logger = new Flog('TestClass', undefined, TEST_CONFIG_PATH);
      logger.info('Test message', { format: '{level}: {message} from {context}' });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toBe('INFO: Test message from TestClass');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty messages', () => {
      const logger = new Flog('TestClass', undefined, TEST_CONFIG_PATH);
      logger.info('');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[INFO] [TestClass] ');
    });

    it('should handle very long messages', () => {
      const logger = new Flog('TestClass', undefined, TEST_CONFIG_PATH);
      const longMessage = 'A'.repeat(10000);
      
      expect(() => logger.info(longMessage)).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog.mock.calls[0][0]).toContain(longMessage);
    });

    it('should handle special Unicode characters', () => {
      const logger = new Flog('TestClass', undefined, TEST_CONFIG_PATH);
      const unicodeMessage = '🚀 Hello 世界 émojis! 🌍';
      
      logger.info(unicodeMessage);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog.mock.calls[0][0]).toContain(unicodeMessage);
    });

    it('should handle newlines in messages', () => {
      const logger = new Flog('TestClass', undefined, TEST_CONFIG_PATH);
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      
      logger.info(multilineMessage);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog.mock.calls[0][0]).toContain(multilineMessage);
    });

    it('should handle very long class names', () => {
      const longClassName = 'VeryLongClassNameThatExceedsNormalLengthLimits'.repeat(10);
      const logger = new Flog(longClassName, undefined, TEST_CONFIG_PATH);
      
      expect(() => logger.info('Test message')).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog.mock.calls[0][0]).toContain(longClassName);
    });

    it('should handle special characters in class names', () => {
      const logger = new Flog('Class-Name_123@Service', undefined, TEST_CONFIG_PATH);
      logger.info('Test message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[Class-Name_123@Service]');
    });

    it('should handle multiple rapid log calls', () => {
      const logger = new Flog('TestClass', undefined, TEST_CONFIG_PATH);
      
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`);
      }
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(100);
    });
  });

  describe('Integration Tests', () => {
    it('should work with typical usage patterns', () => {
      class UserService {
        private log = new Flog('UserService', undefined, TEST_CONFIG_PATH);
        
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
        private log: Flog;
        
        constructor(private id: string) {
          this.log = new Flog('Worker', this.id, TEST_CONFIG_PATH);
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
      const logger = new Flog('FlexibleLogger', undefined, TEST_CONFIG_PATH);
      
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