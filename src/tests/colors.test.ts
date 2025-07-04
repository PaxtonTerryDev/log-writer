import { ColorUtils } from '@/utils/colors';
import { LogLevel } from '@/core/interfaces';
import chalk from 'chalk';

describe('ColorUtils', () => {
  describe('colorizeLevel', () => {
    it('should colorize ERROR level with red', () => {
      const result = ColorUtils.colorizeLevel(LogLevel.ERROR);
      expect(result).toBe(chalk.red('ERROR'));
    });

    it('should colorize WARN level with yellow', () => {
      const result = ColorUtils.colorizeLevel(LogLevel.WARN);
      expect(result).toBe(chalk.yellow('WARN'));
    });

    it('should colorize INFO level with blue', () => {
      const result = ColorUtils.colorizeLevel(LogLevel.INFO);
      expect(result).toBe(chalk.blue('INFO'));
    });

    it('should colorize DEBUG level with green', () => {
      const result = ColorUtils.colorizeLevel(LogLevel.DEBUG);
      expect(result).toBe(chalk.green('DEBUG'));
    });

    it('should colorize TRACE level with gray', () => {
      const result = ColorUtils.colorizeLevel(LogLevel.TRACE);
      expect(result).toBe(chalk.gray('TRACE'));
    });
  });

  describe('colorizeContext', () => {
    it('should colorize context with cyan', () => {
      const context = 'TestClass:instance-1';
      const result = ColorUtils.colorizeContext(context);
      expect(result).toBe(chalk.cyan(context));
    });

    it('should handle empty context', () => {
      const result = ColorUtils.colorizeContext('');
      expect(result).toBe(chalk.cyan(''));
    });

    it('should handle special characters in context', () => {
      const context = 'Class-Name_123:worker@thread';
      const result = ColorUtils.colorizeContext(context);
      expect(result).toBe(chalk.cyan(context));
    });
  });

  describe('colorizeMessage', () => {
    it('should colorize ERROR messages with red', () => {
      const message = 'Critical error occurred';
      const result = ColorUtils.colorizeMessage(LogLevel.ERROR, message);
      expect(result).toBe(chalk.red(message));
    });

    it('should not colorize non-ERROR messages', () => {
      const message = 'Info message';
      
      expect(ColorUtils.colorizeMessage(LogLevel.WARN, message)).toBe(message);
      expect(ColorUtils.colorizeMessage(LogLevel.INFO, message)).toBe(message);
      expect(ColorUtils.colorizeMessage(LogLevel.DEBUG, message)).toBe(message);
      expect(ColorUtils.colorizeMessage(LogLevel.TRACE, message)).toBe(message);
    });

    it('should handle empty messages', () => {
      expect(ColorUtils.colorizeMessage(LogLevel.ERROR, '')).toBe(chalk.red(''));
      expect(ColorUtils.colorizeMessage(LogLevel.INFO, '')).toBe('');
    });
  });

  describe('Color consistency', () => {
    beforeEach(() => {
      // Force chalk to use colors in tests
      chalk.level = 3;
    });

    afterEach(() => {
      // Reset chalk level
      chalk.level = 0;
    });

    it('should use consistent colors across all methods', () => {
      // Test that level colors are consistent
      const errorLevel = ColorUtils.colorizeLevel(LogLevel.ERROR);
      const errorMessage = ColorUtils.colorizeMessage(LogLevel.ERROR, 'test');
      
      // Both should use red color (chalk.red)
      expect(errorLevel).toContain('\u001b[31m'); // ANSI red color code
      expect(errorMessage).toContain('\u001b[31m'); // ANSI red color code
    });

    it('should handle all log levels without errors', () => {
      const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.TRACE];
      
      levels.forEach(level => {
        expect(() => ColorUtils.colorizeLevel(level)).not.toThrow();
        expect(() => ColorUtils.colorizeMessage(level, 'test message')).not.toThrow();
      });
    });
  });
});