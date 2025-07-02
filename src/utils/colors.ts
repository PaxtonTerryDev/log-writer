import chalk from 'chalk';
import { LogLevel } from '../core/interfaces';

export class ColorUtils {
  private static readonly levelColors = {
    [LogLevel.ERROR]: chalk.red,
    [LogLevel.WARN]: chalk.yellow,
    [LogLevel.INFO]: chalk.blue,
    [LogLevel.DEBUG]: chalk.green,
    [LogLevel.TRACE]: chalk.gray
  };

  static colorizeLevel(level: LogLevel): string {
    const colorFn = this.levelColors[level];
    return colorFn ? colorFn(level) : level;
  }

  static colorizeContext(context: string): string {
    return chalk.cyan(context);
  }

  static colorizeMessage(level: LogLevel, message: string): string {
    return level === LogLevel.ERROR ? this.levelColors[level](message) : message;
  }
}