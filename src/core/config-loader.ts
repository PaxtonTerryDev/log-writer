import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { merge } from 'lodash';
import {
  LogLevel,
  LoggerConfig,
  FileConfig,
  TransportConfig,
  Transport,
  ColorConfig,
  LevelFilter,
} from './interfaces';
import { ConsoleTransport } from '../transports/console';
import { FileTransport } from '../transports/file';
import { JSONTransport } from '../transports/json';
import { LogTransport, RotationMethod } from '../transports/log';
import { config } from 'dotenv';

config();

const ENV_VAR_NAME = 'LOGRIDER_ENV';

type Environment = string | 'none';

export class ConfigLoader {
  private static readonly CONFIG_FILE_NAME = 'logrider.config.json';
  private static readonly DEFAULT_CONFIG: LoggerConfig = {
    level: LogLevel.INFO,
    timestamp: false,
    colors: true,
    includeLevel: true,
    includeName: true,
    transports: {
      console: new ConsoleTransport('console'),
    },
    defaultTransports: ['console'],
  };

  private readonly environment: Environment = ConfigLoader.loadEnv();

  static loadEnv(): Environment {
    const env_value = process.env[ENV_VAR_NAME];
    return env_value === undefined ? 'none' : env_value;
  }

  /**
   * Loads configuration from logrider.config.json file, falling back to defaults
   */
  static loadConfig(configPath?: string): LoggerConfig {
    const filePath = configPath || this.findConfigFile();

    if (!filePath || !existsSync(filePath)) {
      return { ...this.DEFAULT_CONFIG };
    }

    try {
      const fileContent = readFileSync(filePath, 'utf-8');
      const rawConfig = JSON.parse(fileContent);

      // Get environment from environment variable
      const environment = this.loadEnv();

      // Extract environment-specific config if environment is set and exists
      const fileConfig: FileConfig = this.extractEnvironmentConfig(
        rawConfig,
        environment
      );

      return this.mergeWithDefaults(fileConfig);
    } catch (error) {
      console.warn(`Failed to load LogRider config from ${filePath}:`, error);
      return { ...this.DEFAULT_CONFIG };
    }
  }

  /**
   * Extracts environment-specific configuration from raw config
   */
  private static extractEnvironmentConfig(
    rawConfig: any,
    environment: Environment
  ): FileConfig {
    // If no environment is set or environment is 'none', use root config
    if (environment === 'none' || !environment) {
      return rawConfig;
    }

    // If environment is set but doesn't exist in config, use root config
    if (!rawConfig[environment]) {
      console.warn(
        `Environment '${environment}' not found in config, using root configuration`
      );
      return rawConfig;
    }

    // Merge environment-specific config with root config
    // Environment-specific config takes precedence over root config
    const envConfig = rawConfig[environment];
    const rootConfig = { ...rawConfig };

    // Remove environment keys from root config to avoid confusion
    Object.keys(rawConfig).forEach((key) => {
      if (
        typeof rawConfig[key] === 'object' &&
        rawConfig[key] !== null &&
        !Array.isArray(rawConfig[key])
      ) {
        // Check if this looks like an environment config (contains typical config keys)
        const configKeys = [
          'level',
          'timestamp',
          'colors',
          'transports',
          'defaultTransports',
        ];
        const hasConfigKeys = configKeys.some(
          (configKey) =>
            key !== configKey && rawConfig[key][configKey] !== undefined
        );
        if (hasConfigKeys) {
          delete rootConfig[key];
        }
      }
    });

    return merge({}, rootConfig, envConfig);
  }

  /**
   * Finds logrider.config.json file starting from current directory up to root
   */
  private static findConfigFile(): string | null {
    let currentDir = process.cwd();
    const root = resolve('/');

    while (currentDir !== root) {
      const configPath = resolve(currentDir, this.CONFIG_FILE_NAME);
      if (existsSync(configPath)) {
        return configPath;
      }
      currentDir = resolve(currentDir, '..');
    }

    // Check root directory
    const rootConfigPath = resolve(root, this.CONFIG_FILE_NAME);
    if (existsSync(rootConfigPath)) {
      return rootConfigPath;
    }

    return null;
  }

  /**
   * Merges file configuration with defaults
   */
  private static mergeWithDefaults(fileConfig: FileConfig): LoggerConfig {
    const transports = fileConfig.transports
      ? this.createNamedTransports(fileConfig.transports)
      : this.DEFAULT_CONFIG.transports;

    const defaultTransports =
      fileConfig.defaultTransports ||
      (Array.isArray(fileConfig.transports)
        ? Object.keys(transports)
        : this.DEFAULT_CONFIG.defaultTransports);

    const config: LoggerConfig = {
      level: this.parseLogLevel(fileConfig.level) || this.DEFAULT_CONFIG.level,
      timestamp: fileConfig.timestamp ?? this.DEFAULT_CONFIG.timestamp,
      colors: fileConfig.colors ?? this.DEFAULT_CONFIG.colors,
      includeLevel: fileConfig.includeLevel ?? this.DEFAULT_CONFIG.includeLevel,
      includeName: fileConfig.includeName ?? this.DEFAULT_CONFIG.includeName,
      transports,
      defaultTransports,
    };

    return config;
  }

  /**
   * Parses string log level to LogLevel enum
   */
  private static parseLogLevel(level?: string): LogLevel | null {
    if (!level) return null;

    const upperLevel = level.toUpperCase();
    if (Object.values(LogLevel).includes(upperLevel as LogLevel)) {
      return upperLevel as LogLevel;
    }

    console.warn(`Invalid log level "${level}", using default`);
    return null;
  }

  /**
   * Creates named transport instances from configuration
   */
  private static createNamedTransports(
    transportConfigs: Record<string, TransportConfig> | TransportConfig[]
  ): Record<string, Transport> {
    // Handle array format (legacy) - create auto-numbered names
    if (Array.isArray(transportConfigs)) {
      const namedTransports: Record<string, Transport> = {};
      transportConfigs.forEach((config, index) => {
        const name = `${config.type}_${index}`;
        namedTransports[name] = this.createTransport(config, name);
      });
      return namedTransports;
    }

    // Handle object format (named transports)
    const namedTransports: Record<string, Transport> = {};
    Object.entries(transportConfigs).forEach(([name, config]) => {
      namedTransports[name] = this.createTransport(config, name);
    });

    return namedTransports;
  }

  /**
   * Creates a single transport instance from configuration
   */
  private static createTransport(
    config: TransportConfig,
    name: string
  ): Transport {
    const levelFilter = this.parseLevelFilter(config.levels);

    switch (config.type) {
      case 'console':
        return new ConsoleTransport(name, levelFilter, config.colors);
      case 'file':
        if (!config.path) {
          throw new Error(`File transport '${name}' requires path`);
        }
        return new FileTransport(config.path, name, levelFilter, config.colors);
      case 'json':
        if (!config.path) {
          throw new Error(`JSON transport '${name}' requires path`);
        }
        return new JSONTransport(config.path, name, levelFilter, config.colors);
      case 'log':
        return this.createLogTransport(config, name, levelFilter);
      default:
        throw new Error(
          `Unknown transport type for '${name}': ${(config as any).type}`
        );
    }
  }

  /**
   * Creates a LogTransport instance from configuration
   */
  private static createLogTransport(
    config: TransportConfig,
    name: string,
    levelFilter?: LevelFilter
  ): LogTransport {
    if (!config.path) {
      throw new Error(`LogTransport '${name}' requires path`);
    }

    if (!config.method) {
      throw new Error(`LogTransport '${name}' requires method (size or date)`);
    }

    // Convert string method to enum
    const method =
      config.method === 'size'
        ? RotationMethod.SIZE
        : config.method === 'date'
          ? RotationMethod.DATE
          : (() => {
              throw new Error(
                `Invalid rotation method '${config.method}' for LogTransport '${name}'`
              );
            })();

    // Build LogTransport options with defaults
    const logOptions: any = {
      method, // Always required
    };

    // Add optional properties only if they exist
    if (config.maxSize !== undefined) logOptions.maxSize = config.maxSize;
    if (config.maxFiles !== undefined) logOptions.maxFiles = config.maxFiles;
    if (config.dateFormat !== undefined)
      logOptions.dateFormat = config.dateFormat;
    if (config.archive?.directory !== undefined)
      logOptions.archiveDir = config.archive.directory;
    if (config.archive?.compress !== undefined)
      logOptions.compress = config.archive.compress;
    if (config.archive?.retentionDays !== undefined)
      logOptions.retentionDays = config.archive.retentionDays;

    return new LogTransport(
      config.path,
      logOptions,
      name,
      levelFilter,
      config.colors
    );
  }

  /**
   * Parses and validates level filter configuration
   */
  private static parseLevelFilter(
    levels?: LevelFilter
  ): LevelFilter | undefined {
    if (!levels) return undefined;

    const filter: LevelFilter = {};

    if (levels.include) {
      filter.include = levels.include.map((level) => {
        const parsedLevel = this.parseLogLevel(level.toString());
        if (!parsedLevel) {
          throw new Error(`Invalid log level in include filter: ${level}`);
        }
        return parsedLevel;
      });
    }

    if (levels.exclude) {
      filter.exclude = levels.exclude.map((level) => {
        const parsedLevel = this.parseLogLevel(level.toString());
        if (!parsedLevel) {
          throw new Error(`Invalid log level in exclude filter: ${level}`);
        }
        return parsedLevel;
      });
    }

    // Validate mutually exclusive rule
    if (filter.include && filter.exclude) {
      throw new Error(
        'Level filter cannot have both include and exclude - use one or the other'
      );
    }

    return filter;
  }

  /**
   * Validates configuration object
   */
  static validateConfig(config: LoggerConfig): void {
    if (!Object.values(LogLevel).includes(config.level)) {
      throw new Error(`Invalid log level: ${config.level}`);
    }

    if (typeof config.timestamp !== 'boolean') {
      throw new Error('timestamp must be a boolean');
    }

    if (
      typeof config.colors !== 'boolean' &&
      typeof config.colors !== 'object'
    ) {
      throw new Error('colors must be a boolean or ColorConfig object');
    }

    if (typeof config.includeLevel !== 'boolean') {
      throw new Error('includeLevel must be a boolean');
    }

    if (typeof config.includeName !== 'boolean') {
      throw new Error('includeName must be a boolean');
    }

    if (
      typeof config.transports !== 'object' ||
      Array.isArray(config.transports)
    ) {
      throw new Error('transports must be a Record<string, Transport>');
    }

    if (!Array.isArray(config.defaultTransports)) {
      throw new Error('defaultTransports must be an array of transport names');
    }

    if (Object.keys(config.transports).length === 0) {
      console.warn('No transports configured, logs will not be output');
    }

    // Validate that defaultTransports reference existing transports
    const transportNames = Object.keys(config.transports);
    const invalidDefaults = config.defaultTransports.filter(
      (name) => !transportNames.includes(name)
    );
    if (invalidDefaults.length > 0) {
      throw new Error(
        `Default transports reference non-existent transports: ${invalidDefaults.join(', ')}`
      );
    }
  }

  /**
   * Resolves transport names to transport instances
   */
  static resolveTransports(
    config: LoggerConfig,
    transportNames: string[]
  ): Transport[] {
    return transportNames.map((name) => {
      const transport = config.transports[name];
      if (!transport) {
        throw new Error(`Transport '${name}' not found in configuration`);
      }
      return transport;
    });
  }
}
