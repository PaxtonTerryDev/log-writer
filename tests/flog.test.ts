import { Flog } from '@/core/flog';
import { LogLevel } from '@/core/interfaces';
import stripAnsi from 'strip-ansi';

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
      const logger = new Flog('TestClass');
      expect(logger).toBeInstanceOf(Flog);
    });

    it('should create instance with className and instanceId', () => {
      const logger = new Flog('TestClass', 'instance-1');
      expect(logger).toBeInstanceOf(Flog);
    });

    it('should handle empty className', () => {
      const logger = new Flog('');
      expect(logger).toBeInstanceOf(Flog);
    });
  });

  describe('Log Level Methods', () => {
    let logger: Flog;

    beforeEach(() => {
      logger = new Flog('TestClass');
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
      const logger = new Flog('UserService');
      logger.info('Processing user data');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toMatch(/\[INFO\] \[UserService\] Processing user data/);
    });

    it('should format message with className and instanceId', () => {
      const logger = new Flog('Worker', 'thread-1');
      logger.info('Task completed');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toMatch(/\[INFO\] \[Worker:thread-1\] Task completed/);
    });

    it('should handle special characters in messages', () => {
      const logger = new Flog('TestClass');
      logger.info('Message with "quotes" and symbols: @#$%');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const loggedMessage = mockConsoleLog.mock.calls[0][0];
      expect(loggedMessage).toContain('Message with "quotes" and symbols: @#$%');
    });

    it('should handle empty messages', () => {
      const logger = new Flog('TestClass');
      logger.info('');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toMatch(/\[INFO\] \[TestClass\] $/);
    });
  });

  describe('Options Support', () => {
    let logger: Flog;

    beforeEach(() => {
      logger = new Flog('TestClass');
    });

    it('should support timestamp option', () => {
      logger.info('Test message', { timestamp: true });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      
      // Should contain ISO timestamp at the beginning
      expect(cleanOutput).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z \[INFO\]/);
    });

    it('should work without timestamp option', () => {
      logger.info('Test message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      
      // Should not contain timestamp
      expect(cleanOutput).toMatch(/^\[INFO\]/);
    });

    it('should support metadata option (for future extensibility)', () => {
      const metadata = { userId: '123', action: 'login' };
      logger.info('User logged in', { metadata });
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      // Currently metadata is not used in formatting, but should not cause errors
      expect(mockConsoleLog.mock.calls[0][0]).toContain('User logged in');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined instanceId gracefully', () => {
      const logger = new Flog('TestClass', undefined);
      logger.info('Test message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toMatch(/\[INFO\] \[TestClass\] Test message/);
    });

    it('should handle null values gracefully', () => {
      const logger = new Flog('TestClass');
      // @ts-expect-error Testing null handling
      logger.info(null);
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      // Should not throw, but handle gracefully
    });

    it('should handle very long messages', () => {
      const logger = new Flog('TestClass');
      const longMessage = 'A'.repeat(1000);
      
      expect(() => logger.info(longMessage)).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog.mock.calls[0][0]).toContain(longMessage);
    });

    it('should handle special Unicode characters', () => {
      const logger = new Flog('TestClass');
      const unicodeMessage = '🚀 Processing data with émojis and äccénts 中文';
      
      logger.info(unicodeMessage);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog.mock.calls[0][0]).toContain(unicodeMessage);
    });

    it('should handle newlines in messages', () => {
      const logger = new Flog('TestClass');
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      
      logger.info(multilineMessage);
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog.mock.calls[0][0]).toContain(multilineMessage);
    });

    it('should handle very long class names', () => {
      const longClassName = 'VeryLongClassNameThatMightCauseIssues'.repeat(10);
      const logger = new Flog(longClassName);
      
      expect(() => logger.info('Test message')).not.toThrow();
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      expect(mockConsoleLog.mock.calls[0][0]).toContain(longClassName);
    });

    it('should handle special characters in class names', () => {
      const logger = new Flog('Class-Name_123@Service');
      logger.info('Test message');
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      const cleanOutput = getCleanLogOutput();
      expect(cleanOutput).toContain('[Class-Name_123@Service]');
    });

    it('should handle multiple rapid log calls', () => {
      const logger = new Flog('TestClass');
      
      for (let i = 0; i < 100; i++) {
        logger.info(`Message ${i}`);
      }
      
      expect(mockConsoleLog).toHaveBeenCalledTimes(100);
    });
  });

  describe('Integration Tests', () => {
    it('should work with typical usage patterns', () => {
      // Simulate real usage
      class UserService {
        private log = new Flog('UserService');
        
        async fetchUser(id: string) {
          this.log.info(`Fetching user ${id}`);
          this.log.debug('Validating user ID');
          
          if (!id) {
            this.log.error('Invalid user ID provided');
            return null;
          }
          
          this.log.info('User fetched successfully');
          return { id, name: 'Test User' };
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
      // Simulate worker with instance ID
      class Worker {
        private log: Flog;
        
        constructor(workerId: string) {
          this.log = new Flog('Worker', workerId);
        }
        
        processTask(taskId: string) {
          this.log.info(`Processing task ${taskId}`);
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
  });
});